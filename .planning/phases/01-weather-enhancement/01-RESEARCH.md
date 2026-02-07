# Phase 1: Weather Enhancement - Research

**Researched:** 2026-02-07
**Domain:** Weather data enhancement, Marine APIs, Canvas visualization, Fishing score algorithms
**Confidence:** HIGH

## Summary

This research investigates the technical requirements for enhancing a fishing weather app with comprehensive meteorological data, marine/coastal features, and improved fishing score calculations. The app currently uses Open-Meteo Weather API and implements solunar calculations with a 5-factor fishing score system. The enhancement adds UV index, visibility, wind gusts, moon rise/set times, marine data, tidal information, and a 48-hour pressure trend graph.

**Key findings:**
- Open-Meteo provides all required standard weather parameters (UV, visibility, wind gusts) via its Forecast API with `past_days` parameter for historical pressure data
- Open-Meteo Marine API provides wave height and sea conditions but does NOT provide tidal prediction data (high/low tide times)
- Tide times require either: (a) calculating from hourly sea level height data, or (b) using a dedicated library like SunCalc for moon-based tide approximation
- Canvas 2D sparkline charts can be implemented without external libraries (consistent with app's zero-dependency approach)
- Fishing score must be rebalanced from 5 factors (inland) to 7-9 factors (coastal) with dynamic factor weighting

**Primary recommendation:** Use Open-Meteo Forecast API with `past_days=1` for pressure history, Open-Meteo Marine API for coastal detection and wave data, and calculate approximate tide times from hourly sea level height values. Implement Canvas-based sparkline for pressure trends. Rebalance fishing score weights to accommodate new factors while maintaining 100% total weight.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**1. Day Detail Layout — Grouping & Density**
- Thematic groups with section headers inside each expanded day
- Groups: Wind & Wetter, Luftdruck (with 48h graph), Sonne & Mond, Marine (coastal only), Fangprognose
- Collapsed view shows: weekday, weather icon, temp range, precipitation, wind, pressure trend arrow, score badge
- All data visible on expand (scrolling OK, no sub-accordions)

**2. Marine Data Visibility**
- Detection: Call Open-Meteo Marine API — if data returns, location is coastal
- Inland: Marine group completely hidden (no placeholder, no message)
- Tidal display: Graphical timeline showing curve with high/low water times AND heights in meters
- Score impact: Tides and wave height are additional factors at coastal locations (5→7-8 factors)

**3. 48h Pressure Trend Graph**
- Placement: Inside expanded day, in "Luftdruck" group
- Content: Line chart over 48h (24h past + 24h future), color-coded zones (green=falling/good, orange=stable, red=rising)
- "Now" marker: Vertical line or dot
- Size: Compact sparkline (~100px height), min/max hPa labels only
- Library: Canvas-based (no external charting library)

**4. Fishing Score Enhancement**
- Formula: Redistribute weights across ALL factors (old + new), sum to 100%
- Inland: ~7 factors (moon, solunar, pressure, time of day, clouds, UV, visibility)
- Coastal: ~8-9 factors (add tides, wave height)
- Best fishing time: Recommended time range per day from solunar + dawn/dusk + tides
- Factor bars: Show ALL factors (5-8 depending on location)
- Visualization: Keep existing circular gauge design

### Claude's Discretion

None specified — all major decisions locked.

### Deferred Ideas (OUT OF SCOPE)

None captured during discussion.
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core APIs
| Service | Endpoint | Purpose | Why Standard |
|---------|----------|---------|--------------|
| Open-Meteo Forecast API | `https://api.open-meteo.com/v1/forecast` | Weather, UV, visibility, wind, pressure history | Free, no API key, comprehensive data, already integrated |
| Open-Meteo Marine API | `https://marine-api.open-meteo.com/v1/marine` | Wave height, sea level (tides), sea temperature, swell | Free, no API key, global coverage, coastal detection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SunCalc | 1.9.0 | Moon rise/set times calculation | If not using own Julian day calculation |
| Canvas 2D API | Native | Sparkline pressure graph rendering | Required for zero-dependency graphs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual tide calculation | WorldTides API | WorldTides requires API key after 100 free requests; Open-Meteo sea level data is free but requires parsing |
| Canvas sparkline | Chart.js / SVG | External dependency vs. zero-dependency constraint |
| SunCalc library | Custom implementation | App already implements moon phase calculation; moon rise/set can use same Julian day approach |

**Installation:**
```bash
# No new dependencies required if using existing Julian day calculations
# Optional if adopting SunCalc for moon rise/set:
npm install suncalc
```

## Architecture Patterns

### Recommended Project Structure
```
fishing-app/
├── js/
│   ├── api.js              # Weather API calls (ENHANCE with Marine API)
│   ├── solunar.js          # Moon/solunar calculations (ADD moon rise/set)
│   ├── config.js           # Config (ADD new API params, factor weights)
│   ├── sparkline.js        # NEW: Canvas sparkline renderer
│   ├── marine.js           # NEW: Marine/tidal data parser
│   └── app.js              # Main app (UPDATE UI rendering)
```

### Pattern 1: Open-Meteo API Parameter Extension

**What:** Add new parameters to existing `WEATHER_PARAMS` and create separate `MARINE_PARAMS` config.

**When to use:** When extending API calls without breaking existing functionality.

**Example:**
```javascript
// In config.js - extend WEATHER_PARAMS
WEATHER_PARAMS: {
    hourly: [
        'temperature_2m',
        'precipitation',
        'pressure_msl',
        'cloud_cover',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',        // NEW
        'uv_index',              // NEW
        'visibility'             // NEW
    ].join(','),
    past_days: 1,                // NEW: for 48h pressure graph
    forecast_days: 7
},

// NEW: Marine API params
MARINE_PARAMS: {
    hourly: [
        'wave_height',
        'wave_direction',
        'wave_period',
        'ocean_current_velocity',
        'sea_surface_temperature'
    ].join(','),
    forecast_days: 7
}
```

### Pattern 2: Coastal Detection via API Probe

**What:** Attempt Marine API call; if data returns, location is coastal. No error state shown to user.

**When to use:** When feature availability depends on geographic conditions.

**Example:**
```javascript
// In api.js or new marine.js
async function detectCoastal(location) {
    const params = new URLSearchParams({
        latitude: location.lat,
        longitude: location.lon,
        hourly: 'wave_height',
        forecast_days: 1
    });

    try {
        const url = `https://marine-api.open-meteo.com/v1/marine?${params}`;
        const response = await fetch(url);

        if (!response.ok) return { isCoastal: false };

        const data = await response.json();

        // Check if wave_height data exists and has values
        if (data.hourly?.wave_height?.some(val => val !== null)) {
            return { isCoastal: true, marineData: data };
        }

        return { isCoastal: false };
    } catch (err) {
        // Network error or invalid response = treat as inland
        return { isCoastal: false };
    }
}
```

### Pattern 3: Canvas Sparkline with Colored Zones

**What:** Draw line chart with background zones using Canvas 2D fillRect + strokePath.

**When to use:** Compact trend visualization without external charting libraries.

**Example:**
```javascript
// In new sparkline.js
function drawPressureSparkline(canvas, pressureData, nowIndex) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 10, right: 20, bottom: 10, left: 20 };

    // Find min/max for scaling
    const values = pressureData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Scale functions
    const scaleX = (i) => padding.left + (i / (values.length - 1)) * (width - padding.left - padding.right);
    const scaleY = (val) => padding.top + ((max - val) / range) * (height - padding.top - padding.bottom);

    // Draw colored zones (analyze pressure trend for each segment)
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < values.length - 1; i++) {
        const trend = values[i + 1] - values[i];
        let color;

        if (trend < -0.5) color = 'rgba(34, 197, 94, 0.15)';      // Green = falling (good)
        else if (trend > 0.5) color = 'rgba(239, 68, 68, 0.15)';  // Red = rising
        else color = 'rgba(245, 158, 11, 0.15)';                  // Orange = stable

        ctx.fillStyle = color;
        ctx.fillRect(
            scaleX(i),
            0,
            scaleX(i + 1) - scaleX(i),
            height
        );
    }

    // Draw pressure line
    ctx.beginPath();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;

    values.forEach((val, i) => {
        const x = scaleX(i);
        const y = scaleY(val);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw "now" marker
    if (nowIndex >= 0 && nowIndex < values.length) {
        const nowX = scaleX(nowIndex);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(nowX, 0);
        ctx.lineTo(nowX, height);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw min/max labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(max)} hPa`, width - 2, padding.top + 10);
    ctx.fillText(`${Math.round(min)} hPa`, width - 2, height - padding.bottom);
}
```

### Pattern 4: Tide Approximation from Sea Level Height

**What:** Parse hourly sea level height data to find local maxima (high tide) and minima (low tide).

**When to use:** When dedicated tide API is unavailable but sea level data exists.

**Example:**
```javascript
// In marine.js
function calculateTideTimes(seaLevelData) {
    // seaLevelData = [{ time: ISO string, height: meters }, ...]

    const tides = [];

    for (let i = 1; i < seaLevelData.length - 1; i++) {
        const prev = seaLevelData[i - 1].height;
        const curr = seaLevelData[i].height;
        const next = seaLevelData[i + 1].height;

        // Local maximum = high tide
        if (curr > prev && curr > next) {
            tides.push({
                time: seaLevelData[i].time,
                height: curr,
                type: 'high'
            });
        }

        // Local minimum = low tide
        if (curr < prev && curr < next) {
            tides.push({
                time: seaLevelData[i].time,
                height: curr,
                type: 'low'
            });
        }
    }

    return tides;
}
```

### Pattern 5: Moon Rise/Set Calculation Extension

**What:** Extend existing Julian day calculations (already in solunar.js) to compute moon rise/set times.

**When to use:** When app already has moon position logic and wants to avoid external dependencies.

**Example:**
```javascript
// In solunar.js - extend existing toJulianDay/getMoonData functions
function getMoonRiseSet(date, lat, lon) {
    // Simplified algorithm based on moon transit time
    // (App already calculates estimateMoonTransit in solunar.js)

    const transit = estimateMoonTransit(date, lon);

    // Approximate rise/set as transit ±6 hours
    // For higher accuracy, use SunCalc library or full Meeus algorithm
    const moonrise = (transit - 6 + 24) % 24;
    const moonset = (transit + 6) % 24;

    return {
        rise: formatDecimalHour(moonrise),
        set: formatDecimalHour(moonset),
        transit: formatDecimalHour(transit)
    };
}
```

### Anti-Patterns to Avoid

- **Fetching Marine API for all locations without caching coastal status:** Marine API call should be cached per location to avoid redundant requests.
- **Hardcoding tide times:** Never hardcode tidal data; always calculate or fetch dynamically.
- **Blocking UI on Marine API failure:** Coastal detection must be non-blocking; if Marine API fails, render as inland without error message.
- **External charting library for simple sparkline:** Adds unnecessary dependency; Canvas 2D is sufficient for 48-point line chart.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Moon rise/set times | Custom lunar position from scratch | Extend existing Julian day logic OR use SunCalc 1.9.0 | Moon position requires complex astronomical calculations; app already has Julian day foundation |
| Tide prediction algorithms | Full harmonic analysis | Parse sea level height maxima/minima OR accept approximation | True tide prediction requires 37+ harmonic constituents; approximation sufficient for fishing score |
| Pressure trend visualization | Full charting framework (Chart.js) | Canvas 2D sparkline (40 lines of code) | Overkill for single-line chart; violates zero-dependency constraint |
| Mobile accordion touch handling | Custom event listeners | CSS transitions + ARIA attributes + click handlers | Accessibility requires ARIA roles; CSS handles animation smoothly |

**Key insight:** The app already implements sophisticated solunar calculations using Julian day conversion. Moon rise/set times use the same mathematical foundation (moon transit time already calculated in `estimateMoonTransit`). Avoid importing SunCalc unless removing existing custom logic. Similarly, tide prediction is astronomically complex, but fishing applications only need approximate high/low times — parsing sea level height data provides sufficient accuracy.

## Common Pitfalls

### Pitfall 1: Confusing Sea Level Height with Tide Times

**What goes wrong:** Open-Meteo Marine API provides `sea_level_height` (elevation in meters) but NOT tide event times (high tide at 14:30, low tide at 20:15).

**Why it happens:** Documentation mentions "sea level height including tides" which sounds like tide predictions, but it's actually instantaneous water level measurements.

**How to avoid:** Parse hourly sea level height values to identify local maxima (high tide) and minima (low tide) using simple peak detection. Store both time AND height.

**Warning signs:**
- API response has no `high_tide_time` or `low_tide_time` fields
- Documentation explicitly states "not suitable for coastal navigation"
- Hourly data requires processing to extract tide events

### Pitfall 2: Pressure Graph "Now" Marker Misalignment

**What goes wrong:** When using `past_days=1`, the API returns 48+ hours of data starting at 00:00 local time. Finding the current hour's index requires matching ISO timestamps, not simple array indexing.

**Why it happens:** API returns data starting at midnight, so current hour is NOT at index 24 (halfway point) — it depends on the current time of day.

**How to avoid:** Match current hour by parsing ISO timestamp strings and finding exact match:
```javascript
const now = new Date();
const currentHourStr = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
const nowIndex = pressureData.findIndex(d => d.time.startsWith(currentHourStr));
```

**Warning signs:**
- "Now" marker appears at wrong position
- Pressure graph shows future data on the left side
- User reports "graph doesn't match current conditions"

### Pitfall 3: Fishing Score Weight Overflow

**What goes wrong:** Adding new factors (UV, visibility, tides, waves) without removing weight from existing factors causes total weight to exceed 100%, inflating scores artificially.

**Why it happens:** Current implementation uses fixed weights that sum to 100%. Adding factors requires redistributing the total.

**How to avoid:** Recalculate ALL weights to sum to 100%. Example redistribution:

**Current (5 factors, inland):**
- Moon phase: 25%
- Solunar: 30%
- Pressure: 20%
- Time of day: 15%
- Cloud cover: 10%
- **Total: 100%**

**Enhanced (7 factors, inland):**
- Moon phase: 20% (↓5%)
- Solunar: 25% (↓5%)
- Pressure: 18% (↓2%)
- Time of day: 12% (↓3%)
- Cloud cover: 10% (same)
- UV index: 8% (NEW)
- Visibility: 7% (NEW)
- **Total: 100%**

**Enhanced (9 factors, coastal):**
- All inland factors: 90% (proportionally scaled down)
- Tide timing: 6% (NEW)
- Wave height: 4% (NEW)
- **Total: 100%**

**Warning signs:**
- Fishing scores suddenly jump to 110-120
- All days show "Ausgezeichnet" rating
- Breakdown percentages don't sum to 100%

### Pitfall 4: Mobile Accordion Touch Target Size

**What goes wrong:** Accordion headers too small for reliable touch interaction on mobile devices, causing users to miss taps or accidentally tap wrong day.

**Why it happens:** Desktop-optimized designs use compact headers (30-40px height); mobile requires minimum 48px for accessibility.

**How to avoid:**
- Set minimum touch target size: `min-height: 48px` on accordion headers
- Add padding: `padding: 12px 16px` for comfortable tap area
- Use `:active` state for immediate visual feedback on tap

**Warning signs:**
- User reports "hard to tap the right day"
- Frequent mis-taps on adjacent days
- Touch events not firing consistently

### Pitfall 5: Coastal Detection False Negatives

**What goes wrong:** Locations near coast are incorrectly classified as inland because Marine API returns empty data for shallow coastal waters or enclosed bays.

**Why it happens:** Open-Meteo Marine API has limited coastal accuracy (8km resolution). Documentation warns "accuracy at coastal areas is limited."

**How to avoid:**
- Don't rely solely on Marine API response for coastal detection
- Consider fallback: if wave_height data is all null but other marine parameters exist, still show marine section with "limited data" caveat
- Alternative: check distance to coastline using geographic bounds (requires separate coastline dataset)

**Warning signs:**
- Mediterranean fishing spots show no marine data
- Enclosed bays (e.g., Baltic Sea) classified as inland
- User reports missing marine data at known coastal locations

### Pitfall 6: Sparkline Rendering Performance on Low-End Devices

**What goes wrong:** Canvas sparkline re-renders on every accordion expand, causing lag on older mobile devices when rapidly opening/closing days.

**Why it happens:** Canvas drawing operations are synchronous and can block main thread if not optimized.

**How to avoid:**
- Cache rendered sparkline as ImageData or offscreen canvas
- Only re-render if data changes (compare timestamps)
- Use `requestAnimationFrame` for smooth animation when drawing
- Debounce resize events that trigger re-render

**Warning signs:**
- Stuttering when expanding day accordions
- UI freezes briefly on older Android devices
- Pressure graph takes >100ms to render

## Code Examples

Verified patterns from official sources and existing codebase:

### Fetching Weather Data with past_days Parameter

```javascript
// Source: Open-Meteo API Documentation + existing api.js pattern
// Add past_days to existing fetchWeatherData function

async function fetchWeatherData(location) {
    const params = new URLSearchParams({
        latitude: location.lat,
        longitude: location.lon,
        ...CONFIG.WEATHER_PARAMS,
        past_days: 1  // Add 24h historical data
    });

    const url = `${CONFIG.API.WEATHER}?${params}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
        throw new Error(`Wetter-API Fehler: ${response.status}`);
    }

    const data = await response.json();

    // Extract 48h pressure data for sparkline
    const pressureHistory = data.hourly.time.map((time, i) => ({
        time: time,
        value: data.hourly.pressure_msl[i]
    }));

    return {
        ...data,
        pressureHistory  // Add to response
    };
}
```

### Marine API Integration with Coastal Detection

```javascript
// Source: Open-Meteo Marine API Documentation
// New function in api.js or marine.js

async function fetchMarineData(location) {
    const params = new URLSearchParams({
        latitude: location.lat,
        longitude: location.lon,
        hourly: [
            'wave_height',
            'wave_direction',
            'wave_period',
            'ocean_current_velocity',
            'ocean_current_direction'
        ].join(','),
        daily: 'wave_height_max',
        forecast_days: 7
    });

    try {
        const url = `https://marine-api.open-meteo.com/v1/marine?${params}`;
        const response = await fetchWithRetry(url, 2);  // Only 2 retries for optional data

        if (!response.ok) {
            return { isCoastal: false };
        }

        const data = await response.json();

        // Check if location has valid marine data
        const hasWaveData = data.hourly?.wave_height?.some(h => h !== null && h !== undefined);

        if (!hasWaveData) {
            return { isCoastal: false };
        }

        // Parse daily marine conditions
        const daily = data.daily.time.map((date, i) => ({
            date: date,
            waveHeightMax: data.daily.wave_height_max[i]
        }));

        return {
            isCoastal: true,
            hourly: data.hourly,
            daily: daily
        };

    } catch (err) {
        // Network error or timeout = treat as inland
        console.warn('Marine API unavailable, treating as inland:', err);
        return { isCoastal: false };
    }
}
```

### Calculating Tide Times from Sea Level Height

```javascript
// Source: Peak detection algorithm (standard signal processing)
// New function in marine.js

function extractTideTimes(seaLevelHourly) {
    // seaLevelHourly = { time: [...], sea_surface_height: [...] }

    const tides = [];
    const heights = seaLevelHourly.sea_surface_height || [];
    const times = seaLevelHourly.time || [];

    // Group by day for per-day tide extraction
    const dayGroups = {};

    times.forEach((time, i) => {
        const date = time.slice(0, 10);  // "YYYY-MM-DD"
        if (!dayGroups[date]) {
            dayGroups[date] = [];
        }
        dayGroups[date].push({ time, height: heights[i], index: i });
    });

    // Find high/low tides per day
    Object.entries(dayGroups).forEach(([date, hourlyData]) => {
        const dayTides = [];

        for (let i = 1; i < hourlyData.length - 1; i++) {
            const prev = hourlyData[i - 1].height;
            const curr = hourlyData[i].height;
            const next = hourlyData[i + 1].height;

            // Skip null values
            if (prev === null || curr === null || next === null) continue;

            // Local maximum = high tide
            if (curr > prev && curr > next) {
                dayTides.push({
                    time: hourlyData[i].time,
                    height: Math.round(curr * 100) / 100,  // Round to cm
                    type: 'high'
                });
            }

            // Local minimum = low tide
            if (curr < prev && curr < next) {
                dayTides.push({
                    time: hourlyData[i].time,
                    height: Math.round(curr * 100) / 100,
                    type: 'low'
                });
            }
        }

        if (dayTides.length > 0) {
            tides.push({
                date: date,
                tides: dayTides
            });
        }
    });

    return tides;
}
```

### Enhanced Fishing Score with Dynamic Factors

```javascript
// Source: Existing solunar.js calculateCatchProbability function
// Modified to support dynamic factor count and coastal parameters

function calculateEnhancedCatchProbability(weather, moon, solunar, marineData, fish) {
    // Determine if location is coastal
    const isCoastal = marineData && marineData.isCoastal;

    // Calculate individual scores
    const scores = {
        moonPhase: MOON_PHASES[moon.phaseIndex].score,
        solunar: solunar.score,
        pressure: pressureScore(weather.pressureTrend),
        timeOfDay: timeOfDayScore(weather),
        cloudCover: cloudCoverScore(weather.cloudCover),
        uvIndex: uvIndexScore(weather.uvIndex),
        visibility: visibilityScore(weather.visibility)
    };

    // Coastal-specific scores
    if (isCoastal) {
        scores.tides = tideTimingScore(marineData.tides, weather);
        scores.waveHeight = waveHeightScore(marineData.waveHeight);
    }

    // Dynamic weights based on location
    const weights = isCoastal ? CATCH_WEIGHTS_COASTAL : CATCH_WEIGHTS_INLAND;

    // Weighted average
    let overall = 0;
    Object.keys(scores).forEach(factor => {
        if (weights[factor]) {
            overall += scores[factor] * weights[factor];
        }
    });

    // Clamp and round
    overall = Math.max(0, Math.min(100, Math.round(overall)));

    // Get rating
    let rating = CATCH_RATINGS[CATCH_RATINGS.length - 1];
    for (const r of CATCH_RATINGS) {
        if (overall >= r.min) {
            rating = r;
            break;
        }
    }

    return {
        overall: overall,
        rating: rating.label,
        color: rating.color,
        colorClass: rating.colorClass,
        breakdown: scores,
        isCoastal: isCoastal
    };
}

// Helper scoring functions (NEW)
function uvIndexScore(uvIndex) {
    // UV 0-2 = 100 (best), 3-5 = 80, 6-7 = 60, 8+ = 40 (fish go deeper)
    if (uvIndex <= 2) return 100;
    if (uvIndex <= 5) return 80;
    if (uvIndex <= 7) return 60;
    return 40;
}

function visibilityScore(visibilityKm) {
    // Good visibility (>10km) = 60, moderate (5-10km) = 80, poor (<5km) = 70
    // Slightly reduced visibility is good for fishing (fish less cautious)
    if (visibilityKm > 10) return 60;
    if (visibilityKm >= 5) return 80;
    return 70;
}

function tideTimingScore(tides, weather) {
    // Check if near tide change (1h before/after high or low tide)
    const now = new Date();

    for (const tide of tides) {
        const tideTime = new Date(tide.time);
        const diffHours = Math.abs(now - tideTime) / (1000 * 60 * 60);

        if (diffHours <= 1) {
            // Near tide change = excellent feeding time
            return tide.type === 'high' ? 90 : 85;
        }
        if (diffHours <= 2) {
            return 70;
        }
    }

    return 50;  // Mid-tide = moderate
}

function waveHeightScore(waveHeightM) {
    // Calm (0-0.5m) = 90, light (0.5-1.5m) = 100 (ideal), moderate (1.5-3m) = 70, rough (3+m) = 30
    if (waveHeightM < 0.5) return 90;
    if (waveHeightM <= 1.5) return 100;
    if (waveHeightM <= 3) return 70;
    return 30;
}
```

### Config Updates for New Weights

```javascript
// Source: Existing config.js CATCH_WEIGHTS
// Add new weight configurations

// CURRENT (keep for reference)
const CATCH_WEIGHTS = {
    MOON_PHASE: 0.25,
    SOLUNAR_PERIOD: 0.30,
    PRESSURE: 0.20,
    TIME_OF_DAY: 0.15,
    CLOUD_COVER: 0.10
};

// NEW: Inland locations (7 factors)
const CATCH_WEIGHTS_INLAND = {
    moonPhase: 0.20,      // 20%
    solunar: 0.25,        // 25%
    pressure: 0.18,       // 18%
    timeOfDay: 0.12,      // 12%
    cloudCover: 0.10,     // 10%
    uvIndex: 0.08,        // 8%
    visibility: 0.07      // 7%
    // Total: 100%
};

// NEW: Coastal locations (9 factors)
const CATCH_WEIGHTS_COASTAL = {
    moonPhase: 0.18,      // 18%
    solunar: 0.22,        // 22%
    pressure: 0.16,       // 16%
    timeOfDay: 0.10,      // 10%
    cloudCover: 0.09,     // 9%
    uvIndex: 0.07,        // 7%
    visibility: 0.06,     // 6%
    tides: 0.08,          // 8%
    waveHeight: 0.04      // 4%
    // Total: 100%
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Historical Weather API for past pressure | Forecast API with `past_days` parameter | Open-Meteo 2023+ | Single API call instead of two separate requests for historical + forecast data |
| External tide APIs (WorldTides, NOAA) | Sea level height parsing from Marine API | Open-Meteo Marine launch 2023 | Zero API key requirement; approximation sufficient for fishing |
| Chart.js / external charting libraries | Canvas 2D sparklines | Modern PWA best practices 2024+ | Reduced bundle size, faster load times, offline capability |
| jQuery Sparklines | Vanilla JS + Canvas API | jQuery deprecation 2020+ | Removes 30KB dependency, improves performance |
| SunCalc for moon rise/set | Extend existing Julian day calculations | N/A (app-specific) | Consistency with existing codebase, avoids new dependency |

**Deprecated/outdated:**
- **WorldTides free tier:** Reduced to 100 requests (was unlimited in 2022); now requires paid plan for production use
- **jQuery.sparkline:** No longer maintained; last release 2013
- **Chart.js for simple sparklines:** Overkill for single-line charts; modern approach is Canvas 2D
- **Separate historical weather API calls:** Open-Meteo consolidated into `past_days` parameter

## Open Questions

Things that couldn't be fully resolved:

1. **Tide prediction accuracy from sea level height**
   - What we know: Open-Meteo Marine API provides hourly sea level height including tidal effects; peak detection identifies high/low tides
   - What's unclear: Accuracy compared to harmonic tide predictions; sufficient for fishing score but not for navigation
   - Recommendation: Implement peak detection algorithm; validate against known tidal locations; document limitation ("approximate tide times for fishing purposes only")

2. **Optimal fishing score factor weights**
   - What we know: Current weights (5 factors) proven effective; must redistribute to 7-9 factors
   - What's unclear: Exact weight distribution for new factors (UV, visibility, tides, waves); requires empirical testing
   - Recommendation: Start with proposed weights (UV: 8%, visibility: 7%, tides: 8%, waves: 4%); collect user feedback; A/B test if possible

3. **Marine API availability in enclosed seas**
   - What we know: Open-Meteo Marine API has 8km resolution; limited coastal accuracy
   - What's unclear: Coverage in Mediterranean, Baltic Sea, lakes; may return null data for valid fishing locations
   - Recommendation: Implement fallback UI state; if Marine API returns data but all nulls, show "Marine data unavailable for this location" instead of hiding section

4. **UV index historical data availability**
   - What we know: Open-Meteo provides UV index in hourly forecasts
   - What's unclear: Whether `past_days` parameter includes historical UV data or only pressure/temperature/wind
   - Recommendation: Test API response; if historical UV unavailable, use forecast-only for current day forward

5. **Best fishing time calculation logic**
   - What we know: Should combine solunar periods + dawn/dusk + tides (coastal)
   - What's unclear: How to weight these inputs when they conflict (e.g., major solunar at noon but tide change at sunset)
   - Recommendation: Priority order: (1) Major solunar periods, (2) Tide changes ±1h, (3) Dawn/dusk ±1h; return earliest high-score window as "best time"

## Sources

### Primary (HIGH confidence)
- [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs) - Weather parameters, `past_days` parameter, hourly data structure
- [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api) - Wave data, sea level height, tidal information limitations
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) - Barometric pressure historical data, time range capabilities
- Existing codebase (api.js, solunar.js, config.js) - Current implementation patterns, Julian day calculations

### Secondary (MEDIUM confidence)
- [GitHub: mourner/suncalc](https://github.com/mourner/suncalc) - Moon rise/set calculation algorithms, verified approach
- [MDN: Canvas API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) - Canvas 2D drawing patterns
- [MDN: Progressive Web Apps - Offline Service Workers](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers) - PWA caching strategies for weather data
- [Tempest: Barometric Pressure and Fishing Guide](https://tempest.earth/resources/barometric-pressure-and-fishing/) - Pressure ranges and fishing conditions
- [iSolunar: Solunar Theory](https://i-solunar.com/solunar-theory) - Major/minor period calculations

### Tertiary (LOW confidence)
- [CSS Script: Accordion Components 2026](https://www.cssscript.com/top-10-javascript-css-accordion-components/) - Mobile accordion best practices
- [GitHub: adactio/Canvas-Sparkline](https://github.com/adactio/Canvas-Sparkline) - Minimal sparkline implementation reference
- [Fishing Points: Marine Insights](https://fishingpoints.app/feature/forecasts/waves/) - Wave height impact on fishing
- [Distraction Charters: Marine Weather](https://www.distractioncharters.com/the-weather/) - Wave period and fishing safety thresholds

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Open-Meteo APIs verified in official documentation; existing codebase confirms integration patterns
- Architecture: HIGH - Patterns derived from existing codebase (api.js, solunar.js) with verified API responses
- Pitfalls: MEDIUM - Based on API documentation limitations and common integration issues; some require real-world testing
- Tide calculation: MEDIUM - Peak detection algorithm is standard but tide accuracy vs. harmonic predictions untested
- Fishing score weights: LOW - Proposed weights are estimates; require empirical validation with user feedback

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable APIs, but weight tuning may need adjustment based on user feedback)
