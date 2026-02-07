# Codebase Concerns

**Analysis Date:** 2025-02-07

## Overview

The Petri Heil fishing forecast app is generally well-built with good separation of concerns and solid error handling. However, several areas contain technical debt, potential bugs, and scaling limitations that should be addressed in future phases.

---

## Tech Debt

### 1. Loose Coupling Between Modules (High Priority)

**Issue:** Files reference global objects without explicit imports/exports. While `config.js` exports constants, several modules assume global availability.

**Files:** `js/app.js`, `js/fish-ui.js`, `js/solunar.js`, `js/storage.js`

**Impact:** Makes testing difficult, causes circular dependencies to be possible, and hides real dependencies.

**Current Pattern:**
```javascript
// In app.js line 25:
const $ = (id) => document.getElementById(id);

// In fish-ui.js line 40:
// Calls _fishFallbackSvg() which is defined in the same file
// but app.js also expects it to be global
```

**Fix approach:**
1. Create an explicit module loader or use ES6 modules (requires server setup)
2. Or bundle files in deterministic order and create explicit namespace
3. At minimum, document the required load order in a README

---

### 2. Inconsistent Error Handling Patterns (Medium Priority)

**Issue:** Different files use different error handling strategies. Some use try-catch, others let errors propagate.

**Files:**
- `js/api.js` (lines 12-37): Good exponential backoff retry logic
- `js/app.js` (lines 410-441): Catches errors but mixes async/await with promises
- `js/storage.js` (lines 75-87): Uses Promise-based error handlers

**Pattern Inconsistency:**
```javascript
// api.js: async/await with try-catch
async function fetchWeatherData(location) {
    const response = await fetchWithRetry(url);
    if (!response.ok) throw new Error(...);
}

// storage.js: Promise chains with callbacks
async function addFavorite(fishId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(...);
        // ... then onsuccess/onerror callbacks
    });
}
```

**Impact:** Makes code harder to understand and maintain. New developers can't predict error flow.

**Fix approach:** Standardize on async/await throughout. Wrap IndexedDB operations in Promise-based utilities.

---

### 3. Service Worker Cache Version Sync Issue (Medium Priority)

**Issue:** Cache version is hardcoded in two places and must be manually kept in sync.

**Files:**
- `js/config.js` (lines 108-109): `CONFIG.CACHE_NAME = 'petri-heil-v1'`
- `sw.js` (lines 9-12): `const CACHE_VERSION = 'v1'`

**Current Code:**
```javascript
// config.js
CACHE_NAME: 'petri-heil-v1',
API_CACHE_NAME: 'petri-heil-api-v1'

// sw.js - NOTE: Cache-Version auch in config.js aktualisieren
const CACHE_VERSION = 'v1';
```

**Impact:** If cache names aren't updated together during releases, old cached assets won't be cleared properly. Users could get stale data.

**Fix approach:**
1. Generate cache version at build time
2. Or create a single source of truth file (version.js)
3. Or at minimum, make comment more visible in config.js

---

### 4. Hard-Coded Array Indices in Date Calculations (Low Priority)

**Issue:** Moon phase array uses index directly without bounds checking.

**Files:** `js/solunar.js` (line 55)

**Code:**
```javascript
const phaseIndex = Math.floor((age / SYNODIC_MONTH) * 8) % 8;
const phase = MOON_PHASES[phaseIndex];  // Assumes index always 0-7
```

**Impact:** Low risk (modulo already bounds to 0-7), but fragile if MOON_PHASES array ever changes size.

**Fix approach:** Add assertion or use explicit bounds check.

---

## Known Bugs

### 1. Geo-Location Fallback Inaccuracy (Medium Priority)

**Issue:** When reverse geocoding fails, coordinates are formatted inconsistently.

**Files:** `js/api.js` (lines 208, 235)

**Current Code:**
```javascript
// Line 208:
let name = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

// Line 235 (fallback):
name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
```

**Impact:** User sees `48.27, 16.37` at line 208, but if that fails, sees `48.2681, 16.3738` at line 235. Inconsistent precision may confuse users.

**Fix approach:** Use consistent decimal places throughout (recommend 4 for accuracy, 2 for readability). Choose one approach.

---

### 2. Pressure Trend Calculation Edge Case (Low Priority)

**Issue:** If `pressure_msl` array doesn't have 3+ historical values, pressure trend calculation may be inaccurate.

**Files:** `js/api.js` (lines 77-80)

**Code:**
```javascript
const pressureNow = data.hourly.pressure_msl[currentIndex] || data.current.pressure_msl;
const pressure3hAgo = data.hourly.pressure_msl[Math.max(0, currentIndex - 3)] || pressureNow;
const pressureTrend = pressureNow - pressure3hAgo;
```

**Impact:** If currentIndex < 3, we use index 0 which may only be 1-3 hours ago, not 3 hours. Pressure trend may not be truly a 3-hour delta.

**Fix approach:** Check if `currentIndex - 3 >= 0` before using that value. If not, return `null` or `0` for trend.

---

### 3. Monthly Fish Data Without Dynamic Month Calculation (Low Priority)

**Issue:** Fish "best months" are stored as arrays like `[11, 12, 1, 2]` but app doesn't validate these against closed seasons.

**Files:** `data/fish-data.json`, `js/app.js` (rendering fish detail)

**Identified Issue from Review:** Aalrutte (burbot) has closed season 01.01-28.02 but best months include 1, 2. The FISHING_REVIEW.md already noted this is acceptable because regulations vary by state, but it creates confusion.

**Impact:** Users in some Austrian states may fish during protected periods if they follow the "best months" guidance without checking closed season carefully.

**Fix approach:** Add explicit warning in fish detail UI: "Check local regulations - closed seasons vary by state" prominently near best months.

---

## Security Considerations

### 1. XSS Protection via Text Content (Medium Priority)

**Issue:** App uses proper XSS escaping in most places, but inline SVG in fallback images is unescaped.

**Files:** `js/fish-ui.js` (lines 328-337)

**Code:**
```javascript
function _fishFallbackSvg(name) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">' +
        // ... SVG content ...
        '<text x="50%" y="100">' + name + '</text>' +  // NAME NOT ESCAPED!
    '</svg>';
    return 'data:image/svg+xml,' + svg;
}
```

**Impact:** If a fish species name ever contains SVG/XML special characters (unlikely but possible), could inject SVG content. Since it's in a data: URI, still relatively safe, but violates defense-in-depth.

**Fix approach:** Escape `name` parameter: `name.replace(/[<>&"]/g, '...')`

---

### 2. IndexedDB Storage Not Encrypted (Low Priority)

**Issue:** IndexedDB stores user location history and settings in plaintext.

**Files:** `js/storage.js`

**Impact:** If device is physically compromised, attacker can read location history. User locations are sensitive privacy data.

**Mitigation:** This is acceptable for a browser-based app (IndexedDB is same-origin only), but should be documented.

**Fix approach:** Add note in privacy policy that data is stored locally, unencrypted. Consider disabling location history save by default (option in settings).

---

## Performance Bottlenecks

### 1. Large Fish Data JSON in Main App Shell (Medium Priority)

**Issue:** `fish-data.json` is 4,915 lines (from file size analysis) but entire file must be loaded on app startup.

**Files:**
- `data/fish-data.json` (4915 lines)
- `js/app.js` (lines 49-56: loads entire file)
- `sw.js` (line 27: caches entire file)

**Current Code:**
```javascript
const resp = await fetch('data/fish-data.json');
fishData = await resp.json();  // Synchronous parse blocking main thread
```

**Impact:**
- App startup is slow (depends on device CPU, but parsing 4KB+ of JSON is non-trivial)
- All fish data loaded even if user only views 5 fish
- Cache size is larger than necessary

**Measurements:** File is ~150KB uncompressed, ~40KB gzipped (typical).

**Fix approach:**
1. **Lazy load:** Fetch fish-data only when user clicks Fish tab
2. **Split data:** Create smaller JSON files per category (raubfisch.json, etc.)
3. **Compress server-side:** Ensure gzip compression is enabled on host
4. **Defer parsing:** Load with `<link rel="preload" as="fetch">` instead of blocking

---

### 2. Hourly Forecast Rendering Creates 24 DOM Elements (Low Priority)

**Issue:** Every hour creates a new DOM element with event listeners.

**Files:** `js/app.js` (lines 591-660)

**Current Code:**
```javascript
// Line 600: Show next 24 hours
var hours = currentWeather.hourly.slice(0, 24);
hours.forEach(function (h) {
    var item = document.createElement('div');
    // ... add 3 event listeners to each item
    container.appendChild(item);
});
```

**Impact:**
- 24 DOM nodes created
- IntersectionObserver created per item (line 657)
- Multiple event listeners per item
- On slower devices, noticeable jank during rendering

**Fix approach:**
1. Use virtual scrolling (only render visible items)
2. Use event delegation (single listener on container)
3. Batch DOM updates with DocumentFragment (already done partially, line 23)

---

## Fragile Areas

### 1. Global Function Dependencies in HTML (High Priority)

**Issue:** HTML elements call JavaScript functions that must be globally available.

**Files:** `js/fish-ui.js` (lines 40, 160)

**Code:**
```html
<!-- In renderFishList, line 40: -->
onerror="this.src=_fishFallbackSvg('..."

<!-- In renderFishDetail, line 160: -->
onerror="this.src=_fishFallbackSvg('..."
```

**Impact:**
- `_fishFallbackSvg()` must be global
- If script order changes, app breaks
- Hard to debug (error happens in HTML attribute)
- Can't minify function name safely

**Fix approach:**
1. Add error handler to image elements via JavaScript instead of inline
2. Use `.addEventListener('error', handler)` in app.js
3. Or move fallback handling to CSS (use `background-image` with SVG fallback)

---

### 2. Tab Switching with Direct DOM Manipulation (Medium Priority)

**Issue:** Tab switching uses direct DOM class/style manipulation without framework state.

**Files:** `js/app.js` (lines 145-183)

**Code:**
```javascript
currentSection.classList.remove('active');
newSection.classList.add('active');
newSection.scrollTop = 0;
```

**Risk:**
- If user rapidly clicks tabs, scroll position gets lost
- Multiple sections could have `active` class
- No undo/redo mechanism for tab history
- Mobile back button doesn't work with tabs

**Impact:** Moderate - mainly UX issue, not data-critical.

**Fix approach:**
1. Introduce explicit state object: `{ activeTab: 'weather', ... }`
2. Re-render UI from state when tab changes
3. Or use Web Components with lifecycle hooks

---

### 3. Map Initialization Lazy-Loading Logic (Medium Priority)

**Issue:** Map is initialized only when user clicks toggle button, but `_map` global variable is checked without being defined.

**Files:** `js/app.js` (line 289)

**Code:**
```javascript
if (!mapInitialized && !_map) {  // _map is undefined globally!
    initMap('map', ...);
}
```

**Impact:**
- First time check for `_map` throws `ReferenceError` in strict mode
- `_map` is defined in `map.js` but not guaranteed to be loaded yet
- Error is caught silently but could hide bugs

**Fix approach:**
1. Check for `typeof _map === 'undefined'` instead
2. Or better: return `_map` from `initMap()` function
3. Or initialize `window._map = null` in config.js

---

## Scaling Limits

### 1. Fish Data Growth (Medium Priority)

**Issue:** App loads all 62 fish species at startup. As this grows, performance degrades linearly.

**Files:** `data/fish-data.json` (62 species), `js/app.js` (line 52)

**Current Scale:**
- 62 fish species
- ~4915 lines JSON
- ~150KB uncompressed

**Projected Limits:**
- 200+ species: Noticeable startup lag on slow devices
- 500+ species: Real performance issue on mobile
- 1000+ species: Parsing time > 1 second on low-end phones

**Scaling Path:**
1. Implement lazy loading (fetch on demand)
2. Split into category files
3. Create backend API for fish data
4. Implement search index (e.g., lunr.js)
5. Add pagination/infinite scroll

---

### 2. Location History Storage (Low Priority)

**Issue:** Location history stored in IndexedDB with no cleanup policy.

**Files:** `js/storage.js` (lines 152-172)

**Current Code:**
```javascript
async function addToHistory(location) {
    // ... stores entry with timestamp as key
    store.put({
        timestamp: Date.now(),  // Every call adds new entry
        ...
    });
}

async function getHistory(limit) {
    // No cleanup, just limit display to 8
    results.slice(0, limit)
}
```

**Impact:**
- History grows unbounded in IndexedDB
- After 1 year of daily use: ~365 entries (negligible)
- After 5 years: ~1825 entries (still negligible, maybe 100KB)
- Device storage eventually fills up (but would take years)

**Scaling Path:**
1. Add cleanup function to delete entries > 1 year old
2. Add settings option to "Clear History"
3. Implement quota management with warnings

---

## Dependencies at Risk

### 1. Leaflet.js Not Vendored (Medium Priority)

**Issue:** Map functionality depends on Leaflet but it's not included in bundle or checked in.

**Files:** `index.html` (lines would show `<script src="...">`), `js/map.js`

**Risk:** If Leaflet CDN goes down, maps won't load. New users who never cached it will see broken map.

**Impact:** Medium - maps are a nice-to-have feature, not critical to app.

**Fix approach:**
1. Vendor Leaflet.js locally (add to `lib/` directory)
2. Or at minimum, test offline experience without maps
3. Add fallback UI if map fails to load

---

### 2. Open-Meteo API Changes (Low Priority)

**Issue:** App depends on Open-Meteo API with no version pinning.

**Files:** `js/config.js` (lines 18-20), `js/api.js`

**URLs:**
- `https://api.open-meteo.com/v1/forecast`
- `https://geocoding-api.open-meteo.com/v1/search`

**Risk:** If Open-Meteo changes API response structure, app could break silently.

**Current Mitigation:**
- Error handling is good (lines 54-56 of api.js)
- Offline cache provides fallback

**Fix approach:**
1. Pin API version explicitly: `/v1/forecast` → `/v2.0/forecast` (if available)
2. Add API response validation (schema checking)
3. Implement circuit breaker pattern for API calls

---

## Test Coverage Gaps

### 1. No Unit Tests for Solunar Calculations (High Priority)

**Issue:** Critical math for moon phases, solunar periods, and catch probability has no automated tests.

**Files:** `js/solunar.js` (entire file, 500 lines)

**Functions Without Tests:**
- `toJulianDay()` - Core astronomical calculation
- `getMoonData()` - Moon phase determination
- `estimateMoonTransit()` - Transit time calculation
- `calculateCatchProbability()` - Main algorithm

**Risk:**
- Bug in Julian Day calculation affects all dates going forward
- Moon phase off by one could be missed for months
- Catch probability weighting errors affect all fishing forecasts

**Test approach:**
```javascript
// Should exist in tests/:
describe('toJulianDay', () => {
    test('Jan 6 2000 00:00 UTC = 2451550.5', () => {
        const date = new Date('2000-01-06T00:00:00Z');
        expect(toJulianDay(date)).toBe(2451550.5);
    });
    // ... more edge cases
});
```

**Fix approach:**
1. Add Jest or Vitest configuration
2. Create test files in `tests/` directory
3. Write tests for all solunar functions (at least 50+ test cases)
4. Add GitHub Actions to run tests on every commit

---

### 2. No Tests for Fish Data Validation (Medium Priority)

**Issue:** 62 fish species are loaded but never validated for completeness.

**Files:** `data/fish-data.json`, `js/app.js` (line 51: just loads blindly)

**Missing Validation:**
- All required fields present (id, name, category, etc.)
- Temperature ranges are sensible (min < max < ideal)
- Closed seasons don't overlap with best months incorrectly
- Images paths are valid
- No duplicate IDs

**Risk:** Fish data corruption could ship undetected.

**Fix approach:**
1. Add validation function in `js/utils.js`:
```javascript
function validateFishData(fishArray) {
    const errors = [];
    fishArray.forEach((fish, i) => {
        if (!fish.id) errors.push(`Fish ${i}: missing id`);
        if (fish.weatherPrefs.temperature.min > fish.weatherPrefs.temperature.max) {
            errors.push(`Fish ${fish.id}: temp range invalid`);
        }
        // ... more checks
    });
    return errors;
}
```
2. Call during app init and log errors
3. Add test file with sample invalid fish data

---

### 3. No Offline Mode Tests (Medium Priority)

**Issue:** Service Worker caching is untested.

**Files:** `sw.js`, `js/app.js` (error handling at lines 410-455)

**Untested Scenarios:**
- First load with no cache
- Offline after cached data exists
- Service Worker updates while offline
- Cache expiration (weather data > 1 hour old)

**Risk:** Offline experience could be broken without being noticed.

**Fix approach:**
1. Add service worker testing library (workbox-testing)
2. Create tests for cache strategies
3. Test offline error messages are shown correctly

---

## Missing Critical Features

### 1. No Location Privacy Option (Medium Priority)

**Issue:** App stores all location history in IndexedDB, user has no way to disable.

**Files:** `js/storage.js` (line 342), `js/app.js` (line 342: calls addToHistory automatically)

**Current Flow:**
```javascript
await saveSetting('lastLocation', location);  // Always saves
await addToHistory(location);  // Always saves
```

**Impact:** Privacy-conscious users can't opt out of location tracking (even though it's local-only).

**Fix approach:**
1. Add settings UI toggle: "Save location history"
2. Add settings UI toggle: "Remember last location"
3. Add "Clear All Data" button in settings

---

### 2. No Fish Difficulty or Skill Level Filtering (Low Priority)

**Issue:** App shows all fish equally, but some are experts-only (difficulty 5, like Huchen).

**Files:** `js/fish-ui.js` (lines 222-285: filter UI)

**Current Filter:**
- Category (raubfisch, friedfisch, etc.)
- Name search

**Missing:**
- Difficulty level filtering (show only difficulty 1-2 for beginners)
- Temperature range filter (show fish suitable for current water temp)
- Closed season filter (hide fish that are protected now)

**Fix approach:**
1. Add filter UI in renderFishSearch()
2. Add difficulty slider: ☐ ☐ ☐ ☐ ☐
3. Add "Currently Fishable" filter

---

## Summary of Priority

| Priority | Count | Examples |
|----------|-------|----------|
| High | 3 | Unit tests, global functions, module coupling |
| Medium | 10 | Error handling, cache sync, performance, offline tests |
| Low | 5 | Edge cases, scaling, data validation |

### Recommended Next Phases

**Phase 1 (Critical):**
- Add unit tests for solunar.js
- Fix global function dependencies

**Phase 2 (Important):**
- Standardize error handling
- Fix service worker cache version sync
- Add fish data validation

**Phase 3 (Nice to Have):**
- Lazy load fish data
- Add privacy settings
- Improve difficulty filtering

---

*Concerns audit: 2025-02-07*
