/**
 * PETRI HEIL - Service Worker
 * Offline-Faehigkeit mit Cache-Strategien
 *
 * Hinweis: Service Worker laeuft in eigenem Scope,
 * kann CONFIG nicht importieren. Cache-Namen sind hardcoded.
 */

// HINWEIS: Cache-Version auch in config.js aktualisieren (CONFIG.CACHE_NAME)
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'petri-heil-' + CACHE_VERSION;
const API_CACHE_NAME = 'petri-heil-api-' + CACHE_VERSION;

// App Shell - Dateien die beim Install gecacht werden
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './js/config.js',
    './js/utils.js',
    './js/api.js',
    './js/solunar.js',
    './js/marine.js',
    './js/sparkline.js',
    './js/tidal-chart.js',
    './js/storage.js',
    './js/map.js',
    './js/fish-ui.js',
    './js/app.js',
    './data/fish-data.json',
    './manifest.json'
];

// ============================================================
// Install: App Shell vorab cachen
// ============================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(APP_SHELL);
            })
            .catch((err) => {
                console.error('Service Worker Install fehlgeschlagen:', err);
            })
    );
});

// ============================================================
// Activate: Alte Caches aufraumen
// ============================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Loesche alle Caches die nicht unsere aktuellen sind
                            return name !== CACHE_NAME && name !== API_CACHE_NAME;
                        })
                        .map((name) => {
                            console.log('Alten Cache loeschen:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Sofort alle Clients uebernehmen
                return self.clients.claim();
            })
    );
});

// ============================================================
// Fetch: Cache-Strategien
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Nur GET-Anfragen cachen
    if (event.request.method !== 'GET') {
        return;
    }

    // API-Anfragen: Network-First mit Cache-Fallback
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Karten-Tiles: Cache-First (OSM Tiles)
    if (isMapTile(url)) {
        event.respondWith(cacheFirst(event.request, CACHE_NAME));
        return;
    }

    // Statische Assets: Cache-First
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
});

// ============================================================
// Hilfsfunktionen
// ============================================================

/**
 * Checks if URL is an API request
 * @param {URL} url
 * @returns {boolean}
 */
function isApiRequest(url) {
    return url.hostname === 'api.open-meteo.com' ||
           url.hostname === 'geocoding-api.open-meteo.com' ||
           url.hostname === 'marine-api.open-meteo.com';
}

/**
 * Checks if URL is a map tile
 * @param {URL} url
 * @returns {boolean}
 */
function isMapTile(url) {
    return url.hostname.endsWith('.tile.openstreetmap.org');
}

/**
 * Cache-First Strategy: Versuche zuerst den Cache, dann Netzwerk
 * @param {Request} request
 * @param {string} cacheName
 * @returns {Promise<Response>}
 */
async function cacheFirst(request, cacheName) {
    try {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        const response = await fetch(request);

        // Gueltige Antworten cachen (basic = same-origin, cors = cross-origin tiles)
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Offline und nicht im Cache: Fallback
        const cached = await caches.match(request);
        if (cached) return cached;

        // Falls es eine Navigation ist, zeige die Startseite
        if (request.mode === 'navigate') {
            const fallback = await caches.match('./index.html');
            if (fallback) return fallback;
        }

        return new Response('Offline - Inhalt nicht verfuegbar', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

/**
 * Network-First Strategy: Versuche zuerst das Netzwerk, dann Cache
 * Fuer API-Aufrufe: Antworten werden im API-Cache gespeichert
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        // Erfolgreiche API-Antwort cachen
        if (response && response.status === 200) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Netzwerk nicht verfuegbar: Fallback auf Cache
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // Kein Cache vorhanden
        return new Response(
            JSON.stringify({ error: 'Offline - keine gecachten Daten verfuegbar' }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }
        );
    }
}

// ============================================================
// Message: Client kann skipWaiting anfordern
// ============================================================
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
