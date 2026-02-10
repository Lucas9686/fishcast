/**
 * PETRI HEIL - Weather & Geocoding API
 * Open-Meteo API calls (kostenlos, kein API-Key)
 */

/**
 * Fetch with exponential backoff retry
 * @param {string} url - URL to fetch
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, maxRetries) {
    if (maxRetries === undefined) maxRetries = 3;
    const delays = [1000, 2000, 4000];
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.status >= 500) {
                throw new Error('Server error: ' + response.status);
            }
            return response;
        } catch (err) {
            lastError = err;
            // Only retry on network errors (TypeError) or server errors (thrown above)
            if (err instanceof TypeError || (err.message && err.message.startsWith('Server error'))) {
                if (attempt < maxRetries) {
                    await new Promise(function (resolve) { setTimeout(resolve, delays[attempt]); });
                    continue;
                }
            }
            throw err;
        }
    }
    throw lastError;
}

/**
 * Fetches weather data from Open-Meteo API
 * @param {LocationData} location - Standort mit lat, lon
 * @returns {Promise<WeatherData>} Wetterdaten
 */
async function fetchWeatherData(location) {
    const params = new URLSearchParams({
        latitude: location.lat,
        longitude: location.lon,
        ...CONFIG.WEATHER_PARAMS
    });

    const url = `${CONFIG.API.WEATHER}?${params}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
        throw new Error(`Wetter-API Fehler: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Find current hour index in hourly data
    const now = new Date();
    const currentHourStr = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
    let currentIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourStr));
    if (currentIndex === -1) {
        // Fallback: find nearest hour
        const nowMs = now.getTime();
        let minDiff = Infinity;
        data.hourly.time.forEach((t, i) => {
            const diff = Math.abs(new Date(t).getTime() - nowMs);
            if (diff < minDiff) {
                minDiff = diff;
                currentIndex = i;
            }
        });
    }

    // Calculate pressure trend (current vs 3 hours ago)
    const pressureNow = data.hourly.pressure_msl[currentIndex] || data.current.pressure_msl;
    const pressure3hAgo = data.hourly.pressure_msl[Math.max(0, currentIndex - 3)] || pressureNow;
    const pressureTrend = pressureNow - pressure3hAgo;

    // Extract 48h pressure history
    const pressureHistory = data.hourly.time.map((time, i) => ({
        time: time,
        value: data.hourly.pressure_msl[i]
    }));

    // Parse hourly forecasts (next 48 hours from current index)
    const hourly = [];
    const hourlyCount = Math.min(48, data.hourly.time.length - currentIndex);
    for (let i = 0; i < hourlyCount; i++) {
        const idx = currentIndex + i;
        hourly.push({
            time: data.hourly.time[idx],
            temperature: data.hourly.temperature_2m[idx],
            precipitation: data.hourly.precipitation[idx],
            precipitationProbability: data.hourly.precipitation_probability[idx],
            cloudCover: data.hourly.cloud_cover[idx],
            windSpeed: data.hourly.wind_speed_10m[idx],
            windDirection: data.hourly.wind_direction_10m[idx],
            windGusts: data.hourly.wind_gusts_10m[idx],
            pressure: data.hourly.pressure_msl[idx],
            uvIndex: data.hourly.uv_index[idx],
            visibility: data.hourly.visibility[idx],
            weatherCode: data.hourly.weather_code[idx]
        });
    }

    // Parse daily forecasts
    const daily = data.daily.time.map((date, i) => ({
        date: date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        precipitationSum: data.daily.precipitation_sum[i],
        windSpeedMax: data.daily.wind_speed_10m_max[i],
        windGustsMax: data.daily.wind_gusts_10m_max[i],
        uvIndexMax: data.daily.uv_index_max[i],
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
        weatherCode: data.daily.weather_code[i]
    }));

    return {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m || data.hourly.wind_gusts_10m[currentIndex],
        pressure: data.current.pressure_msl,
        pressureTrend: Math.round(pressureTrend * 10) / 10,
        cloudCover: data.current.cloud_cover,
        precipitation: data.current.precipitation,
        weatherCode: data.current.weather_code,
        uvIndex: data.hourly.uv_index[currentIndex],
        visibility: data.hourly.visibility[currentIndex],
        sunrise: daily[0] ? daily[0].sunrise : '',
        sunset: daily[0] ? daily[0].sunset : '',
        pressureHistory: pressureHistory,
        hourly: hourly,
        daily: daily
    };
}

/**
 * Searches for locations using Open-Meteo Geocoding API
 * @param {string} query - Suchbegriff (z.B. "Salzburg")
 * @returns {Promise<LocationData[]>} Gefundene Orte
 */
async function searchLocation(query) {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const params = new URLSearchParams({
        name: query.trim(),
        language: CONFIG.GEOCODING_PARAMS.language,
        count: CONFIG.GEOCODING_PARAMS.count
    });

    const url = `${CONFIG.API.GEOCODING}?${params}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
        throw new Error(`Geocoding-API Fehler: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return [];
    }

    return data.results.map(r => ({
        lat: r.latitude,
        lon: r.longitude,
        name: buildLocationName(r),
        timezone: r.timezone || 'Europe/Vienna'
    }));
}

/**
 * Builds a readable location name from geocoding result
 * @param {Object} result - Open-Meteo Geocoding result
 * @returns {string} z.B. "Salzburg, Oesterreich"
 */
function buildLocationName(result) {
    const parts = [result.name];
    if (result.admin1 && result.admin1 !== result.name) {
        parts.push(result.admin1);
    }
    if (result.country) {
        parts.push(result.country);
    }
    return parts.join(', ');
}

/**
 * Fetches marine data from Open-Meteo Marine API
 * @param {LocationData} location - Standort mit lat, lon
 * @returns {Promise<Object>} Marine data with isCoastal flag
 */
async function fetchMarineData(location) {
    try {
        const params = new URLSearchParams({
            latitude: location.lat,
            longitude: location.lon,
            hourly: CONFIG.MARINE_PARAMS.hourly,
            daily: CONFIG.MARINE_PARAMS.daily,
            forecast_days: CONFIG.MARINE_PARAMS.forecast_days
        });

        const url = `${CONFIG.API.MARINE}?${params}`;
        const response = await fetchWithRetry(url, 2);

        if (!response.ok) {
            return { isCoastal: false };
        }

        const data = await response.json();

        // Check if location has valid marine data
        const hasWaveData = data.hourly && data.hourly.wave_height &&
                           data.hourly.wave_height.some(h => h !== null && h !== undefined);

        if (!hasWaveData) {
            return { isCoastal: false };
        }

        // Parse daily marine conditions
        const daily = data.daily.time.map((date, i) => ({
            date: date,
            waveHeightMax: data.daily.wave_height_max[i],
            waveDirectionDominant: data.daily.wave_direction_dominant[i]
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

/**
 * Gets current location via browser Geolocation API, then reverse geocodes
 * @returns {Promise<LocationData>} Aktueller Standort
 */
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation wird von diesem Browser nicht unterstuetzt.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = Math.round(position.coords.latitude * 10000) / 10000;
                const lon = Math.round(position.coords.longitude * 10000) / 10000;

                try {
                    // Reverse geocode using Open-Meteo search with coordinates
                    // Open-Meteo doesn't have a direct reverse geocode endpoint,
                    // so we use a small search around the coordinates
                    const params = new URLSearchParams({
                        name: `${lat},${lon}`,
                        language: CONFIG.GEOCODING_PARAMS.language,
                        count: 1
                    });

                    let name = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

                    try {
                        // Attempt reverse geocode with nominatim-style approach
                        const reverseUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=de`;
                        const resp = await fetch(reverseUrl);
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data.results && data.results.length > 0) {
                                name = buildLocationName(data.results[0]);
                            }
                        }
                    } catch (e) {
                        // Fallback: just use coordinates as name
                    }

                    resolve({
                        lat: lat,
                        lon: lon,
                        name: name,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Vienna'
                    });
                } catch (err) {
                    // Still return location even if reverse geocoding fails
                    resolve({
                        lat: lat,
                        lon: lon,
                        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Vienna'
                    });
                }
            },
            (error) => {
                const messages = {
                    1: 'Standortzugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.',
                    2: 'Standort nicht verfuegbar.',
                    3: 'Zeitueberschreitung bei der Standortermittlung.'
                };
                reject(new Error(messages[error.code] || 'Standort konnte nicht ermittelt werden.'));
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchWeatherData, searchLocation, getCurrentLocation, fetchMarineData };
}
