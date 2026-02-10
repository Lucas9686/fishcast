/**
 * PETRI HEIL - Marine Data Processing
 * Tide extraction and marine data parsing
 */

/**
 * Extracts tide times from hourly sea level or wave height data
 * Uses peak detection to identify high and low tides
 * @param {Object} hourlyData - Hourly marine data with time and height arrays
 * @returns {Array<Object>} Array of {date, tides: [{time, height, type}]}
 */
function extractTideTimes(hourlyData) {
    if (!hourlyData || !hourlyData.time) {
        return [];
    }

    const tides = [];

    // Try to use wave_height as proxy for tidal patterns
    // (Note: Open-Meteo Marine may not provide direct sea level height)
    const heights = hourlyData.wave_height || [];
    const times = hourlyData.time || [];

    if (heights.length === 0 || times.length === 0) {
        return [];
    }

    // Group by day for per-day tide extraction
    const dayGroups = {};

    times.forEach((time, i) => {
        const date = time.slice(0, 10); // "YYYY-MM-DD"
        if (!dayGroups[date]) {
            dayGroups[date] = [];
        }
        dayGroups[date].push({ time, height: heights[i], index: i });
    });

    // Find high/low tides per day using simple peak detection
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
                    height: Math.round(curr * 100) / 100,
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

/**
 * Parses marine daily data into per-day summaries
 * @param {Object} marineData - Raw Marine API response
 * @returns {Array<Object>} Array of {date, waveHeightMax, wavePeriodAvg, waveDirectionDominant}
 */
function parseMarineDaily(marineData) {
    if (!marineData || !marineData.daily) {
        return [];
    }

    const daily = marineData.daily;

    if (!daily.time || !Array.isArray(daily.time)) {
        return [];
    }

    return daily.time.map((date, i) => {
        // Calculate average wave period from hourly data for this day
        let wavePeriodAvg = null;
        if (marineData.hourly && marineData.hourly.wave_period && marineData.hourly.time) {
            const dayStart = date + 'T00:00';
            const dayEnd = date + 'T23:59';
            const dayPeriods = marineData.hourly.wave_period.filter((_, idx) => {
                const t = marineData.hourly.time[idx];
                return t >= dayStart && t <= dayEnd;
            }).filter(p => p !== null);

            if (dayPeriods.length > 0) {
                const sum = dayPeriods.reduce((a, b) => a + b, 0);
                wavePeriodAvg = Math.round((sum / dayPeriods.length) * 10) / 10;
            }
        }

        return {
            date: date,
            waveHeightMax: daily.wave_height_max ? daily.wave_height_max[i] : null,
            wavePeriodAvg: wavePeriodAvg,
            waveDirectionDominant: daily.wave_direction_dominant ? daily.wave_direction_dominant[i] : null
        };
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractTideTimes, parseMarineDaily };
}
