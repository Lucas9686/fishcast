---
phase: 06-offline-enhancement
plan: 01
subsystem: offline
tags: [service-worker, pwa, offline, caching, network-detection]

# Dependency graph
requires:
  - phase: 05-navigation-favorites
    provides: Three-tab navigation, optimistic favorites toggle, service worker v5
provides:
  - Complete offline fish catalog with all 62 fish SVG images cached
  - Automatic offline/online network state detection with banner
  - German relative time formatting for cached weather data
  - Staleness indicator for weather data older than 6 hours
affects: [07-polish-accessibility, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Service worker v6 with complete image pre-caching
    - Network state detection via navigator.onLine API
    - Relative time formatting in German

key-files:
  created: []
  modified:
    - fishing-app/sw.js
    - fishing-app/js/utils.js
    - fishing-app/js/app.js

key-decisions:
  - "Service worker v6 pre-caches all 62 fish SVGs on install for complete offline catalog"
  - "Staleness threshold set at 6 hours for cached weather data visual indicator"
  - "Relative time uses German text (vor X Minuten/Stunden/Tagen) with fallback to absolute date after 7 days"

patterns-established:
  - "formatRelativeTime function in utils.js provides consistent German time formatting"
  - "Online/offline listeners auto-toggle banner without user intervention"
  - "Weather timestamp switches from live 'Aktualisiert: HH:MM' to cached 'Letzte Aktualisierung: vor X Stunden'"

# Metrics
duration: 3min
completed: 2026-02-10
---

# Phase 06 Plan 01: Offline Enhancement Summary

**Service worker v6 pre-caches all 62 fish SVG images, automatic offline banner detection, and German relative time display for cached weather data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T00:49:44Z
- **Completed:** 2026-02-10T00:52:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Service worker v6 guarantees complete offline fish catalog with all 62 fish images
- Automatic online/offline detection shows banner when network unavailable
- Human-readable cached weather timestamps in German (e.g., "vor 2 Stunden")
- Staleness indicator for weather data older than 6 hours

## Task Commits

Each task was committed atomically:

1. **Task 1: Cache all fish SVG images in service worker v6** - `7806a9a` (feat)
2. **Task 2: Add relative time formatter and wire offline banner + weather timestamp** - `328f408` (feat)

## Files Created/Modified
- `fishing-app/sw.js` - Bumped to v6, added all 62 fish SVG paths + icon.svg to APP_SHELL
- `fishing-app/js/utils.js` - Added formatRelativeTime function for German relative timestamps
- `fishing-app/js/app.js` - Wired online/offline event listeners, updated cached weather display to use relative time with staleness indicator

## Decisions Made
- **Service worker v6 caches 63 images total** - 62 fish SVGs + icon.svg, all with './' prefix for consistency
- **Staleness threshold: 6 hours** - Weather data older than 6 hours gets weather-time--stale CSS class for visual indication
- **Relative time limit: 7 days** - After 7 days, formatRelativeTime falls back to absolute date format (DD.MM.YYYY HH:MM)
- **Navigator.onLine checked on init** - Ensures offline banner shows correctly on app load if user starts offline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Offline functionality complete. App is now fully usable without internet:
- Fish catalog with all images loads from cache
- User sees clear indication when offline
- Cached weather data shows how old it is

Ready for Phase 7 (Polish & Accessibility) or deployment.

No blockers or concerns.

---
*Phase: 06-offline-enhancement*
*Completed: 2026-02-10*

## Self-Check: PASSED

All files and commits verified successfully.
