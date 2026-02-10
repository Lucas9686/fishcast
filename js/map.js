/**
 * PETRI HEIL - Leaflet Map Integration
 * Provides: initMap, setMapLocation, addMarker
 */

/** @type {L.Map|null} */
let _map = null;

/** @type {L.Marker|null} */
let _marker = null;

/** @type {function|null} */
let _onLocationSelect = null;

/**
 * Initialize the Leaflet map inside a container.
 * @param {string} containerId - The DOM element ID for the map
 * @param {function(LocationData): void} onLocationSelect - Callback when user taps the map
 */
function initMap(containerId, onLocationSelect) {
    _onLocationSelect = onLocationSelect;

    _map = L.map(containerId, {
        center: CONFIG.MAP.DEFAULT_CENTER,
        zoom: CONFIG.MAP.DEFAULT_ZOOM,
        minZoom: CONFIG.MAP.MIN_ZOOM,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        zoomControl: true,
        attributionControl: true,
        tap: true
    });

    L.tileLayer(CONFIG.MAP.TILE_URL, {
        attribution: CONFIG.MAP.ATTRIBUTION,
        maxZoom: CONFIG.MAP.MAX_ZOOM
    }).addTo(_map);

    // Position zoom controls bottom-right for better thumb reach
    _map.zoomControl.setPosition('bottomright');

    // Tap/click on map to select location
    _map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        addMarker(lat, lon);

        if (_onLocationSelect) {
            // Reverse-geocode is handled by the caller (app.js);
            // we pass a partial LocationData with lat/lon
            _onLocationSelect({
                lat: lat,
                lon: lon,
                name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                timezone: ''
            });
        }
    });
}

/**
 * Center the map on the given coordinates.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
function setMapLocation(lat, lon) {
    if (!_map) return;
    _map.setView([lat, lon], Math.max(_map.getZoom(), 10), { animate: true });
}

/**
 * Add or move the primary marker on the map.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} [label] - Optional popup text
 */
function addMarker(lat, lon, label) {
    if (!_map) return;

    if (_marker) {
        _marker.setLatLng([lat, lon]);
    } else {
        _marker = L.marker([lat, lon]).addTo(_map);
    }

    if (label) {
        _marker.bindPopup(label).openPopup();
    }
}

/**
 * Invalidate map size (call after showing the map container).
 * Leaflet requires this when the container was hidden during init.
 */
function refreshMap() {
    if (_map) {
        _map.invalidateSize();
        requestAnimationFrame(function() {
            _map.invalidateSize();
        });
    }
}
