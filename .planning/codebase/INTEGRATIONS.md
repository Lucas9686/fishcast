# External Integrations

**Analysis Date:** 2026-02-07

## APIs & External Services

**Weather Forecasting:**
- Open-Meteo API v1 - Historical and forecast weather data
  - Endpoint: `https://api.open-meteo.com/v1/forecast`
  - Auth: None required (free, public API)
  - Implementation: `js/api.js` - `fetchWeatherData(location)` function
  - Parameters configured in `js/config.js` lines 18-58
  - Data returned: Current conditions, hourly forecast (48h), daily forecast (7 days)
  - Includes: Temperature, humidity, wind, pressure, precipitation, cloud cover, visibility, weather codes (WMO)
  - Pressure trend calculated from 3-hour comparison (line 77-80 in api.js)

**Geocoding & Location Search:**
- Open-Meteo Geocoding API v1 - Forward and reverse geocoding
  - Endpoint: `https://geocoding-api.open-meteo.com/v1/search`
  - Auth: None required (free, public API)
  - Implementation: `js/api.js` - `searchLocation(query)` function
  - Parameters: Language (German), result count (max 8)
  - Returns: Latitude, longitude, timezone, location name (city, state, country)
  - Used for: User location search via text input, reverse geocoding for GPS coordinates

**Mapping & Visualization:**
- OpenStreetMap (tile provider)
  - Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - Auth: None required
  - Client library: Leaflet 1.9.4 (CDN)
  - Implementation: `js/map.js` - Leaflet map initialization
  - Configuration: `js/config.js` lines 66-74
  - Features: Zoomable map (4-18), default center Salzburg (47.8095, 13.0550), markers for locations

## Data Storage

**Local Database:**
- IndexedDB (Browser API)
  - Database name: `petri-heil-db`
  - Version: 2
  - Stores:
    - `favorites` - Bookmarked fish species (key: fishId)
    - `history` - Location search history (key: timestamp, indexed by name)
    - `settings` - User preferences (key: setting name)
    - `weatherCache` - Cached weather data for offline mode (key: lat_lon string)
  - Implementation: `js/storage.js`
  - Accessed by: `app.js` for state persistence, offline support

**Local File Data:**
- `data/fish-data.json` - Static fish species database
  - Not a true API, but local static asset
  - Contains 60+ fish species with metadata
  - Loaded once on app initialization via fetch (app.js line 51)
  - Structure: Array of FishSpecies objects with name, size, habitat, weather preferences, techniques, baits, tips, difficulty, seasonal info

## Authentication & Identity

**Auth Provider:**
- None - App is fully public
- No user accounts, sign-in, or authentication required
- All data is device-local via IndexedDB

## Geolocation

**Browser Geolocation API:**
- Used for: GPS-based location access
- Implementation: `js/api.js` - `getCurrentLocation()` function
- Accuracy: Standard (enableHighAccuracy: false)
- Timeout: 10 seconds
- Cache: 5 minutes
- Fallback: Defaults to Salzburg (CONFIG.MAP.DEFAULT_CENTER) if GPS denied or unavailable
- Error handling: User-friendly German error messages for permission denied, unavailable, timeout (lines 241-246)

## Caching & Offline Support

**Service Worker Caching:**
- File: `sw.js`
- Install: Caches entire app shell (HTML, CSS, JS, fish data, manifest)
- Strategies:
  - Network-first for API calls (weather forecasts)
  - Cache fallback when offline
  - Cache version: `petri-heil-v1`
  - API cache version: `petri-heil-api-v1`

**IndexedDB Weather Cache:**
- Caches weather data by location (lat_lon key format)
- Enables viewing last-fetched weather when offline
- Functions: `cacheWeatherData(locationKey, weatherData)`, `getCachedWeatherData(locationKey)`
- Timestamp stored for cache freshness checks

## Webhooks & Callbacks

**Incoming:**
- None - App receives no webhooks

**Outgoing:**
- None - App sends no webhooks to external services

## Environment Configuration

**Required Environment Variables:**
- None - All configuration is static in `js/config.js`

**No Secrets Required:**
- Open-Meteo APIs are free and public (no API keys)
- Leaflet/OpenStreetMap are free and public
- No authentication tokens needed

**Secrets Location:**
- Not applicable - No secrets in this app

## API Rate Limiting

**Open-Meteo:**
- Documented: 10,000 calls/day for free tier
- Implementation handles: Exponential backoff retry on server errors (api.js lines 12-37)
- Max retries: 3 attempts with delays [1000ms, 2000ms, 4000ms]

## Data Flow

**Weather Updates:**
1. User selects location (search or GPS)
2. `fetchWeatherData()` called with location lat/lon
3. Open-Meteo API returns current + forecast data
4. Data cached in IndexedDB for offline access
5. UI rendered with current conditions and forecasts
6. Auto-refresh every 30 minutes (CONFIG.REFRESH_INTERVAL = 30 * 60 * 1000)

**Location Search:**
1. User types in location search input (debounced)
2. `searchLocation()` calls Open-Meteo Geocoding API
3. Results displayed in dropdown
4. User selects location
5. Selected location saved to IndexedDB history
6. Weather data fetched for new location

**Fish Data:**
1. Static JSON loaded on app start
2. Stored in memory (fishData array)
3. Filtered by search/category
4. Combined with current catch probability for display

## Monitoring & Observability

**Error Tracking:**
- None configured - Errors logged to browser console only
- See: console.error/warn calls throughout codebase

**Logs:**
- Browser console logging for debugging
- No external logging service

---

*Integration audit: 2026-02-07*
