/**
 * PETRI HEIL - Gemeinsame Hilfsfunktionen
 * Formatierung, Konvertierung, Debounce
 */

/**
 * Temperatur formatieren
 * @param {number} temp - Temperatur in °C
 * @returns {string} z.B. "14°C"
 */
function formatTemperature(temp) {
    if (!Number.isFinite(temp)) return '\u2013';
    return `${Math.round(temp)}°C`;
}

/**
 * Windgeschwindigkeit formatieren
 * @param {number} speed - Geschwindigkeit in km/h
 * @returns {string} z.B. "12 km/h"
 */
function formatWindSpeed(speed) {
    if (!Number.isFinite(speed)) return '\u2013';
    return `${Math.round(speed)} km/h`;
}

/**
 * Luftdruck formatieren
 * @param {number} pressure - Druck in hPa
 * @returns {string} z.B. "1013 hPa"
 */
function formatPressure(pressure) {
    if (!Number.isFinite(pressure)) return '\u2013';
    return `${Math.round(pressure)} hPa`;
}

/**
 * Windrichtung in Grad zu deutschem Himmelsrichtungs-Kuerzel
 * @param {number} degrees - Grad (0-360)
 * @returns {string} z.B. "NO", "SW"
 */
function degToCompass(degrees) {
    if (!Number.isFinite(degrees)) return '\u2013';
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

/**
 * Windrichtung formatiert mit Pfeil und Kuerzel
 * @param {number} degrees - Grad (0-360)
 * @returns {string} z.B. "↗ NO"
 */
function formatWindDirection(degrees) {
    if (!Number.isFinite(degrees)) return '\u2013';
    const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(degrees / 45) % 8;
    return `${arrows[index]} ${degToCompass(degrees)}`;
}

/**
 * Datum formatieren (deutsch)
 * @param {Date|string} date - Datum
 * @returns {string} z.B. "Mo, 15. Jan 2025"
 */
function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('de-AT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Uhrzeit formatieren
 * @param {Date|string} date - Datum/Zeit
 * @returns {string} z.B. "14:30"
 */
function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('de-AT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Kurzes Datum (nur Tag + Wochentag)
 * @param {Date|string} date
 * @returns {string} z.B. "Mo 15."
 */
function formatShortDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('de-AT', {
        weekday: 'short',
        day: 'numeric'
    });
}

/**
 * Debounce-Funktion
 * @param {Function} fn - Zu debouncende Funktion
 * @param {number} delay - Verzoegerung in ms
 * @returns {Function}
 */
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Wetter-Code zu deutschem Text und Icon
 * @param {number} code - WMO Wetter-Code
 * @returns {{text: string, icon: string}}
 */
function weatherCodeToText(code) {
    return WEATHER_CODES[code] || { text: 'Unbekannt', icon: '❓' };
}

/**
 * Niederschlag formatieren
 * @param {number} mm - Niederschlag in mm
 * @returns {string} z.B. "2.5 mm"
 */
function formatPrecipitation(mm) {
    if (!Number.isFinite(mm)) return '0 mm';
    if (mm === 0) return '0 mm';
    return `${mm.toFixed(1)} mm`;
}

/**
 * Prozentwert formatieren
 * @param {number} value - Wert 0-100
 * @returns {string} z.B. "72%"
 */
function formatPercent(value) {
    if (!Number.isFinite(value)) return '\u2013';
    return `${Math.round(value)}%`;
}

/**
 * Luftdruck-Trend in deutschem Text
 * @param {number} trend - hPa Aenderung (letzte 3h)
 * @returns {{text: string, icon: string}}
 */
function pressureTrendText(trend) {
    if (trend < -2) return { text: 'stark fallend', icon: '⬇️' };
    if (trend < -0.5) return { text: 'fallend', icon: '↘️' };
    if (trend > 2) return { text: 'stark steigend', icon: '⬆️' };
    if (trend > 0.5) return { text: 'steigend', icon: '↗️' };
    return { text: 'stabil', icon: '➡️' };
}

/**
 * CSS-Klasse fuer Fangbewertung ermitteln
 * @param {number} score - Fangwahrscheinlichkeit 0-100
 * @returns {{label: string, color: string, colorClass: string}}
 */
function getCatchRating(score) {
    for (const rating of CATCH_RATINGS) {
        if (score >= rating.min) return rating;
    }
    return CATCH_RATINGS[CATCH_RATINGS.length - 1];
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatTemperature, formatWindSpeed, formatPressure,
        degToCompass, formatWindDirection, formatDate, formatTime,
        formatShortDate, debounce, weatherCodeToText, formatPrecipitation,
        formatPercent, pressureTrendText, getCatchRating
    };
}
