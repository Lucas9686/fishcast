# Roadmap: FishCast - Angel-Wetter-App

## Overview

This roadmap transforms an existing fishing weather PWA into a comprehensive angler's tool by systematically enhancing weather data, expanding the fish catalog from 40 to 200+ species, implementing dark marine theming, and strengthening offline capabilities. The 6-phase journey builds on proven vanilla JavaScript foundations, with each phase delivering coherent user value while establishing infrastructure for subsequent phases.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Weather Enhancement** - Comprehensive 7-day fishing weather with accordion UI
- [x] **Phase 2: Dark Marine Theme** - Professional dark theme with mobile-optimized UI
- [x] **Phase 3: Fish Catalog Expansion** - 200+ species with detailed fishing information
- [ ] **Phase 4: Filter & Search System** - Multi-dimensional fish filtering and search
- [ ] **Phase 5: Navigation & Favorites** - Bottom tab navigation and favorites management
- [ ] **Phase 6: Offline Enhancement** - Robust offline capability with optimized storage

## Phase Details

### Phase 1: Weather Enhancement
**Goal**: Users see comprehensive 7-day fishing weather with all critical parameters for making informed fishing decisions
**Depends on**: Nothing (foundation phase)
**Requirements**: WETTER-01, WETTER-02, WETTER-03, WETTER-04, WETTER-05, WETTER-06, WETTER-07, WETTER-08, WETTER-09, WETTER-10, WETTER-11, WETTER-12, WETTER-13
**Success Criteria** (what must be TRUE):
  1. User opens app and sees today's weather expanded, next 6 days collapsed in accordion
  2. User taps any day and sees comprehensive fishing data: wind (speed/direction/gusts), pressure with trend, temperature, UV index, solunar times, moon phase, sunrise/sunset
  3. User sees marine data (wave height, conditions) for coastal locations
  4. User sees barometric pressure as 48-hour trend graph showing rising/falling/stable patterns
  5. User sees fishing score (0-100) with rating for each day
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md -- API + data layer: weather params, Marine API, scoring, moon rise/set
- [x] 01-02-PLAN.md -- Canvas charts: 48h pressure sparkline + tidal timeline
- [x] 01-03-PLAN.md -- UI restructure: accordion thematic groups, wiring data + charts
- [x] 01-04-PLAN.md -- Integration: service worker update, testing, visual verification

### Phase 2: Dark Marine Theme
**Goal**: App has professional dark marine appearance optimized for mobile use with smooth animations
**Depends on**: Nothing (but executes before Phase 3 to establish theme foundation)
**Requirements**: UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. User opens app and sees dark marine theme with blue/turquoise accents on dark background
  2. User toggles weather days and sees smooth accordion animations (expand/collapse)
  3. User switches between light/dark/auto theme modes without seeing color flicker
  4. User navigates on mobile and all touch targets are appropriately sized and responsive
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- CSS marine retheme, theme system, wave/glow/animations, anti-flicker, HTML toggle button
- [x] 02-02-PLAN.md -- ThemeToggle JS, card fade-in observer, tab pulse trigger, service worker bump

### Phase 3: Fish Catalog Expansion
**Goal**: Users can explore 200+ fish species with comprehensive fishing information including bait, methods, habitat, and preparation details
**Depends on**: Phase 2 (dark theme foundation)
**Requirements**: FISCH-01, FISCH-02, FISCH-03, FISCH-04, FISCH-05, FISCH-06, FISCH-07, FISCH-08
**Success Criteria** (what must be TRUE):
  1. User browses fish catalog and sees 200+ species (Adriatic saltwater + European freshwater)
  2. User taps any fish and sees comprehensive details: German/Latin names, image, best baits (type and color), fishing methods, season, closed seasons
  3. User sees habitat information (depth range, water type, region, structure preferences)
  4. User sees edibility rating, taste description, and preparation tips for each fish
  5. Fish catalog works completely offline with all data embedded in the app
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md -- Schema extension + UI: edibility/habitat rendering in fish-ui.js, CSS styles
- [x] 03-02-PLAN.md -- Data batch 1: retrofit edibility on 62 existing + add ~50 new species (112 total)
- [x] 03-03-PLAN.md -- Data batch 2: add ~50 more species (162 total)
- [x] 03-04-PLAN.md -- Data batch 3: add ~40+ species to reach 200+ total (201 total)
- [x] 03-05-PLAN.md -- Integration: lazy loading, service worker bump, visual verification

### Phase 4: Filter & Search System
**Goal**: Users can quickly find relevant fish species through flexible filtering and text search
**Depends on**: Phase 3 (expanded fish catalog)
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05, FILTER-06
**Success Criteria** (what must be TRUE):
  1. User filters fish by water type (saltwater/freshwater) and sees only matching species
  2. User filters by season and sees "What's biting now?" results
  3. User filters by edibility and sees only fish good for eating
  4. User types in search box and sees real-time results matching German or Latin names
  5. User combines multiple filters (water type + season + edibility) and sees correct intersecting results
  6. User sees count of results ("23 species found") as they adjust filters
**Plans**: 1 plan

Plans:
- [ ] 04-01-PLAN.md -- Filter logic (water type/season/edibility) + UI + CSS + human verification

### Phase 5: Navigation & Favorites
**Goal**: Users can navigate efficiently between Weather/Fish/Favorites tabs and save favorite fish for quick access
**Depends on**: Phase 3 (fish catalog), Phase 4 (filter system)
**Requirements**: FAV-01, FAV-02, FAV-03, UI-01
**Success Criteria** (what must be TRUE):
  1. User sees bottom tab bar with three tabs: Weather, Fish, Favorites
  2. User taps tab and switches between Weather page, Fish catalog, and Favorites page
  3. User taps heart icon on any fish and it saves to favorites
  4. User opens Favorites tab and sees all saved fish with quick access to details
  5. Favorites persist across app sessions and work offline
**Plans**: TBD

Plans:
- [ ] 05-01: TBD during planning

### Phase 6: Offline Enhancement
**Goal**: App works reliably offline with optimized storage management and intelligent caching strategies
**Depends on**: All previous phases (needs final data structures)
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. User goes offline and fish catalog remains fully accessible with all images and data
  2. User opens app offline and sees cached weather data with visible timestamp showing when data was last updated
  3. User installs app as PWA on mobile device from browser
  4. User's last selected location and location history persist across sessions
  5. App monitors storage quota and prevents exceeding device limits with 200+ fish species images
**Plans**: TBD

Plans:
- [ ] 06-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Weather Enhancement | 4/4 | Complete | 2026-02-07 |
| 2. Dark Marine Theme | 2/2 | Complete | 2026-02-07 |
| 3. Fish Catalog Expansion | 5/5 | Complete | 2026-02-09 |
| 4. Filter & Search System | 0/TBD | Not started | - |
| 5. Navigation & Favorites | 0/TBD | Not started | - |
| 6. Offline Enhancement | 0/TBD | Not started | - |
