/**
 * PETRI HEIL - Angel-Wetter & Fangprognose App
 * Gemeinsame Konfiguration und Typdefinitionen
 *
 * DIESE DATEI IST DER VERTRAG ZWISCHEN ALLEN TEAMS.
 * Aenderungen nur durch den Team-Lead!
 */

// ============================================================
// API-Endpunkte
// ============================================================
const CONFIG = {
    APP_NAME: 'Petri Heil',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Angel-Wetter & Fangprognose',

    // Open-Meteo APIs (kostenlos, kein Key noetig)
    API: {
        WEATHER: 'https://api.open-meteo.com/v1/forecast',
        GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
        MARINE: 'https://marine-api.open-meteo.com/v1/marine'
    },

    // Wetter-API Parameter
    WEATHER_PARAMS: {
        hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation_probability',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'pressure_msl',
            'visibility',
            'uv_index'
        ].join(','),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'sunrise',
            'sunset',
            'precipitation_sum',
            'wind_speed_10m_max',
            'wind_gusts_10m_max',
            'uv_index_max'
        ].join(','),
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
            'pressure_msl'
        ].join(','),
        timezone: 'auto',
        forecast_days: 7,
        past_days: 1
    },

    // Geocoding Parameter
    GEOCODING_PARAMS: {
        language: 'de',
        count: 8
    },

    // Marine-API Parameter
    MARINE_PARAMS: {
        hourly: [
            'wave_height',
            'wave_direction',
            'wave_period',
            'swell_wave_height',
            'ocean_current_velocity'
        ].join(','),
        daily: 'wave_height_max,wave_direction_dominant',
        forecast_days: 7
    },

    // Leaflet Karte
    MAP: {
        TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        DEFAULT_CENTER: [47.8095, 13.0550], // Salzburg
        DEFAULT_ZOOM: 8,
        MIN_ZOOM: 4,
        MAX_ZOOM: 18
    },

    // IndexedDB
    DB: {
        NAME: 'petri-heil-db',
        VERSION: 2,
        STORES: {
            FAVORITES: 'favorites',    // Favorisierte Fischarten
            HISTORY: 'history',        // Standort-Verlauf
            SETTINGS: 'settings'       // Benutzer-Einstellungen
        }
    },

    // HTML Section IDs
    SECTIONS: {
        WEATHER: 'section-weather',
        FISH: 'section-fish',
        FORECAST: 'section-forecast',
        FAVORITES: 'section-favorites'
    },

    // Tab IDs
    TABS: {
        WEATHER: 'tab-weather',
        FISH: 'tab-fish',
        FORECAST: 'tab-forecast',
        FAVORITES: 'tab-favorites'
    },

    // Auto-Refresh Intervall (ms)
    REFRESH_INTERVAL: 30 * 60 * 1000, // 30 Minuten

    // Cache-Name fuer Service Worker
    // HINWEIS: Cache-Version auch in sw.js aktualisieren (CACHE_VERSION)
    CACHE_NAME: 'petri-heil-v1',
    API_CACHE_NAME: 'petri-heil-api-v1'
};

// ============================================================
// Solunar-Gewichtungen fuer Fangprognose
// ============================================================
const CATCH_WEIGHTS = {
    MOON_PHASE: 0.25,      // 25% Mondphase
    SOLUNAR_PERIOD: 0.30,  // 30% Solunar-Periode
    PRESSURE: 0.20,        // 20% Luftdruck
    TIME_OF_DAY: 0.15,     // 15% Tageszeit
    CLOUD_COVER: 0.10      // 10% Bewoelkung
};

// Inland-Gewichtungen (7 Faktoren)
const CATCH_WEIGHTS_INLAND = {
    moonPhase: 0.20,
    solunar: 0.25,
    pressure: 0.18,
    timeOfDay: 0.12,
    cloudCover: 0.10,
    uvIndex: 0.08,
    visibility: 0.07
};

// Coastal-Gewichtungen (9 Faktoren)
const CATCH_WEIGHTS_COASTAL = {
    moonPhase: 0.18,
    solunar: 0.22,
    pressure: 0.16,
    timeOfDay: 0.10,
    cloudCover: 0.09,
    uvIndex: 0.07,
    visibility: 0.06,
    tides: 0.08,
    waveHeight: 0.04
};

// ============================================================
// Mondphasen (8 Phasen, Index 0-7)
// ============================================================
const MOON_PHASES = [
    { name: 'Neumond',              emoji: '🌑', score: 100 },
    { name: 'Zunehmende Sichel',    emoji: '🌒', score: 60 },
    { name: 'Erstes Viertel',       emoji: '🌓', score: 40 },
    { name: 'Zunehmender Mond',     emoji: '🌔', score: 65 },
    { name: 'Vollmond',             emoji: '🌕', score: 100 },
    { name: 'Abnehmender Mond',     emoji: '🌖', score: 70 },
    { name: 'Letztes Viertel',      emoji: '🌗', score: 40 },
    { name: 'Abnehmende Sichel',    emoji: '🌘', score: 65 }
];

// ============================================================
// Wetter-Codes (WMO) auf Deutsch
// ============================================================
const WEATHER_CODES = {
    0: { text: 'Klar', icon: '☀️' },
    1: { text: 'Ueberwiegend klar', icon: '🌤️' },
    2: { text: 'Teilweise bewoelkt', icon: '⛅' },
    3: { text: 'Bedeckt', icon: '☁️' },
    45: { text: 'Nebel', icon: '🌫️' },
    48: { text: 'Reifnebel', icon: '🌫️' },
    51: { text: 'Leichter Nieselregen', icon: '🌦️' },
    53: { text: 'Nieselregen', icon: '🌦️' },
    55: { text: 'Starker Nieselregen', icon: '🌧️' },
    61: { text: 'Leichter Regen', icon: '🌦️' },
    63: { text: 'Regen', icon: '🌧️' },
    65: { text: 'Starker Regen', icon: '🌧️' },
    66: { text: 'Gefrierender Regen', icon: '🌧️' },
    67: { text: 'Starker gefrierender Regen', icon: '🌧️' },
    71: { text: 'Leichter Schneefall', icon: '🌨️' },
    73: { text: 'Schneefall', icon: '🌨️' },
    75: { text: 'Starker Schneefall', icon: '🌨️' },
    77: { text: 'Schneegriesel', icon: '🌨️' },
    80: { text: 'Leichte Regenschauer', icon: '🌦️' },
    81: { text: 'Regenschauer', icon: '🌧️' },
    82: { text: 'Starke Regenschauer', icon: '🌧️' },
    85: { text: 'Leichte Schneeschauer', icon: '🌨️' },
    86: { text: 'Starke Schneeschauer', icon: '🌨️' },
    95: { text: 'Gewitter', icon: '⛈️' },
    96: { text: 'Gewitter mit Hagel', icon: '⛈️' },
    99: { text: 'Gewitter mit starkem Hagel', icon: '⛈️' }
};

// ============================================================
// Fangwahrscheinlichkeits-Bewertungen
// ============================================================
const CATCH_RATINGS = [
    { min: 75, label: 'Ausgezeichnet', color: '#22c55e', colorClass: 'rating-excellent' },
    { min: 55, label: 'Gut',           color: '#3b82f6', colorClass: 'rating-good' },
    { min: 35, label: 'Maessig',       color: '#f59e0b', colorClass: 'rating-moderate' },
    { min: 0,  label: 'Schlecht',      color: '#ef4444', colorClass: 'rating-poor' }
];

// ============================================================
// JSDoc Typdefinitionen
// ============================================================

/**
 * @typedef {Object} LocationData
 * @property {number} lat - Breitengrad
 * @property {number} lon - Laengengrad
 * @property {string} name - Ortsname (z.B. "Salzburg, Oesterreich")
 * @property {string} timezone - Zeitzone (z.B. "Europe/Vienna")
 */

/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Aktuelle Temperatur in °C
 * @property {number} humidity - Relative Luftfeuchtigkeit in %
 * @property {number} windSpeed - Windgeschwindigkeit in km/h
 * @property {number} windDirection - Windrichtung in Grad (0-360)
 * @property {number} pressure - Luftdruck in hPa
 * @property {number} pressureTrend - Druckveraenderung letzte 3h in hPa (negativ = fallend)
 * @property {number} cloudCover - Bewoelkung in % (0-100)
 * @property {number} precipitation - Niederschlag in mm
 * @property {number} weatherCode - WMO Wetter-Code
 * @property {string} sunrise - Sonnenaufgang ISO String
 * @property {string} sunset - Sonnenuntergang ISO String
 * @property {Array<HourlyForecast>} hourly - Stundenprognose (48h)
 * @property {Array<DailyForecast>} daily - Tagesprognose (7 Tage)
 */

/**
 * @typedef {Object} HourlyForecast
 * @property {string} time - ISO Zeitstring
 * @property {number} temperature - Temperatur °C
 * @property {number} precipitation - Niederschlag mm
 * @property {number} precipitationProbability - Regenwahrscheinlichkeit %
 * @property {number} cloudCover - Bewoelkung %
 * @property {number} windSpeed - Wind km/h
 * @property {number} windDirection - Windrichtung Grad
 * @property {number} pressure - Luftdruck hPa
 * @property {number} weatherCode - WMO Code
 */

/**
 * @typedef {Object} DailyForecast
 * @property {string} date - ISO Datum
 * @property {number} tempMax - Hoechsttemperatur °C
 * @property {number} tempMin - Tiefsttemperatur °C
 * @property {number} precipitationSum - Niederschlagssumme mm
 * @property {number} windSpeedMax - Max. Windgeschwindigkeit km/h
 * @property {string} sunrise - Sonnenaufgang ISO
 * @property {string} sunset - Sonnenuntergang ISO
 * @property {number} weatherCode - WMO Code
 */

/**
 * @typedef {Object} MoonData
 * @property {number} phaseIndex - Index 0-7 (siehe MOON_PHASES)
 * @property {string} name - Deutscher Phasenname
 * @property {string} emoji - Mond-Emoji
 * @property {number} illumination - Beleuchtung 0-100%
 * @property {number} age - Mondalter in Tagen (0-29.53)
 * @property {number} score - Fang-Score 0-100
 */

/**
 * @typedef {Object} SolunarPeriod
 * @property {string} start - Startzeit HH:MM
 * @property {string} end - Endzeit HH:MM
 * @property {string} type - "major" oder "minor"
 */

/**
 * @typedef {Object} SolunarData
 * @property {Array<SolunarPeriod>} periods - Alle Solunar-Perioden des Tages
 * @property {boolean} isInMajor - Aktuell in Major-Periode?
 * @property {boolean} isInMinor - Aktuell in Minor-Periode?
 * @property {boolean} isNearPeriod - Innerhalb 30min einer Periode?
 * @property {number} score - Solunar-Score 0-100
 */

/**
 * @typedef {Object} CatchProbability
 * @property {number} overall - Gesamtwahrscheinlichkeit 0-100
 * @property {string} rating - Bewertungstext ("Ausgezeichnet", "Gut", etc.)
 * @property {string} color - Hex-Farbcode
 * @property {string} colorClass - CSS-Klasse
 * @property {Object} breakdown - Einzelne Faktor-Scores
 * @property {number} breakdown.moonPhase - Mondphasen-Score
 * @property {number} breakdown.solunar - Solunar-Score
 * @property {number} breakdown.pressure - Luftdruck-Score
 * @property {number} breakdown.timeOfDay - Tageszeit-Score
 * @property {number} breakdown.cloudCover - Bewoelkungs-Score
 * @property {string} tip - Kontext-abhaengiger Angel-Tipp
 */

/**
 * @typedef {Object} FishSpecies
 * @property {string} id - Eindeutige ID (kebab-case, z.B. "hecht")
 * @property {string} name - Deutscher Name
 * @property {string} scientificName - Wissenschaftlicher Name
 * @property {string} image - Bildpfad relativ zu App-Root (z.B. "images/fish/hecht.jpg")
 * @property {string} imageCredit - Bildnachweis / Lizenz
 * @property {string} family - Fischfamilie
 * @property {string} description - Kurzbeschreibung (2-3 Saetze)
 * @property {Object} size - Groessenangaben
 * @property {number} size.avgCm - Durchschnittliche Laenge in cm
 * @property {number} size.maxCm - Maximale Laenge in cm
 * @property {number} size.avgKg - Durchschnittsgewicht in kg
 * @property {number} size.maxKg - Maximalgewicht in kg
 * @property {string} habitat - Lebensraum-Beschreibung
 * @property {Array<string>} waterTypes - Gewaessertypen: "fluss", "see", "bach", "teich"
 * @property {Array<string>} techniques - Angeltechniken
 * @property {Array<string>} baits - Empfohlene Koeder
 * @property {Array<string>} tips - 3-5 Angeltipps auf Deutsch
 * @property {Object} weatherPrefs - Ideale Wetterbedingungen
 * @property {Object} weatherPrefs.temperature - {min: number, max: number, ideal: number}
 * @property {Object} weatherPrefs.pressure - {trend: "fallend"|"stabil"|"steigend"|"egal"}
 * @property {Object} weatherPrefs.wind - {max: number} in km/h
 * @property {Object} weatherPrefs.cloudCover - {min: number, max: number} in %
 * @property {Object} season - Beste Angelsaison
 * @property {Array<number>} season.bestMonths - Beste Monate (1-12)
 * @property {string} season.description - Saisonbeschreibung
 * @property {Object|null} closedSeason - Schonzeit (null wenn keine)
 * @property {string} closedSeason.period - Zeitraum z.B. "01.02. - 31.03."
 * @property {string} closedSeason.note - Hinweis (z.B. "In Oesterreich variiert nach Bundesland")
 * @property {number} difficulty - Schwierigkeit 1-5 (1=leicht, 5=sehr schwer)
 * @property {boolean} catchAndRelease - Empfehlung fuer Catch & Release
 * @property {string} minSize - Mindestmass z.B. "50 cm" oder "kein"
 * @property {string} category - "raubfisch", "friedfisch", "salmonide"
 */

// ============================================================
// Funktions-Signaturen (Team-Vertrag)
// ============================================================

/**
 * TEAM 2 - api.js:
 *
 * async function fetchWeatherData(location: LocationData): Promise<WeatherData>
 * async function searchLocation(query: string): Promise<LocationData[]>
 * async function getCurrentLocation(): Promise<LocationData>
 */

/**
 * TEAM 2 - solunar.js:
 *
 * function getMoonData(date: Date): MoonData
 * function getSolunarPeriods(date: Date, lat: number, lon: number): SolunarData
 * function calculateCatchProbability(weather: WeatherData, moon: MoonData, solunar: SolunarData, fish?: FishSpecies): CatchProbability
 */

/**
 * TEAM 2 - storage.js:
 *
 * async function initDB(): Promise<IDBDatabase>
 * async function addFavorite(fishId: string): Promise<void>
 * async function removeFavorite(fishId: string): Promise<void>
 * async function getFavorites(): Promise<string[]>
 * async function isFavorite(fishId: string): Promise<boolean>
 * async function addToHistory(location: LocationData): Promise<void>
 * async function getHistory(limit?: number): Promise<LocationData[]>
 * async function saveSetting(key: string, value: any): Promise<void>
 * async function getSetting(key: string): Promise<any>
 */

/**
 * TEAM 1 - map.js:
 *
 * function initMap(containerId: string, onLocationSelect: (loc: LocationData) => void): void
 * function setMapLocation(lat: number, lon: number): void
 * function addMarker(lat: number, lon: number, label?: string): void
 */

/**
 * TEAM 1 - fish-ui.js:
 *
 * function renderFishList(container: HTMLElement, fishData: FishSpecies[], onSelect: (fish: FishSpecies) => void): void
 * function renderFishDetail(container: HTMLElement, fish: FishSpecies, catchProb?: CatchProbability, isFav?: boolean, onFavToggle?: () => void): void
 * function renderFishSearch(container: HTMLElement, fishData: FishSpecies[], onFilter: (filtered: FishSpecies[]) => void): void
 */

// Export fuer Nutzung in anderen Modulen
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CATCH_WEIGHTS, CATCH_WEIGHTS_INLAND, CATCH_WEIGHTS_COASTAL, MOON_PHASES, WEATHER_CODES, CATCH_RATINGS };
}
