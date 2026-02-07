# Feature Research

**Domain:** Fishing & Weather PWA (Angel-Wetter-App)
**Researched:** 2026-02-07
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **7-Day Weather Forecast** | All fishing apps provide multi-day forecasts; users plan trips in advance | MEDIUM | Must include hourly breakdown with temperature, precipitation, wind |
| **Barometric Pressure Data** | Fish behavior strongly correlated with pressure changes; critical fishing indicator | MEDIUM | Include current pressure, trend (rising/falling/stable), and hourly history/forecast |
| **Wind Speed & Direction** | Safety concern for boats; affects fishing technique and fish behavior | LOW | Real-time and forecast, with gust data |
| **Solunar/Moon Tables** | Major and minor feeding periods based on moon position; widely used by serious anglers | MEDIUM | 4 periods per day (2 major, 2 minor), moon phase display |
| **Fish Species Catalog** | Users expect comprehensive species info; basis for targeting fish | HIGH | 80+ species (Adriatic saltwater + European freshwater) with images |
| **Basic Species Info** | Name, habitat, size range, appearance | LOW | Multi-language support (German de-AT primary) |
| **Catch Logging** | Standard feature in 2026; users expect to track their catches | MEDIUM | Date, time, location, species, size, photo |
| **Offline Mode** | Anglers fish in remote areas; PWA must work without connectivity | HIGH | Service workers, cached data, sync when online |
| **Location-Based Data** | Weather and conditions specific to user's location | MEDIUM | GPS integration, saved locations |
| **Fishing Regulations** | Users expect quick access to local rules (seasons, bag limits, size) | HIGH | Region-specific data for Adriatic + European freshwater; requires frequent updates |
| **Community Features (70%)** | 70% of users now expect social networking capabilities | MEDIUM | Anglers share catches, tips, and reports; not just solo experience |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Comprehensive Weather for Fishing Decisions** | Most apps show generic weather; fishing-specific interpretation of all data points together | MEDIUM | Synthesize pressure trends, wind patterns, solunar periods into fishing score/recommendation |
| **Detailed Bait & Method Info per Species** | Beyond basic info: specific bait recommendations, fishing methods, tackle suggestions per species | HIGH | Requires extensive research; highly valuable for targeting unfamiliar species |
| **Edibility & Preparation Guide** | Unique angle: not just catching, but eating; includes recipes, preparation methods | MEDIUM | Cultural relevance for European/Adriatic cuisine; differentiates from catch-and-release focused apps |
| **Multi-Dimensional Fish Filters** | Filter by water type (saltwater/freshwater), season, edibility, fighting characteristics | MEDIUM | Advanced search: "What can I catch in March in freshwater that's good to eat?" |
| **Regional Specialization (Adriatic + European)** | Most apps focus on North America; this targets underserved European market | LOW | Competitive gap in German-language Adriatic fishing apps |
| **Barometric Pressure Trend Visualization** | Not just current pressure, but graphed trends showing 24-48hr history and forecast | MEDIUM | Visual storytelling: see the front moving through, predict feeding windows |
| **Dark Marine Theme** | Aesthetic differentiation; fishing apps often bright/outdoorsy; marine theme is sophisticated | LOW | UI/UX choice that signals quality and professionalism |
| **Favorites System** | Quick access to frequently caught species, saved locations, preferred settings | LOW | Personalization that improves UX for repeat users |
| **Integrated Map with Spots** | Combine location, weather, species presence, and saved fishing spots in one view | HIGH | High value but complex; requires mapping integration |
| **Trophy Potential Filters** | Show lakes/areas with high trophy potential or keeper abundance | HIGH | Requires curated data or integration with fisheries management databases |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Public Exact GPS Spots** | Users want to know where others caught fish | Privacy concerns drive users away; spot-burning kills fishing; overpromises results | Allow vague location sharing (lake/region only); private spot saving |
| **Real-Time Everything** | Users think they want live updates constantly | Battery drain; unnecessary for fishing (conditions don't change that fast); complex infrastructure | Refresh weather every 30-60 min; solunar data static per day |
| **Catch Leaderboards/Competition** | Gamification seems engaging | Encourages overfishing, spot-burning, dishonesty; contradicts conservation ethic | Focus on personal logs, achievements; optional private group challenges |
| **Social Feed as Primary Interface** | Apps copy Instagram model | Distracts from core function (fishing info); privacy issues; content moderation needed | Community features secondary to weather/species data |
| **Complex AI Predictions** | "AI tells you exactly when/where to fish" | Overpromises; fishing too variable; users lose trust when wrong | Present data honestly; let users interpret with guidance |
| **Bluetooth Sonar Integration** | Sounds cutting-edge (28% growth) | Hardware dependency; most users don't own sonar; support burden | Focus on software features all users can access |
| **Native App Instead of PWA** | Users assume native is better | PWA sufficient for this use case; avoid double development (iOS/Android); PWA offline mode mature in 2026 | Optimize PWA for performance and offline |

## Feature Dependencies

```
[Offline Mode]
    └──requires──> [Service Workers]
    └──requires──> [Local Data Caching]
                       └──enables──> [Catch Logging Offline]
                       └──enables──> [Species Catalog Offline]

[Location-Based Weather]
    └──requires──> [GPS/Location Services]
    └──enables──> [Regional Regulations]
    └──enables──> [Saved Locations]

[7-Day Forecast]
    └──requires──> [Weather API Integration]
    └──enhances──> [Barometric Pressure Trends]
    └──enhances──> [Comprehensive Fishing Score]

[Fish Catalog]
    └──requires──> [Species Database]
    └──enables──> [Bait/Method Details]
    └──enables──> [Edibility Info]
    └──enables──> [Multi-Dimensional Filters]

[Community Features]
    └──requires──> [User Accounts/Authentication]
    └──enables──> [Catch Logging]
    └──conflicts──> [Full Anonymity]

[Map Integration]
    └──requires──> [Mapping Library/API]
    └──requires──> [Location Services]
    └──enhances──> [Saved Spots]
    └──enhances──> [Weather Overlay]
```

### Dependency Notes

- **Offline Mode requires upfront investment:** Service workers and caching strategy must be implemented early; retrofitting is difficult
- **Species Catalog is foundation:** Many differentiating features (bait/method/edibility) extend the base catalog; must be comprehensive before adding depth
- **Weather API is critical path:** 7-day forecast, barometric pressure, hourly data all depend on reliable weather API; single point of failure
- **Community vs Privacy tension:** Catch logging and community features require accounts, but anglers value privacy; allow anonymous use with optional account
- **Map integration is high complexity:** Adds significant development time and potential API costs; defer until core features solid

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **7-Day Weather Forecast with Hourly Detail** — Table stakes; users won't use app without this
- [ ] **Barometric Pressure Current + Trend** — Critical differentiator for fishing decisions; must include trend direction
- [ ] **Solunar Tables (Major/Minor Times)** — Expected feature; predicts feeding activity
- [ ] **Wind Speed/Direction Forecast** — Safety and fishing technique essential
- [ ] **Fish Species Catalog (80+ species)** — Core value; Adriatic + European freshwater with images, basic info
- [ ] **Bait & Method Info per Species** — Key differentiator; detailed tactical information
- [ ] **Edibility & Preparation Guide** — Unique angle; appeals to European angling culture
- [ ] **Water Type Filter (Saltwater/Freshwater)** — Basic but essential for regional catalog
- [ ] **Season Filter** — "What can I catch now?" is primary use case
- [ ] **Edibility Filter** — Supports unique differentiator; users want to know what's good eating
- [ ] **Favorites System** — Low complexity, high value for repeat users
- [ ] **Offline Mode (PWA)** — Non-negotiable for remote fishing; core architecture decision
- [ ] **Dark Marine Theme** — Aesthetic differentiator; sets professional tone
- [ ] **German Language (de-AT)** — Primary market; must be native, not translated

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Catch Logging** — When users are engaged and want to track catches (requires accounts)
- [ ] **Saved Locations** — After users establish habit of checking weather
- [ ] **Barometric Pressure Trend Visualization (48hr graph)** — Enhance existing pressure data with visual storytelling
- [ ] **Fishing Regulations Database** — High maintenance; add when user base justifies effort
- [ ] **Community Features (Forums/Groups)** — After establishing privacy-respecting model
- [ ] **Advanced Species Filters (Fighting Characteristics, Trophy Potential)** — Enhance existing catalog
- [ ] **Weather Overlay on Map** — After basic map integration proven

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Map Integration with Saved Spots** — High complexity; wait for user demand signal
- [ ] **Multi-Language Support** — Expand market after German success
- [ ] **Historical Weather Correlation** — "Best catches in these conditions" requires data over time
- [ ] **Gear Recommendations** — 39% increase in tackle purchases; potential monetization angle
- [ ] **Conservation/Sustainability Tracking** — Appeals to 78% of eco-conscious users; differentiator for future
- [ ] **Trip Planning & Itineraries** — Aggregate multiple data points for multi-day trip planning
- [ ] **Weather Alerts/Notifications** — Push notifications when conditions are ideal

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 7-Day Weather Forecast | HIGH | MEDIUM | P1 |
| Barometric Pressure Data | HIGH | MEDIUM | P1 |
| Solunar Tables | HIGH | MEDIUM | P1 |
| Fish Species Catalog (80+) | HIGH | HIGH | P1 |
| Bait/Method Details | HIGH | HIGH | P1 |
| Edibility Guide | MEDIUM | MEDIUM | P1 |
| Offline Mode (PWA) | HIGH | HIGH | P1 |
| Wind Data | HIGH | LOW | P1 |
| Water/Season/Edibility Filters | HIGH | MEDIUM | P1 |
| Favorites System | MEDIUM | LOW | P1 |
| Dark Marine Theme | LOW | LOW | P1 |
| Pressure Trend Visualization | MEDIUM | MEDIUM | P2 |
| Catch Logging | MEDIUM | MEDIUM | P2 |
| Saved Locations | MEDIUM | LOW | P2 |
| Fishing Regulations | HIGH | HIGH | P2 |
| Community Features | MEDIUM | HIGH | P2 |
| Map Integration | MEDIUM | HIGH | P2 |
| Advanced Filters (Trophy Potential) | LOW | HIGH | P3 |
| Gear Recommendations | LOW | MEDIUM | P3 |
| Multi-Language | LOW | MEDIUM | P3 |
| Weather Alerts | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

## Weather Data Critical for Fishing Decisions

Based on research, these are the weather/environmental factors that matter most for fishing, in priority order:

### Tier 1: Critical (Must Have)
1. **Barometric Pressure Trend** — Most important single indicator; rising/falling/stable pressure predicts fish feeding behavior
2. **Wind Speed & Direction** — Safety + technique; affects boat handling, casting, water temperature mixing
3. **Solunar Major/Minor Times** — Moon position relative to Earth; predicts feeding windows (60-90 min major, 30-45 min minor)
4. **Temperature** — Water and air temperature affect fish metabolism and location

### Tier 2: Important (Should Have)
5. **Precipitation** — Current and forecast; affects water clarity, fish behavior
6. **Cloud Cover** — Light penetration affects fish location/activity
7. **Moon Phase** — Complements solunar tables; full/new moon = stronger feeding periods
8. **Tide Data** (for coastal/Adriatic) — High/low tide times and predictions; critical for saltwater

### Tier 3: Enhancing (Nice to Have)
9. **UV Index** — Affects fish location (seek shade in high UV)
10. **Water Temperature** — Requires integration with buoys/sensors; not universally available
11. **Wave Height** (for coastal) — Safety and boat handling

### Key Insight: It's About Trends, Not Snapshots
- Static weather data is less valuable than **trends**: Is pressure rising or falling? Has it been stable for 24 hours?
- Best fishing often occurs **before** a front arrives (falling pressure) or **after** it passes (stable/rising pressure)
- Apps that synthesize multiple factors into a "fishing score" or "bite forecast" provide more value than raw data dumps

## Fish Catalog Requirements

Based on analysis of existing apps and user expectations:

### Core Data per Species (Table Stakes)
- **Scientific & Common Names** (German + Latin)
- **High-Quality Image** (for identification)
- **Habitat** (saltwater/freshwater, depth, structure preferences)
- **Size Range** (typical and maximum)
- **Appearance/Identification** (distinctive features)
- **Legal Status** (if regulated; size limits, seasons)

### Differentiating Data per Species
- **Best Bait** (live bait, lures, specific recommendations)
- **Fishing Methods** (bottom fishing, trolling, casting, etc.)
- **Tackle Recommendations** (rod weight, line strength, hooks)
- **Seasonal Patterns** (when/where to find throughout year)
- **Edibility Rating** (excellent/good/fair/poor/avoid)
- **Taste Profile** (mild/strong, texture)
- **Preparation Methods** (grilling, frying, smoking, etc.)
- **Recipe Suggestions** (link to simple preparations)

### Search & Filter Patterns That Work
1. **Water Type** (saltwater/freshwater) — Primary division
2. **Season/Month** — "What's biting now?"
3. **Edibility** — "What's good to eat?"
4. **Fighting Characteristics** — "Beginner-friendly" vs "Challenging"
5. **Size Class** — "Pan fish" vs "Trophy fish"
6. **Text Search** — Name search (handles common/scientific)

### Filter Implementation Notes
- Filters should be **cumulative** (AND logic): "Show me freshwater fish, catchable in March, that are good eating"
- Include **"Available Now"** filter combining season + regional availability
- Allow **sorting** by: Name (A-Z), Size (biggest first), Popularity (most caught)
- Show **filter count** ("23 species match your filters")
- **Quick clear** option to reset all filters

## Competitor Feature Analysis

| Feature | Fishbrain (Global Leader) | ALLE ANGELN (German) | FishingReminder | Our Approach |
|---------|--------------------------|----------------------|-----------------|--------------|
| Weather Forecast | 7-day, hourly | 48-hour, basic | 7-day, 3-hour intervals | 7-day, hourly, fishing-specific interpretation |
| Barometric Pressure | Current + trend | Current + graph | Current + history | Current + trend + 48hr graph |
| Solunar Tables | Major/minor times | Not prominent | Major/minor + moon | Major/minor + moon phase + explanation |
| Fish Catalog | 1000+ global species | Focus on German waters | Limited catalog | 80+ Adriatic + European, detailed |
| Bait Info | Crowdsourced recommendations | Basic | Limited | Expert-curated per species |
| Edibility | Not included | Not included | Not included | **Unique differentiator** |
| Offline Mode | Limited | Limited | Requires connection | Full PWA with service workers |
| Community | Massive social network (primary feature) | Forum + club chats | Minimal | Privacy-first, optional |
| Regulations | Comprehensive (primary feature) | German-focused | By location | Regional focus (Adriatic + EU) |
| Map/Spots | HD bathymetry, spot sharing | Depth maps, private spots | Tides + locations | Private spots only (no public sharing) |
| Language | English + 12 languages | German | English | German (de-AT) primary |

### Competitive Positioning
- **Fishbrain** dominates with social features + massive database; we differentiate with European focus + edibility angle
- **ALLE ANGELN** serves German market but basic; we exceed with better weather data + comprehensive catalog
- **FishingReminder** strong on solunar; we match + add species/bait detail
- **Our gap to fill:** European-focused, German-language, fishing weather + detailed species info including edibility

## Sources

### Fishing Weather & Apps
- [The Best Weather Apps for Fishing | Best On Tour](https://bestontour.net/blog/the-best-weather-apps-for-fishing/)
- [Fishing Weather Forecast Reports | onX Fish App](https://www.onxmaps.com/fish/app/features/fishing-weather-forecast)
- [FishWeather: Marine Forecasts App](https://apps.apple.com/us/app/fishweather-marine-forecasts/id555644333)
- [The 5 Best Fishing Apps for Anglers: An Expert's Inside Guide for 2026](https://fishingbooker.com/blog/best-fishing-apps/)
- [Today's Fishing Times Near You + Tides & Weather | FishingReminder](https://www.fishingreminder.com)

### Fishing Data & Features
- [Fishing By the Solunar Tables | Saltwater Sportsman](https://www.saltwatersportsman.com/story/howto/fishing-using-solunar-tables/)
- [The 16 Best Fishing Apps 2026 for 21st Century Angler](https://bonfirebob.com/best-fishing-apps/)
- [Unlock Angling Success: Mobile Fishing Apps Revolution](https://allaboutfishing.org/equipment-and-gear/fishing-apps-and-software/mobile-fishing-apps)

### Fish Catalogs & Species Info
- [10 Best Fish Identification Apps for Android & iOS](https://freeappsforme.com/fish-identification-apps/)
- [FishVerify: ID & Regulations App](https://apps.apple.com/us/app/fishverify-id-regulations/id1121514756)
- [onX Fish FAQs | Species Filters](https://www.onxmaps.com/fish/app/faq)

### Regional Fishing (Adriatic & Europe)
- [Fishing in Europe: A Complete Guide for 2026](https://fishingbooker.com/blog/fishing-in-europe/)
- [Croatia Fishing: The Complete Guide for 2026](https://fishingbooker.com/blog/fishing-in-croatia/)
- [Most common fish in the Adriatic Sea | My Luxoria](https://www.myluxoria.com/en/journal/fish-in-the-adriatic-sea)

### PWA & Offline Technology
- [Best PWA Progressive Web Apps 2026 - AppsThunder](https://appsthunder.com/best-pwa-progressive-web-apps-2026/)
- [How PWA Offline Capabilities Works | Romexsoft](https://www.romexsoft.com/blog/what-is-pwa-progressive-web-apps-and-offline-capabilities/)
- [Build a Next.js 16 PWA with true offline support | LogRocket](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)

### User Behavior & Anti-Patterns
- [Study: Fishers Still Fear Fishing Apps | Angler Action Foundation](https://angleractionfoundation.org/study-fishers-still-fear-fishing-apps)
- [Why Fishing Spots Apps Don't Work | Deep Dive](https://deepdiveapp.com/blog/why-fishing-spots-apps-dont-work/)
- [Are Fishing Apps Doing More Harm Than Good? | Outdoor Life](https://www.outdoorlife.com/fishing/are-fishing-apps-doing-more-harm-than-good/)

### German Fishing Apps
- [ALLE ANGELN - App für Angler](https://play.google.com/store/apps/details?id=com.echo_projects.alleangeln&hl=en_US)
- [angeln-in App](https://apps.apple.com/us/app/angeln-in/id1460809527)

---
*Feature research for: Angel-Wetter-App (Fishing & Weather PWA)*
*Researched: 2026-02-07*
*Confidence: HIGH — Based on verified sources from 2026 fishing app market leaders and current PWA technology standards*
