# Coding Conventions

**Analysis Date:** 2026-02-07

## Naming Patterns

**Files:**
- Kebab-case for module files: `api.js`, `fish-ui.js`, `storage.js`, `solunar.js`
- Descriptive names indicating module responsibility
- Shared utility files use descriptive names: `config.js`, `utils.js`, `map.js`

**Functions:**
- camelCase for function names: `fetchWeatherData()`, `getMoonData()`, `addFavorite()`, `renderFishList()`
- Descriptive verbs at start: `fetch`, `get`, `set`, `render`, `format`, `search`
- Private/internal functions use leading underscore: `_escAttr()`, `_esc()`, `_fishFallbackSvg()`
- All async functions explicitly use `async` keyword: `async function fetchWeatherData()`

**Variables:**
- camelCase throughout: `currentLocation`, `currentWeather`, `fishData`, `favoriteIds`
- Module-level state variables prefixed with underscore for private state: `_db`, `_map`, `_marker`, `_onLocationSelect`
- Constants use UPPER_SNAKE_CASE: `SYNODIC_MONTH`, `KNOWN_NEW_MOON_JD`, `API_CACHE_NAME`
- Configuration constants in objects: `CONFIG`, `CATCH_WEIGHTS`, `MOON_PHASES`, `WEATHER_CODES`, `CATCH_RATINGS`

**Types (JSDoc):**
- PascalCase for typedef objects: `LocationData`, `WeatherData`, `MoonData`, `CatchProbability`, `FishSpecies`
- Properties in types use camelCase: `windSpeed`, `windDirection`, `cloudCover`, `precipitationProbability`
- Arrays denoted with brackets: `LocationData[]`, `HourlyForecast[]`

## Code Style

**Formatting:**
- No explicit linter/formatter detected (no .eslintrc, .prettierrc found)
- Manual formatting observed:
  - 4-space indentation throughout
  - Semicolons required at end of statements
  - Single quotes in attribute escaping contexts, double quotes for HTML attributes
  - String template literals with backticks: `` `${CONFIG.API.WEATHER}?${params}` ``

**Linting:**
- Not detected - no ESLint or Prettier configuration found
- Code follows consistent style manually

**Conventions observed:**
- Consistent use of `'use strict';` in IIFE module pattern (see `app.js`)
- Comments use multi-line `/** */` for JSDoc, single `//` for inline comments
- Code organized with visual section headers: `// ============================================================`

## Import Organization

**Order:**
1. No external imports in modules (plain JavaScript, no module system)
2. CONFIG object imported via global scope: `CONFIG.API.WEATHER`, `CONFIG.DB.STORES`
3. Type definitions imported via JSDoc comments
4. Helper functions grouped within same file or exported at bottom

**Path Aliases:**
- Not used - plain JavaScript with global scope
- Modules depend on each other through script tag ordering in HTML

**Module Pattern:**
- Conditional CommonJS export at file end:
  ```javascript
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = { fetchWeatherData, searchLocation, getCurrentLocation };
  }
  ```
- Allows reuse in Node.js environment while working in browser

## Error Handling

**Patterns:**
- Try-catch blocks for async operations:
  ```javascript
  try {
      const resp = await fetch('data/fish-data.json');
      fishData = await resp.json();
  } catch (e) {
      console.error('Fischdaten laden fehlgeschlagen:', e);
      fishData = [];
  }
  ```
- Promise rejection handling in Promise constructors:
  ```javascript
  request.onerror = (event) => {
      reject(new Error(`IndexedDB Fehler: ${event.target.error}`));
  };
  ```
- Graceful degradation: Continue with sensible defaults on error
- Explicit validation before operations:
  ```javascript
  if (typeof fishId !== 'string' || fishId.length === 0) {
      throw new Error('fishId muss ein nicht-leerer String sein');
  }
  ```

## Logging

**Framework:** Plain `console` object (no logging library detected)

**Patterns:**
- `console.error()` for critical failures: `console.error('Fischdaten laden fehlgeschlagen:', e);`
- `console.warn()` for non-fatal issues: `console.warn('IndexedDB init fehlgeschlagen:', e);`
- Error messages in German to match UI language
- No debug/info logging detected

## Comments

**When to Comment:**
- File header with purpose and responsibility
- Section headers for logical groupings (visible with `// ============================================================`)
- Complex algorithms documented: moon calculations, Julian Day conversion
- Team contracts specified in comments (function signatures expected from each team)

**JSDoc/TSDoc:**
- Extensive JSDoc usage throughout codebase
- Every function documented with `@param` and `@returns`
- Type definitions as `@typedef` objects with full property documentation
- Example from `api.js`:
  ```javascript
  /**
   * Fetch with exponential backoff retry
   * @param {string} url - URL to fetch
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Response>}
   */
  async function fetchWithRetry(url, maxRetries) {
  ```

## Function Design

**Size:**
- Most functions 10-50 lines
- Larger functions (100+ lines) handle complex logic: `fetchWeatherData()` does API parsing and data transformation
- Helper functions extracted for reuse: `buildLocationName()`, `formatHour()`, `toJulianDay()`

**Parameters:**
- Explicit parameter names (no destructuring observed)
- Optional parameters marked in JSDoc with square brackets: `@param {string} [label]`
- Defaults handled via conditional assignment: `if (maxRetries === undefined) maxRetries = 3;`
- Objects passed for related data (LocationData contains lat, lon, name, timezone together)

**Return Values:**
- Promise<T> for async operations
- Plain objects for complex return types (e.g., `{ text: string, icon: string }`)
- Arrays for collections: `LocationData[]`, `string[]`
- Early returns for error conditions and empty cases:
  ```javascript
  if (!query || query.trim().length < 2) {
      return [];
  }
  ```

## Module Design

**Exports:**
- All public functions exported at bottom via CommonJS pattern
- Single responsibility per module:
  - `api.js`: Weather/geocoding API calls
  - `solunar.js`: Moon and catch probability calculations
  - `storage.js`: IndexedDB operations
  - `fish-ui.js`: Fish rendering functions
  - `utils.js`: Format and utility functions
  - `map.js`: Leaflet map operations

**Barrel Files:**
- Not used - single-file modules with clear exports

**Global Dependencies:**
- All modules depend on `CONFIG` (config.js) for API endpoints, constants, database schema
- Modules in `fish-ui.js` depend on helper functions from `utils.js` via global scope
- HTML includes scripts in dependency order

## German Localization

**Conventions:**
- All UI strings, error messages, and comments in German: "Standort suchen", "Fischdaten laden fehlgeschlagen"
- Variable names in German for domain concepts: `fishData`, `fishId`, `currentLocation`
- JSDoc uses German: "Momentaner Fangwahrscheinlichkeit", "Breitengrad", "Laengengrad"

## HTML/DOM Patterns

**DOM References:**
- Helper function `$()` for element selection: `const $ = (id) => document.getElementById(id);`
- IDs use kebab-case: `location-search`, `section-weather`, `map-container`
- CSS classes use kebab-case: `fish-card`, `fish-grid`, `location-bar__search`
- BEM methodology observed: `fish-card__image`, `fish-card__body`, `fish-card__name`

**DOM Manipulation:**
- Direct innerHTML for card templates (with HTML escaping)
- DocumentFragment for batch appends to reduce reflows: `document.createDocumentFragment()`
- Event listeners added inline: `card.addEventListener('click', function() { ... })`
- Custom attributes for accessibility: `role="button"`, `aria-label`, `tabindex`

---

*Convention analysis: 2026-02-07*
