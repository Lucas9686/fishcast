/**
 * PETRI HEIL - Haupt-Controller
 * Verbindet alle Module: API, Solunar, Storage, Map, Fish-UI
 */

(function () {
    'use strict';

    // ============================================================
    // App State
    // ============================================================
    let currentLocation = null;   // LocationData
    let currentWeather = null;    // WeatherData
    let currentMoon = null;       // MoonData
    let currentSolunar = null;    // SolunarData
    let currentCatch = null;      // CatchProbability
    let currentMarineData = null; // Marine/coastal data or { isCoastal: false }
    let fishData = [];            // FishSpecies[]
    let selectedFish = null;      // FishSpecies | null
    let favoriteIds = [];         // string[]
    let refreshTimer = null;

    // ============================================================
    // DOM References
    // ============================================================
    const $ = (id) => document.getElementById(id);

    // ============================================================
    // Hash Routing
    // ============================================================
    // Hash routing maps
    var HASH_TO_TAB = {
        '#weather': { tab: 'tab-weather', section: 'section-weather' },
        '#fish': { tab: 'tab-fish', section: 'section-fish' },
        '#favorites': { tab: 'tab-favorites', section: 'section-favorites' }
    };
    var SECTION_TO_HASH = {
        'section-weather': '#weather',
        'section-fish': '#fish',
        'section-favorites': '#favorites'
    };
    var _suppressHashUpdate = false;

    // ============================================================
    // Theme Toggle
    // ============================================================
    var THEME_MODES = ['dark', 'light', 'auto'];
    var THEME_ICONS = { dark: '\u{1F319}', light: '\u{2600}\uFE0F', auto: '\u{1F504}' };
    var THEME_LABELS = { dark: 'Dunkel', light: 'Hell', auto: 'Auto' };
    var THEME_STORAGE_KEY = 'theme';

    /**
     * ThemeToggle - Manages dark/light/auto theme cycling
     * Reads/writes localStorage, sets data-theme attribute on <html>,
     * updates meta theme-color, listens for system preference changes.
     */
    function ThemeToggle() {
        this.button = $('btn-theme-toggle');
        if (!this.button) return;

        this.currentTheme = this._getStored() || 'auto';
        this._applyTheme(this.currentTheme);
        this._updateIcon();
        this._bindEvents();
    }

    ThemeToggle.prototype._getStored = function() {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY);
        } catch (e) {
            return null;
        }
    };

    ThemeToggle.prototype._save = function(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Theme-Einstellung konnte nicht gespeichert werden');
        }
    };

    ThemeToggle.prototype._applyTheme = function(theme) {
        var resolvedTheme;
        if (theme === 'auto') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            resolvedTheme = theme;
        }
        document.documentElement.setAttribute('data-theme', resolvedTheme);

        // Update meta theme-color for mobile browser chrome
        var metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#0d1b2a' : '#00bcd4');
        }
    };

    ThemeToggle.prototype._updateIcon = function() {
        this.button.textContent = THEME_ICONS[this.currentTheme];
        this.button.setAttribute('aria-label', 'Theme: ' + THEME_LABELS[this.currentTheme]);
        this.button.setAttribute('title', 'Theme: ' + THEME_LABELS[this.currentTheme]);
    };

    ThemeToggle.prototype.toggle = function() {
        // Add transition class for smooth color fade
        document.documentElement.classList.add('theme-transition');

        var currentIndex = THEME_MODES.indexOf(this.currentTheme);
        var nextIndex = (currentIndex + 1) % THEME_MODES.length;
        this.currentTheme = THEME_MODES[nextIndex];

        this._save(this.currentTheme);
        this._applyTheme(this.currentTheme);
        this._updateIcon();

        // Remove transition class after fade completes (300ms)
        var self = this;
        setTimeout(function() {
            document.documentElement.classList.remove('theme-transition');
        }, 350);
    };

    ThemeToggle.prototype._bindEvents = function() {
        var self = this;

        // Click to cycle through themes
        this.button.addEventListener('click', function() {
            self.toggle();
        });

        // Listen for system preference changes (applies when in auto mode)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            if (self.currentTheme === 'auto') {
                self._applyTheme('auto');
            }
        });
    };

    // ============================================================
    // Card Fade-In on Scroll
    // ============================================================
    /**
     * setupCardFadeIn - Uses Intersection Observer to animate cards
     * entering the viewport. Cards start hidden and fade in once.
     * Disabled when user prefers reduced motion.
     */
    function setupCardFadeIn() {
        // Skip if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('fade-in-hidden');
                    entry.target.classList.add('fade-in-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all cards currently in the DOM
        document.querySelectorAll('.card').forEach(function(card) {
            card.classList.add('fade-in-hidden');
            observer.observe(card);
        });
    }

    // ============================================================
    // Initialization
    // ============================================================
    document.addEventListener('DOMContentLoaded', async function () {
        await init();
    });

    async function init() {
        // Init IndexedDB
        try {
            await initDB();
        } catch (e) {
            console.warn('IndexedDB init fehlgeschlagen:', e);
        }

        // Request persistent storage (silent, no user prompt needed)
        requestPersistentStorage().then(function(persistent) {
            if (persistent) {
                console.log('Persistent Storage aktiv');
            }
        });

        // Load favorites
        try {
            favoriteIds = await getFavorites();
        } catch (e) {
            favoriteIds = [];
        }

        // Load fish data
        try {
            const resp = await fetch('data/fish-data.json');
            fishData = await resp.json();
        } catch (e) {
            console.error('Fischdaten laden fehlgeschlagen:', e);
            fishData = [];
        }

        // Setup tab navigation
        setupTabs();

        // Hash-based routing: restore tab from URL on load
        var initialRoute = HASH_TO_TAB[window.location.hash];
        if (initialRoute) {
            switchTab(initialRoute.tab, initialRoute.section);
        }

        // Listen for browser back/forward navigation
        window.addEventListener('hashchange', function() {
            var route = HASH_TO_TAB[window.location.hash];
            if (route) {
                // Avoid pushing duplicate history entry
                var currentSection = document.querySelector('.section.active');
                if (currentSection && currentSection.id !== route.section) {
                    // Temporarily disable hash push in switchTab
                    _suppressHashUpdate = true;
                    switchTab(route.tab, route.section);
                    _suppressHashUpdate = false;
                }
            }
        });

        // Setup theme toggle
        new ThemeToggle();

        // Setup location search
        setupLocationSearch();

        // Setup GPS button
        setupGPSButton();

        // Setup map toggle
        setupMapToggle();

        // Offline/Online detection
        window.addEventListener('online', function() {
            var banner = $('offline-banner');
            if (banner) banner.hidden = true;
        });

        window.addEventListener('offline', function() {
            var banner = $('offline-banner');
            if (banner) banner.hidden = false;
        });

        // Check initial state
        if (!navigator.onLine) {
            var banner = $('offline-banner');
            if (banner) banner.hidden = false;
        }

        // Render fish section
        renderFishUI();

        // Render favorites section
        renderFavoritesSection();

        // Setup storage quota display
        setupStorageDisplay();

        // Setup card fade-in animation
        setupCardFadeIn();

        // Load saved location or use default
        try {
            const savedLoc = await getSetting('lastLocation');
            if (savedLoc) {
                await setLocation(savedLoc);
            } else {
                // Try GPS, fallback to default
                try {
                    const loc = await getCurrentLocation();
                    await setLocation(loc);
                } catch (e) {
                    // Fallback: Salzburg
                    await setLocation({
                        lat: CONFIG.MAP.DEFAULT_CENTER[0],
                        lon: CONFIG.MAP.DEFAULT_CENTER[1],
                        name: 'Salzburg, Oesterreich',
                        timezone: 'Europe/Vienna'
                    });
                }
            }
        } catch (e) {
            await setLocation({
                lat: CONFIG.MAP.DEFAULT_CENTER[0],
                lon: CONFIG.MAP.DEFAULT_CENTER[1],
                name: 'Salzburg, Oesterreich',
                timezone: 'Europe/Vienna'
            });
        }

        // Register Service Worker
        registerServiceWorker();

        // Auto-refresh
        refreshTimer = setInterval(refreshData, CONFIG.REFRESH_INTERVAL);

        // Back to top button
        setupBackToTop();

        // Offline banner dismiss
        var offlineDismiss = document.querySelector('.offline-banner__dismiss');
        if (offlineDismiss) {
            offlineDismiss.addEventListener('click', function() {
                var banner = $('offline-banner');
                if (banner) banner.hidden = true;
            });
        }
    }

    // ============================================================
    // Tab Navigation
    // ============================================================
    function setupTabs() {
        var tabs = document.querySelectorAll('.tab-bar__tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                // Visual press feedback
                tab.style.transform = 'scale(0.93)';
                tab.classList.add('tab-pressed');
                setTimeout(function() {
                    tab.style.transform = '';
                    tab.classList.remove('tab-pressed');
                }, 150);

                var targetId = tab.getAttribute('aria-controls');
                switchTab(tab.id, targetId);

                // Tab pulse micro-interaction
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    tab.classList.add('tab-pulse');
                    tab.addEventListener('animationend', function removePulse() {
                        tab.classList.remove('tab-pulse');
                        tab.removeEventListener('animationend', removePulse);
                    });
                }
            });
        });
    }

    function switchTab(tabId, sectionId) {
        var currentSection = document.querySelector('.section.active');
        var newSection = $(sectionId);

        // Deactivate all tabs
        document.querySelectorAll('.tab-bar__tab').forEach(function (t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });

        // Activate selected tab
        var tab = $(tabId);
        if (tab) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        }

        // Transition sections
        if (currentSection && currentSection !== newSection) {
            currentSection.classList.remove('active');
            // Small delay for CSS transition
            requestAnimationFrame(function() {
                if (newSection) {
                    newSection.classList.add('active');
                    newSection.scrollTop = 0;
                }
            });
        } else if (newSection) {
            newSection.classList.add('active');
        }

        // Scroll content to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update URL hash for bookmarkability
        if (!_suppressHashUpdate) {
            var newHash = SECTION_TO_HASH[sectionId];
            if (newHash && window.location.hash !== newHash) {
                history.pushState(null, '', newHash);
            }
        }

        // Special: refresh favorites
        if (sectionId === CONFIG.SECTIONS.FAVORITES) {
            renderFavoritesSection();
        }
    }

    // ============================================================
    // Location Search
    // ============================================================
    function setupLocationSearch() {
        var searchInput = $('location-search');
        var resultsList = $('search-results');

        if (!searchInput || !resultsList) return;

        var debouncedSearch = debounce(async function () {
            var query = searchInput.value.trim();
            if (query.length < 2) {
                resultsList.hidden = true;
                return;
            }

            try {
                var results = await searchLocation(query);
                renderSearchResults(results, resultsList);
            } catch (e) {
                console.error('Suche fehlgeschlagen:', e);
                resultsList.hidden = true;
            }
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);

        // Close results on click outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.location-bar__search')) {
                resultsList.hidden = true;
            }
        });

        // Close on Escape
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                resultsList.hidden = true;
                searchInput.blur();
            }
        });
    }

    function renderSearchResults(results, listEl) {
        listEl.innerHTML = '';

        if (!results || results.length === 0) {
            listEl.innerHTML = '<li style="color:var(--color-text-muted)">Keine Ergebnisse</li>';
            listEl.hidden = false;
            return;
        }

        results.forEach(function (loc) {
            var li = document.createElement('li');
            li.textContent = loc.name;
            li.setAttribute('role', 'option');
            li.addEventListener('click', function () {
                listEl.hidden = true;
                $('location-search').value = '';
                setLocation(loc);
            });
            listEl.appendChild(li);
        });

        listEl.hidden = false;
    }

    // ============================================================
    // GPS Button
    // ============================================================
    function setupGPSButton() {
        var btn = $('btn-gps');
        if (!btn) return;

        btn.addEventListener('click', async function () {
            btn.classList.add('loading');
            try {
                var loc = await getCurrentLocation();
                await setLocation(loc);
            } catch (e) {
                alert(e.message || 'Standort konnte nicht ermittelt werden.');
            } finally {
                btn.classList.remove('loading');
            }
        });
    }

    // ============================================================
    // Map Toggle
    // ============================================================
    function setupMapToggle() {
        var btn = $('btn-map-toggle');
        var mapContainer = $('map-container');
        var mapInitialized = false;

        if (!btn || !mapContainer) return;

        btn.addEventListener('click', function () {
            var isHidden = mapContainer.hidden;

            if (isHidden) {
                mapContainer.hidden = false;
                btn.classList.add('active');

                if (!mapInitialized && !_map) {
                    initMap('map', function (loc) {
                        // Map tap handler: reverse geocode and set location
                        handleMapTap(loc);
                    });
                    mapInitialized = true;
                }

                // Update map with current location
                if (currentLocation) {
                    setMapLocation(currentLocation.lat, currentLocation.lon);
                    addMarker(currentLocation.lat, currentLocation.lon, currentLocation.name);
                }

                refreshMap();
            } else {
                mapContainer.hidden = true;
                btn.classList.remove('active');
            }
        });
    }

    async function handleMapTap(loc) {
        // Try to get a name for the coordinates via search
        try {
            var results = await searchLocation(loc.lat.toFixed(2) + ',' + loc.lon.toFixed(2));
            if (results.length > 0) {
                loc.name = results[0].name;
                loc.timezone = results[0].timezone;
            }
        } catch (e) {
            // Keep coordinate-based name
        }

        await setLocation(loc);
    }

    // ============================================================
    // Set Location & Load Data
    // ============================================================
    async function setLocation(location) {
        currentLocation = location;

        // Update location display
        var locDisplay = $('current-location');
        if (locDisplay) {
            locDisplay.textContent = location.name;
            locDisplay.classList.add('loading');
        }

        // Save location
        try {
            await saveSetting('lastLocation', location);
            await addToHistory(location);
        } catch (e) {
            // Non-critical
        }

        // Update map marker if map is visible
        var mapContainer = $('map-container');
        if (mapContainer && !mapContainer.hidden) {
            setMapLocation(location.lat, location.lon);
            addMarker(location.lat, location.lon, location.name);
        }

        // Load weather & calculate everything
        try {
            await loadWeatherData();
        } finally {
            if (locDisplay) locDisplay.classList.remove('loading');
        }
    }

    async function loadWeatherData() {
        if (!currentLocation) return;

        var locationKey = currentLocation.lat.toFixed(2) + '_' + currentLocation.lon.toFixed(2);

        try {
            document.body.classList.add('weather-loading');
            var loadingBar = $('loading-bar');
            if (loadingBar) loadingBar.hidden = false;

            // Fetch weather
            currentWeather = await fetchWeatherData(currentLocation);

            // Cache weather for offline use
            try {
                await cacheWeatherData(locationKey, currentWeather);
            } catch (cacheErr) {
                // Non-critical
            }

            // Fetch marine data (non-blocking, optional)
            try {
                currentMarineData = await fetchMarineData(currentLocation);
                if (currentMarineData.isCoastal && currentMarineData.hourly) {
                    // Extract tide times from hourly data
                    currentMarineData.tides = extractTideTimes(currentMarineData.hourly);
                    // Parse daily marine summaries
                    currentMarineData.dailySummary = parseMarineDaily(currentMarineData);
                }
            } catch (e) {
                console.warn('Marine-Daten nicht verfuegbar:', e);
                currentMarineData = { isCoastal: false };
            }

            // Hide offline banner
            var offlineBanner = $('offline-banner');
            if (offlineBanner) offlineBanner.hidden = true;

            // Calculate moon data
            currentMoon = getMoonData(new Date());

            // Calculate solunar periods
            currentSolunar = getSolunarPeriods(new Date(), currentLocation.lat, currentLocation.lon, new Date());

            // Calculate catch probability
            currentCatch = calculateCatchProbability(currentWeather, currentMoon, currentSolunar, null, currentMarineData);

            // Update all UI
            renderWeatherDashboard();
            renderAstroData();
            renderCatchSummary();
            renderHourlyForecast();
            renderDailyForecast();
            renderCatchBreakdown();

            // Remove skeleton loading states
            document.body.classList.add('loaded');

            document.body.classList.remove('weather-loading');
            var loadingBar = $('loading-bar');
            if (loadingBar) loadingBar.hidden = true;

        } catch (e) {
            console.error('Wetter laden fehlgeschlagen:', e);

            // Try loading cached weather data
            try {
                var cached = await getCachedWeather(locationKey);
                if (cached && cached.data) {
                    currentWeather = cached.data;
                    var relativeStr = formatRelativeTime(cached.timestamp);

                    // Set marine data to inland for offline fallback
                    currentMarineData = { isCoastal: false };

                    // Calculate moon and solunar with cached weather
                    currentMoon = getMoonData(new Date());
                    currentSolunar = getSolunarPeriods(new Date(), currentLocation.lat, currentLocation.lon, new Date());
                    currentCatch = calculateCatchProbability(currentWeather, currentMoon, currentSolunar, null, currentMarineData);

                    // Update all UI
                    renderWeatherDashboard();
                    renderAstroData();
                    renderCatchSummary();
                    renderHourlyForecast();
                    renderDailyForecast();
                    renderCatchBreakdown();

                    document.body.classList.add('loaded');

                    // Show cached data note with relative time
                    setTextContent('weather-time', 'Letzte Aktualisierung: ' + relativeStr);

                    // Add staleness indicator if data is older than 6 hours
                    var weatherTimeEl = $('weather-time');
                    if (weatherTimeEl) {
                        var ageMs = Date.now() - cached.timestamp;
                        if (ageMs > 6 * 60 * 60 * 1000) {
                            weatherTimeEl.classList.add('weather-time--stale');
                        }
                    }
                }
            } catch (cacheErr) {
                // Could not load cache either
            }

            // Show offline banner
            var offlineBanner = $('offline-banner');
            if (offlineBanner) offlineBanner.hidden = false;

            var locDisplay = $('current-location');
            if (locDisplay) {
                locDisplay.textContent = currentLocation.name + ' (Offline)';
            }

            document.body.classList.remove('weather-loading');
            var loadingBar = $('loading-bar');
            if (loadingBar) loadingBar.hidden = true;
        }
    }

    async function refreshData() {
        if (currentLocation) {
            await loadWeatherData();
        }
    }

    // ============================================================
    // Weather Dashboard Rendering
    // ============================================================
    function renderWeatherDashboard() {
        if (!currentWeather) return;

        var wc = weatherCodeToText(currentWeather.weatherCode);

        setTextContent('weather-icon', wc.icon);
        setTextContent('weather-temp', formatTemperature(currentWeather.temperature));
        setTextContent('weather-desc', wc.text);
        setTextContent('weather-wind', formatWindSpeed(currentWeather.windSpeed) + ' ' + formatWindDirection(currentWeather.windDirection));
        setTextContent('weather-pressure', formatPressure(currentWeather.pressure));

        var trend = pressureTrendText(currentWeather.pressureTrend);
        setTextContent('weather-pressure-trend', trend.icon + ' ' + trend.text);
        setTextContent('weather-humidity', formatPercent(currentWeather.humidity));
        setTextContent('weather-clouds', formatPercent(currentWeather.cloudCover));
        setTextContent('weather-precip', formatPrecipitation(currentWeather.precipitation));
        setTextContent('weather-time', 'Aktualisiert: ' + formatTime(new Date()));

        // Remove skeleton class
        document.querySelectorAll('#current-weather .skeleton-text').forEach(function (el) {
            el.classList.remove('skeleton-text');
        });
    }

    function renderAstroData() {
        if (!currentWeather || !currentMoon) return;

        setTextContent('sun-rise', currentWeather.sunrise ? formatTime(currentWeather.sunrise) : '--:--');
        setTextContent('sun-set', currentWeather.sunset ? formatTime(currentWeather.sunset) : '--:--');
        setTextContent('moon-emoji', currentMoon.emoji);
        setTextContent('moon-phase', currentMoon.name);
        setTextContent('moon-illumination', formatPercent(currentMoon.illumination));

        // Remove skeleton
        document.querySelectorAll('.card--astro .skeleton-text').forEach(function (el) {
            el.classList.remove('skeleton-text');
        });
    }

    function animateCounter(elementId, targetValue, duration) {
        var el = $(elementId);
        if (!el) return;

        // Respect reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.textContent = targetValue + '%';
            return;
        }

        var start = 0;
        var startTime = null;
        duration = duration || 800;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * targetValue);
            el.textContent = current + '%';
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function renderCatchSummary() {
        if (!currentCatch) return;

        // Update gauge with smooth rAF-driven fill
        var gaugeFill = $('gauge-fill');
        if (gaugeFill) {
            var circumference = 2 * Math.PI * 52;
            var targetOffset = circumference - (currentCatch.overall / 100) * circumference;

            // Set initial state (fully empty)
            gaugeFill.style.strokeDasharray = circumference.toFixed(2);
            gaugeFill.style.stroke = currentCatch.color;

            // Animate to target offset via rAF
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                gaugeFill.style.strokeDashoffset = circumference.toFixed(2);
                requestAnimationFrame(function() {
                    gaugeFill.style.transition = 'stroke-dashoffset 0.8s ease-out';
                    gaugeFill.style.strokeDashoffset = targetOffset.toFixed(2);
                });
            } else {
                gaugeFill.style.strokeDashoffset = targetOffset.toFixed(2);
            }
        }

        animateCounter('catch-percent', currentCatch.overall, 800);
        var percentEl = $('catch-percent');
        if (percentEl) percentEl.style.color = currentCatch.color;

        setTextContent('catch-label', currentCatch.rating);
        setTextContent('catch-tip', currentCatch.tip);

        // Solunar periods
        renderSolunarPeriods();

        // Remove skeleton
        document.querySelectorAll('.card--catch-summary .skeleton-text').forEach(function (el) {
            el.classList.remove('skeleton-text');
        });
    }

    function renderSolunarPeriods() {
        if (!currentSolunar) return;

        var container = $('solunar-periods');
        if (!container) return;

        container.innerHTML = '';
        currentSolunar.periods.forEach(function (period) {
            var badge = document.createElement('span');
            badge.className = 'solunar-period-badge solunar-period-badge--' + period.type;
            badge.textContent = (period.type === 'major' ? 'Haupt' : 'Neben') + ': ' + period.start + ' - ' + period.end;
            container.appendChild(badge);
        });
    }

    // ============================================================
    // Hourly Forecast
    // ============================================================
    function renderHourlyForecast() {
        if (!currentWeather || !currentWeather.hourly) return;

        var container = $('hourly-forecast');
        if (!container) return;

        container.innerHTML = '';

        // Show next 24 hours
        var hours = currentWeather.hourly.slice(0, 24);
        hours.forEach(function (h) {
            var wc = weatherCodeToText(h.weatherCode);
            var item = document.createElement('div');
            item.className = 'hourly-item';

            // Mark current hour
            var itemDate = new Date(h.time);
            var now = new Date();
            if (itemDate.getHours() === now.getHours() &&
                itemDate.getDate() === now.getDate()) {
                item.classList.add('is-now');
            }

            item.innerHTML =
                '<span class="hourly-item__time">' + formatTime(h.time) + '</span>' +
                '<span class="hourly-item__icon">' + wc.icon + '</span>' +
                '<span class="hourly-item__temp">' + formatTemperature(h.temperature) + '</span>' +
                '<span class="hourly-item__wind">' + formatWindSpeed(h.windSpeed) + '</span>' +
                (h.precipitationProbability > 0 ? '<span class="hourly-item__precip">' + h.precipitationProbability + '%</span>' : '');
            container.appendChild(item);
        });

        // Detect overflow for scroll hint indicator
        if (container.scrollWidth > container.clientWidth) {
            container.classList.add('has-overflow');
        }

        // Detect scroll end for fade indicator
        var cardHourly = container.closest('.card--hourly');
        if (cardHourly) {
            container.addEventListener('scroll', function() {
                var isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
                cardHourly.classList.toggle('scrolled-end', isAtEnd);
            }, { passive: true });
        }

        // Staggered fade-in for hourly items via IntersectionObserver
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
            'IntersectionObserver' in window) {
            var hourlyItems = container.querySelectorAll('.hourly-item');
            hourlyItems.forEach(function(item) {
                item.classList.add('hourly-item--hidden');
            });

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('hourly-item--hidden');
                        entry.target.classList.add('hourly-item--visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { root: container, threshold: 0.3 });

            hourlyItems.forEach(function(item, index) {
                item.style.transitionDelay = (index * 40) + 'ms';
                observer.observe(item);
            });
        }
    }

    // ============================================================
    // Daily Forecast (7-Tage) - Accordion with Thematic Groups
    // ============================================================
    function renderDailyForecast() {
        if (!currentWeather || !currentWeather.daily) return;

        var container = $('daily-forecast');
        if (!container) return;

        container.innerHTML = '';
        container.className = 'daily-accordion';

        // Factor labels for dynamic breakdown rendering
        var factorLabels = {
            moonPhase: 'Mond',
            solunar: 'Solunar',
            pressure: 'Druck',
            timeOfDay: 'Tageszeit',
            cloudCover: 'Wolken',
            uvIndex: 'UV-Index',
            visibility: 'Sicht',
            tides: 'Gezeiten',
            waveHeight: 'Wellen'
        };

        currentWeather.daily.forEach(function (day, i) {
            var wc = weatherCodeToText(day.weatherCode);

            // Calculate catch prob for each day
            var dayDate = new Date(day.date);
            var dayMoon = getMoonData(dayDate);
            var daySolunar = getSolunarPeriods(dayDate, currentLocation.lat, currentLocation.lon);

            // Get moon rise/set for this day
            var moonRiseSet = getMoonRiseSet(dayDate, currentLocation.lat, currentLocation.lon);

            // Extract day-specific marine data
            var dayMarineData = null;
            var dayTides = null;
            if (currentMarineData && currentMarineData.isCoastal && currentMarineData.dailySummary && currentMarineData.dailySummary[i]) {
                dayMarineData = currentMarineData.dailySummary[i];
            }
            if (currentMarineData && currentMarineData.tides && currentMarineData.tides[i]) {
                dayTides = currentMarineData.tides[i];
            }

            // Approximate weather for the day (for catch calculation)
            var dayWeather = {
                temperature: (day.tempMax + day.tempMin) / 2,
                pressureTrend: currentWeather.pressureTrend,
                cloudCover: 50,
                windSpeed: day.windSpeedMax * 0.6,
                precipitation: day.precipitationSum,
                sunrise: day.sunrise,
                sunset: day.sunset,
                weatherCode: day.weatherCode
            };

            var dayCatch = calculateCatchProbability(dayWeather, dayMoon, daySolunar, null, dayMarineData ? { isCoastal: true, daily: [dayMarineData] } : { isCoastal: false });
            var breakdown = dayCatch.breakdown || {};

            // Calculate best fishing time for this day
            var bestTime = calculateBestFishingTime(daySolunar, day.sunrise, day.sunset, dayTides && dayTides.tides ? dayTides.tides : null);

            // Build solunar periods HTML
            var solunarHtml = '';
            if (daySolunar && daySolunar.periods && daySolunar.periods.length > 0) {
                daySolunar.periods.forEach(function (period) {
                    var typeLabel = period.type === 'major' ? 'Haupt' : 'Neben';
                    solunarHtml += '<span class="solunar-period-badge solunar-period-badge--' + _esc(period.type) + '">' +
                        _esc(typeLabel) + ': ' + _esc(period.start) + ' - ' + _esc(period.end) + '</span>';
                });
            } else {
                solunarHtml = '<span class="daily-accordion__no-data">Keine Daten</span>';
            }

            // Build wind info with gusts
            var windSpeed = day.windSpeedMax ? formatWindSpeed(day.windSpeedMax * 0.6) : '--';
            var windGusts = day.windGustsMax ? formatWindSpeed(day.windGustsMax) : null;
            var windDir = day.windDirection != null ? formatWindDirection(day.windDirection) : '';

            // Get pressure trend arrow for collapsed view
            var pressureTrend = pressureTrendText(currentWeather.pressureTrend);

            // UV Index
            var uvIndex = day.uvIndexMax != null ? Math.round(day.uvIndexMax) : '--';

            // Visibility (from hourly data for this day if available)
            var visibility = '--';
            if (currentWeather.hourly && currentWeather.hourly[i * 24]) {
                var dayHourly = currentWeather.hourly[i * 24];
                if (dayHourly.visibility != null) {
                    visibility = (dayHourly.visibility / 1000).toFixed(1) + ' km';
                }
            }

            // Precipitation details
            var precipAmount = day.precipitationSum > 0 ? formatPrecipitation(day.precipitationSum) : '0 mm';
            var precipProb = day.precipitationProbabilityMax != null ? formatPercent(day.precipitationProbabilityMax) : '--';

            var item = document.createElement('div');
            item.className = 'daily-accordion__item';
            if (i === 0) item.classList.add('is-expanded');

            // Build factor bars dynamically from breakdown keys
            var factorBarsHtml = '';
            for (var key in breakdown) {
                if (breakdown.hasOwnProperty(key) && factorLabels[key]) {
                    factorBarsHtml += buildFactorBar(factorLabels[key], breakdown[key]);
                }
            }

            item.innerHTML =
                // Summary row (collapsed view)
                '<button class="daily-accordion__summary" aria-expanded="' + (i === 0 ? 'true' : 'false') + '">' +
                    '<span class="daily-accordion__day">' + (i === 0 ? 'Heute' : _esc(formatShortDate(day.date))) + '</span>' +
                    '<span class="daily-accordion__icon">' + wc.icon + '</span>' +
                    '<div class="daily-accordion__temps">' +
                        '<span class="daily-accordion__temp-max">' + _esc(formatTemperature(day.tempMax)) + '</span>' +
                        '<span class="daily-accordion__temp-min">' + _esc(formatTemperature(day.tempMin)) + '</span>' +
                    '</div>' +
                    '<span class="daily-accordion__precip">' + (day.precipitationSum > 0 ? _esc(formatPrecipitation(day.precipitationSum)) : '') + '</span>' +
                    '<span class="daily-accordion__wind">' + _esc(windSpeed) + '</span>' +
                    '<span class="daily-accordion__pressure-trend">' + pressureTrend.icon + '</span>' +
                    '<span class="daily-accordion__catch-badge" style="background:' + dayCatch.color + '">' + dayCatch.overall + '%</span>' +
                    '<span class="daily-accordion__chevron" aria-hidden="true"></span>' +
                '</button>' +
                // Detail panel with thematic groups
                '<div class="daily-accordion__detail">' +
                    '<div class="daily-accordion__detail-inner">' +
                        // GROUP 1: Wind & Wetter
                        '<div class="daily-accordion__group">' +
                            '<h4 class="daily-accordion__group-title">Wind & Wetter</h4>' +
                            '<div class="daily-accordion__group-grid">' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Bedingungen</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(wc.text) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Wind</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(windSpeed) + (windDir ? ' ' + _esc(windDir) : '') + '</span>' +
                                '</div>' +
                                (windGusts ? '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Boeen</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(windGusts) + '</span>' +
                                '</div>' : '') +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Temperatur</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(formatTemperature(day.tempMax)) + ' / ' + _esc(formatTemperature(day.tempMin)) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Niederschlag</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(precipAmount) + ' (' + _esc(precipProb) + ')</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">UV-Index</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(uvIndex) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Sicht</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(visibility) + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        // GROUP 2: Luftdruck
                        '<div class="daily-accordion__group">' +
                            '<h4 class="daily-accordion__group-title">Luftdruck</h4>' +
                            '<div class="daily-accordion__pressure-info">' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Druck</span>' +
                                    '<span class="daily-accordion__data-value">' + formatPressure(currentWeather.pressure) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Trend</span>' +
                                    '<span class="daily-accordion__data-value">' + pressureTrend.icon + ' ' + _esc(pressureTrend.text) + '</span>' +
                                '</div>' +
                            '</div>' +
                            (i === 0 && currentWeather.hourly ? '<canvas class="daily-accordion__sparkline" id="sparkline-day-' + i + '" width="300" height="60"></canvas>' : '') +
                        '</div>' +
                        // GROUP 3: Sonne & Mond
                        '<div class="daily-accordion__group">' +
                            '<h4 class="daily-accordion__group-title">Sonne & Mond</h4>' +
                            '<div class="daily-accordion__group-grid">' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Aufgang</span>' +
                                    '<span class="daily-accordion__data-value">🌅 ' + formatTime(day.sunrise) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Untergang</span>' +
                                    '<span class="daily-accordion__data-value">🌇 ' + formatTime(day.sunset) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Mondphase</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(dayMoon.emoji) + ' ' + _esc(dayMoon.name) + '</span>' +
                                '</div>' +
                                '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Beleuchtung</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(formatPercent(dayMoon.illumination)) + '</span>' +
                                '</div>' +
                                (moonRiseSet.moonrise ? '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Mond ↑</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(moonRiseSet.moonrise) + '</span>' +
                                '</div>' : '') +
                                (moonRiseSet.moonset ? '<div class="daily-accordion__data-item">' +
                                    '<span class="daily-accordion__data-label">Mond ↓</span>' +
                                    '<span class="daily-accordion__data-value">' + _esc(moonRiseSet.moonset) + '</span>' +
                                '</div>' : '') +
                            '</div>' +
                        '</div>' +
                        // GROUP 4: Marine & Gezeiten (only if coastal)
                        (dayMarineData ?
                            '<div class="daily-accordion__group daily-accordion__group--marine">' +
                                '<h4 class="daily-accordion__group-title">Marine & Gezeiten</h4>' +
                                '<div class="daily-accordion__group-grid">' +
                                    '<div class="daily-accordion__data-item">' +
                                        '<span class="daily-accordion__data-label">Wellenhoehe</span>' +
                                        '<span class="daily-accordion__data-value">' + (dayMarineData.waveHeightMax != null ? _esc(dayMarineData.waveHeightMax.toFixed(1)) + ' m' : '--') + '</span>' +
                                    '</div>' +
                                    (dayMarineData.wavePeriodAvg != null ? '<div class="daily-accordion__data-item">' +
                                        '<span class="daily-accordion__data-label">Wellenperiode</span>' +
                                        '<span class="daily-accordion__data-value">' + _esc(dayMarineData.wavePeriodAvg.toFixed(0)) + ' s</span>' +
                                    '</div>' : '') +
                                '</div>' +
                                (dayTides && dayTides.tides && dayTides.tides.length > 0 ? '<canvas class="daily-accordion__tidal-chart" id="tidal-chart-day-' + i + '" width="300" height="80"></canvas>' : '') +
                            '</div>'
                        : '') +
                        // GROUP 5: Fangprognose
                        '<div class="daily-accordion__group daily-accordion__group--catch">' +
                            '<h4 class="daily-accordion__group-title">Fangprognose</h4>' +
                            '<div class="daily-accordion__score-header">' +
                                '<span class="daily-accordion__catch-badge-large" style="background:' + dayCatch.color + '">' + dayCatch.overall + '%</span>' +
                                '<div class="daily-accordion__best-time">' +
                                    '<strong>Beste Zeit:</strong> ' + (bestTime ? _esc(bestTime.start) + ' - ' + _esc(bestTime.end) : '--') +
                                '</div>' +
                            '</div>' +
                            '<div class="daily-accordion__solunar-periods">' + solunarHtml + '</div>' +
                            '<div class="daily-accordion__breakdown">' +
                                factorBarsHtml +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            // Toggle handler
            var summaryBtn = item.querySelector('.daily-accordion__summary');
            var firstExpand = true;
            summaryBtn.addEventListener('click', function () {
                var expanded = item.classList.contains('is-expanded');
                if (expanded) {
                    item.classList.remove('is-expanded');
                    summaryBtn.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('is-expanded');
                    summaryBtn.setAttribute('aria-expanded', 'true');

                    // Draw charts on first expand
                    if (firstExpand) {
                        firstExpand = false;
                        // Draw pressure sparkline for today (day 0)
                        if (i === 0 && currentWeather.pressureHistory) {
                            var sparklineCanvas = item.querySelector('#sparkline-day-' + i);
                            if (sparklineCanvas && typeof drawPressureSparkline === 'function') {
                                var nowIndex = findNowIndex(currentWeather.hourly);
                                drawPressureSparkline(sparklineCanvas, currentWeather.pressureHistory, nowIndex);
                            }
                        }
                        // Draw tidal chart if coastal
                        if (dayTides && dayTides.tides && dayTides.tides.length > 0) {
                            var tidalCanvas = item.querySelector('#tidal-chart-day-' + i);
                            if (tidalCanvas && typeof drawTidalTimeline === 'function') {
                                drawTidalTimeline(tidalCanvas, dayTides.tides, 0, 24);
                            }
                        }
                    }
                }
            });

            container.appendChild(item);
        });

        // Draw charts for initially expanded day (today)
        var todayItem = container.querySelector('.daily-accordion__item.is-expanded');
        if (todayItem && currentWeather.pressureHistory) {
            var sparklineCanvas = todayItem.querySelector('#sparkline-day-0');
            if (sparklineCanvas && typeof drawPressureSparkline === 'function') {
                var nowIndex = findNowIndex(currentWeather.hourly);
                drawPressureSparkline(sparklineCanvas, currentWeather.pressureHistory, nowIndex);
            }
        }
        // Draw tidal chart for today if coastal
        if (currentMarineData && currentMarineData.isCoastal && currentMarineData.tides && currentMarineData.tides[0]) {
            var todayTides = currentMarineData.tides[0];
            if (todayTides && todayTides.tides && todayTides.tides.length > 0 && todayItem) {
                var tidalCanvas = todayItem.querySelector('#tidal-chart-day-0');
                if (tidalCanvas && typeof drawTidalTimeline === 'function') {
                    drawTidalTimeline(tidalCanvas, todayTides.tides, 0, 24);
                }
            }
        }
    }

    // Helper: Find the current hour index in hourly data
    function findNowIndex(hourlyData) {
        if (!hourlyData || hourlyData.length === 0) return 0;
        var now = new Date();
        for (var i = 0; i < hourlyData.length; i++) {
            var hourTime = new Date(hourlyData[i].time);
            if (hourTime >= now) return i;
        }
        return 0;
    }

    function buildFactorBar(label, value) {
        var v = value || 0;
        return '<div class="catch-factor">' +
            '<span class="catch-factor__label">' + _esc(label) + '</span>' +
            '<div class="catch-factor__bar"><div class="catch-factor__fill" style="width:' + v + '%"></div></div>' +
            '<span class="catch-factor__val">' + v + '%</span>' +
        '</div>';
    }


    // ============================================================
    // Catch Breakdown (Vorhersage-Tab)
    // ============================================================
    function renderCatchBreakdown() {
        if (!currentCatch) return;

        var breakdown = currentCatch.breakdown;

        setBarAndValue('factor-moon', 'factor-moon-val', breakdown.moonPhase);
        setBarAndValue('factor-solunar', 'factor-solunar-val', breakdown.solunar);
        setBarAndValue('factor-pressure', 'factor-pressure-val', breakdown.pressure);
        setBarAndValue('factor-time', 'factor-time-val', breakdown.timeOfDay);
        setBarAndValue('factor-clouds', 'factor-clouds-val', breakdown.cloudCover);
    }

    function setBarAndValue(barId, valId, score) {
        var bar = $(barId);
        var val = $(valId);
        if (bar) bar.style.width = score + '%';
        if (val) val.textContent = score + '%';
    }

    // ============================================================
    // Fish UI
    // ============================================================
    function renderFishUI() {
        var searchContainer = $('fish-search-container');
        var listContainer = $('fish-list-container');

        if (!searchContainer || !listContainer) return;

        // Render search + filter
        renderFishSearch(searchContainer, fishData, function (filtered) {
            renderFishList(listContainer, filtered, onFishSelect);
        });

        // Render initial full list
        renderFishList(listContainer, fishData, onFishSelect);
    }

    async function onFishSelect(fish) {
        selectedFish = fish;

        // Calculate fish-specific catch probability
        var fishCatch = null;
        if (currentWeather && currentMoon && currentSolunar) {
            fishCatch = calculateCatchProbability(currentWeather, currentMoon, currentSolunar, fish, currentMarineData);
        }

        // Check if favorite
        var isFav = favoriteIds.indexOf(fish.id) !== -1;

        // Hide list, show detail
        var listContainer = $('fish-list-container');
        var searchContainer = $('fish-search-container');
        var detailContainer = $('fish-detail-container');

        if (listContainer) listContainer.style.display = 'none';
        if (searchContainer) searchContainer.style.display = 'none';
        if (detailContainer) {
            detailContainer.hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            renderFishDetail(detailContainer, fish, fishCatch, isFav, function () {
                toggleFavorite(fish.id);
            });
        }
    }

    async function toggleFavorite(fishId) {
        var idx = favoriteIds.indexOf(fishId);
        var wasAdding = idx === -1;

        // Optimistic update: modify in-memory state FIRST
        if (wasAdding) {
            favoriteIds.push(fishId);
        } else {
            favoriteIds.splice(idx, 1);
        }

        // Update UI immediately (heart button in fish detail)
        var favBtn = document.getElementById('fish-fav-btn');
        if (favBtn) {
            favBtn.classList.toggle('is-favorite', wasAdding);
            favBtn.innerHTML = wasAdding ? '&#9829;' : '&#9825;';
            favBtn.setAttribute('aria-pressed', String(wasAdding));
        }

        // Persist to IndexedDB asynchronously
        try {
            if (wasAdding) {
                await addFavorite(fishId);
            } else {
                await removeFavorite(fishId);
            }
        } catch (e) {
            // Rollback on error: revert in-memory state
            if (wasAdding) {
                var rollbackIdx = favoriteIds.indexOf(fishId);
                if (rollbackIdx !== -1) favoriteIds.splice(rollbackIdx, 1);
            } else {
                favoriteIds.push(fishId);
            }

            // Rollback UI
            if (favBtn) {
                favBtn.classList.toggle('is-favorite', !wasAdding);
                favBtn.innerHTML = !wasAdding ? '&#9829;' : '&#9825;';
                favBtn.setAttribute('aria-pressed', String(!wasAdding));
            }

            console.error('Favorit-Aenderung fehlgeschlagen:', e);
        }
    }

    // ============================================================
    // Storage Quota Display
    // ============================================================
    function setupStorageDisplay() {
        // Create storage info display in favorites section
        var favSection = $('section-favorites');
        if (!favSection) return;

        var existingStorageInfo = $('storage-info');
        if (existingStorageInfo) return; // Already created

        // Create container for storage info and cache button
        var storageContainer = document.createElement('div');
        storageContainer.style.cssText = 'text-align: center; padding: 1rem 0; border-top: 1px solid var(--border-color, #1a3a5c);';

        // Create storage info display
        var storageDiv = document.createElement('div');
        storageDiv.id = 'storage-info';
        storageDiv.className = 'storage-info';
        storageDiv.setAttribute('aria-label', 'Speicherverbrauch');
        storageDiv.style.cssText = 'padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--text-secondary, #8899aa); text-align: center; opacity: 0.8;';

        // Create clear cache button
        var clearCacheBtn = document.createElement('button');
        clearCacheBtn.id = 'btn-clear-cache';
        clearCacheBtn.className = 'btn-clear-cache';
        clearCacheBtn.textContent = 'Cache leeren';
        clearCacheBtn.style.cssText = 'display: inline-block; margin: 0.5rem auto; padding: 0.4rem 1rem; font-size: 0.75rem; background: transparent; border: 1px solid var(--text-secondary, #8899aa); color: var(--text-secondary, #8899aa); border-radius: 0.5rem; cursor: pointer; opacity: 0.7;';
        clearCacheBtn.addEventListener('click', async function() {
            clearCacheBtn.textContent = 'Wird geleert...';
            clearCacheBtn.disabled = true;
            var success = await clearApiCaches();
            clearCacheBtn.textContent = success ? 'Cache geleert!' : 'Fehler beim Leeren';
            setTimeout(function() {
                clearCacheBtn.textContent = 'Cache leeren';
                clearCacheBtn.disabled = false;
                updateStorageDisplay();
            }, 2000);
        });

        storageContainer.appendChild(storageDiv);
        storageContainer.appendChild(clearCacheBtn);
        favSection.appendChild(storageContainer);

        // Initial display update
        updateStorageDisplay();
    }

    /**
     * Updates storage quota display in the favorites section
     */
    async function updateStorageDisplay() {
        var quotaInfo = await checkStorageQuota();
        if (!quotaInfo) return;

        var storageEl = $('storage-info');
        if (!storageEl) return;

        var usageMB = (quotaInfo.usage / (1024 * 1024)).toFixed(1);
        var quotaMB = (quotaInfo.quota / (1024 * 1024)).toFixed(0);
        var text = 'Speicher: ' + usageMB + ' MB / ' + quotaMB + ' MB (' + quotaInfo.percentage + '%)';

        // Warning states
        if (quotaInfo.percentage >= 95) {
            storageEl.style.color = '#ef4444';
            storageEl.textContent = text + ' - Speicher fast voll!';
        } else if (quotaInfo.percentage >= 80) {
            storageEl.style.color = '#f59e0b';
            storageEl.textContent = text + ' - Speicher wird knapp';
        } else {
            storageEl.style.color = 'var(--text-secondary, #8899aa)';
            storageEl.textContent = text;
        }
    }

    // ============================================================
    // Favorites Section
    // ============================================================
    async function renderFavoritesSection() {
        // Refresh favorites list
        try {
            favoriteIds = await getFavorites();
        } catch (e) {
            // use cached favoriteIds
        }

        var favContainer = $('favorites-list');
        var emptyState = $('favorites-empty');

        if (!favContainer) return;

        // Filter fish data to favorites
        var favFish = fishData.filter(function (f) {
            return favoriteIds.indexOf(f.id) !== -1;
        });

        if (favFish.length === 0) {
            favContainer.innerHTML = '<p class="empty-state">Noch keine Favoriten gespeichert. Tippe auf das Herz bei einem Fisch, um ihn hier zu sehen.</p>';
        } else {
            renderFishList(favContainer, favFish, function (fish) {
                // Switch to fish tab and show detail
                switchTab(CONFIG.TABS.FISH, CONFIG.SECTIONS.FISH);
                onFishSelect(fish);
            });
        }

        // Location history
        renderLocationHistory();
    }

    async function renderLocationHistory() {
        var historyContainer = $('location-history');
        if (!historyContainer) return;

        try {
            var history = await getHistory(8);

            if (history.length === 0) {
                historyContainer.innerHTML = '<li class="empty-state">Noch keine Standorte im Verlauf.</li>';
                return;
            }

            historyContainer.innerHTML = '';
            history.forEach(function (loc) {
                var li = document.createElement('li');
                li.innerHTML = '<span class="location-history__icon">📍</span>' + _esc(loc.name);
                li.addEventListener('click', function () {
                    setLocation(loc);
                    switchTab(CONFIG.TABS.WEATHER, CONFIG.SECTIONS.WEATHER);
                });
                historyContainer.appendChild(li);
            });
        } catch (e) {
            // silent
        }
    }

    // ============================================================
    // Service Worker
    // ============================================================
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').then(function (reg) {
                console.log('Service Worker registriert:', reg.scope);

                // Detect waiting worker (new version available)
                function promptUpdate(worker) {
                    var toast = document.createElement('div');
                    toast.className = 'sw-update-toast';
                    toast.textContent = 'Neue Version verfügbar - Neu laden?';
                    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a73e8;color:#fff;padding:12px 24px;border-radius:8px;cursor:pointer;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:14px;';
                    toast.addEventListener('click', function () {
                        worker.postMessage('skipWaiting');
                        toast.remove();
                    });
                    document.body.appendChild(toast);
                }

                if (reg.waiting) {
                    promptUpdate(reg.waiting);
                }

                reg.addEventListener('updatefound', function () {
                    var newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', function () {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            promptUpdate(newWorker);
                        }
                    });
                });

                // Reload when the new SW takes over
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function () {
                    if (!refreshing) {
                        refreshing = true;
                        window.location.reload();
                    }
                });
            }).catch(function (err) {
                console.warn('Service Worker Registrierung fehlgeschlagen:', err);
            });
        }
    }

    // ============================================================
    // Back to Top
    // ============================================================
    function setupBackToTop() {
        var btn = $('btn-back-to-top');
        if (!btn) return;

        var scrollThreshold = 400;

        window.addEventListener('scroll', debounce(function() {
            var show = window.scrollY > scrollThreshold;
            btn.classList.toggle('visible', show);
            if (!btn.classList.contains('visible')) {
                btn.hidden = false; // Ensure not display:none for CSS transition
            }
        }, 100), { passive: true });

        btn.hidden = false; // Remove hidden, CSS handles visibility

        btn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================================
    // Helpers
    // ============================================================
    function setTextContent(id, text) {
        var el = $(id);
        if (el) el.textContent = text;
    }

    // Re-use _esc from fish-ui.js (it's global)
    // If not available, provide fallback
    if (typeof _esc !== 'function') {
        window._esc = function (str) {
            if (!str) return '';
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(String(str)));
            return div.innerHTML;
        };
    }

})();
