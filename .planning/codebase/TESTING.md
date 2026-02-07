# Testing Patterns

**Analysis Date:** 2026-02-07

## Test Framework

**Runner:**
- No test framework detected
- No test files found (no `.test.js`, `.spec.js` files)
- No Jest, Vitest, Mocha, or other test configuration found

**Assertion Library:**
- None detected

**Run Commands:**
- No test scripts configured
- No package.json with test commands

## Test File Organization

**Location:**
- No test files present in codebase
- Testing would need to be added

**Naming:**
- Not applicable - no tests exist

**Structure:**
- Not applicable - no tests exist

## Manual Testing Approach

**Current State:**
The codebase appears to rely on manual testing and browser-based QA rather than automated tests. Key areas that would benefit from testing:

**Critical Logic (Untested):**
- `toJulianDay()` in `solunar.js` - Julian Day number calculation (astronomical algorithm)
- `getMoonData()` in `solunar.js` - Moon phase calculation from known reference date
- `estimateMoonTransit()` in `solunar.js` - Moon transit time estimation
- `calculateCatchProbability()` in `solunar.js` - Weighted catch score calculation
- `fetchWithRetry()` in `api.js` - Exponential backoff retry logic with network error handling

**API Integration (Untested):**
- `fetchWeatherData()` response parsing: Maps Open-Meteo API response to WeatherData structure
- `searchLocation()` geocoding: Query validation, results mapping, timezone defaults
- `getCurrentLocation()` geolocation: Browser geolocation, reverse geocoding, timezone detection

**Storage Operations (Untested):**
- `initDB()` - IndexedDB initialization with schema creation, upgrades
- `addFavorite()`, `removeFavorite()` - Transaction handling
- `getFavorites()`, `getHistory()` - Query and index operations
- All async Promise-based operations

**Rendering Functions (Untested):**
- `renderFishList()` in `fish-ui.js` - DOM generation from data arrays
- `renderFishDetail()` in `fish-ui.js` - Complex detail view with conditional content
- HTML escaping via `_esc()`, `_escAttr()` - XSS prevention

## Recommended Testing Strategy

**Unit Tests:**
- Test pure calculation functions first (Julian Day, moon phase)
- Test format/utility functions: `formatTemperature()`, `formatWindSpeed()`, `degToCompass()`
- Test error handling in API functions with fetch mocking

**Integration Tests:**
- Test API workflows: search location → fetch weather → calculate catch probability
- Test IndexedDB initialization and CRUD operations
- Test app state management (location changes, favorites toggling)

**E2E Tests:**
- Not configured - would require Playwright or Cypress
- Test user flows: search location, view weather, toggle favorites, view map

## Mocking

**Framework:**
- Would require Jest, Sinon, or similar mock libraries
- Not currently configured

**What to Mock:**
- `fetch()` API calls (weather, geocoding)
- `navigator.geolocation` for location testing
- `indexedDB` for storage operations
- Browser Geolocation API
- Leaflet L.map() for map component testing

**What NOT to Mock:**
- Utility functions like `formatTemperature()` - pure functions
- Configuration constants - use actual CONFIG object
- Date/Time calculations where possible (test with fixed dates)

## Fixtures and Factories

**Test Data:**
- No fixtures exist
- Would need sample data for:
  - LocationData objects: `{lat: 47.8095, lon: 13.0550, name: "Salzburg", timezone: "Europe/Vienna"}`
  - WeatherData objects with all hourly/daily forecast arrays
  - FishSpecies objects from `data/fish-data.json`
  - API responses from Open-Meteo service
  - IndexedDB test data

**Example Factory Pattern (recommended):**
```javascript
function createMockWeatherData(overrides = {}) {
    return {
        temperature: 15,
        humidity: 65,
        windSpeed: 10,
        windDirection: 180,
        pressure: 1013,
        pressureTrend: 0,
        cloudCover: 50,
        precipitation: 0,
        weatherCode: 0,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        hourly: [],
        daily: [],
        ...overrides
    };
}
```

**Location:**
- Would create in `tests/fixtures/` or `tests/mocks/` directory

## Coverage

**Requirements:**
- No coverage enforcement detected
- Not configured in any build/test configuration

**Suggested Target:**
- Core business logic (solunar calculations): 95%+
- API layer: 90%+
- Storage operations: 85%+
- Rendering: 60-70% (DOM testing is complex)

**View Coverage:**
- Would use Jest coverage command: `npm test -- --coverage`
- Currently: `npm test` script does not exist

## Test Types

**Unit Tests:**
**Scope:** Individual functions in isolation
**Approach (recommended):**
```javascript
describe('toJulianDay', () => {
    test('calculates correct Julian Day for known date', () => {
        const date = new Date(2000, 0, 6, 18, 14); // Jan 6, 2000 18:14
        const jd = toJulianDay(date);
        expect(jd).toBeCloseTo(2451550.26, 1);
    });

    test('handles different hours correctly', () => {
        const date1 = new Date(2025, 1, 7, 0, 0);
        const date2 = new Date(2025, 1, 7, 12, 0);
        expect(toJulianDay(date2)).toBeGreaterThan(toJulianDay(date1));
    });
});
```

**Integration Tests:**
**Scope:** Multiple modules working together
**Approach (recommended):**
```javascript
describe('Weather workflow', () => {
    test('search location and fetch weather', async () => {
        const location = await searchLocation('Salzburg');
        expect(location).toHaveLength(1);
        expect(location[0]).toHaveProperty('lat');
        expect(location[0]).toHaveProperty('lon');

        const weather = await fetchWeatherData(location[0]);
        expect(weather).toHaveProperty('temperature');
        expect(weather).toHaveProperty('hourly');
        expect(weather.hourly).toHaveLength(48);
    });
});
```

**E2E Tests:**
**Framework:** Not configured - would use Playwright or Cypress
**Approach:** Test complete user flows in real browser environment
- User searches for location
- App displays weather and catch probability
- User marks fish as favorite
- Data persists in IndexedDB
- Offline mode shows cached data

## Current Testing Gap

**Critical Issue:** No automated tests exist. The following should be prioritized:

1. **Astronomical Calculations** (HIGH PRIORITY)
   - `toJulianDay()`, `getMoonData()`, `estimateMoonTransit()` are complex mathematical functions
   - Errors silently produce wrong catch probability predictions
   - Should test against known astronomical reference dates

2. **API Parsing** (HIGH PRIORITY)
   - Open-Meteo response structure parsing in `fetchWeatherData()`
   - Missing error handling for malformed API responses
   - Retry logic in `fetchWithRetry()` needs verification

3. **IndexedDB Operations** (MEDIUM PRIORITY)
   - Transaction handling in storage functions
   - Migration logic in `onupgradeneeded`
   - Error cases and transaction rollback

4. **DOM Rendering** (MEDIUM PRIORITY)
   - Fish list and detail view rendering
   - HTML escaping prevents XSS but should be verified
   - Dynamic content generation in `renderFishDetail()`

## Recommended Next Steps

1. Add Jest configuration: `npm install --save-dev jest @testing-library/dom`
2. Create tests directory: `tests/unit/`, `tests/integration/`
3. Start with pure function tests (utils, calculations)
4. Add API mocking for async functions
5. Create fixtures for test data
6. Integrate with CI/CD pipeline

---

*Testing analysis: 2026-02-07*
