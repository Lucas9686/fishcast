# Stack Research

**Domain:** Fishing Weather PWA
**Researched:** 2026-02-07
**Confidence:** HIGH

## Recommended Stack

### Core Technologies (Existing)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla JS | ES2020+ | Core application logic | Already in use; zero build overhead; excellent browser support; perfect for PWAs without framework complexity |
| IndexedDB | Native API | Offline data storage | Native browser API; 20-50% of disk capacity available; async operations prevent UI blocking; perfect for large fish databases |
| Service Worker | Native API | Offline support & caching | PWA requirement; mature API; excellent for cache-first strategies with static JSON data |
| Leaflet | 1.9.4 | Interactive maps | Already integrated; lightweight (42KB gzipped); excellent mobile support; extensive plugin ecosystem |

### Weather APIs (NEW - Critical for Fishing Enhancement)

| API | Tier | Purpose | Why Recommended |
|-----|------|---------|-----------------|
| Open-Meteo Marine Weather API | Free (non-commercial) | Primary marine weather data | **HIGH CONFIDENCE** - Free for non-commercial use; wave height/direction/period, wind waves, swell data, ocean currents, sea surface temp; 7-day forecast + 92 days historical; no explicit rate limits documented; uses ICON Wave model from German Weather Service (DWD) |
| Open-Meteo Weather API | Free (non-commercial) | Barometric pressure & atmospheric data | **HIGH CONFIDENCE** - Already in use; add `surface_pressure` parameter to existing calls; pressure level forecasts available; hourly data for trend detection |
| WorldTides API | Freemium (100 credits free trial) | Tide predictions | **MEDIUM CONFIDENCE** - Global coverage including Adriatic; 100 free credits = ~50 predictions (2 credits per 7-day forecast); extremes (high/low tides) + height data; then $10 for 10,000 credits; no current data (heights only) |
| USNO Astronomical Applications API | Free | Moon phases | **HIGH CONFIDENCE** - Free with no authentication; JSON format; supports 1700-2100 date range; no rate limits mentioned; government API (reliable) |

### Supporting Libraries (NEW)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SunCalc | Latest (~2KB) | Client-side moon calculations | **HIGH CONFIDENCE** - Purely client-side; BSD license; tiny footprint; provides moon phase, illumination fraction (0.0-1.0), moonrise/moonset; eliminates API dependency for moon data; use instead of USNO API for real-time calculations |
| FishBase REST API | v3 (via S3) | Fish species database | **HIGH CONFIDENCE** - Free, no authentication; 30,000+ species; endpoints for species, ecology, diet, morphology, reproduction, geographic distribution; RopEnSci hosted; read-only GET requests; 5,000 records max per request; paginated |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| None required | Vanilla JS approach | Staying with no build system as specified; all libraries are CDN-compatible or can be vendored |
| Browser DevTools | Service Worker debugging | Chrome/Edge DevTools have excellent SW cache inspection |
| Lighthouse | PWA audit | Built into Chrome; validates offline functionality and performance |

## Installation

```bash
# No npm installation needed for vanilla JS approach
# All libraries can be loaded via CDN or vendored

# For local development testing of APIs:
# Open-Meteo - no API key required
# WorldTides - register for free API key at worldtides.info
# FishBase - no API key required
# USNO - no API key required
```

## Specific API Endpoints & Implementation

### Open-Meteo Marine Weather API
```javascript
// Base URL: https://api.open-meteo.com/v1/marine
// Parameters for fishing:
// - wave_height, wave_direction, wave_period
// - wind_wave_height, wind_wave_direction, wind_wave_period
// - swell_wave_height, swell_wave_direction, swell_wave_period
// - ocean_current_velocity, ocean_current_direction
// - sea_surface_temperature

// Example endpoint:
// https://api.open-meteo.com/v1/marine?latitude=45.44&longitude=12.32&hourly=wave_height,wave_direction,wave_period,ocean_current_velocity,sea_surface_temperature&timezone=auto&forecast_days=7
```

### Open-Meteo Weather API (Barometric Pressure)
```javascript
// Base URL: https://api.open-meteo.com/v1/forecast
// Add parameter: surface_pressure
// For pressure trends: request hourly data and calculate 3-hour or 6-hour deltas

// Example endpoint:
// https://api.open-meteo.com/v1/forecast?latitude=45.44&longitude=12.32&hourly=surface_pressure,temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,visibility&timezone=auto&forecast_days=7
```

### WorldTides API
```javascript
// Base URL: https://www.worldtides.info/api/v3
// Requires API key (register for 100 free credits)
// Heights: 1 credit per 7 days (30-min intervals)
// Extremes: 1 credit per 7 days (high/low tide times)

// Example endpoint:
// https://www.worldtides.info/api/v3?extremes&lat=45.44&lon=12.32&key=YOUR_API_KEY&start=timestamp&length=604800
```

### SunCalc (Client-Side)
```javascript
// CDN or vendor suncalc.js (~2KB)
import SunCalc from 'suncalc';

// Moon phase calculation (no API call needed):
const moonIllum = SunCalc.getMoonIllumination(new Date());
// Returns: { fraction: 0.5, phase: 0.5, angle: 1.57 }
// fraction: 0.0 = new moon, 1.0 = full moon
// phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
```

### USNO Moon Phases API (Alternative to SunCalc)
```javascript
// Base URL: https://aa.usno.navy.mil/api/moon/phases
// By year: /year?year=2026
// By date: /date?date=2026-02-07&nump=12
// No authentication required
```

### FishBase API
```javascript
// Base URL: https://fishbase.ropensci.org
// Key endpoints for fishing app:
// /species - fish species data
// /ecology - habitat, depth range, climate zone
// /diet - feeding habits
// /comnames - common names in multiple languages
// /country - geographic distribution (filter by European countries)

// Example endpoint for Adriatic/European species:
// https://fishbase.ropensci.org/species?fields=Species,FBname,BodyShapeI,DemersPelag,Comments&limit=100&offset=0

// Search by country/region:
// https://fishbase.ropensci.org/country?C_Code=ITA&limit=100
// Then join with species data using SpecCode
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Open-Meteo Marine Weather | Stormglass.io | **AVOID for free tier** - Only 10 requests/day free (insufficient for PWA); paid tier starts at premium pricing; Open-Meteo provides unlimited non-commercial use |
| Open-Meteo | World Weather Online Marine API | **AVOID** - Requires paid subscription; no adequate free tier for development/personal use |
| WorldTides API | NOAA Tides & Currents | **Use NOAA if US-only** - NOAA is completely free but limited to US coastal areas; WorldTides has better European/Adriatic coverage |
| SunCalc (client-side) | USNO API | **Use USNO for historical data** - SunCalc better for real-time calculations; USNO better for generating calendars of future moon phases |
| FishBase API | Manual JSON database | **Use manual database if custom data needed** - FishBase has 30,000+ species but may lack specific local knowledge; for Adriatic-specific fishing tips, curate custom data |
| IndexedDB (native) | Dexie.js wrapper | **Use Dexie if complex queries needed** - Native IndexedDB is verbose but zero dependencies; Dexie adds nice Promise API but 20KB overhead |
| Vanilla JS | React/Vue framework | **NEVER for this project** - Requirement explicitly states vanilla JS, no build system; frameworks would add 50-200KB+ overhead and build complexity |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Stormglass.io free tier | 10 requests/day limit insufficient for PWA usage; would exhaust quota in single user session checking multiple locations | Open-Meteo Marine Weather API (unlimited non-commercial use) |
| FishWatch API (NOAA) | US species only; no European/Adriatic coverage | FishBase API (global coverage including European freshwater and Mediterranean) |
| Local moon phase calculations without library | Lunar calculations are complex (orbital mechanics, parallax, libration); easy to get wrong; reinventing wheel | SunCalc library (battle-tested, 2KB, client-side) |
| localStorage for fish database | 5-10MB limit; synchronous API blocks UI; insufficient for comprehensive fish catalog with images | IndexedDB (20-50% disk capacity; async; designed for large datasets) |
| Network-first caching for static fish data | Wastes bandwidth; poor offline experience; fish data changes infrequently | Cache-first strategy with versioned updates (fish data is static reference material) |
| Multiple weather API sources "for redundancy" | Different APIs use different models with different predictions; mixing creates confusing/contradictory forecasts | Single authoritative source (Open-Meteo) with clear data provenance |
| Build tools (Webpack, Vite, etc.) | Project requirement: no build system; adds complexity and tooling overhead | Vanilla JS with ES modules; CDN or vendored dependencies |

## Stack Patterns by Variant

**For offline-first fish database:**
- Pre-populate IndexedDB with curated fish species data on first app load
- Use Cache-first strategy in Service Worker for fish species JSON files
- Version the database schema to enable incremental updates
- Store fish images separately in Cache API (static assets)
- Use FishBase API as fallback when online for species not in local database

**For weather data caching:**
- Use Network-first with short fallback timeout (2-3 seconds) for current weather
- Cache last successful weather response for offline fallback
- Cache for 30-60 minutes maximum (weather data becomes stale quickly)
- Show data timestamp and "last updated" indicator to user
- Use stale-while-revalidate pattern for acceptable UX

**For tide predictions:**
- Pre-fetch 7-day tide data for saved locations during off-peak times
- Cache tide predictions indefinitely (they're deterministic/pre-calculated)
- Tide data rarely changes (only database updates); safe to cache long-term
- Refresh only when user manually requests or on app version update

**For dark marine UI theme:**
- Use CSS custom properties (variables) for consistent theming
- Off-black backgrounds (#0a1929 to #1a2332 range - nautical dark blues)
- Off-white text (#e0e7ee to #f0f4f8 - soft whites)
- Accent colors: Navy (#003d5b), Teal (#00a6a6), Coral (#ff6b6b for warnings)
- Avoid pure white (#ffffff) on pure black (#000000) - too high contrast
- Use semantic color shifts (red warnings less dominant in dark mode)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Leaflet 1.9.4 | All recommended APIs | APIs return JSON; Leaflet handles map rendering; no direct dependency |
| SunCalc latest | Pure JavaScript (ES5+) | No dependencies; works in all modern browsers and Node.js |
| Service Worker API | IndexedDB API | Both native browser APIs; SW can cache IndexedDB data structure definitions |
| Open-Meteo API | Fetch API or XMLHttpRequest | Returns JSON; no specific client library required |
| FishBase API | Any HTTP client | REST API; returns JSON; CORS-enabled |

## Data Size Considerations

**Fish Database:**
- FishBase has 30,000+ species globally
- European freshwater + Adriatic marine subset: ~500-1,000 relevant species
- Per-species data: ~5-10KB (taxonomy, ecology, diet, morphology, distribution)
- Total database size: 5-10MB for curated subset
- IndexedDB can easily handle this (typical limit: 50GB+)
- Strategy: Pre-load curated subset, lazy-load full details on demand

**Weather Data:**
- 7-day forecast per location: ~50-100KB JSON
- Cache up to 10 locations: ~1MB total
- Negligible compared to IndexedDB limits
- Clean up cached weather data older than 24 hours

**Map Tiles:**
- Leaflet tile caching: Limit to specific zoom levels for offline use
- Recommended: Cache zoom levels 6-12 for European region
- Use Cache API for tile storage (not IndexedDB)
- Implement LRU eviction policy if storage quota exceeded

## Performance Optimization

**API Call Batching:**
- Combine Open-Meteo weather + marine calls when possible (same base URL, different parameters)
- Pre-fetch weather data for saved locations in background
- Use Service Worker background sync when online to refresh stale data

**IndexedDB Query Optimization:**
- Create indexes on frequently searched fields (species name, family, habitat type)
- Use compound indexes for multi-criteria searches (habitat + depth range)
- Paginate results for large queries (100 species per page)

**Lazy Loading:**
- Load fish species summaries (name, image thumbnail) initially
- Fetch full details (ecology, diet, reproduction) only when user views species
- Use Intersection Observer API for infinite scroll in species list

## Sources

### APIs (HIGH CONFIDENCE)
- [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api) - Official documentation verified
- [Open-Meteo Weather API](https://open-meteo.com/en/docs) - Official documentation verified
- [WorldTides API Documentation](https://www.worldtides.info/apidocs) - Official documentation verified
- [USNO Astronomical Applications API](https://aa.usno.navy.mil/data/api) - Official documentation verified
- [FishBase API Reference](https://ropensci.github.io/fishbaseapidocs/) - Official RopEnSci documentation verified
- [SunCalc GitHub Repository](https://github.com/mourner/suncalc) - Official library documentation verified

### Research & Comparisons (MEDIUM CONFIDENCE)
- [Best Weather API 2025 Comparison - Stormglass](https://stormglass.io/best-weather-api-2025/) - Industry comparison
- [Best Free Weather APIs 2026 - Ambee](https://www.getambee.com/blogs/best-weather-apis) - Ecosystem survey
- [Best Fishing Apps for 2025 - Cast and Spear](https://castandspear.com/best-fishing-apps-for-anglers/) - Feature research
- [RivFISH Database - European Freshwater Fish](https://www.kmae-journal.org/articles/kmae/full_html/2025/01/kmae250001/kmae250001.html) - Geographic coverage verification

### PWA & IndexedDB (HIGH CONFIDENCE)
- [IndexedDB for PWAs - Google Developers](https://developers.google.com/codelabs/pwa-training/pwa03--indexeddb) - Official best practices
- [PWA Caching Strategies - web.dev](https://web.dev/learn/pwa/caching) - Official Chrome documentation
- [Service Worker Caching for PWAs - DEV Community](https://dev.to/crisiscoresystems/service-workers-that-dont-surprise-you-deterministic-caching-for-offline-first-pwas-5480) - Implementation patterns

### UI/UX Design (MEDIUM CONFIDENCE)
- [Dark Mode UI Best Practices 2026 - DesignStudio](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/) - Design patterns
- [Mobile App Design Trends 2026 - UX Pilot](https://uxpilot.ai/blogs/mobile-app-design-trends) - Current trends
- [Ocean Boat Blue Color Palette - Piktochart](https://piktochart.com/tips/ocean-boat-blue-color-palette) - Marine color schemes

### Vanilla JavaScript Components (MEDIUM CONFIDENCE)
- [Vanilla JS Accordion Components 2026 - CSS Script](https://www.cssscript.com/top-10-javascript-css-accordion-components/) - Component libraries
- [Vanilla Framework Accordion](https://vanillaframework.io/docs/patterns/accordion) - Implementation examples

---
*Stack research for: Angel-Wetter-App (Fishing Weather PWA)*
*Researched: 2026-02-07*
*Next step: Create FEATURES.md, ARCHITECTURE.md, and PITFALLS.md for complete research package*
