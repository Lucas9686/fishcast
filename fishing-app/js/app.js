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

        // Setup location search
        setupLocationSearch();

        // Setup GPS button
        setupGPSButton();

        // Setup map toggle
        setupMapToggle();

        // Render fish section
        renderFishUI();

        // Render favorites section
        renderFavoritesSection();

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
                    var cachedTime = new Date(cached.timestamp);
                    var timeStr = cachedTime.getHours().toString().padStart(2, '0') + ':' + cachedTime.getMinutes().toString().padStart(2, '0');

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

                    // Show cached data note in weather time
                    setTextContent('weather-time', 'Daten von ' + timeStr);
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
    // Daily Forecast (7-Tage) - Accordion
    // ============================================================
    function renderDailyForecast() {
        if (!currentWeather || !currentWeather.daily) return;

        var container = $('daily-forecast');
        if (!container) return;

        container.innerHTML = '';
        container.className = 'daily-accordion';

        currentWeather.daily.forEach(function (day, i) {
            var wc = weatherCodeToText(day.weatherCode);

            // Calculate catch prob for each day
            var dayDate = new Date(day.date);
            var dayMoon = getMoonData(dayDate);
            var daySolunar = getSolunarPeriods(dayDate, currentLocation.lat, currentLocation.lon);

            // Approximate weather for the day
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

            var dayCatch = calculateCatchProbability(dayWeather, dayMoon, daySolunar);
            var breakdown = dayCatch.breakdown || {};

            // Build recommendation text
            var recommendation = getDayRecommendation(dayCatch.overall);

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

            // Build wind info
            var windSpeed = day.windSpeedMax ? formatWindSpeed(day.windSpeedMax * 0.6) : '--';
            var windDir = day.windDirection != null ? formatWindDirection(day.windDirection) : '';

            // Precipitation details
            var precipAmount = day.precipitationSum > 0 ? formatPrecipitation(day.precipitationSum) : '0 mm';
            var precipProb = day.precipitationProbabilityMax != null ? formatPercent(day.precipitationProbabilityMax) : '--';

            var item = document.createElement('div');
            item.className = 'daily-accordion__item';
            if (i === 0) item.classList.add('is-expanded');

            item.innerHTML =
                // Summary row
                '<button class="daily-accordion__summary" aria-expanded="' + (i === 0 ? 'true' : 'false') + '">' +
                    '<span class="daily-accordion__day">' + (i === 0 ? 'Heute' : _esc(formatShortDate(day.date))) + '</span>' +
                    '<span class="daily-accordion__icon">' + wc.icon + '</span>' +
                    '<div class="daily-accordion__temps">' +
                        '<span class="daily-accordion__temp-max">' + _esc(formatTemperature(day.tempMax)) + '</span>' +
                        '<span class="daily-accordion__temp-min">' + _esc(formatTemperature(day.tempMin)) + '</span>' +
                    '</div>' +
                    '<span class="daily-accordion__precip">' + (day.precipitationSum > 0 ? _esc(formatPrecipitation(day.precipitationSum)) : '') + '</span>' +
                    '<span class="daily-accordion__catch-badge" style="background:' + dayCatch.color + '">' + dayCatch.overall + '%</span>' +
                    '<span class="daily-accordion__chevron" aria-hidden="true"></span>' +
                '</button>' +
                // Detail panel
                '<div class="daily-accordion__detail">' +
                    '<div class="daily-accordion__detail-inner">' +
                        // Weather description
                        '<div class="daily-accordion__section">' +
                            '<div class="daily-accordion__section-label">Wetter</div>' +
                            '<div class="daily-accordion__section-value">' + _esc(wc.text) + '</div>' +
                        '</div>' +
                        // Wind
                        '<div class="daily-accordion__section">' +
                            '<div class="daily-accordion__section-label">Wind</div>' +
                            '<div class="daily-accordion__section-value">' + _esc(windSpeed) + (windDir ? ' ' + _esc(windDir) : '') + '</div>' +
                        '</div>' +
                        // Precipitation
                        '<div class="daily-accordion__section">' +
                            '<div class="daily-accordion__section-label">Niederschlag</div>' +
                            '<div class="daily-accordion__section-value">' + _esc(precipAmount) + ' &middot; ' + _esc(precipProb) + ' Wahrsch.</div>' +
                        '</div>' +
                        // Catch breakdown bars
                        '<div class="daily-accordion__breakdown">' +
                            '<div class="daily-accordion__section-label">Fangfaktoren</div>' +
                            buildFactorBar('Mond', breakdown.moonPhase) +
                            buildFactorBar('Solunar', breakdown.solunar) +
                            buildFactorBar('Druck', breakdown.pressure) +
                            buildFactorBar('Tageszeit', breakdown.timeOfDay) +
                            buildFactorBar('Wolken', breakdown.cloudCover) +
                        '</div>' +
                        // Solunar periods
                        '<div class="daily-accordion__section">' +
                            '<div class="daily-accordion__section-label">Solunar-Perioden</div>' +
                            '<div class="daily-accordion__solunar-periods">' + solunarHtml + '</div>' +
                        '</div>' +
                        // Moon
                        '<div class="daily-accordion__section">' +
                            '<div class="daily-accordion__section-label">Mond</div>' +
                            '<div class="daily-accordion__section-value">' +
                                _esc(dayMoon.emoji) + ' ' + _esc(dayMoon.name) + ' &middot; ' + _esc(formatPercent(dayMoon.illumination)) + ' Beleuchtung' +
                            '</div>' +
                        '</div>' +
                        // Recommendation
                        '<div class="daily-accordion__recommendation">' +
                            '<span class="daily-accordion__rec-icon" aria-hidden="true"></span> ' +
                            _esc(recommendation) +
                        '</div>' +
                    '</div>' +
                '</div>';

            // Toggle handler
            var summaryBtn = item.querySelector('.daily-accordion__summary');
            summaryBtn.addEventListener('click', function () {
                var expanded = item.classList.contains('is-expanded');
                if (expanded) {
                    item.classList.remove('is-expanded');
                    summaryBtn.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('is-expanded');
                    summaryBtn.setAttribute('aria-expanded', 'true');
                }
            });

            container.appendChild(item);
        });
    }

    function buildFactorBar(label, value) {
        var v = value || 0;
        return '<div class="catch-factor">' +
            '<span class="catch-factor__label">' + _esc(label) + '</span>' +
            '<div class="catch-factor__bar"><div class="catch-factor__fill" style="width:' + v + '%"></div></div>' +
            '<span class="catch-factor__val">' + v + '%</span>' +
        '</div>';
    }

    function getDayRecommendation(overall) {
        if (overall >= 75) return 'Hervorragender Tag zum Angeln! Nutze die Solunar-Hauptzeiten.';
        if (overall >= 55) return 'Gute Bedingungen. Fruehe Morgen- und Abendstunden bevorzugen.';
        if (overall >= 35) return 'Maessige Chancen. Konzentriere dich auf die Solunar-Perioden.';
        return 'Schwierige Bedingungen. Geduld und die richtige Koederwahl sind entscheidend.';
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
        try {
            var idx = favoriteIds.indexOf(fishId);
            if (idx !== -1) {
                await removeFavorite(fishId);
                favoriteIds.splice(idx, 1);
            } else {
                await addFavorite(fishId);
                favoriteIds.push(fishId);
            }

            // Update aria-pressed on favorite button
            var favBtn = document.getElementById('fish-fav-btn');
            if (favBtn) {
                var isNowFav = favoriteIds.indexOf(fishId) !== -1;
                favBtn.setAttribute('aria-pressed', isNowFav ? 'true' : 'false');
            }
        } catch (e) {
            console.error('Favorit-Aenderung fehlgeschlagen:', e);
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
