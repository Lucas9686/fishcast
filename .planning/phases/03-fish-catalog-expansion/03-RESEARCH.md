# Phase 3: Fish Catalog Expansion - Research

**Researched:** 2026-02-07
**Domain:** Fish species data management, offline catalog expansion
**Confidence:** MEDIUM

## Summary

Expanding the fish catalog from 62 to 200+ species requires a disciplined data collection and validation strategy. The research reveals that comprehensive fish databases exist for both Adriatic Sea (444+ confirmed marine species) and European freshwater (667 documented species), providing sufficient source material. The existing JSON schema is well-structured and can scale to 200+ records with vanilla JavaScript array methods, as performance remains acceptable up to ~10,000 records at the browser level.

The standard approach is to maintain embedded JSON data for offline capability, use existing fish-ui.js rendering patterns, and implement lazy loading with IntersectionObserver for images. Critical success factors include data quality validation (species identification accuracy is a known industry problem with 39% mislabeling rates), consistent data structure enforcement, and proper SVG image sourcing with copyright compliance.

**Primary recommendation:** Extend the existing fish-data.json structure with validated data, add edibility/culinary fields to the schema, source copyright-free SVG illustrations from public domain vectors, and implement lazy image loading to handle 200+ fish card images efficiently.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript | ES6+ | Array filtering, rendering | Already used in codebase, no build system |
| IndexedDB | Native API | Offline storage | Native browser API, no dependencies |
| IntersectionObserver | Native API | Lazy image loading | Native API, superior to scroll listeners |
| DocumentFragment | Native API | Batch DOM operations | Native API for list rendering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Service Worker Cache API | Native | Image caching | Already implemented for offline PWA |
| JSON Schema validation | N/A | Data validation | Optional, for build-time validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embedded JSON | External API | External API requires server, contradicts FISCH-08 requirement |
| Vanilla arrays | Virtual scrolling library | 200 items don't justify library overhead |
| SVG images | PNG/JPEG | SVG provides smaller file sizes, scalability |
| Manual DOM | Template literals | Already using template string pattern in fish-ui.js |

**Installation:**
No additional packages needed. All features use native browser APIs.

## Architecture Patterns

### Recommended Project Structure
```
fishing-app/
├── data/
│   └── fish-data.json        # Extended from 62 to 200+ species
├── images/
│   └── fish/                 # SVG illustrations (200+ files)
│       ├── [species-id].svg
├── js/
│   ├── fish-ui.js            # Existing, add lazy loading
│   └── config.js             # Add edibility categories
```

### Pattern 1: Data Schema Extension
**What:** Extend existing FishSpecies typedef with culinary/edibility fields
**When to use:** Every new fish entry must conform to extended schema
**Example:**
```javascript
// Source: Existing config.js + culinary research
/**
 * @typedef {Object} FishSpecies
 * @property {string} id
 * @property {string} name
 * @property {string} scientificName
 * // ... existing fields ...
 * @property {Object} edibility - NEW: Culinary information
 * @property {number} edibility.rating - 1-5 (1=nicht essbar, 5=ausgezeichnet)
 * @property {string} edibility.taste - Flavor profile (mild/medium/kräftig/stark)
 * @property {string} edibility.texture - Textur (zart/fest/mager/fett)
 * @property {Array<string>} edibility.preparation - Zubereitungsmethoden
 * @property {string} edibility.notes - Besondere kulinarische Hinweise
 */
```

### Pattern 2: Lazy Image Loading with IntersectionObserver
**What:** Load fish card images only when entering viewport
**When to use:** For fish grid rendering with 200+ cards
**Example:**
```javascript
// Source: Modern best practices research
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    }
  });
}, {
  rootMargin: '50px' // Start loading 50px before entering viewport
});

// In renderFishList:
// <img data-src="..." class="fish-card__image lazy">
document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
```

### Pattern 3: Incremental Data Addition
**What:** Add species in batches with validation checkpoints
**When to use:** To maintain data quality while expanding to 200+
**Example workflow:**
```
1. Add 40 Adriatic species → validate schema → commit
2. Add 40 more Adriatic → validate → commit
3. Add 40 European freshwater → validate → commit
4. Continue until 200+ reached
5. Final quality pass: missing fields, inconsistencies
```

### Anti-Patterns to Avoid
- **Bulk import without validation:** Species mislabeling is a known issue (39% error rate in industry). Validate each entry's scientific name against authoritative sources.
- **Inconsistent null handling:** Current schema uses `null` for closedSeason when absent. Maintain consistency - don't mix `null`, `undefined`, and empty strings.
- **Loading all images eagerly:** 200+ images at page load will cause performance degradation. Use lazy loading.
- **Hardcoded categories:** Currently uses "raubfisch", "friedfisch", "salmonide", "salzwasser", "meeresfruechte". Don't invent new categories mid-expansion - standardize first.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image lazy loading | Custom scroll listener | IntersectionObserver API | Native API, handles edge cases (resize, dynamic content), better performance |
| Data validation | Manual field checking | JSON Schema validator (build time) | Catches missing/wrong types, ensures consistency across 200+ records |
| SVG fallback generation | Complex inline SVG | Existing `_fishFallbackSvg()` function | Already implemented in fish-ui.js line 328, handles missing images |
| Array filtering performance | Custom indexing | Native `Array.filter()` | For 200 items, native is fast enough (<1ms). Optimization premature. |

**Key insight:** At 200 records, vanilla JavaScript array operations remain performant. The "sweet spot" for browser performance is ~10,000 records (research confirmed). Don't over-engineer.

## Common Pitfalls

### Pitfall 1: Species Identification Errors
**What goes wrong:** Incorrect scientific names, mislabeled species, confusion between similar species
**Why it happens:** Certification measures don't guarantee accuracy - industry studies show 39.1% of samples mislabeled, with 26.2% involving species substitution
**How to avoid:** Cross-reference every scientific name with authoritative sources:
  - Eschmeyer's Catalog of Fishes (California Academy of Sciences)
  - Kottelat & Freyhof (2007) for European freshwater
  - FishBase (fishbase.org) for verification
**Warning signs:** Missing scientific name, generic descriptions, duplicate species with different names

### Pitfall 2: Inconsistent Data Structure
**What goes wrong:** Some fish have `baits: ["Brot", "Teig"]`, others have `baits: ["Brot (weiß)", "Teig (Käse)"]` - mixing specificity levels
**Why it happens:** Manual data entry by different people, no validation schema
**How to avoid:**
  - Define specificity guidelines BEFORE bulk data entry
  - Use JSON Schema validation in build step
  - Consistent field presence: always include `edibility` object, use `null` for N/A fields
**Warning signs:** Field length variance (some fish have 2 tips, others have 8), mixed null/undefined/empty string usage

### Pitfall 3: Copyright Violation on Images
**What goes wrong:** Using copyrighted fish illustrations without permission
**Why it happens:** Google Images contains mix of free and copyrighted content
**How to avoid:**
  - Use only verified public domain sources (publicdomainvectors.org, freesvg.org with CC0 license)
  - Document image source and license for each SVG in imageCredit field
  - Generate simple SVGs programmatically for species lacking free images
**Warning signs:** High-quality commercial-looking illustrations without clear CC0/public domain license

### Pitfall 4: Stale/Expired Data
**What goes wrong:** Closed seasons, minimum sizes, regulations change over time
**Why it happens:** Data isn't updated, no designated data steward
**How to avoid:**
  - Add data freshness metadata: `dataVersion`, `lastUpdated`
  - Note regulation variability: "Variiert nach Bundesland in Österreich"
  - Focus on general biological data (habitat, diet, behavior) over changing regulations
**Warning signs:** Absolute statements about regulations without geographic qualifiers

### Pitfall 5: Performance Degradation on Initial Load
**What goes wrong:** App loads slowly with 200+ fish species and images
**Why it happens:** All images loaded eagerly, large JSON parsed synchronously
**How to avoid:**
  - Implement lazy loading for images (IntersectionObserver)
  - Consider initial render of 20-30 cards, then load more on scroll
  - fish-data.json at 200 species ~500KB - acceptable for embedded data
**Warning signs:** Initial page load >3 seconds on 3G connection

## Code Examples

Verified patterns from existing codebase and best practices:

### Lazy Loading Implementation
```javascript
// Add to fish-ui.js after renderFishList
function initLazyLoading() {
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px'
    });

    document.querySelectorAll('img.lazy').forEach(function(img) {
        imageObserver.observe(img);
    });
}

// Modify renderFishList to use data-src instead of src:
// Change: '<img class="fish-card__image" src="' + _escAttr(fish.image) + '"'
// To: '<img class="fish-card__image lazy" data-src="' + _escAttr(fish.image) + '" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect fill=\'%23e8f0e8\' width=\'200\' height=\'120\'/%3E%3C/svg%3E"'
```

### Extended Fish Species Schema
```javascript
// Add to config.js typedef
/**
 * @property {Object} edibility - Culinary and taste information
 * @property {number} edibility.rating - Edibility rating 1-5 (1=nicht essbar, 5=ausgezeichnet)
 * @property {string} edibility.taste - "mild" | "medium" | "kräftig" | "stark"
 * @property {string} edibility.texture - "zart" | "fest" | "mager" | "fett"
 * @property {Array<string>} edibility.preparation - ["Braten", "Grillen", "Räuchern", etc.]
 * @property {string} edibility.notes - Special culinary notes
 */

// Example fish entry with edibility:
{
  "id": "wolfsbarsch",
  "name": "Wolfsbarsch",
  "scientificName": "Dicentrarchus labrax",
  // ... existing fields ...
  "edibility": {
    "rating": 5,
    "taste": "mild",
    "texture": "fest",
    "preparation": ["Grillen", "Braten", "Dämpfen", "Im Ganzen backen"],
    "notes": "Einer der besten Speisefische der Adria. Weißes, festes Fleisch mit feinem Geschmack."
  }
}
```

### Rendering Edibility Information
```javascript
// Add to renderFishDetail in fish-ui.js
var edibilityHtml = '';
if (fish.edibility) {
    var stars = '';
    for (var i = 1; i <= 5; i++) {
        stars += '<span class="edibility-star' + (i > fish.edibility.rating ? ' empty' : '') + '">★</span>';
    }

    var prepHtml = '';
    fish.edibility.preparation.forEach(function(prep) {
        prepHtml += '<span class="fish-badge fish-badge--prep">' + _esc(prep) + '</span>';
    });

    edibilityHtml =
        '<div class="fish-detail__section-title">Kulinarische Eignung</div>' +
        '<div class="fish-detail__edibility">' +
            '<div class="edibility-rating">' + stars + '</div>' +
            '<div class="edibility-info">' +
                '<strong>Geschmack:</strong> ' + _esc(fish.edibility.taste) + ' | ' +
                '<strong>Textur:</strong> ' + _esc(fish.edibility.texture) +
            '</div>' +
            '<div class="fish-detail__badges">' + prepHtml + '</div>' +
            (fish.edibility.notes ? '<p class="edibility-notes">' + _esc(fish.edibility.notes) + '</p>' : '') +
        '</div>';
}

// Insert into detail.innerHTML before tips section
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scroll event listeners for lazy loading | IntersectionObserver API | ~2017 (widespread support 2019) | Better performance, handles edge cases, less code |
| Manual reflow optimization with DocumentFragment | Direct DOM manipulation | Modern browsers ~2020 | Browsers now batch DOM operations, DocumentFragment advantage marginal |
| Embedded base64 images | SVG files with lazy loading | Ongoing trend | Better caching, smaller payload, scalable graphics |
| LocalStorage for offline data | IndexedDB for structured data | ~2018 best practice shift | Larger storage quota, better for complex objects |

**Deprecated/outdated:**
- **Base64 embedding in JSON:** Inflates JSON size, prevents image caching. Use file references with Service Worker caching.
- **Synchronous data validation at runtime:** Slows initial load. Move validation to build/test step.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Adriatic species count for angler's catalog**
   - What we know: 444 confirmed marine species in Adriatic, but many are deep-water or non-angler targets
   - What's unclear: Which subset is relevant for recreational fishing (likely 80-120 species)
   - Recommendation: Focus on commonly encountered species, include rare but prized game fish, exclude deep-sea/commercial-only species

2. **Austrian closed season variability**
   - What we know: Closed seasons vary by Bundesland (federal state)
   - What's unclear: Whether to include state-specific data or generic warnings
   - Recommendation: Use generic approach with note "Variiert nach Bundesland" to avoid outdated state-specific data

3. **Bait color specificity**
   - What we know: Bait color matters (chartreuse vs natural, bright vs subdued)
   - What's unclear: How granular to make bait recommendations per species
   - Recommendation: Add general color guidance in tips array ("Bei trübem Wasser grelle Farben"), avoid species-level color arrays (too complex, low ROI)

4. **Image licensing verification**
   - What we know: Multiple public domain SVG sources exist
   - What's unclear: Legal verification process for each image's license
   - Recommendation: Use only CC0/public domain sources, document source URL in imageCredit, generate simple SVGs for any questionable cases

## Sources

### Primary (HIGH confidence)
- MDN Web Docs - IntersectionObserver API: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver_API
- MDN Web Docs - IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Existing codebase (fish-ui.js, config.js, fish-data.json) - Direct analysis

### Secondary (MEDIUM confidence)
- [RivFISH database - European freshwater fish species](https://www.kmae-journal.org/articles/kmae/full_html/2025/01/kmae250001/kmae250001.html) - 667 species documented
- [Checklist of Adriatic Sea Fishes (ResearchGate)](https://www.researchgate.net/publication/287615405_Checklist_of_the_Adriatic_Sea_Fishes) - 444 confirmed species
- [Fish Culinary Profiles - Chefs Resources](https://www.chefs-resources.com/seafood/finfish/fish-index/) - Taste/texture categorization
- [Offline-first Frontend Apps 2025 - LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) - IndexedDB best practices
- [IntersectionObserver for Lazy Loading - Medium](https://medium.com/@1nick1patel1/7-intersectionobserver-plays-for-lazy-everything-js-2b5de03fe7fa) - 2025 best practices

### Tertiary (LOW confidence)
- [JavaScript Filter Performance - Better Programming](https://betterprogramming.pub/performance-analysis-of-javascript-array-prototype-filter-616e3e3d316f) - Performance analysis for array filtering
- [Fish Product Mislabeling - PLOS One](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0098691) - 39% mislabeling rate in industry
- [Public Domain Vectors - Fish](https://publicdomainvectors.org/en/tag/fish) - 647+ copyright-free fish SVGs
- [Lure Color Selection - Bass Resource](https://www.bassresource.com/beginner/Choosing_Colors_selection.html) - Bait color recommendations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native browser APIs, existing codebase patterns verified
- Architecture: HIGH - Existing fish-ui.js patterns proven, IntersectionObserver well-documented
- Pitfalls: MEDIUM - Industry data quality issues documented, but fish-specific pitfalls inferred
- Fish species sources: MEDIUM - Databases exist and are authoritative, but subsetting for anglers requires domain judgment
- Edibility schema: MEDIUM - Culinary categories standardized, but integration with existing schema not production-tested

**Research date:** 2026-02-07
**Valid until:** ~60 days (data structure patterns stable, browser APIs mature)

**Key dependencies for planning:**
- No new libraries needed (all native APIs)
- Data collection is the long pole (200+ species × 15+ fields each)
- Image sourcing secondary to data structure (fallback SVG exists)
- Lazy loading implementation straightforward (20-30 lines of code)
