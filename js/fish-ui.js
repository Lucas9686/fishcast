/**
 * PETRI HEIL - Fish List & Detail Rendering
 * Provides: renderFishList, renderFishDetail, renderFishSearch
 */

// Filter constants
var SALTWATER_TYPES = ['meer', 'kueste', 'brackwasser'];
var FRESHWATER_TYPES = ['fluss', 'see', 'bach', 'teich'];
var EDIBILITY_THRESHOLD = 3;

/**
 * Check if fish matches water type filter.
 * @param {FishSpecies} fish - Fish to check
 * @param {boolean} saltwater - Saltwater filter enabled
 * @param {boolean} freshwater - Freshwater filter enabled
 * @returns {boolean}
 */
function matchesWaterTypeFilter(fish, saltwater, freshwater) {
    if (!saltwater && !freshwater) return true;
    if (!fish.waterTypes || !Array.isArray(fish.waterTypes)) return false;
    var matchesSalt = saltwater && fish.waterTypes.some(function(t) { return SALTWATER_TYPES.indexOf(t) !== -1; });
    var matchesFresh = freshwater && fish.waterTypes.some(function(t) { return FRESHWATER_TYPES.indexOf(t) !== -1; });
    return matchesSalt || matchesFresh;
}

/**
 * Check if fish matches season filter (current month).
 * @param {FishSpecies} fish - Fish to check
 * @param {boolean} enabled - Season filter enabled
 * @returns {boolean}
 */
function matchesSeasonFilter(fish, enabled) {
    if (!enabled) return true;
    if (!fish.season || !fish.season.bestMonths) return false;
    var currentMonth = new Date().getMonth() + 1;
    return fish.season.bestMonths.indexOf(currentMonth) !== -1;
}

/**
 * Check if fish matches edibility filter.
 * @param {FishSpecies} fish - Fish to check
 * @param {boolean} enabled - Edibility filter enabled
 * @returns {boolean}
 */
function matchesEdibilityFilter(fish, enabled) {
    if (!enabled) return true;
    if (!fish.edibility) return false;
    return fish.edibility.rating >= EDIBILITY_THRESHOLD;
}

/**
 * Format result count with German grammar.
 * @param {number} count - Number of results
 * @returns {string}
 */
function formatResultCount(count) {
    if (count === 0) return 'Keine Arten gefunden';
    if (count === 1) return '1 Art gefunden';
    return count + ' Arten gefunden';
}

/**
 * Render a grid of fish cards into the given container.
 * @param {HTMLElement} container - Target container element
 * @param {FishSpecies[]} fishData - Array of fish species
 * @param {function(FishSpecies): void} onSelect - Callback when a fish card is tapped
 */
function renderFishList(container, fishData, onSelect) {
    container.innerHTML = '';

    if (!fishData || fishData.length === 0) {
        container.innerHTML = '<p class="empty-state">Keine Fische gefunden.</p>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'fish-grid';

    var fragment = document.createDocumentFragment();

    fishData.forEach(function (fish) {
        const card = document.createElement('div');
        card.className = 'fish-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', fish.name);

        var categoryLabel = fish.category === 'raubfisch' ? 'Raubfisch'
            : fish.category === 'friedfisch' ? 'Friedfisch'
            : fish.category === 'salmonide' ? 'Salmonide'
            : fish.category === 'salzwasser' ? 'Salzwasser'
            : fish.category === 'meeresfruechte' ? 'Meeresfruechte'
            : fish.category;

        card.innerHTML =
            '<img class="fish-card__image lazy" data-src="' + _escAttr(fish.image) + '" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect fill=\'%230d1b2a\' width=\'200\' height=\'120\' rx=\'4\'/%3E%3C/svg%3E" alt="' + _escAttr(fish.name) + '" loading="lazy" onerror="this.src=_fishFallbackSvg(\'' + _escAttr(fish.name).replace(/'/g, "\\'") + '\')">' +
            '<div class="fish-card__body">' +
                '<div class="fish-card__name">' + _esc(fish.name) + '</div>' +
                '<span class="fish-card__category fish-card__category--' + _escAttr(fish.category) + '">' + categoryLabel + '</span>' +
            '</div>';

        card.addEventListener('click', function () { onSelect(fish); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(fish);
            }
        });

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    container.appendChild(grid);

    // IntersectionObserver for lazy loading images
    var imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.remove('lazy');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px 0px'
    });

    grid.querySelectorAll('img.lazy').forEach(function(img) {
        imageObserver.observe(img);
    });
}

/**
 * Render the full detail view for a single fish.
 * @param {HTMLElement} container - Target container element
 * @param {FishSpecies} fish - The fish to display
 * @param {CatchProbability} [catchProb] - Optional current catch probability
 * @param {boolean} [isFav=false] - Whether this fish is a favorite
 * @param {function(): void} [onFavToggle] - Callback to toggle favorite
 */
var _fishListScrollY = 0;

function renderFishDetail(container, fish, catchProb, isFav, onFavToggle) {
    _fishListScrollY = window.scrollY;
    container.innerHTML = '';

    var detail = document.createElement('div');
    detail.className = 'fish-detail';

    // Difficulty stars
    var starsHtml = '';
    for (var s = 1; s <= 5; s++) {
        starsHtml += '<span class="fish-difficulty__star' + (s > fish.difficulty ? ' fish-difficulty__star--empty' : '') + '">&#9733;</span>';
    }

    // Stats
    var statsHtml =
        _statBox('Durchschn.', fish.size.avgCm + ' cm / ' + fish.size.avgKg + ' kg') +
        _statBox('Maximum', fish.size.maxCm + ' cm / ' + fish.size.maxKg + ' kg') +
        _statBox('Mindestmass', fish.minSize) +
        _statBox('Schwierigkeit', '<span class="fish-difficulty">' + starsHtml + '</span>');

    // Technique badges
    var techHtml = '';
    fish.techniques.forEach(function (t) {
        techHtml += '<span class="fish-badge">' + _esc(t) + '</span>';
    });

    // Bait badges
    var baitHtml = '';
    fish.baits.forEach(function (b) {
        baitHtml += '<span class="fish-badge fish-badge--bait">' + _esc(b) + '</span>';
    });

    // Tips list
    var tipsHtml = '';
    fish.tips.forEach(function (tip) {
        tipsHtml += '<li>' + _esc(tip) + '</li>';
    });

    // Water types
    var waterHtml = '';
    fish.waterTypes.forEach(function (w) {
        var label = w === 'fluss' ? 'Fluss' : w === 'see' ? 'See' : w === 'bach' ? 'Bach' : w === 'teich' ? 'Teich' : w === 'meer' ? 'Meer' : w === 'kueste' ? 'Kueste' : w === 'brackwasser' ? 'Brackwasser' : w;
        waterHtml += '<span class="fish-badge">' + label + '</span>';
    });

    // Edibility section
    var edibilityHtml = '';
    if (fish.edibility) {
        var edibilityStarsHtml = '';
        for (var e = 1; e <= 5; e++) {
            edibilityStarsHtml += '<span class="edibility-star' + (e > fish.edibility.rating ? ' edibility-star--empty' : '') + '">&#9733;</span>';
        }

        var prepHtml = '';
        fish.edibility.preparation.forEach(function (p) {
            prepHtml += '<span class="fish-badge fish-badge--prep">' + _esc(p) + '</span>';
        });

        edibilityHtml =
            '<div class="fish-detail__section-title">Kulinarische Eignung</div>' +
            '<div class="fish-detail__edibility">' +
                '<div class="edibility-rating">' + edibilityStarsHtml + '</div>' +
                '<div class="edibility-info">Geschmack: ' + _esc(fish.edibility.taste) + ' | Textur: ' + _esc(fish.edibility.texture) + '</div>' +
                '<div class="fish-detail__badges">' + prepHtml + '</div>' +
                (fish.edibility.notes ? '<p class="edibility-notes">' + _esc(fish.edibility.notes) + '</p>' : '') +
            '</div>';
    }

    // Habitat detail section
    var habitatDetailHtml = '';
    if (fish.habitatDetail) {
        var structureHtml = '';
        fish.habitatDetail.structure.forEach(function (s) {
            structureHtml += '<span class="fish-badge">' + _esc(s) + '</span>';
        });

        habitatDetailHtml =
            '<div class="fish-detail__section-title">Lebensraum-Details</div>' +
            '<div class="fish-detail__habitat-detail">' +
                '<div class="habitat-info"><strong>Tiefe:</strong> ' + _esc(fish.habitatDetail.depthRange) + '</div>' +
                '<div class="habitat-info"><strong>Region:</strong> ' + _esc(fish.habitatDetail.region) + '</div>' +
                '<div class="fish-detail__badges">' + structureHtml + '</div>' +
            '</div>';
    }

    // Catch probability section
    var catchHtml = '';
    if (catchProb) {
        var circumference = 2 * Math.PI * 32;
        var offset = circumference - (catchProb.overall / 100) * circumference;
        catchHtml =
            '<div class="fish-detail__catch">' +
                '<div class="catch-gauge" style="width:80px;height:80px;">' +
                    '<svg class="catch-gauge__svg" viewBox="0 0 80 80">' +
                        '<circle class="catch-gauge__bg" cx="40" cy="40" r="32" />' +
                        '<circle class="catch-gauge__fill" cx="40" cy="40" r="32" style="stroke:' + catchProb.color + ';stroke-dasharray:' + circumference.toFixed(2) + ';stroke-dashoffset:' + offset.toFixed(2) + '" />' +
                    '</svg>' +
                    '<div class="catch-gauge__text">' +
                        '<span class="catch-gauge__percent" style="color:' + catchProb.color + '">' + Math.round(catchProb.overall) + '%</span>' +
                        '<span class="catch-gauge__label">' + _esc(catchProb.rating) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="fish-detail__catch-info">' +
                    '<div class="fish-detail__catch-title">Aktuelle Fangprognose</div>' +
                    '<div class="fish-detail__catch-text">' + _esc(catchProb.tip || '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="catch-legend">' +
                '<span class="catch-legend__item"><span class="catch-legend__dot" style="background:#22c55e"></span>Ausgezeichnet</span>' +
                '<span class="catch-legend__item"><span class="catch-legend__dot" style="background:#3b82f6"></span>Gut</span>' +
                '<span class="catch-legend__item"><span class="catch-legend__dot" style="background:#f59e0b"></span>Maessig</span>' +
                '<span class="catch-legend__item"><span class="catch-legend__dot" style="background:#ef4444"></span>Schlecht</span>' +
            '</div>';
    }

    // Season
    var seasonHtml = '';
    if (fish.season) {
        seasonHtml = '<div class="fish-detail__season"><strong>Beste Saison:</strong> ' + _esc(fish.season.description) + '</div>';
    }

    // Closed season
    var closedHtml = '';
    if (fish.closedSeason) {
        closedHtml = '<div class="fish-detail__closed-season"><strong>Schonzeit:</strong> ' + _esc(fish.closedSeason.period) + ' &mdash; ' + _esc(fish.closedSeason.note) + '</div>';
    }

    detail.innerHTML =
        '<div class="fish-detail__header">' +
            '<img class="fish-detail__image" src="' + _escAttr(fish.image) + '" alt="' + _escAttr(fish.name) + '" onerror="this.src=_fishFallbackSvg(\'' + _escAttr(fish.name).replace(/'/g, "\\'") + '\')">' +
            '<button class="fish-detail__back" aria-label="Zurueck" id="fish-back-btn">&larr;</button>' +
            '<button class="fish-detail__fav' + (isFav ? ' is-favorite' : '') + '" aria-label="Favorit umschalten" aria-pressed="' + (isFav ? 'true' : 'false') + '" id="fish-fav-btn">' + (isFav ? '&#9829;' : '&#9825;') + '</button>' +
        '</div>' +
        '<div class="fish-detail__body">' +
            '<h2 class="fish-detail__title">' + _esc(fish.name) + '</h2>' +
            '<div class="fish-detail__scientific">' + _esc(fish.scientificName) + '</div>' +
            (fish.nicknames && fish.nicknames.length > 0 ? '<div class="fish-detail__nicknames">Auch bekannt als: ' + fish.nicknames.map(function(n) { return _esc(n); }).join(', ') + '</div>' : '') +
            '<p class="fish-detail__desc">' + _esc(fish.description) + '</p>' +
            '<div class="fish-detail__stats">' + statsHtml + '</div>' +
            catchHtml +
            '<div class="fish-detail__section-title">Gewaessertypen</div>' +
            '<div class="fish-detail__badges">' + waterHtml + '</div>' +
            habitatDetailHtml +
            '<div class="fish-detail__section-title">Angeltechniken</div>' +
            '<div class="fish-detail__badges">' + techHtml + '</div>' +
            '<div class="fish-detail__section-title">Koeder</div>' +
            '<div class="fish-detail__badges">' + baitHtml + '</div>' +
            '<div class="fish-detail__section-title">Tipps</div>' +
            '<ul class="fish-detail__tips">' + tipsHtml + '</ul>' +
            edibilityHtml +
            seasonHtml +
            closedHtml +
        '</div>';

    container.appendChild(detail);

    // Wire up back button
    var backBtn = detail.querySelector('#fish-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            container.setAttribute('hidden', '');
            var listContainer = document.getElementById('fish-list-container');
            var searchContainer = document.getElementById('fish-search-container');
            if (listContainer) listContainer.style.display = '';
            if (searchContainer) searchContainer.style.display = '';
            // Restore scroll position
            window.scrollTo(0, _fishListScrollY);
        });
    }

    // Wire up favorite button
    var favBtn = detail.querySelector('#fish-fav-btn');
    if (favBtn && onFavToggle) {
        favBtn.addEventListener('click', function () {
            onFavToggle();
            var isNowFav = favBtn.classList.toggle('is-favorite');
            favBtn.innerHTML = isNowFav ? '&#9829;' : '&#9825;';
            favBtn.setAttribute('aria-pressed', isNowFav ? 'true' : 'false');
        });
    }

    // Focus back button for accessibility
    if (backBtn) {
        setTimeout(function () { backBtn.focus(); }, 100);
    }
}

/**
 * Render search input and category filter buttons.
 * @param {HTMLElement} container - Target container element
 * @param {FishSpecies[]} fishData - Full fish data array to search/filter
 * @param {function(FishSpecies[]): void} onFilter - Callback with filtered results
 */
function renderFishSearch(container, fishData, onFilter) {
    container.innerHTML = '';

    // Centralized filter state
    var filterState = {
        searchText: '',
        category: 'alle',
        saltwater: false,
        freshwater: false,
        seasonEnabled: false,
        edibilityEnabled: false
    };

    var searchBar = document.createElement('div');
    searchBar.className = 'fish-search-bar';

    var input = document.createElement('input');
    input.type = 'search';
    input.className = 'fish-search-bar__input';
    input.placeholder = 'Fisch suchen...';
    input.setAttribute('aria-label', 'Fisch suchen');

    searchBar.appendChild(input);
    container.appendChild(searchBar);

    // New filter row with toggle buttons
    var filterRow = document.createElement('div');
    filterRow.className = 'fish-filter-row';

    // Store button references for clear-all
    var filterButtons = [];

    // Helper to wire filter toggle buttons
    function wireFilterButton(btn, stateKey) {
        filterButtons.push(btn);
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', function() {
            filterState[stateKey] = !filterState[stateKey];
            btn.classList.toggle('active');
            btn.setAttribute('aria-pressed', String(filterState[stateKey]));
            applyFilter();
        });
    }

    // Freshwater button
    var freshwaterBtn = document.createElement('button');
    freshwaterBtn.className = 'fish-filter-btn';
    freshwaterBtn.textContent = 'Suesswasser';
    wireFilterButton(freshwaterBtn, 'freshwater');
    filterRow.appendChild(freshwaterBtn);

    // Saltwater button
    var saltwaterBtn = document.createElement('button');
    saltwaterBtn.className = 'fish-filter-btn';
    saltwaterBtn.textContent = 'Salzwasser';
    wireFilterButton(saltwaterBtn, 'saltwater');
    filterRow.appendChild(saltwaterBtn);

    // Season button with current month
    var monthName = new Date().toLocaleDateString('de-DE', { month: 'long' });
    var seasonBtn = document.createElement('button');
    seasonBtn.className = 'fish-filter-btn';
    seasonBtn.textContent = 'Was beisst jetzt? (' + monthName + ')';
    wireFilterButton(seasonBtn, 'seasonEnabled');
    filterRow.appendChild(seasonBtn);

    // Edibility button
    var edibilityBtn = document.createElement('button');
    edibilityBtn.className = 'fish-filter-btn';
    edibilityBtn.textContent = 'Essbar';
    wireFilterButton(edibilityBtn, 'edibilityEnabled');
    filterRow.appendChild(edibilityBtn);

    // Reset/Clear-all button
    var resetBtn = document.createElement('button');
    resetBtn.className = 'fish-filter-btn fish-filter-btn--reset';
    resetBtn.textContent = 'Zuruecksetzen';
    resetBtn.style.display = 'none';
    resetBtn.addEventListener('click', function() {
        filterState.searchText = '';
        filterState.category = 'alle';
        filterState.saltwater = false;
        filterState.freshwater = false;
        filterState.seasonEnabled = false;
        filterState.edibilityEnabled = false;
        input.value = '';
        activeCategory = 'alle';
        // Remove active class and reset aria-pressed on all filter buttons
        filterButtons.forEach(function(btn) {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        // Reset category buttons to 'alle' active state
        categoryFilterBar.querySelectorAll('.fish-category-btn').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-category') === 'alle');
        });
        applyFilter();
    });
    filterRow.appendChild(resetBtn);

    container.appendChild(filterRow);

    // Category filters
    var categoryFilterBar = document.createElement('div');
    categoryFilterBar.className = 'fish-category-filters';

    var categories = [
        { id: 'alle', label: 'Alle' },
        { id: 'raubfisch', label: 'Raubfisch' },
        { id: 'friedfisch', label: 'Friedfisch' },
        { id: 'salmonide', label: 'Salmonide' },
        { id: 'salzwasser', label: 'Salzwasser' },
        { id: 'meeresfruechte', label: 'Meeresfruechte' }
    ];

    var activeCategory = 'alle';

    categories.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.className = 'fish-category-btn' + (cat.id === 'alle' ? ' active' : '');
        btn.textContent = cat.label;
        btn.setAttribute('data-category', cat.id);
        btn.addEventListener('click', function () {
            activeCategory = cat.id;
            filterState.category = cat.id;
            categoryFilterBar.querySelectorAll('.fish-category-btn').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-category') === cat.id);
            });
            applyFilter();
        });
        categoryFilterBar.appendChild(btn);
    });

    container.appendChild(categoryFilterBar);

    // Result counter
    var resultCounter = document.createElement('div');
    resultCounter.className = 'fish-result-counter';
    resultCounter.setAttribute('aria-live', 'polite');
    resultCounter.setAttribute('aria-atomic', 'true');
    resultCounter.textContent = formatResultCount(fishData.length);
    container.appendChild(resultCounter);

    // Filter logic with all dimensions
    function applyFilter() {
        filterState.searchText = input.value.trim().toLowerCase();
        filterState.category = activeCategory;

        var filtered = fishData.filter(function(fish) {
            var matchesCategory = filterState.category === 'alle' || fish.category === filterState.category;
            var matchesSearch = !filterState.searchText ||
                fish.name.toLowerCase().indexOf(filterState.searchText) !== -1 ||
                fish.scientificName.toLowerCase().indexOf(filterState.searchText) !== -1 ||
                fish.family.toLowerCase().indexOf(filterState.searchText) !== -1 ||
                (fish.nicknames && fish.nicknames.some(function(n) { return n.toLowerCase().indexOf(filterState.searchText) !== -1; }));
            var matchesWater = matchesWaterTypeFilter(fish, filterState.saltwater, filterState.freshwater);
            var matchesSeason = matchesSeasonFilter(fish, filterState.seasonEnabled);
            var matchesEdibility = matchesEdibilityFilter(fish, filterState.edibilityEnabled);

            return matchesCategory && matchesSearch && matchesWater && matchesSeason && matchesEdibility;
        });

        // Update result counter
        resultCounter.textContent = formatResultCount(filtered.length);

        // Show/hide reset button
        var anyFilterActive = filterState.category !== 'alle' ||
            filterState.searchText !== '' ||
            filterState.saltwater || filterState.freshwater ||
            filterState.seasonEnabled || filterState.edibilityEnabled;
        resetBtn.style.display = anyFilterActive ? '' : 'none';

        onFilter(filtered);
    }

    input.addEventListener('input', debounce(applyFilter, 250));
}

// ---- Private Helpers ----

/**
 * Escape HTML entities to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function _esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

/**
 * Escape a string for use in an HTML attribute.
 * @param {string} str
 * @returns {string}
 */
function _escAttr(str) {
    return _esc(str).replace(/"/g, '&quot;');
}

/**
 * Create a stat box HTML string.
 * @param {string} label
 * @param {string} value - Can contain HTML (e.g. star spans)
 * @returns {string}
 */
function _statBox(label, value) {
    return '<div class="fish-stat">' +
        '<span class="fish-stat__label">' + _esc(label) + '</span>' +
        '<span class="fish-stat__value">' + value + '</span>' +
    '</div>';
}

/**
 * Generate a data URI SVG fallback with a fish silhouette and name.
 * @param {string} name - Fish name to display
 * @returns {string} Data URI for fallback image
 */
function _fishFallbackSvg(name) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">' +
        '<rect fill="%23e8f0e8" width="200" height="120" rx="4"/>' +
        '<g transform="translate(10,15) scale(0.95,0.85)" fill="%23a0b8a0" opacity="0.6">' +
            '<path d="M30,60 Q10,60 10,50 Q10,35 30,30 L50,25 Q70,20 90,25 L110,30 Q140,35 160,50 Q170,55 180,50 Q185,45 180,40 Q175,55 170,55 L160,55 Q140,65 110,70 L90,72 Q70,75 50,72 L30,60 Z"/>' +
            '<circle cx="35" cy="45" r="4" fill="%23c0d0c0"/>' +
        '</g>' +
        '<text x="50%" y="100" dominant-baseline="middle" text-anchor="middle" fill="%23708070" font-size="13" font-family="sans-serif">' + name + '</text>' +
    '</svg>';
    return 'data:image/svg+xml,' + svg;
}
