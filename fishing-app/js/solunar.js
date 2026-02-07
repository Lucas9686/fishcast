/**
 * PETRI HEIL - Solunar & Mondphasen-Berechnungen
 * Julian Day Algorithmus, Solunar-Perioden, Fangprognose
 */

// ============================================================
// Mondphasen-Berechnung
// ============================================================

/**
 * Calculates Julian Day Number for a given date
 * @param {Date} date
 * @returns {number} Julian Day Number
 */
function toJulianDay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate() + (date.getHours() + date.getMinutes() / 60) / 24;

    let y = year;
    let m = month;
    if (m <= 2) {
        y -= 1;
        m += 12;
    }

    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);

    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

/**
 * Calculates moon data for a given date
 * @param {Date} date - Datum
 * @returns {MoonData} Monddaten
 */
function getMoonData(date) {
    const SYNODIC_MONTH = 29.53059;

    // Known new moon reference: January 6, 2000 at 18:14 UTC
    const KNOWN_NEW_MOON_JD = 2451550.26;

    const jd = toJulianDay(date);
    const daysSinceNew = jd - KNOWN_NEW_MOON_JD;
    const age = ((daysSinceNew % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

    // Phase index: 8 phases, each ~3.69 days
    const phaseIndex = Math.floor((age / SYNODIC_MONTH) * 8) % 8;

    // Illumination: 0% at new moon, 100% at full moon
    // Uses cosine curve: 0.5 * (1 - cos(2*PI*age/synodic))
    const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * age / SYNODIC_MONTH)));

    const phase = MOON_PHASES[phaseIndex];

    return {
        phaseIndex: phaseIndex,
        name: phase.name,
        emoji: phase.emoji,
        illumination: illumination,
        age: Math.round(age * 100) / 100,
        score: phase.score
    };
}

// ============================================================
// Solunar-Perioden
// ============================================================

/**
 * Estimates moon transit time (upper culmination) for a given date and longitude
 * Simplified calculation based on moon age and longitude offset
 * @param {Date} date
 * @param {number} lon - Laengengrad
 * @returns {number} Approximate hour of moon transit (0-24, can exceed 24)
 */
function estimateMoonTransit(date, lon) {
    const SYNODIC_MONTH = 29.53059;
    const KNOWN_NEW_MOON_JD = 2451550.26;

    const jd = toJulianDay(date);
    const daysSinceNew = jd - KNOWN_NEW_MOON_JD;
    const age = ((daysSinceNew % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

    // Moon transits ~50 minutes later each day
    // At new moon, the moon transits at approximately solar noon
    // Longitude offset: 1 degree = 4 minutes = 1/15 hour
    const baseTransit = 12.0; // Solar noon at new moon
    const ageOffset = age * (24 + 50 / 60) / SYNODIC_MONTH; // Moon retardation
    const lonOffset = -lon / 15; // Longitude correction (relative to timezone)

    let transit = (baseTransit + ageOffset + lonOffset) % 24;
    if (transit < 0) transit += 24;

    return transit;
}

/**
 * Formats a decimal hour to HH:MM string
 * @param {number} decimalHour - Stunde als Dezimalzahl (z.B. 14.5 = 14:30)
 * @returns {string} z.B. "14:30"
 */
function formatDecimalHour(decimalHour) {
    // Normalize to 0-24 range
    let h = ((decimalHour % 24) + 24) % 24;
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes === 60 ? 0 : minutes).padStart(2, '0')}`;
}

/**
 * Calculates moon rise and set times for a given date and location
 * @param {Date} date - Datum
 * @param {number} lat - Breitengrad
 * @param {number} lon - Laengengrad
 * @returns {Object} {rise: "HH:MM", set: "HH:MM", transit: "HH:MM"}
 */
function getMoonRiseSet(date, lat, lon) {
    const transit = estimateMoonTransit(date, lon);

    // Approximate rise/set as transit ±6 hours
    const moonrise = transit - 6;
    const moonset = transit + 6;

    return {
        rise: formatDecimalHour(moonrise),
        set: formatDecimalHour(moonset),
        transit: formatDecimalHour(transit)
    };
}

/**
 * Creates a SolunarPeriod object
 * @param {number} centerHour - Center time as decimal hour
 * @param {number} halfDuration - Half duration in hours (1.0 for major, 0.5 for minor)
 * @param {string} type - "major" or "minor"
 * @returns {SolunarPeriod}
 */
function createPeriod(centerHour, halfDuration, type) {
    return {
        start: formatDecimalHour(centerHour - halfDuration),
        end: formatDecimalHour(centerHour + halfDuration),
        type: type
    };
}

/**
 * Checks if current time falls within a time range (HH:MM strings)
 * @param {string} startStr - Start time "HH:MM"
 * @param {string} endStr - End time "HH:MM"
 * @param {Date} now - Current time
 * @returns {boolean}
 */
function isInTimeRange(startStr, endStr, now) {
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Treat end of 00:00 as 1440 (end of day) when start is before midnight
    if (endMin === 0 && startMin > 0) {
        endMin = 1440;
    }

    if (endMin >= startMin) {
        return nowMin >= startMin && nowMin <= endMin;
    }
    // Wraps midnight
    return nowMin >= startMin || nowMin <= endMin;
}

/**
 * Checks if current time is within N minutes of any period
 * @param {Array<SolunarPeriod>} periods
 * @param {Date} now
 * @param {number} minutesBefore - Minutes before period start
 * @returns {boolean}
 */
function isNearPeriod(periods, now, minutesBefore) {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const period of periods) {
        const [sh, sm] = period.start.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const diff = ((startMin - nowMin) + 1440) % 1440;
        if (diff <= minutesBefore && diff > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Calculates solunar periods for a given date and location
 * @param {Date} date - Datum
 * @param {number} lat - Breitengrad
 * @param {number} lon - Laengengrad
 * @returns {SolunarData} Solunar-Daten
 */
function getSolunarPeriods(date, lat, lon, checkDate) {
    const now = checkDate || date;
    const transit = estimateMoonTransit(date, lon);

    // Moon positions (approximate):
    // Upper transit (culmination): transit hour
    // Moonrise: transit - 6h (approximate)
    // Moonset: transit + 6h (approximate)
    // Lower transit (anti-transit): transit + 12h
    const moonrise = transit - 6;
    const moonset = transit + 6;
    const antiTransit = transit + 12;

    const periods = [];

    // Major periods: moonrise and moonset, each +/- 1 hour
    periods.push(createPeriod(moonrise, 1.0, 'major'));
    periods.push(createPeriod(moonset, 1.0, 'major'));

    // Minor periods: upper transit and lower transit (anti-transit), each +/- 30 min
    periods.push(createPeriod(transit, 0.5, 'minor'));
    periods.push(createPeriod(antiTransit, 0.5, 'minor'));

    // Sort periods by start time
    periods.sort((a, b) => {
        const [ah, am] = a.start.split(':').map(Number);
        const [bh, bm] = b.start.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
    });

    // Check current position relative to periods
    const isInMajor = periods
        .filter(p => p.type === 'major')
        .some(p => isInTimeRange(p.start, p.end, now));

    const isInMinor = periods
        .filter(p => p.type === 'minor')
        .some(p => isInTimeRange(p.start, p.end, now));

    const nearPeriod = !isInMajor && !isInMinor && isNearPeriod(periods, now, 30);

    // Calculate score
    let score;
    if (isInMajor) {
        score = 100;
    } else if (isInMinor) {
        score = 70;
    } else if (nearPeriod) {
        score = 30;
    } else {
        score = 10;
    }

    return {
        periods: periods,
        isInMajor: isInMajor,
        isInMinor: isInMinor,
        isNearPeriod: nearPeriod,
        score: score
    };
}

// ============================================================
// Fangwahrscheinlichkeits-Berechnung
// ============================================================

/**
 * Calculates pressure score based on trend
 * @param {number} trend - Pressure change in hPa (last 3 hours)
 * @returns {number} Score 0-100
 */
function pressureScore(trend) {
    if (trend < -2) return 90;     // Stark fallend = sehr gut
    if (trend < -0.5) return 70;   // Fallend = gut
    if (trend > 2) return 40;      // Stark steigend = maessig
    if (trend > 0.5) return 50;    // Steigend = leicht unter Durchschnitt
    return 60;                     // Stabil
}

/**
 * Calculates time-of-day score (dawn/dusk best for fishing)
 * @param {WeatherData} weather - Wetterdaten mit sunrise/sunset
 * @returns {number} Score 0-100
 */
function timeOfDayScore(weather) {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    let sunriseHour = 6;
    let sunsetHour = 20;

    if (weather.sunrise) {
        const sr = new Date(weather.sunrise);
        sunriseHour = sr.getHours() + sr.getMinutes() / 60;
    }
    if (weather.sunset) {
        const ss = new Date(weather.sunset);
        sunsetHour = ss.getHours() + ss.getMinutes() / 60;
    }

    // Dawn: sunrise +/- 1h = 100, +/- 2h = 70
    const dawnDiff = Math.abs(currentHour - sunriseHour);
    if (dawnDiff <= 1) return 100;
    if (dawnDiff <= 2) return 70;

    // Dusk: sunset +/- 1h = 100, +/- 2h = 70
    const duskDiff = Math.abs(currentHour - sunsetHour);
    if (duskDiff <= 1) return 100;
    if (duskDiff <= 2) return 70;

    // Night (between sunset+2 and sunrise-2)
    if (currentHour < sunriseHour - 2 || currentHour > sunsetHour + 2) {
        return 50;
    }

    // Day
    return 40;
}

/**
 * Calculates cloud cover score
 * @param {number} cloudCover - Bewoelkung 0-100%
 * @returns {number} Score 0-100
 */
function cloudCoverScore(cloudCover) {
    // More clouds = slightly better fishing (fish feel safer)
    return Math.round(70 + (cloudCover * 0.3));
}

/**
 * Calculates UV index score
 * @param {number} uvIndex - UV index 0-11+
 * @returns {number} Score 0-100
 */
function uvIndexScore(uvIndex) {
    if (uvIndex === null || uvIndex === undefined) return 70;
    if (uvIndex <= 2) return 100; // Low UV, fish feed freely
    if (uvIndex <= 5) return 80;  // Moderate
    if (uvIndex <= 7) return 60;  // High
    return 40; // Very high, fish go deeper
}

/**
 * Calculates visibility score
 * @param {number} visibilityMeters - Visibility in meters
 * @returns {number} Score 0-100
 */
function visibilityScore(visibilityMeters) {
    if (visibilityMeters === null || visibilityMeters === undefined) return 70;
    const visibilityKm = visibilityMeters / 1000;
    if (visibilityKm > 10) return 60;  // Very clear, fish more cautious
    if (visibilityKm >= 5) return 80;  // Slightly reduced = good
    return 70; // Poor visibility
}

/**
 * Calculates tide timing score based on proximity to tide changes
 * @param {Array} tides - Array of {time, height, type} for the day
 * @param {Date} currentDate - Current date/time
 * @returns {number} Score 0-100
 */
function tideTimingScore(tides, currentDate) {
    if (!tides || tides.length === 0) return 50;

    const now = currentDate instanceof Date ? currentDate : new Date(currentDate);

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

    return 50; // Mid-tide = moderate
}

/**
 * Calculates wave height score
 * @param {number} waveHeightM - Wave height in meters
 * @returns {number} Score 0-100
 */
function waveHeightScore(waveHeightM) {
    if (waveHeightM === null || waveHeightM === undefined) return 70;
    if (waveHeightM < 0.5) return 90;   // Calm
    if (waveHeightM <= 1.5) return 100; // Light chop (ideal)
    if (waveHeightM <= 3) return 70;    // Moderate
    return 30; // Rough
}

/**
 * Generates a contextual German fishing tip based on conditions
 * @param {WeatherData} weather
 * @param {MoonData} moon
 * @param {SolunarData} solunar
 * @param {number} overallScore
 * @returns {string}
 */
function generateTip(weather, moon, solunar, overallScore) {
    const tips = [];

    // Pressure-based tips
    if (weather.pressureTrend < -2) {
        tips.push('Stark fallender Luftdruck - die Fische sind jetzt besonders aktiv!');
    } else if (weather.pressureTrend < -0.5) {
        tips.push('Fallender Luftdruck beguenstigt die Beissaktivitaet.');
    } else if (weather.pressureTrend > 2) {
        tips.push('Stark steigender Druck - die Fische sind eher traege. Versuche tiefere Stellen.');
    }

    // Moon phase tips
    if (moon.phaseIndex === 0 || moon.phaseIndex === 4) {
        tips.push(`${moon.name} - erfahrungsgemaess eine der besten Phasen zum Angeln.`);
    }

    // Solunar tips
    if (solunar.isInMajor) {
        tips.push('Du bist in einer Solunar-Hauptperiode - jetzt ist die beste Zeit!');
    } else if (solunar.isInMinor) {
        tips.push('Aktuelle Solunar-Nebenperiode - gute Chancen auf einen Biss.');
    } else if (solunar.isNearPeriod) {
        tips.push('Eine Solunar-Periode beginnt bald - mach dich bereit!');
    }

    // Weather-based tips
    if (weather.windSpeed > 30) {
        tips.push('Starker Wind - suche geschuetzte Uferbereiche.');
    } else if (weather.windSpeed > 15) {
        tips.push('Leichter bis maessiger Wind trueb das Wasser auf - gut fuer Raubfische.');
    }

    if (weather.cloudCover > 70) {
        tips.push('Bewoelkter Himmel - Fische sind weniger scheu und beissen besser.');
    }

    if (weather.precipitation > 0 && weather.precipitation < 5) {
        tips.push('Leichter Regen kann die Beissaktivitaet foerdern.');
    } else if (weather.precipitation >= 5) {
        tips.push('Starker Niederschlag - die Fische ziehen sich in tiefere Bereiche zurueck.');
    }

    if (weather.temperature < 5) {
        tips.push('Kaltes Wasser: Verwende kleine Koeder und fische langsam.');
    }

    // If no specific tips, give a general one
    if (tips.length === 0) {
        if (overallScore >= 75) {
            tips.push('Hervorragende Bedingungen - nutze die Gelegenheit!');
        } else if (overallScore >= 55) {
            tips.push('Gute Bedingungen. Probiere verschiedene Koeder aus.');
        } else if (overallScore >= 35) {
            tips.push('Maessige Bedingungen. Geduld ist heute gefragt.');
        } else {
            tips.push('Schwierige Bedingungen - aber auch an solchen Tagen kann man Glueck haben.');
        }
    }

    // Return the most relevant tip (first one)
    return tips[0];
}

/**
 * Calculates overall catch probability
 * @param {WeatherData} weather - Wetterdaten
 * @param {MoonData} moon - Monddaten
 * @param {SolunarData} solunar - Solunar-Daten
 * @param {FishSpecies} [fish] - Optionale Fischart fuer spezifische Anpassung
 * @param {Object} [marineData] - Optional marine data for coastal locations
 * @returns {CatchProbability} Fangprognose
 */
function calculateCatchProbability(weather, moon, solunar, fish, marineData) {
    // Determine if location is coastal
    const isCoastal = marineData && marineData.isCoastal;

    // Individual scores
    const moonScore = MOON_PHASES[moon.phaseIndex].score;
    const solScore = solunar.score;
    const pressScore = pressureScore(weather.pressureTrend);
    const timeScore = timeOfDayScore(weather);
    const cloudScore = cloudCoverScore(weather.cloudCover);

    // Check if new weight system is available
    const hasNewWeights = typeof CATCH_WEIGHTS_INLAND !== 'undefined';

    let overall;
    let breakdown;

    if (hasNewWeights) {
        // New system: dynamic weights based on location
        const scores = {
            moonPhase: moonScore,
            solunar: solScore,
            pressure: pressScore,
            timeOfDay: timeScore,
            cloudCover: cloudScore,
            uvIndex: uvIndexScore(weather.uvIndex),
            visibility: visibilityScore(weather.visibility)
        };

        // Coastal-specific scores
        if (isCoastal && marineData) {
            // Extract current wave height from hourly data
            let currentWaveHeight = null;
            if (marineData.hourly && marineData.hourly.wave_height) {
                const now = new Date();
                const currentHourStr = now.toISOString().slice(0, 13);
                const idx = marineData.hourly.time ? marineData.hourly.time.findIndex(t => t.startsWith(currentHourStr)) : -1;
                if (idx >= 0) {
                    currentWaveHeight = marineData.hourly.wave_height[idx];
                }
            }

            // Extract tides for current day
            let todayTides = [];
            if (marineData.tides && Array.isArray(marineData.tides)) {
                const today = new Date().toISOString().slice(0, 10);
                const todayTideData = marineData.tides.find(t => t.date === today);
                if (todayTideData && todayTideData.tides) {
                    todayTides = todayTideData.tides;
                }
            }

            scores.tides = tideTimingScore(todayTides, new Date());
            scores.waveHeight = waveHeightScore(currentWaveHeight);
        }

        // Dynamic weights based on location
        const weights = isCoastal ? CATCH_WEIGHTS_COASTAL : CATCH_WEIGHTS_INLAND;

        // Weighted average
        overall = 0;
        Object.keys(scores).forEach(factor => {
            if (weights[factor]) {
                overall += scores[factor] * weights[factor];
            }
        });

        breakdown = scores;
    } else {
        // Old system: backward compatibility
        overall =
            moonScore * CATCH_WEIGHTS.MOON_PHASE +
            solScore * CATCH_WEIGHTS.SOLUNAR_PERIOD +
            pressScore * CATCH_WEIGHTS.PRESSURE +
            timeScore * CATCH_WEIGHTS.TIME_OF_DAY +
            cloudScore * CATCH_WEIGHTS.CLOUD_COVER;

        breakdown = {
            moonPhase: moonScore,
            solunar: solScore,
            pressure: pressScore,
            timeOfDay: timeScore,
            cloudCover: cloudScore
        };
    }

    // Fish-specific adjustments
    if (fish && fish.weatherPrefs) {
        let fishMod = 0;
        let modCount = 0;

        // Temperature preference
        if (fish.weatherPrefs.temperature) {
            const prefs = fish.weatherPrefs.temperature;
            const temp = weather.temperature;
            if (temp >= prefs.min && temp <= prefs.max) {
                // Within range, bonus if near ideal
                const idealDiff = Math.abs(temp - prefs.ideal);
                fishMod += idealDiff < 3 ? 10 : 5;
            } else {
                // Outside preferred range
                fishMod -= 15;
            }
            modCount++;
        }

        // Pressure trend preference
        if (fish.weatherPrefs.pressure && fish.weatherPrefs.pressure.trend !== 'egal') {
            const prefTrend = fish.weatherPrefs.pressure.trend;
            const actualTrend = weather.pressureTrend;
            if (
                (prefTrend === 'fallend' && actualTrend < -0.5) ||
                (prefTrend === 'steigend' && actualTrend > 0.5) ||
                (prefTrend === 'stabil' && Math.abs(actualTrend) <= 0.5)
            ) {
                fishMod += 10;
            } else {
                fishMod -= 5;
            }
            modCount++;
        }

        // Wind preference
        if (fish.weatherPrefs.wind) {
            if (weather.windSpeed <= fish.weatherPrefs.wind.max) {
                fishMod += 5;
            } else {
                fishMod -= 10;
            }
            modCount++;
        }

        // Cloud cover preference
        if (fish.weatherPrefs.cloudCover) {
            const cc = weather.cloudCover;
            if (cc >= fish.weatherPrefs.cloudCover.min && cc <= fish.weatherPrefs.cloudCover.max) {
                fishMod += 5;
            }
            modCount++;
        }

        if (modCount > 0) {
            overall += fishMod / modCount * 0.15 * 100; // Scale modifier
        }
    }

    // Clamp to 0-100
    overall = Math.max(0, Math.min(100, Math.round(overall)));

    // Get rating from CATCH_RATINGS
    let rating = CATCH_RATINGS[CATCH_RATINGS.length - 1]; // default: Schlecht
    for (const r of CATCH_RATINGS) {
        if (overall >= r.min) {
            rating = r;
            break;
        }
    }

    // Generate contextual tip
    const tip = generateTip(weather, moon, solunar, overall);

    return {
        overall: overall,
        rating: rating.label,
        color: rating.color,
        colorClass: rating.colorClass,
        breakdown: breakdown,
        isCoastal: isCoastal,
        tip: tip
    };
}

/**
 * Calculates best fishing time for a day based on solunar periods, dawn/dusk, and tides
 * @param {SolunarData} daySolunar - Solunar periods for the day
 * @param {string} sunrise - Sunrise ISO string
 * @param {string} sunset - Sunset ISO string
 * @param {Array} [tides] - Optional tides array for coastal locations
 * @returns {Object} {start: "HH:MM", end: "HH:MM"}
 */
function calculateBestFishingTime(daySolunar, sunrise, sunset, tides) {
    // Score each hour 0-23
    const hourScores = new Array(24).fill(0);

    // Add points for solunar periods
    if (daySolunar && daySolunar.periods) {
        daySolunar.periods.forEach(period => {
            const [startH, startM] = period.start.split(':').map(Number);
            const [endH, endM] = period.end.split(':').map(Number);
            const startHour = startH + startM / 60;
            const endHour = endH + endM / 60;
            const points = period.type === 'major' ? 40 : 20;

            for (let h = 0; h < 24; h++) {
                // Check if hour overlaps with period
                if ((h >= Math.floor(startHour) && h <= Math.ceil(endHour)) ||
                    (endHour < startHour && (h >= Math.floor(startHour) || h <= Math.ceil(endHour)))) {
                    hourScores[h] += points;
                }
            }
        });
    }

    // Add points for dawn/dusk
    if (sunrise) {
        const sr = new Date(sunrise);
        const sunriseHour = sr.getHours();
        for (let h = sunriseHour - 1; h <= sunriseHour + 1; h++) {
            const hour = ((h % 24) + 24) % 24;
            hourScores[hour] += 25;
        }
    }

    if (sunset) {
        const ss = new Date(sunset);
        const sunsetHour = ss.getHours();
        for (let h = sunsetHour - 1; h <= sunsetHour + 1; h++) {
            const hour = ((h % 24) + 24) % 24;
            hourScores[hour] += 25;
        }
    }

    // Add points for tide changes (if coastal)
    if (tides && tides.length > 0) {
        tides.forEach(tide => {
            const tideTime = new Date(tide.time);
            const tideHour = tideTime.getHours();
            for (let h = tideHour - 1; h <= tideHour + 1; h++) {
                const hour = ((h % 24) + 24) % 24;
                hourScores[hour] += 15;
            }
        });
    }

    // Find contiguous block of 2+ hours with highest average score
    let bestStart = 0;
    let bestEnd = 1;
    let bestAvg = 0;

    for (let start = 0; start < 24; start++) {
        for (let len = 2; len <= 6 && start + len <= 24; len++) {
            const end = start + len - 1;
            let sum = 0;
            for (let h = start; h <= end; h++) {
                sum += hourScores[h];
            }
            const avg = sum / len;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestStart = start;
                bestEnd = end;
            }
        }
    }

    return {
        start: formatDecimalHour(bestStart),
        end: formatDecimalHour(bestEnd + 1)
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getMoonData, getMoonRiseSet, getSolunarPeriods, calculateCatchProbability, calculateBestFishingTime };
}
