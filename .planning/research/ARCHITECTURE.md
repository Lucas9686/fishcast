# Architecture Research

**Domain:** Fishing/Weather PWA Enhancement
**Researched:** 2026-02-07
**Confidence:** HIGH

## Standard Architecture

### System Overview - Enhanced Fishing App

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Weather  │  │ Fish     │  │ Forecast │  │Favorites │    │
│  │ Tab UI   │  │ Tab UI   │  │ Tab UI   │  │ Tab UI   │    │
│  │          │  │          │  │          │  │          │    │
│  │ NEW:     │  │ NEW:     │  │ (exists) │  │ (exists) │    │
│  │ 7-day    │  │ Filter/  │  │          │  │          │    │
│  │ Accordion│  │ Search   │  │          │  │          │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                    CONTROLLER LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐     │
│  │           app.js (Orchestrator)                    │     │
│  │  - State management                                │     │
│  │  - Tab routing                                     │     │
│  │  - Event delegation                                │     │
│  │  NEW: Weather accordion state                      │     │
│  │  NEW: Filter state management                      │     │
│  └────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ weather  │  │ fish-ui  │  │ solunar  │  │ NEW:     │    │
│  │ .js      │  │ .js      │  │ .js      │  │ filter   │    │
│  │ (extend) │  │ (extend) │  │ (exists) │  │ .js      │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                    DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ api.js   │  │ storage  │  │ fish-    │                   │
│  │ (extend) │  │ .js      │  │ data.json│                   │
│  │          │  │ (extend) │  │ (expand) │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │             │             │                          │
├───────┴─────────────┴─────────────┴──────────────────────────┤
│                    FOUNDATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ config   │  │ utils    │  │ Service  │                   │
│  │ .js      │  │ .js      │  │ Worker   │                   │
│  │ (extend) │  │ (exists) │  │ sw.js    │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘

EXTERNAL:
  - Open-Meteo API (weather, geocoding)
  - Leaflet (map)
  - IndexedDB (browser storage)
  - Cache API (Service Worker)
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **weather.js** (NEW) | Enhanced weather display logic | Accordion state, 7-day detailed weather sections |
| **filter.js** (NEW) | Fish filtering/search engine | Multi-criteria filter (waterType, season, edibility) + text search |
| **fish-ui.js** (EXTEND) | Fish catalog rendering | Existing: grid, detail. NEW: filter integration, expanded data display |
| **api.js** (EXTEND) | Weather API enrichment | Add marine data, air pressure trends, UV index parsing |
| **storage.js** (EXTEND) | Persist filter preferences | Save last filter state, expanded accordion sections |
| **config.js** (EXTEND) | New constants | Filter options, weather display configs, expanded fish categories |
| **fish-data.json** (EXPAND) | Comprehensive fish catalog | 40+ → 200+ species (Adriatic + freshwater), richer metadata |
| **app.js** (EXTEND) | New orchestration logic | Weather accordion state, filter state, tab routing |

## Recommended Project Structure

```
fishing-app/
├── index.html              # Add new tab (Favorites), expand weather section
├── manifest.json           # Update theme color for dark marine
├── sw.js                   # Extend cache for new assets
├── css/
│   └── style.css           # NEW: Dark marine theme, accordion styles, filter UI
├── js/
│   ├── config.js           # EXTEND: new constants, filter configs
│   ├── utils.js            # (no change expected)
│   ├── api.js              # EXTEND: additional weather params
│   ├── solunar.js          # (no change expected)
│   ├── storage.js          # EXTEND: filter state persistence
│   ├── map.js              # (no change expected)
│   ├── weather.js          # NEW: accordion logic, 7-day display
│   ├── filter.js           # NEW: filter/search engine
│   ├── fish-ui.js          # EXTEND: filter integration
│   └── app.js              # EXTEND: weather/filter orchestration
├── data/
│   └── fish-data.json      # EXPAND: 40+ → 200+ species, richer fields
└── images/
    ├── icon.svg            # UPDATE: dark theme variant
    └── fish/               # EXPAND: 40+ → 200+ fish SVGs
```

### Structure Rationale

- **weather.js (NEW):** Separates complex accordion logic from app.js (single responsibility). Follows existing pattern: dedicated module for specific UI domain.
- **filter.js (NEW):** Encapsulates filtering/search algorithm. Keeps fish-ui.js focused on rendering, filter.js on data manipulation.
- **Script load order:** `config → utils → api → solunar → storage → map → weather (NEW) → filter (NEW) → fish-ui → app`
  - weather.js and filter.js inserted BEFORE fish-ui and app since app orchestrates them
  - No dependencies between weather.js and filter.js (parallel)
- **fish-data.json expansion:** Static data file grows from ~40 to ~200 entries. Acceptable for client-side (< 500KB JSON). IndexedDB not needed for static catalog.
- **CSS approach:** Continue single style.css pattern. Dark marine theme via CSS variables (maintain existing BEM structure).

## Architectural Patterns

### Pattern 1: IIFE Module Pattern (Existing, Continue)

**What:** Each .js file wraps code in `(function() { 'use strict'; ... })()` to avoid global namespace pollution.

**When to use:** All new modules (weather.js, filter.js).

**Trade-offs:**
- Pros: Avoids global conflicts, mimics module encapsulation without build system
- Cons: No tree-shaking, manual dependency management via script order

**Example:**
```javascript
// weather.js
(function () {
    'use strict';

    // Module-private state
    let expandedDays = new Set([0]); // Day 0 (today) expanded by default

    function renderWeatherAccordion(container, dailyData) {
        // Render 7 accordion sections
        dailyData.forEach((day, index) => {
            const section = createAccordionSection(day, index);
            section.addEventListener('click', () => toggleDay(index));
            container.appendChild(section);
        });
    }

    function toggleDay(dayIndex) {
        if (expandedDays.has(dayIndex)) {
            expandedDays.delete(dayIndex);
        } else {
            expandedDays.add(dayIndex);
        }
        updateAccordionUI();
    }

    // Expose public API
    window.renderWeatherAccordion = renderWeatherAccordion;
})();
```

### Pattern 2: Debounced Search Input (Existing, Extend)

**What:** Delay search execution until user stops typing (300ms). Already used in existing location search.

**When to use:** Fish catalog search input. Reuse existing `debounce()` from utils.js.

**Trade-offs:**
- Pros: Reduces expensive filter operations, smooth UX
- Cons: Slight delay, but 300ms is imperceptible for search

**Example:**
```javascript
// In fish-ui.js or filter.js
const searchInput = document.getElementById('fish-search');
searchInput.addEventListener('input', debounce(function(e) {
    const query = e.target.value.trim().toLowerCase();
    const filtered = filterFish(fishData, { searchQuery: query });
    renderFilteredFishList(filtered);
}, 300));
```

### Pattern 3: Accordion with Max-Height Animation (Standard for Vanilla JS)

**What:** Use `maxHeight` transition to smoothly expand/collapse content. Set `maxHeight: 0` when collapsed, `maxHeight: scrollHeight + 'px'` when expanded.

**When to use:** 7-day weather accordion. Industry-standard vanilla JS accordion pattern.

**Trade-offs:**
- Pros: Smooth animation without libraries, compatible with all browsers
- Cons: Requires calculating scrollHeight (minor performance cost)

**Example:**
```javascript
function toggleAccordionSection(headerEl, contentEl) {
    const isExpanded = headerEl.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        headerEl.setAttribute('aria-expanded', 'false');
        contentEl.style.maxHeight = '0';
    } else {
        headerEl.setAttribute('aria-expanded', 'true');
        contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
    }
}
```

### Pattern 4: Multi-Criteria Filter with Indexed Lookup (Performance-Optimized)

**What:** For large datasets (200+ fish), pre-index fish by category/waterType/season for O(1) lookups instead of O(n) filtering.

**When to use:** Fish filter system. Build index once on load, reuse for all filter operations.

**Trade-offs:**
- Pros: Fast filtering even with 200+ items, smooth UX
- Cons: Upfront index build cost (acceptable, happens once on page load)

**Example:**
```javascript
// filter.js
(function () {
    'use strict';

    let fishIndex = {
        byWaterType: {},
        byCategory: {},
        bySeason: {}
    };

    function buildFishIndex(fishData) {
        fishData.forEach(fish => {
            // Index by waterType
            fish.waterTypes.forEach(wt => {
                if (!fishIndex.byWaterType[wt]) fishIndex.byWaterType[wt] = [];
                fishIndex.byWaterType[wt].push(fish);
            });

            // Index by category
            if (!fishIndex.byCategory[fish.category]) {
                fishIndex.byCategory[fish.category] = [];
            }
            fishIndex.byCategory[fish.category].push(fish);

            // Index by season (if applicable)
            if (fish.season) {
                fish.season.forEach(month => {
                    if (!fishIndex.bySeason[month]) fishIndex.bySeason[month] = [];
                    fishIndex.bySeason[month].push(fish);
                });
            }
        });
    }

    function filterFish(criteria) {
        // Start with full set or indexed subset
        let results = fishData;

        if (criteria.waterType) {
            results = fishIndex.byWaterType[criteria.waterType] || [];
        }

        if (criteria.category) {
            results = results.filter(f => f.category === criteria.category);
        }

        if (criteria.searchQuery) {
            const query = criteria.searchQuery.toLowerCase();
            results = results.filter(f =>
                f.name.toLowerCase().includes(query) ||
                f.scientificName.toLowerCase().includes(query) ||
                (f.nicknames && f.nicknames.some(n => n.toLowerCase().includes(query)))
            );
        }

        return results;
    }

    window.buildFishIndex = buildFishIndex;
    window.filterFish = filterFish;
})();
```

### Pattern 5: Offline-First with Stale-While-Revalidate (Extend Existing)

**What:** Serve cached weather data immediately, fetch fresh data in background. Service Worker pattern already in use, extend for new weather data.

**When to use:** Enhanced weather API calls (marine data, UV index, pressure trends).

**Trade-offs:**
- Pros: Instant load, works offline, fresh data when online
- Cons: May briefly show stale data

**Example (in sw.js):**
```javascript
// Service Worker strategy for weather API
self.addEventListener('fetch', event => {
    if (event.request.url.includes('api.open-meteo.com')) {
        event.respondWith(
            caches.open('weather-cache-v2').then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    // Return cached response immediately, update cache in background
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});
```

## Data Flow

### Weather Accordion Flow (NEW)

```
User loads Weather tab
    ↓
app.js: renderWeatherSection()
    ↓
weather.js: renderWeatherAccordion(container, dailyWeatherData)
    ↓
Create 7 accordion sections:
  - Section 0 (today): aria-expanded="true", maxHeight=auto
  - Sections 1-6: aria-expanded="false", maxHeight=0
    ↓
User clicks day header
    ↓
weather.js: toggleDay(dayIndex)
    ↓
Update expandedDays Set
    ↓
Update DOM: aria-expanded, maxHeight transition
    ↓
Save expanded state to storage.js (optional persistence)
```

### Fish Filter Flow (NEW)

```
User opens Fish tab
    ↓
app.js: renderFishUI()
    ↓
filter.js: buildFishIndex(fishData) (one-time)
    ↓
fish-ui.js: renderFishList(fishData, filters={})
    ↓
Display full catalog (grid of fish cards)
    ↓
User types in search OR selects filter dropdown
    ↓
Debounced input handler (300ms)
    ↓
filter.js: filterFish({ searchQuery, waterType, category })
    ↓
Return filtered subset (using index for performance)
    ↓
fish-ui.js: renderFishList(filteredData, filters)
    ↓
Update grid (hide non-matching, show matching)
    ↓
storage.js: saveFilterState(filters) (optional persistence)
```

### Key Data Flows

1. **Weather data enrichment:** api.js fetches additional params → weather.js formats for accordion → app.js renders
2. **Fish search:** User input → debounced → filter.js filters → fish-ui.js re-renders grid
3. **Filter persistence:** filter state → storage.js → IndexedDB → restored on next load
4. **Dark theme:** CSS variables in :root → all components inherit → toggle (future: user preference in storage)

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (40 fish) | No optimization needed, linear filtering works fine |
| Target (200+ fish) | Build index on load (byWaterType, byCategory), O(1) lookups. Debounce search input. |
| Future (500+ fish) | Virtual scrolling for fish grid (IntersectionObserver), lazy load images, paginate results |

### Scaling Priorities

1. **First bottleneck (200+ fish):** Search/filter performance
   - **Fix:** Indexed filtering (Pattern 4), debounced search (Pattern 2)
   - **Benefit:** Sub-50ms filter operations, smooth UX

2. **Second bottleneck (500+ fish, unlikely):** DOM rendering of large grid
   - **Fix:** Virtual scrolling (render only visible cards), lazy image loading (already using `loading="lazy"`)
   - **Benefit:** Constant render time regardless of dataset size

3. **Weather data size (7-day detailed):** Minimal impact
   - Each day: ~20 fields × 7 days = ~140 data points (< 10KB JSON)
   - Accordion collapses 6 days by default → renders only ~3-4 visible sections

## Anti-Patterns

### Anti-Pattern 1: Global Filter State in App.js

**What people do:** Store filter criteria as global variables in app.js alongside currentWeather, currentLocation, etc.

**Why it's wrong:** app.js becomes bloated. Filter state couples to app lifecycle, harder to test filter logic in isolation.

**Do this instead:** Encapsulate filter state in filter.js module. Expose `getActiveFilters()` and `setFilters(criteria)` functions. app.js orchestrates but doesn't own filter state.

```javascript
// BAD: in app.js
let currentFilters = { waterType: null, category: null, searchQuery: '' };

// GOOD: in filter.js
(function() {
    let activeFilters = { waterType: null, category: null, searchQuery: '' };

    window.getActiveFilters = () => ({ ...activeFilters });
    window.setFilters = (newFilters) => {
        activeFilters = { ...activeFilters, ...newFilters };
    };
})();
```

### Anti-Pattern 2: Re-Fetching Weather on Every Accordion Expand

**What people do:** Trigger API call when user expands a day section to load "detailed" data.

**Why it's wrong:** Unnecessary API calls (Open-Meteo already returns 7-day data in one response). Slow UX, breaks offline mode.

**Do this instead:** Fetch all 7 days once. Store in currentWeather. Accordion sections read from in-memory data. Render details on expand from existing data.

```javascript
// BAD
function expandDay(dayIndex) {
    fetchWeatherData(location, dayIndex); // NO!
}

// GOOD
function expandDay(dayIndex) {
    const dayData = currentWeather.daily[dayIndex]; // Already in memory
    renderDayDetails(container, dayData);
}
```

### Anti-Pattern 3: Filtering on Every Keystroke Without Debounce

**What people do:** Attach direct `input` event listener to search field, filter on every character.

**Why it's wrong:** For 200+ fish, filtering 10x per second (fast typing) causes UI jank, wasted CPU cycles.

**Do this instead:** Use debounce (300ms). Already implemented in utils.js. Reduces filter operations by ~90%.

```javascript
// BAD
searchInput.addEventListener('input', (e) => {
    filterFish(e.target.value); // Runs 50x while typing "Adriatic"
});

// GOOD
searchInput.addEventListener('input', debounce((e) => {
    filterFish(e.target.value); // Runs once, 300ms after user stops
}, 300));
```

### Anti-Pattern 4: Storing 200 Fish in IndexedDB

**What people do:** Load fish-data.json, immediately write to IndexedDB, read from IndexedDB on every render.

**Why it's wrong:** fish-data.json is static, doesn't change. IndexedDB adds async complexity, slower than JSON fetch (cached by Service Worker). No benefit.

**Do this instead:** Keep fish data in fish-data.json. Fetch once on page load. Service Worker caches the file for offline. Store only user-specific data (favorites) in IndexedDB.

```javascript
// BAD
async function loadFish() {
    const stored = await getFishFromIndexedDB(); // Slow, complex
    return stored;
}

// GOOD
async function loadFish() {
    const resp = await fetch('data/fish-data.json'); // Fast, simple, offline via SW
    return await resp.json();
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Open-Meteo Weather API | Extend existing api.js `fetchWeatherData()` | Add hourly params: `uv_index`, `pressure_msl`, `wave_height` (marine), `wind_gusts_10m` |
| Open-Meteo Geocoding | No change | Already integrated, used for location search |
| Leaflet Maps | No change | Already integrated, map.js handles all interactions |
| IndexedDB | Extend storage.js | Add stores/functions: `filterPreferences`, `weatherCacheV2` (expanded data) |
| Service Worker | Extend sw.js cache list | Add weather.js, filter.js to CACHE_FILES array, bump CACHE_VERSION |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **app.js ↔ weather.js** | Function calls | app.js calls `renderWeatherAccordion(container, dailyData)`. weather.js emits no events. |
| **app.js ↔ filter.js** | Function calls + state queries | app.js calls `filterFish(criteria)`, reads `getActiveFilters()`. No events needed. |
| **filter.js ↔ fish-ui.js** | Data flow only | filter.js returns filtered array. fish-ui.js renders. No direct coupling. |
| **weather.js ↔ storage.js** | Optional persistence | weather.js can call `saveSetting('expandedDays', array)` to persist accordion state. |
| **app.js ↔ api.js** | Existing pattern, extend | app.js calls `fetchWeatherData()`. api.js returns enriched WeatherData object with new fields. |

### Build Order Implications (Critical)

**Dependency chain for new modules:**
1. config.js — must load first (defines constants used by weather.js, filter.js)
2. utils.js — must load before filter.js (provides debounce function)
3. api.js — must load before weather.js (weather.js may call api.js utilities)
4. storage.js — must load before weather.js and filter.js (both may persist state)
5. **weather.js (NEW)** — must load before app.js
6. **filter.js (NEW)** — must load before fish-ui.js (fish-ui may call filter functions)
7. fish-ui.js — must load before app.js
8. app.js — loads last, orchestrates all

**Recommended script order in index.html:**
```html
<script defer src="js/config.js"></script>
<script defer src="js/utils.js"></script>
<script defer src="js/api.js"></script>
<script defer src="js/solunar.js"></script>
<script defer src="js/storage.js"></script>
<script defer src="js/map.js"></script>
<script defer src="js/weather.js"></script>    <!-- NEW -->
<script defer src="js/filter.js"></script>     <!-- NEW -->
<script defer src="js/fish-ui.js"></script>
<script defer src="js/app.js"></script>
```

## Component Boundaries - Major New Components

### 1. Weather Accordion Component (weather.js)

**Responsibility:**
- Render 7-day weather accordion (1 section per day)
- Manage expanded/collapsed state per day
- Handle click events on day headers
- Format detailed weather data for display (wind, pressure, UV, waves, etc.)

**Interface (Public API):**
```javascript
// Render accordion into container
function renderWeatherAccordion(containerEl, dailyWeatherData)

// Toggle specific day (called by event handler)
function toggleDay(dayIndex)

// Restore accordion state from saved preferences
function restoreAccordionState(expandedDaysArray)
```

**Data Dependencies:**
- Input: `dailyWeatherData` (array of 7 DailyWeatherData objects from api.js)
- Output: None (renders to DOM, updates aria-expanded attributes)
- Persisted: `expandedDays` array (via storage.js)

**Integration Points:**
- Called by: app.js `renderWeatherSection()`
- Calls: storage.js `saveSetting('expandedDays')` (optional)
- Uses: utils.js formatting functions (formatTemperature, formatWindSpeed, etc.)

### 2. Fish Filter Component (filter.js)

**Responsibility:**
- Build searchable index of fish data (by waterType, category, season)
- Execute multi-criteria filtering (waterType + category + searchQuery)
- Return filtered fish array
- Persist/restore filter state

**Interface (Public API):**
```javascript
// Build index on initial load (call once)
function buildFishIndex(fishDataArray)

// Execute filter with criteria
function filterFish(criteria)
// criteria = { waterType?: string, category?: string, searchQuery?: string, season?: string }

// Get/set active filters
function getActiveFilters()
function setFilters(newCriteria)
```

**Data Dependencies:**
- Input: `fishData` array (from fish-data.json)
- Output: Filtered `fishData` subset
- Persisted: `activeFilters` object (via storage.js)

**Integration Points:**
- Called by: app.js (on user input), fish-ui.js (on filter change)
- Calls: storage.js `saveSetting('fishFilters')`
- Uses: utils.js `debounce()` (indirectly, via app.js event handler)

### 3. Extended Fish Data Structure (fish-data.json)

**Additions to FishSpecies schema:**
```javascript
{
  // Existing fields (40 fish currently have these)
  id, name, scientificName, image, family, description, size, habitat,
  waterTypes, techniques, baits, tips, weatherPrefs, season, closedSeason,
  difficulty, catchAndRelease, minSize, category,

  // NEW fields for enhanced catalog
  "edibility": "excellent|good|poor|not_recommended",  // Essbarkeit
  "taste": "string",                                   // Geschmacksbeschreibung
  "cookingMethods": ["grilled", "baked", "fried"],    // Zubereitungsmethoden
  "baitColors": ["red", "yellow", "natural"],         // Köderfarben
  "depthRange": { "min": 0, "max": 50 },              // Tiefenbereich in Metern
  "region": ["adriatic", "danube", "alpine_lakes"],   // Regionen
  "nicknames": ["string"],                             // Lokale Namen
  "imageCredit": "string"                              // Bildquelle
}
```

**Expansion Plan:**
- Current: ~40 fish (mostly freshwater, some Adriatic)
- Target: 200+ fish (comprehensive Adriatic + European freshwater)
- Categories: "raubfisch", "friedfisch", "salmonide", "salzwasser", "meeresfruechte"

**Integration:**
- Loaded by: app.js on init
- Filtered by: filter.js
- Rendered by: fish-ui.js

## Sources

- [Vanilla JavaScript Accordion Pattern](https://dev.to/bek-dev/vanilla-javascript-accordion-57e)
- [Progressive Accordion Components - Go Make Things](https://gomakethings.com/how-to-build-a-progressively-enhanced-accordion-component-with-vanilla-js/)
- [Optimizing Real-Time Search with JavaScript on Large Datasets](https://nelkodev.com/en/blog/mastering-real-time-search-on-large-datasets-with-javascript/)
- [Crossfilter for Large Dataset Filtering](https://square.github.io/crossfilter/)
- [In-Page Filtered Search With Vanilla JavaScript - CSS-Tricks](https://css-tricks.com/in-page-filtered-search-with-vanilla-javascript/)
- [PWA Offline Storage Strategies-IndexedDB and Cache API](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)
- [Offline-first frontend apps 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Build an Offline-First PWA with IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)
- [PWA 2.0 + Edge Runtime: Next-Gen PWAs 2026](https://www.zignuts.com/blog/pwa-2-0-edge-runtime-full-stack-2026)

---
*Architecture research for: Fishing/Weather PWA Enhancement*
*Researched: 2026-02-07*
