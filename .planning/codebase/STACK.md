# Technology Stack

**Analysis Date:** 2026-02-07

## Languages

**Primary:**
- JavaScript (ES2020+) - Core application logic across all modules

## Runtime

**Environment:**
- Browser-based (Vanilla JavaScript, no build tool/transpiler)
- No Node.js backend

**Package Manager:**
- Not applicable (no npm/package.json)
- CDN for external libraries only

## Frameworks

**Core:**
- None (Vanilla JavaScript) - DOM manipulation via native APIs

**Libraries (CDN):**
- Leaflet 1.9.4 - Interactive mapping
  - URL: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
  - CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - Use: Geographic map rendering with markers, tile layers

**Buildsystem/Dev:**
- None - Direct file serving, no build pipeline

## Key Dependencies

**Critical:**
- Leaflet 1.9.4 - Interactive maps for location visualization
  - Loaded in `index.html` lines 19-21, 320-322
  - Tile provider: OpenStreetMap (free, no API key required)

**Infrastructure:**
- Open-Meteo API (external, no client-side dependency)
  - Weather forecasting
  - Geocoding
  - No authentication required

**Browser APIs Used:**
- IndexedDB - Local data persistence
- Geolocation API - GPS location access
- Service Worker API - Offline support
- Fetch API - HTTP requests
- Local Storage - Settings and cache management

## Configuration

**Environment:**
- Static configuration in `js/config.js`
- No environment variables required
- Hardcoded API endpoints (Open-Meteo is free, no API keys needed)

**Build:**
- No build configuration - served as static files
- index.html loads scripts with `defer` attribute for proper execution order

**Script Load Order (critical):**
1. Leaflet JS/CSS (CDN)
2. js/config.js - Configuration and type definitions
3. js/utils.js - Utility functions
4. js/api.js - Open-Meteo API calls
5. js/solunar.js - Moon phase and solunar calculations
6. js/storage.js - IndexedDB operations
7. js/map.js - Leaflet map initialization
8. js/fish-ui.js - Fish species UI rendering
9. js/app.js - Main application controller

See `index.html` lines 325-332 for load order.

## Platform Requirements

**Development:**
- Any modern browser with:
  - ES2020+ support
  - IndexedDB support
  - Service Worker support
  - Geolocation API support
  - Fetch API support

**Production:**
- Static file hosting (any web server)
- HTTPS required for:
  - Service Worker registration
  - Geolocation API access
- No backend server required

**Browser Compatibility:**
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Graceful degradation for Geolocation (fallback to default location)

## Assets

**Data Files:**
- `data/fish-data.json` - Static JSON database of fish species
  - Loaded in `app.js` via fetch (line 51)
  - Contains: ID, name, scientific name, image path, size data, habitat, techniques, baits, weather preferences, seasonal info, fishing difficulty

**Static Assets:**
- `css/style.css` - Single stylesheet
- `images/icon.svg` - PWA icon
- `images/fish/*.svg` - Individual fish species SVG illustrations (80+ fish species)

**Service Worker:**
- `sw.js` - Offline caching strategy
  - Caches entire app shell on install (app.html, CSS, JS, fish-data.json)
  - Network-first strategy for API calls with fallback to cache
  - Uses IndexedDB for weather data caching (offline support)

## PWA Configuration

**Web App Manifest:**
- File: `manifest.json`
- Display: "standalone" (full-screen app)
- Theme: Green (#1a5e2a) fishing theme
- Supports: iOS and Android installation
- Shortcuts: Quick launch "Wetter pruefen" (Weather) and "Fische suchen" (Fish)

---

*Stack analysis: 2026-02-07*
