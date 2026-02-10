/**
 * PETRI HEIL - IndexedDB Storage
 * Persistente Speicherung: Favoriten, Verlauf, Einstellungen
 */

/** @type {IDBDatabase|null} */
let _db = null;

/**
 * Opens or creates the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
async function initDB() {
    if (_db) return _db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CONFIG.DB.NAME, CONFIG.DB.VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Favorites store: fishId as key
            if (!db.objectStoreNames.contains(CONFIG.DB.STORES.FAVORITES)) {
                db.createObjectStore(CONFIG.DB.STORES.FAVORITES, { keyPath: 'fishId' });
            }

            // History store: timestamp as key, index on name
            if (!db.objectStoreNames.contains(CONFIG.DB.STORES.HISTORY)) {
                const historyStore = db.createObjectStore(CONFIG.DB.STORES.HISTORY, { keyPath: 'timestamp' });
                historyStore.createIndex('name', 'name', { unique: false });
            }

            // Settings store: key as key
            if (!db.objectStoreNames.contains(CONFIG.DB.STORES.SETTINGS)) {
                db.createObjectStore(CONFIG.DB.STORES.SETTINGS, { keyPath: 'key' });
            }

            // Weather cache store (offline mode)
            if (!db.objectStoreNames.contains('weatherCache')) {
                db.createObjectStore('weatherCache', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            _db = event.target.result;
            resolve(_db);
        };

        request.onerror = (event) => {
            reject(new Error(`IndexedDB Fehler: ${event.target.error}`));
        };
    });
}

/**
 * Gets the database instance, initializing if needed
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
    if (!_db) {
        return initDB();
    }
    return _db;
}

// ============================================================
// Favoriten
// ============================================================

/**
 * Adds a fish to favorites
 * @param {string} fishId - Fisch-ID (z.B. "hecht")
 * @returns {Promise<void>}
 */
async function addFavorite(fishId) {
    if (typeof fishId !== 'string' || fishId.length === 0) {
        throw new Error('fishId muss ein nicht-leerer String sein');
    }
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.FAVORITES, 'readwrite');
        const store = tx.objectStore(CONFIG.DB.STORES.FAVORITES);
        store.put({ fishId: fishId, addedAt: Date.now() });

        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject(new Error(`Favorit hinzufuegen fehlgeschlagen: ${event.target.error}`));
    });
}

/**
 * Removes a fish from favorites
 * @param {string} fishId - Fisch-ID
 * @returns {Promise<void>}
 */
async function removeFavorite(fishId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.FAVORITES, 'readwrite');
        const store = tx.objectStore(CONFIG.DB.STORES.FAVORITES);
        store.delete(fishId);

        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject(new Error(`Favorit entfernen fehlgeschlagen: ${event.target.error}`));
    });
}

/**
 * Gets all favorite fish IDs
 * @returns {Promise<string[]>} Array von Fisch-IDs
 */
async function getFavorites() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.FAVORITES, 'readonly');
        const store = tx.objectStore(CONFIG.DB.STORES.FAVORITES);
        const request = store.getAll();

        request.onsuccess = () => {
            const results = request.result || [];
            resolve(results.map(r => r.fishId));
        };
        request.onerror = (event) => reject(new Error(`Favoriten laden fehlgeschlagen: ${event.target.error}`));
    });
}

/**
 * Checks if a fish is in favorites
 * @param {string} fishId - Fisch-ID
 * @returns {Promise<boolean>}
 */
async function isFavorite(fishId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.FAVORITES, 'readonly');
        const store = tx.objectStore(CONFIG.DB.STORES.FAVORITES);
        const request = store.get(fishId);

        request.onsuccess = () => resolve(!!request.result);
        request.onerror = (event) => reject(new Error(`Favorit pruefen fehlgeschlagen: ${event.target.error}`));
    });
}

// ============================================================
// Standort-Verlauf
// ============================================================

/**
 * Adds a location to history
 * @param {LocationData} location - Standortdaten
 * @returns {Promise<void>}
 */
async function addToHistory(location) {
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon) ||
        location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180) {
        throw new Error('Ungueltige Koordinaten: lat muss -90..90, lon muss -180..180 sein');
    }
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.HISTORY, 'readwrite');
        const store = tx.objectStore(CONFIG.DB.STORES.HISTORY);
        store.put({
            timestamp: Date.now(),
            lat: location.lat,
            lon: location.lon,
            name: location.name,
            timezone: location.timezone
        });

        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject(new Error(`Verlauf speichern fehlgeschlagen: ${event.target.error}`));
    });
}

/**
 * Gets recent locations from history, newest first
 * @param {number} [limit=10] - Max. Anzahl Eintraege
 * @returns {Promise<LocationData[]>}
 */
async function getHistory(limit) {
    if (limit === undefined) limit = 10;
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.HISTORY, 'readonly');
        const store = tx.objectStore(CONFIG.DB.STORES.HISTORY);
        const request = store.getAll();

        request.onsuccess = () => {
            const results = request.result || [];
            // Sort by timestamp descending (newest first)
            results.sort((a, b) => b.timestamp - a.timestamp);
            // Limit and map to LocationData
            const locations = results.slice(0, limit).map(r => ({
                lat: r.lat,
                lon: r.lon,
                name: r.name,
                timezone: r.timezone
            }));
            resolve(locations);
        };
        request.onerror = (event) => reject(new Error(`Verlauf laden fehlgeschlagen: ${event.target.error}`));
    });
}

// ============================================================
// Einstellungen
// ============================================================

/**
 * Saves a setting
 * @param {string} key - Schluessel
 * @param {*} value - Wert (beliebiger Typ)
 * @returns {Promise<void>}
 */
async function saveSetting(key, value) {
    if (typeof key !== 'string' || key.length === 0) {
        throw new Error('key muss ein nicht-leerer String sein');
    }
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(CONFIG.DB.STORES.SETTINGS);
        store.put({ key: key, value: value });

        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject(new Error(`Einstellung speichern fehlgeschlagen: ${event.target.error}`));
    });
}

/**
 * Gets a setting value
 * @param {string} key - Schluessel
 * @returns {Promise<*>} Der gespeicherte Wert oder undefined
 */
async function getSetting(key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.DB.STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(CONFIG.DB.STORES.SETTINGS);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : undefined);
        };
        request.onerror = (event) => reject(new Error(`Einstellung laden fehlgeschlagen: ${event.target.error}`));
    });
}

// ============================================================
// Wetter-Cache (Offline Mode)
// ============================================================

/**
 * Caches weather data for a location
 * @param {string} locationKey - Key format: lat.toFixed(2)_lon.toFixed(2)
 * @param {Object} weatherData - The weather data to cache
 * @returns {Promise<void>}
 */
async function cacheWeatherData(locationKey, weatherData) {
    var db = await getDB();
    return new Promise(function (resolve, reject) {
        var tx = db.transaction('weatherCache', 'readwrite');
        var store = tx.objectStore('weatherCache');
        store.put({ key: locationKey, data: weatherData, timestamp: Date.now() });

        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (event) { reject(new Error('Wetter-Cache speichern fehlgeschlagen: ' + event.target.error)); };
    });
}

/**
 * Retrieves cached weather data for a location
 * @param {string} locationKey - Key format: lat.toFixed(2)_lon.toFixed(2)
 * @returns {Promise<{data: Object, timestamp: number}|null>}
 */
async function getCachedWeather(locationKey) {
    var db = await getDB();
    return new Promise(function (resolve, reject) {
        var tx = db.transaction('weatherCache', 'readonly');
        var store = tx.objectStore('weatherCache');
        var request = store.get(locationKey);

        request.onsuccess = function () {
            resolve(request.result || null);
        };
        request.onerror = function (event) { reject(new Error('Wetter-Cache laden fehlgeschlagen: ' + event.target.error)); };
    });
}

// ============================================================
// Speicher-Quota Monitoring
// ============================================================

/**
 * Checks storage quota usage
 * @returns {Promise<{usage: number, quota: number, percentage: number}|null>}
 */
async function checkStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return null;
    }
    try {
        var estimate = await navigator.storage.estimate();
        var usage = estimate.usage || 0;
        var quota = estimate.quota || 0;
        var percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;
        return { usage: usage, quota: quota, percentage: percentage };
    } catch (e) {
        console.warn('Storage-Quota konnte nicht abgefragt werden:', e);
        return null;
    }
}

/**
 * Requests persistent storage to prevent data eviction
 * @returns {Promise<boolean>} true if storage is persistent
 */
async function requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
        return false;
    }
    try {
        // Check if already persistent
        var isPersisted = await navigator.storage.persisted();
        if (isPersisted) return true;
        // Request persistence
        var granted = await navigator.storage.persist();
        return granted;
    } catch (e) {
        console.warn('Persistent Storage konnte nicht angefordert werden:', e);
        return false;
    }
}

/**
 * Clears API/weather cache (preserves user data like favorites, settings, history)
 * @returns {Promise<boolean>} true if caches were cleared
 */
async function clearApiCaches() {
    try {
        var cacheNames = await caches.keys();
        var apiCaches = cacheNames.filter(function(name) {
            return name.indexOf('petri-heil-api-') === 0;
        });
        await Promise.all(apiCaches.map(function(name) {
            return caches.delete(name);
        }));
        // Also clear weatherCache store in IndexedDB
        var db = await getDB();
        return new Promise(function(resolve, reject) {
            var tx = db.transaction('weatherCache', 'readwrite');
            var store = tx.objectStore('weatherCache');
            store.clear();
            tx.oncomplete = function() { resolve(true); };
            tx.onerror = function() { resolve(false); };
        });
    } catch (e) {
        console.warn('Cache leeren fehlgeschlagen:', e);
        return false;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDB, addFavorite, removeFavorite, getFavorites, isFavorite,
        addToHistory, getHistory, saveSetting, getSetting,
        cacheWeatherData, getCachedWeather,
        checkStorageQuota, requestPersistentStorage, clearApiCaches
    };
}
