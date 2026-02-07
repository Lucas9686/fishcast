# Pitfalls Research

**Domain:** Fishing PWA Enhancement (Weather APIs, Fish Database, Dark Theme, Offline Caching)
**Researched:** 2026-02-07
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Weather API Data Staleness from Aggressive Caching

**What goes wrong:**
Fishing apps cache weather data too aggressively to reduce API calls and costs, resulting in anglers receiving outdated forecasts that are 30 minutes to several hours old. This is especially problematic for time-sensitive fishing decisions that depend on barometric pressure changes, wind shifts, and approaching weather fronts.

**Why it happens:**
Weather API rate limits (e.g., OpenWeatherMap free tier: 1,000 calls/day, paid tiers starting at $40/month for 100,000 calls) incentivize developers to cache aggressively. A single user checking weather multiple times per trip can quickly exhaust quotas without proper caching. However, the balance tips too far toward cost savings at the expense of data freshness.

**How to avoid:**
- Implement TTL (time-to-live) caching with weather-specific expiration: 15-30 minutes for current conditions, 1-2 hours for extended forecasts
- Use stale-while-revalidate strategy: serve cached data immediately while fetching fresh data in the background
- Display cache timestamp prominently in UI so users know data freshness
- Implement "refresh" button for manual updates when users need current data
- Consider hybrid approach: free tier for casual users, premium tier with more frequent updates for serious anglers

**Warning signs:**
- User complaints about inaccurate forecasts
- Weather conditions in app don't match on-the-water reality
- No visible timestamp on weather data
- API quota exhaustion logs appearing frequently

**Phase to address:**
Phase 1 (Weather API Integration) - Must establish caching strategy before launch to prevent user trust issues

---

### Pitfall 2: Wrong Location for Weather Data (Land vs. Water)

**What goes wrong:**
Apps fetch weather forecasts for the boat launch location or user's suburb instead of the actual fishing location on the water. Wind speeds can be 2x stronger offshore compared to land, barometric pressure differs, and wave conditions are completely absent from land-based forecasts.

**Why it happens:**
Default geolocation APIs return user's current position (typically on land at launch), and developers don't understand the marine weather accuracy requirements. Using simpler, single-point weather lookups is easier than implementing proper marine zone forecasting.

**How to avoid:**
- Implement location picker that lets users specify their intended fishing location on the water
- Use marine weather zones/forecasts from NOAA or marine-specific APIs (e.g., StormGlass.io)
- Provide visual map interface where users tap their fishing spot for location-specific forecasts
- Store common fishing spots for quick selection
- If using generic weather APIs, clearly label data as "nearby land forecast" and warn about offshore differences

**Warning signs:**
- Weather data doesn't include marine-specific parameters (wave height, sea temperature, offshore wind)
- No way to select different locations than current GPS position
- Users reporting forecast doesn't match water conditions

**Phase to address:**
Phase 1 (Weather API Integration) - Core feature requirement, not a post-launch fix

---

### Pitfall 3: Missing Critical Fishing Weather Parameters

**What goes wrong:**
Apps display basic temperature, precipitation, and wind but omit critical fishing parameters like barometric pressure trends, solunar data (sunrise/sunset/moon phases), air pressure changes, and sea conditions. Anglers rely heavily on barometric pressure trends—falling pressure triggers aggressive feeding before storms, and stable low pressure after fronts is also productive.

**Why it happens:**
Developers without fishing domain knowledge implement generic weather displays. Basic weather APIs may not include specialized parameters, or developers don't realize these are essential for fishing applications (not just "nice to have").

**How to avoid:**
- Research fishing-specific weather requirements before API selection
- Ensure chosen API provides: barometric pressure (current + trend), solunar data, wind speed/direction, wave/sea conditions, water temperature
- If primary API lacks parameters, supplement with specialized APIs (e.g., separate solunar API)
- Display pressure trend (rising/falling/stable) prominently, not just current value
- Consider "fishing forecast quality" indicator that combines pressure, wind, and moon phase

**Warning signs:**
- Weather display looks generic, could work for any outdoor activity
- No barometric pressure data visible
- No sunrise/sunset or moon phase information
- User feedback requesting "real fishing weather" features

**Phase to address:**
Phase 1 (Weather API Integration) - API selection must account for these parameters from the start

---

### Pitfall 4: Dark Theme Breaking Existing UI with Incomplete Color Migration

**What goes wrong:**
Developers implement dark theme by toggling only background and text colors, but forget about border colors, icon fills, shadow colors, input field styling, and status bar colors. Result is a partially broken UI with invisible elements, poor contrast, and accessibility violations.

**Why it happens:**
Quick global find-replace approach misses edge cases. Inline styles and hardcoded color values scattered throughout codebase prevent theme changes from applying. Lack of systematic color audit before migration.

**How to avoid:**
- Before migration: audit ALL color usage in codebase (backgrounds, text, borders, shadows, icons, SVG fills, status bars)
- Migrate to CSS custom properties (variables) systematically: `--bg`, `--text-primary`, `--text-secondary`, `--border`, `--accent`, etc.
- Create semantic color tokens, not direct color names (use `--text-heavy` not `--black`)
- Test every screen/component in both themes before deployment
- Use browser DevTools to verify contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- Avoid inline styles—they prevent variable-based theming

**Warning signs:**
- Colors hardcoded as hex values throughout codebase instead of CSS variables
- Inline styles in HTML/JavaScript
- No comprehensive color inventory/design tokens documented
- Testing only homepage in dark mode, not all screens

**Phase to address:**
Phase 2 (Dark Theme Implementation) - Requires complete UI audit and refactoring, cannot be rushed

---

### Pitfall 5: Dark Theme Page Flicker on Load (FOUC)

**What goes wrong:**
When page loads, it briefly displays in light mode before JavaScript detects dark mode preference and re-applies dark theme. This "flash of unstyled content" (FOUC) creates jarring user experience, especially for users who exclusively use dark mode.

**Why it happens:**
Theme detection JavaScript runs too late—loaded via external file, in DOMContentLoaded listener, or after DOM rendering. By the time script runs, browser has already rendered page with default (light) styles.

**How to avoid:**
- Place theme detection script INLINE in `<head>` before any CSS
- Read localStorage/system preference synchronously before DOM renders
- Apply theme class to `<html>` element immediately
- Do NOT wait for DOMContentLoaded or put script in external file
- Example: `<script>document.documentElement.classList.add(localStorage.getItem('theme')||'light')</script>`

**Warning signs:**
- Theme detection code in external JavaScript file
- Event listener: `window.addEventListener('DOMContentLoaded', ...)`
- Async/deferred script loading for theme logic
- Visible flash when reloading page in dark mode

**Phase to address:**
Phase 2 (Dark Theme Implementation) - Critical UX issue, must be tested during initial implementation

---

### Pitfall 6: Bi-State Instead of Tri-State Theme Logic

**What goes wrong:**
App treats theme as binary (light/dark) instead of three states: explicit light choice, explicit dark choice, and system preference. Users who prefer auto-switching based on OS settings lose that capability because app forces them into one mode.

**Why it happens:**
Developers assume theme is binary toggle without considering "follow system" as a valid state. Simpler to implement on/off switch than three-way selector.

**How to avoid:**
- Implement three-state theme system: "light", "dark", "auto"
- Default to "auto" which respects `prefers-color-scheme` media query
- Only when user explicitly chooses light/dark do you override system preference
- Store user's explicit choice (or lack thereof) in localStorage
- Provide UI that shows all three options, not just toggle switch

**Warning signs:**
- Theme selector is binary toggle/switch
- No "system preference" or "auto" option visible
- Code doesn't reference `prefers-color-scheme` media query
- Users cannot enable automatic theme switching based on time of day

**Phase to address:**
Phase 2 (Dark Theme Implementation) - Architectural decision that affects UI design

---

### Pitfall 7: Fish Database Incompleteness and Quality Gaps

**What goes wrong:**
Fish species database appears comprehensive with 200+ species, but data quality varies wildly—some species have complete information (habitat, diet, seasons, regulations), while others have only a name and photo. Non-commercial species are especially data-poor. Nutritional information, detailed habitat preferences, and regional regulations are often missing.

**Why it happens:**
Database compiled from multiple sources without quality standards. Commercial/game fish receive attention while less popular species are neglected. Nutritional and laboratory data is resource-intensive to generate. Scattered information across literature not systematically integrated.

**How to avoid:**
- Establish minimum data quality bar for inclusion (e.g., must have: photo, basic description, habitat, range map)
- Mark incomplete records with "data limited" flag—better than hiding incompleteness
- Prioritize species by user interest: start with regional game fish, expand gradually
- Create contribution system for anglers/experts to submit verified data
- Link to authoritative sources (FishBase.org, Eschmeyer's Catalog, state DNR sites) for species lacking local data
- Implement data completeness score visible to users (e.g., "75% complete")

**Warning signs:**
- No data quality standards documented
- Assumption that "more species = better" without considering completeness
- No source attribution for fish data
- Testing only shows most popular species, obscure species have empty fields

**Phase to address:**
Phase 3 (Fish Database Expansion) - Quality standards must be defined before bulk import

---

### Pitfall 8: Fish Species Taxonomic Inaccuracy and Regional Variations

**What goes wrong:**
Fish identification data uses outdated taxonomy, incorrect common names, or fails to account for regional name variations. Same species called different names regionally (e.g., "walleye" vs "pickerel"), or different species sharing same common name. Users cannot find species they're looking for.

**Why it happens:**
Database built from non-authoritative sources or community contributions without taxonomic validation. Common names vary by region, and developers don't account for aliases. Taxonomy changes over time—species get reclassified but database isn't updated.

**How to avoid:**
- Use authoritative taxonomic sources: Eschmeyer's Catalog of Fishes (37,520+ valid species), FishBase.org
- Store both scientific name (authoritative) and multiple common names (searchable)
- Implement search that matches on all name variations and regional aliases
- Include taxonomic synonym handling for species that were reclassified
- Regular updates from authoritative sources to catch taxonomy changes
- For user-contributed data, require verification against scientific names

**Warning signs:**
- Database uses only common names without scientific names
- No source attribution for taxonomy
- Search fails when using regional fish names
- No mechanism for handling taxonomic updates

**Phase to address:**
Phase 3 (Fish Database Expansion) - Data structure must support taxonomy from start

---

### Pitfall 9: IndexedDB Storage Quota Exceeded on Mobile

**What goes wrong:**
Expanded fish database (200+ species with photos, descriptions, regulations) plus cached weather data exceeds IndexedDB storage limits on mobile devices, especially iOS. App crashes, data gets corrupted, or iOS auto-deletes data when storage is low. Users lose saved fishing logs and favorites.

**Why it happens:**
Developers test on desktop with generous storage limits but don't validate mobile constraints. iOS Safari limits IndexedDB to ~500MB, and unused PWAs may have data purged after few weeks. Large fish photos stored unoptimized. Assuming unlimited storage without quota management.

**How to avoid:**
- Check storage quota before storing large datasets: `navigator.storage.estimate()`
- Implement storage pressure monitoring and warn users before limit reached
- Optimize images: compress fish photos, use WebP format, lazy load images
- Partition data: store only essential data offline, load extended info on-demand from server
- Implement data cleanup strategy: old cached weather, fishing logs older than X months
- Request persistent storage: `navigator.storage.persist()` to prevent iOS auto-deletion
- Store homescreen-added PWAs which are less likely to be purged by iOS

**Warning signs:**
- No storage quota checks in code
- Fish database images stored at full resolution
- All 200+ species loaded into IndexedDB at once
- No cleanup/eviction strategy for old cached data
- Testing only on desktop browsers

**Phase to address:**
Phase 3 (Fish Database Expansion) + Phase 4 (Offline Enhancement) - Must design for mobile constraints from start

---

### Pitfall 10: Service Worker Update Breaking Offline Functionality

**What goes wrong:**
When deploying service worker updates with breaking changes (new cache structure, data format changes, API modifications), already-opened app instances use old service worker while new instances use new one. This creates version conflicts—cached data incompatible with new code, features break, users see errors.

**Why it happens:**
Service worker lifecycle means old SW stays active until all pages using it close. Developers don't implement migration logic for breaking changes. Testing updates only on single fresh install, not upgrade scenarios.

**How to avoid:**
- Implement versioning: include version constant in service worker file and cache names
- Add data migration logic in `activate` event to transform old cached data to new format
- Use "skipWaiting()" cautiously—only when safe, not for breaking changes
- Implement phased rollout or feature flags for major updates
- Show update notification prompting user to refresh when new version available
- Test upgrade paths: old version → new version migration, not just fresh installs
- Version cache names: `cache-v2` not `cache` to prevent conflicts

**Warning signs:**
- Service worker has no version identifier
- No migration logic in activate event
- Cache names are static strings without version numbers
- Breaking changes deployed without user notification
- Update testing only covers fresh installations

**Phase to address:**
Phase 4 (Offline Enhancement) - Critical for long-term maintainability

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using generic weather API without marine parameters | Faster initial implementation, lower cost | Users complain about missing barometric pressure/solunar data, requires API migration later | Never—fishing apps require fishing-specific weather from day 1 |
| Hardcoded color values instead of CSS variables | Faster to write, no refactoring needed | Dark theme implementation requires massive find-replace, high error risk, incomplete coverage | Never—CSS variables are negligible overhead |
| Storing full-resolution fish photos in IndexedDB | Simpler data pipeline, better image quality | Mobile storage quota exceeded, slow performance, data eviction | Early MVP with <20 species, must fix before scaling |
| Cache-first strategy for all weather data | Lower API costs, faster perceived performance | Stale data causes user mistrust, complaints about inaccuracy | Acceptable for extended forecasts (>24hr), never for current conditions |
| Single-language fish species data | Faster database population | Excludes non-English users, limits app reach | Acceptable for regional MVP targeting single language region |
| Loading entire fish database into memory | Simpler code, faster filtering | Mobile performance issues, high memory usage | Acceptable for <50 species, must paginate/lazy-load beyond that |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Weather APIs | Treating all weather APIs as equivalent—some lack barometric pressure, marine conditions, solunar data | Validate API provides ALL required fishing parameters before committing. Test with real data, not just docs. |
| Weather APIs | Not checking rate limits/quotas until production | Calculate expected API calls (users × sessions/day × refreshes/session) during planning. Add buffer for spikes. |
| Weather APIs | Using single lat/lon point for entire fishing area | Allow users to specify multiple spots or zones. Use marine forecast zones for offshore fishing. |
| FishBase/taxonomy APIs | Assuming free-tier API performance scales to production | Check rate limits, latency, and failover strategies. Cache taxonomic data aggressively (changes slowly). |
| Geolocation API | Assuming GPS accuracy sufficient for depth/structure maps | GPS accuracy ±5-50 meters inadequate for precise underwater features. Warn users about accuracy limits. |
| IndexedDB | Storing data without checking quota or handling quota errors | Always check `navigator.storage.estimate()` before large writes. Implement quota exceeded error handling. |
| Service Worker caching | Caching API responses indefinitely without expiration | Set TTL for cached weather (15-30min). Implement cache version cleanup in SW activate event. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all fish species data on app launch | Slow initial load, high memory usage | Lazy load species: show list immediately, fetch full data on-demand. Implement pagination. | >100 species with photos/detailed data |
| Syncing entire fish database offline without compression | IndexedDB quota exceeded, storage warnings | Compress images (WebP, 50-70% quality), store thumbnails not full images. Lazy load full resolution. | 200+ species with 5MB photos each = 1GB |
| API call bursts during peak hours | Rate limit errors, quota exhaustion | Implement request queuing, exponential backoff, distribute load. Cache aggressively with stale-while-revalidate. | >100 concurrent users refreshing weather |
| IndexedDB single-transaction bulk writes | Slow writes (2s for 1k records vs 80ms batched) | Use single transaction for bulk operations, not one transaction per write. | Writing >500 records individually |
| No image lazy loading for fish database | High bandwidth usage, slow scrolling | Implement intersection observer for lazy image loading. Load images as they enter viewport. | >50 fish species with images on single page |
| Storing fishing logs without cleanup | Storage grows indefinitely until quota exceeded | Implement archival: keep recent logs locally, move older logs to server or compress. Auto-cleanup after X months. | After 1-2 years of active use |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing weather API keys in client-side code | API key theft, quota abuse by others, unexpected bills | Proxy weather requests through your server, validate requests, rate-limit per user. Never bundle API keys in PWA. |
| Storing user location history without consent/controls | Privacy violations, GDPR/CCPA non-compliance | Implement explicit location tracking opt-in. Provide location history deletion. Clear privacy policy. |
| No HTTPS enforcement for PWA | Service workers won't install, geolocation blocked, security warnings | HTTPS is mandatory for PWAs and geolocation. Use Let's Encrypt or similar for free certificates. |
| Sharing fishing spots publicly without user consent | Privacy invasion, overcrowding of secret spots | Default to private fishing logs. Require explicit sharing action. Allow anonymous spot sharing (remove identifying info). |
| Caching API responses with user-specific data | Data leakage between users on shared devices | Never cache user-specific data in shared cache. Use separate caches per user or mark as non-cacheable. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible indicator of stale weather data | Users make decisions on outdated data, lose trust | Display "Last updated: 23 min ago" prominently. Show warning if data >1 hour old. Provide manual refresh. |
| Dark theme toggle buried in settings | Users don't discover feature, continue using hard-to-read light theme at night | Place theme toggle in main UI (header/navbar). Auto-switch based on time if user hasn't chosen preference. |
| Fish species list without filtering | Scrolling through 200+ species to find one is tedious | Implement search, filters (freshwater/saltwater, region, season), alphabetical jump. Remember recent species. |
| Generic "offline" message with no context | Users don't know what functionality is available offline | Show specific offline capabilities: "Weather last updated X ago. Fish database fully available. Cannot sync logs until online." |
| No onboarding for weather parameter meanings | Users see "barometric pressure 29.92 inHg" but don't know if that's good for fishing | Provide tooltips/help icons explaining fishing relevance: "Falling pressure often triggers feeding before storms" |
| Forcing location permission immediately on launch | Users deny permission, lose access to key features, never prompted again | Explain WHY location is needed before requesting. Provide manual location entry fallback. Allow re-prompting. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Weather integration:** Often missing barometric pressure trend (not just current value), solunar data, marine-specific forecasts — verify API provides AND displays these
- [ ] **Offline caching:** Often missing cache expiration strategy, quota management, update notification — verify old data cleanup, storage limit handling implemented
- [ ] **Dark theme:** Often missing theme in all states (modals, error messages, loading screens), icon color adaptation, system preference option — verify EVERY screen component in both themes
- [ ] **Fish database:** Often missing regional name variations, incomplete data for non-game species, source attribution — verify search works with common regional names, completeness flagged
- [ ] **Service worker:** Often missing update notification, migration logic for breaking changes, cache versioning — verify upgrade path from old → new version tested
- [ ] **Mobile performance:** Often missing storage quota checks, image optimization, lazy loading — verify works on actual mobile device with limited storage, not just desktop
- [ ] **Location accuracy:** Often missing marine zone support, multiple spot selection, accuracy warnings — verify users can specify water locations, not just current GPS
- [ ] **Accessibility:** Often missing WCAG contrast ratios in dark theme, screen reader labels, keyboard navigation — verify with accessibility audit tools

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong weather API selected (missing fishing parameters) | HIGH | 1. Identify replacement API with required parameters. 2. Abstract weather service behind interface. 3. Implement adapter for new API. 4. Migrate gradually with feature flag. 5. Update cached data structure. |
| Dark theme incomplete/broken | MEDIUM | 1. Audit all color usage with DevTools. 2. Create complete CSS variable system. 3. Test every screen in both themes. 4. Use automated visual regression testing. 5. Rollback to light-only if needed. |
| IndexedDB quota exceeded | MEDIUM | 1. Implement emergency data cleanup (old cache). 2. Compress/optimize images. 3. Request persistent storage. 4. Partition data (essential vs. optional). 5. Move large data to on-demand fetch. |
| Fish database data quality poor | MEDIUM | 1. Flag incomplete records visibly. 2. Prioritize filling gaps for popular species. 3. Implement user contribution system. 4. Link to external authoritative sources. 5. Remove species below quality threshold. |
| Service worker breaking changes deployed | HIGH | 1. Rollback service worker to previous version immediately. 2. Force refresh all clients. 3. Implement version migration logic. 4. Test upgrade path thoroughly. 5. Redeploy with gradual rollout. |
| API quota exceeded/rate limited | LOW-MEDIUM | 1. Implement caching immediately. 2. Add request queuing with backoff. 3. Upgrade API tier if cost-effective. 4. Distribute load across time. 5. Reduce unnecessary API calls. |
| Stale weather data complaints | LOW | 1. Reduce cache TTL for current conditions. 2. Add visible timestamp. 3. Implement manual refresh. 4. Use stale-while-revalidate. 5. Communicate data freshness in UI. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale weather data from aggressive caching | Phase 1 (Weather API Integration) | Test: check cache TTL in DevTools. Verify timestamp displayed. Trigger cache refresh and confirm data updates. |
| Wrong location (land vs water) | Phase 1 (Weather API Integration) | Test: compare forecast for land location vs offshore point. Verify marine parameters present. |
| Missing fishing weather parameters | Phase 1 (Weather API Integration) | Verify: barometric pressure (trend not just value), solunar data, wind, waves all visible in UI. |
| Dark theme incomplete color migration | Phase 2 (Dark Theme Implementation) | Test: visit EVERY screen in dark mode. Run automated contrast checker. Verify no hardcoded colors remain. |
| Dark theme page flicker (FOUC) | Phase 2 (Dark Theme Implementation) | Test: hard refresh in dark mode. Verify no flash of light theme. Check theme script is inline in `<head>`. |
| Bi-state instead of tri-state theme | Phase 2 (Dark Theme Implementation) | Verify: UI shows light/dark/auto options. Auto mode follows `prefers-color-scheme`. |
| Fish database incompleteness | Phase 3 (Fish Database Expansion) | Verify: data quality standards documented. Incomplete records flagged. Test with non-commercial species. |
| Taxonomic inaccuracy | Phase 3 (Fish Database Expansion) | Test: search regional fish names. Verify scientific names present. Check source is authoritative. |
| IndexedDB quota exceeded | Phase 3 + Phase 4 | Test: on iOS device with limited storage. Verify quota checks before writes. Trigger low storage scenario. |
| Service worker breaking changes | Phase 4 (Offline Enhancement) | Test: upgrade from previous version. Verify migration logic works. Cache versions incrementing correctly. |

## Sources

### Weather API and Fishing Apps
- [Weather API for Commercial Fishing and Sport Fishing Applications - StormGlass.io](https://stormglass.io/weather-api-for-commercial-fishing-and-sport-fishing-applications/)
- [Aussie Fishos and Weather Apps](https://www.fishranger.com.au/aussie_fishos_and_weather_apps)
- [Top weather APIs in 2026 - Xweather](https://www.xweather.com/blog/article/top-weather-apis-for-production-2026)
- [How to Handle API Rate Limits Gracefully (2026 Guide)](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits)
- [Best Weather Apps for Fishing | Best On Tour](https://bestontour.net/blog/the-best-weather-apps-for-fishing/)
- [Fishing Weather Forecast Reports | onX Fish App](https://www.onxmaps.com/fish/app/features/fishing-weather-forecast)

### PWA Offline Caching
- [PWA Offline Functionality: Caching Strategies Checklist](https://www.zeepalm.com/blog/pwa-offline-functionality-caching-strategies-checklist)
- [Best Practices for PWA Offline Caching Strategies](https://blog.pixelfreestudio.com/best-practices-for-pwa-offline-caching-strategies/)
- [Offline-First PWAs: Service Worker Caching Strategies](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies)
- [Best Practices for Handling Updates in Progressive Web Apps](https://blog.pixelfreestudio.com/best-practices-for-handling-updates-in-progressive-web-apps/)
- [Handling Service Worker updates](https://progressier.com/handling-service-worker-updates)

### Dark Theme Implementation
- [Notes on implementing dark mode — brandur.org](https://brandur.org/fragments/dark-mode-notes)
- [The Quest for the Perfect Dark Mode Toggle, using Vanilla JavaScript](https://www.bram.us/2020/04/26/the-quest-for-the-perfect-dark-mode-using-vanilla-javascript/)
- [CSS { In Real Life } | Quick and Easy Dark Mode with CSS Custom Properties](https://css-irl.info/quick-and-easy-dark-mode-with-css-custom-properties/)
- [How To Create a Dark-Mode Theme Using CSS Variables | DigitalOcean](https://www.digitalocean.com/community/tutorials/css-theming-custom-properties)

### Fish Species Databases
- [Fishing for data and sorting the catch: assessing the data quality, completeness and fitness for use of data in marine biogeographic databases](https://dx.doi.org/10.1093/database/bau125)
- [Eschmeyer's Catalog of Fishes | California Academy of Sciences](https://www.calacademy.org/scientists/projects/eschmeyers-catalog-of-fishes)
- [Fishbase](https://fishbase.org/)
- [FishVerify – Species Identification & Local Fishing Regulations](https://www.fishverify.com/)

### IndexedDB and Storage
- [Solving IndexedDB Slowness for Seamless Apps | RxDB](https://rxdb.info/slow-indexeddb.html)
- [IndexedDB Max Storage Size Limit - Detailed Best Practices | RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [How to Use IndexedDB for Data Storage in PWAs](https://blog.pixelfreestudio.com/how-to-use-indexeddb-for-data-storage-in-pwas/)

### Location and Bathymetry
- [i-Boating: Free Marine Navigation Charts & Fishing Maps](https://fishing-app.gpsnauticalcharts.com/)
- [Fishidy Fishing App | Lake Maps, Depth Contours, Reports](https://www.fishidy.com/fishing-maps)

---
*Pitfalls research for: Fishing PWA Enhancement Project*
*Researched: 2026-02-07*
