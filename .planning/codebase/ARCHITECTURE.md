# Architecture

**Analysis Date:** 2026-02-07

## Pattern Overview

**Overall:** Modular MVC with layered separation of concerns

**Key Characteristics:**
- Global namespace pollution minimized through IIFE module pattern
- Centralized configuration (`CONFIG` object in `config.js`)
- Event-driven UI updates triggered by data layer changes
- Offline-first caching strategy with IndexedDB and Service Worker
- Progressive Enhancement: works without JavaScript, enhanced with features

## Layers

**Configuration Layer:**
- Purpose: Centralized constants, API endpoints, type definitions, shared contracts
- Location: `js/config.js`
- Contains: API endpoints, database schema, weather codes, moon phases, catch probability ratings, JSDoc type definitions
- Depends on: Nothing (pure data)
- Used by: All other modules

**Data/API Layer:**
- Purpose: Fetch weather, geocoding, location data from external APIs
- Location: `js/api.js`
- Contains: `fetchWeatherData()`, `searchLocation()`, `getCurrentLocation()`, retry logic
- Depends on: `CONFIG` (endpoints), `utils.js` (formatting)
- Used by: `app.js` (for weather refresh)
- Features: Exponential backoff retry, current hour detection, hourly/daily forecast parsing

**Calculation Layer:**
- Purpose: Calculate moon phases, solunar periods, catch probability scores
- Location: `js/solunar.js`
- Contains: `getMoonData()`, `getSolunarPeriods()`, `calculateCatchProbability()`, Julian Day calculations
- Depends on: `CONFIG` (MOON_PHASES, CATCH_WEIGHTS)
- Used by: `app.js` (for rendering weather dashboard)
- Algorithms: Julian Day conversion, synodic month interpolation, solunar period estimation

**Storage Layer:**
- Purpose: Persistent storage of user data (favorites, history, settings, cached weather)
- Location: `js/storage.js`
- Contains: IndexedDB initialization, `addFavorite()`, `getFavorites()`, `addToHistory()`, `getSetting()`, weather cache functions
- Depends on: `CONFIG` (database name, store names)
- Used by: `app.js` (favorites, location history), offline handling
- Schema: 4 stores (favorites, history, settings, weatherCache)

**UI Rendering Layer:**
- Purpose: Render DOM elements for specific sections (fish list, fish detail, search)
- Location: `js/fish-ui.js`
- Contains: `renderFishList()`, `renderFishDetail()`, `renderFishSearch()`, fallback SVG generation
- Depends on: Fish data array structure, HTML element references
- Used by: `app.js` (fish section rendering, detail views)
- Pattern: Fragment insertion, HTML escaping for XSS prevention

**Map Layer:**
- Purpose: Initialize Leaflet map, manage markers, handle map interactions
- Location: `js/map.js`
- Contains: `initMap()`, `setMapLocation()`, `addMarker()`, global `_map` and `_marker` variables
- Depends on: Leaflet library (external CDN), `CONFIG` (tile URL, bounds)
- Used by: `app.js` (map toggle, location selection)
- Features: Tap-to-select location, dynamic marker management

**Utilities Layer:**
- Purpose: Common formatting, conversion, and helper functions
- Location: `js/utils.js`
- Contains: `formatTemperature()`, `formatWindSpeed()`, `formatDate()`, `formatTime()`, `debounce()`, `weatherCodeToText()`, `_esc()` (XSS prevention)
- Depends on: Nothing
- Used by: All other modules (especially app.js)

**Controller/Orchestrator Layer:**
- Purpose: Coordinate all modules, manage application state, handle user interactions
- Location: `js/app.js`
- Contains: App initialization, state management, tab switching, location setting, data loading, all UI rendering orchestration
- Depends on: All other modules (config, api, solunar, storage, map, fish-ui, utils)
- Used by: HTML (via DOMContentLoaded)
- State variables: `currentLocation`, `currentWeather`, `currentMoon`, `currentSolunar`, `currentCatch`, `fishData`, `selectedFish`, `favoriteIds`

## Data Flow

**Initial Load Flow:**

1. HTML document loads, deferred scripts queue
2. `DOMContentLoaded` fires → `app.js` `init()` called
3. Init sequence:
   - `initDB()` → IndexedDB stores created
   - `getFavorites()` → Load saved favorites from storage
   - `fetch('data/fish-data.json')` → Load fish catalog
   - `setupTabs()` → Attach tab navigation listeners
   - `setupLocationSearch()` → Attach geocoding listeners
   - `setupGPSButton()` → Attach GPS click handler
   - `setupMapToggle()` → Attach map toggle handler
   - `renderFishUI()` → Initialize fish list and search
   - `renderFavoritesSection()` → Load saved favorites
   - `getSetting('lastLocation')` → Load last used location (fallback to GPS, fallback to Salzburg)
   - `setLocation(location)` → Trigger weather load for current location
   - `registerServiceWorker()` → Register offline support
   - `setInterval(refreshData, 30min)` → Auto-refresh weather

**Weather Update Flow:**

1. User selects location (search result, GPS, map tap, or history)
2. `setLocation(location)` called
3. `saveSetting('lastLocation')` → Store for next session
4. `addToHistory(location)` → Add to location history
5. Map marker updated if map visible
6. `loadWeatherData()` called:
   - `fetchWeatherData(location)` from Open-Meteo API
   - Cache weather to IndexedDB via `cacheWeatherData()`
   - `getMoonData(now)` → Calculate moon phase for today
   - `getSolunarPeriods(now, lat, lon)` → Calculate solunar periods
   - `calculateCatchProbability(weather, moon, solunar)` → Overall score + breakdown
7. UI updated:
   - `renderWeatherDashboard()` → Current conditions
   - `renderAstroData()` → Sun/moon times and phase
   - `renderCatchSummary()` → Gauge + tip
   - `renderHourlyForecast()` → 24-hour scroll
   - `renderDailyForecast()` → 7-day accordion
   - `renderCatchBreakdown()` → Factor bars
8. Skeleton loading states removed
9. If error, try `getCachedWeather()` for offline fallback

**Fish Selection Flow:**

1. User clicks fish card in grid
2. `onFishSelect(fish)` called from `renderFishList()` callback
3. Calculate fish-specific catch probability via `calculateCatchProbability(..., fish)`
4. Check if fish is in favorites via `favoriteIds.indexOf(fishId)`
5. Hide fish list/search, show `fish-detail-container`
6. `renderFishDetail(container, fish, fishCatch, isFav, toggleCallback)` called
7. User can toggle favorite → `toggleFavorite(fishId)` → IndexedDB update

**Offline Flow:**

1. Network error during `fetchWeatherData()`
2. Fallback to `getCachedWeather(locationKey)` → IndexedDB
3. Render cached data with timestamp "Daten von HH:MM"
4. Show offline banner
5. Service Worker serves cached assets (CSS, JS, HTML shell)
6. Refresh button (not auto-refresh) when back online

## State Management

**App-level state (IIFE closure variables in `app.js`):**
- `currentLocation` - Active location object
- `currentWeather` - Fetched weather data for current location
- `currentMoon` - Calculated moon data for today
- `currentSolunar` - Calculated solunar periods for today
- `currentCatch` - Calculated catch probability and breakdown
- `fishData` - Array of all fish species (from fish-data.json)
- `selectedFish` - Currently viewed fish detail (or null)
- `favoriteIds` - Array of favorite fish IDs
- `refreshTimer` - Interval ID for auto-refresh

**DOM state (class names, hidden attributes):**
- `.active` on sections and tabs for tab visibility
- `hidden` attribute on maps, details, dialogs
- `loading` class on buttons (GPS)
- `skeleton-text` class on loading placeholders

**Persistent state (IndexedDB):**
- `favorites` store: favorited fish IDs
- `history` store: location search history with timestamps
- `settings` store: `lastLocation`, timezone preferences
- `weatherCache` store: cached weather by location key

## Key Abstractions

**LocationData:**
- Purpose: Represent a geographic location
- Examples: `js/config.js` line 184, used throughout `app.js`
- Properties: `lat`, `lon`, `name`, `timezone`
- Pattern: Plain object, passed between API, map, storage layers

**WeatherData:**
- Purpose: Hold all weather information for a location
- Examples: Parsed in `js/api.js`, rendered in `app.js` renderWeatherDashboard()
- Contains: Current conditions, hourly forecast (48h), daily forecast (7d)
- Pattern: Structured with hourly/daily arrays for time-series

**CatchProbability:**
- Purpose: Score fishing conditions with weighted factor analysis
- Examples: Calculated in `js/solunar.js`, displayed in `app.js`
- Contains: Overall score (0-100), rating label, color, factor breakdown, tip text
- Pattern: Multiple properties for rendering (color, rating, tip) derived from single calculation

**FishSpecies:**
- Purpose: Represent a single fish species with metadata
- Examples: `data/fish-data.json` entries, iterated in `js/fish-ui.js`
- Properties: id, name, scientificName, image, family, description, size, habitat, waterTypes, techniques, baits, tips, weatherPrefs, season, closedSeason, difficulty, catchAndRelease, minSize, category
- Pattern: Comprehensive data object, supports fish-specific catch probability calculation

## Entry Points

**HTML Entry:**
- Location: `index.html`
- Triggers: Browser load
- Responsibilities: Define DOM structure (4 main sections: weather, fish, forecast, favorites), load stylesheets, defer script loading

**App Initialization:**
- Location: `js/app.js` lines 30-32 (DOMContentLoaded)
- Triggers: HTML loaded + deferred scripts executed
- Responsibilities: Initialize database, load fish data, setup all event listeners, load last location, register service worker, start auto-refresh

**Tab Navigation:**
- Location: `js/app.js` `setupTabs()` function
- Triggers: Click on tab bar buttons
- Responsibilities: Switch visible section, manage aria-selected state, clear scroll position, update favorites if needed

**Location Selection:**
- Location: `js/app.js` `setLocation()` function
- Triggers: Search result click, GPS button click, map tap, location history click
- Responsibilities: Update location display, save for next session, update map marker, load weather data

**Service Worker:**
- Location: `sw.js`
- Triggers: Browser loads (registered from `app.js` line 974)
- Responsibilities: Cache app shell, intercept fetch requests, serve cached assets/API responses offline

## Error Handling

**Strategy:** Graceful degradation - app functions with reduced features when errors occur

**Patterns:**
- Try/catch blocks in async functions with fallback behavior
- Network errors trigger offline UI (show offline banner, use cached data)
- Missing fish data falls back to empty list
- Geolocation failures fall back to manual location search
- Service Worker registration failures logged but non-blocking
- IndexedDB failures logged but non-blocking (app works without persistence)
- Invalid moon calculations silently use fallback values
- XSS prevention via `_esc()` function on all user-visible text from external sources

**Key error boundaries:**
- `fetchWeatherData()`: Retry 3x with exponential backoff, fallback to cache
- `setLocation()`: Save always succeeds or silently fails
- Fish selection: Works even if catch probability calculation fails
- Map interactions: Graceful failure if Leaflet not loaded

## Cross-Cutting Concerns

**Logging:** Console.error() for significant failures, console.warn() for non-blocking issues

**Validation:**
- Weather API response parsing with fallback indices
- Location object shape validation before using
- Fish data array length checks before iteration
- IndexedDB transactions with error handlers

**Authentication:** Not applicable (Open-Meteo API is public, no auth required)

**Localization:** All UI text in German (de-AT locale), hardcoded in HTML/JS

**Accessibility:**
- ARIA labels on buttons and interactive elements
- ARIA roles on custom components (listbox, tabs, buttons)
- Semantic HTML (nav, main, sections)
- Keyboard support (Enter/Space on fish cards)
- Reduced motion preference respected in animations
- Skip link to main content
- Color contrast maintained

**Performance:**
- Lazy loading images in fish grid (`loading="lazy"`)
- Intersection Observer for staggered animation of hourly items
- Debounced search input (300ms)
- Debounced scroll events (100ms back-to-top)
- Fragment insertion for DOM efficiency
- CSS transitions for animations instead of JS
- Service Worker caching for offline support

**Security:**
- Content Security Policy: Not implemented (no manifest)
- XSS prevention: HTML escaping via `_esc()` on all dynamic content
- CSRF: Not applicable (GET-only API calls)
- Secrets: No API keys needed (Open-Meteo is public)

---

*Architecture analysis: 2026-02-07*
