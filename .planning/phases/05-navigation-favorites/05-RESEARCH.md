# Phase 5: Navigation & Favorites - Research

**Researched:** 2026-02-09
**Domain:** Tab navigation, favorites management, IndexedDB persistence
**Confidence:** HIGH

## Summary

Phase 5 implements bottom tab navigation and favorites management for a vanilla JavaScript PWA fishing app. The codebase already has tab UI in place (HTML/CSS complete), IndexedDB storage layer operational, and fish detail views with heart button placeholders. This phase focuses on wiring up navigation state management, favorites toggle optimistic UI, and ensuring accessibility compliance.

**Key architectural insight:** The app already uses a section-switching pattern with `.section.active` class toggling. The existing `setupTabs()` in app.js handles tab clicks and section transitions. The IndexedDB layer (`storage.js`) already provides `addFavorite()`, `removeFavorite()`, and `getFavorites()` methods. Phase 5 connects these existing pieces and adds the favorites tab rendering logic.

**Primary recommendation:** Leverage existing infrastructure (tab HTML/CSS, storage layer, section switching) and focus on three integration tasks: (1) ensure tab navigation updates URL hash for bookmarkability, (2) implement optimistic UI for heart button toggles, (3) wire favorites section to display saved fish with click-to-detail navigation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| IndexedDB API | Native | Persistent favorites storage | Native browser API, no external deps, works offline, already integrated in codebase |
| History API | Native | URL hash routing for tabs | Native pushState/hash navigation, enables bookmarking specific tabs |
| IntersectionObserver | Native | Lazy loading fish images | Already used for lazy loading in `fish-ui.js`, proven pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | Vanilla JS codebase, all necessary APIs are native |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hash routing | History API pushState | pushState requires server-side routing for deep links, hash routing works with static PWA |
| Manual event listeners | Event delegation | Event delegation more efficient but current codebase uses direct listeners consistently |

**Installation:**
```bash
# No packages required - all native APIs
```

## Architecture Patterns

### Recommended Project Structure
```
fishing-app/
├── js/
│   ├── app.js              # Tab navigation state, favorites section rendering (MODIFY)
│   ├── storage.js          # IndexedDB favorites CRUD (ALREADY COMPLETE)
│   ├── fish-ui.js          # Fish cards, detail view with heart button (MODIFY)
│   └── config.js           # Config constants (may add TABS/SECTIONS constants)
├── css/
│   └── style.css           # Tab bar, favorites styles (MOSTLY COMPLETE)
└── index.html              # Tab bar markup, favorites section (ALREADY PRESENT)
```

### Pattern 1: Tab Navigation with URL Hash Routing
**What:** Update URL hash on tab click, read hash on page load to restore active tab
**When to use:** When tabs represent distinct app states users may want to bookmark
**Example:**
```javascript
// On tab click
function switchTab(tabId, sectionId) {
    // ... existing section switching logic ...

    // Update URL hash for bookmarkability
    const hashMap = {
        'section-weather': '#weather',
        'section-fish': '#fish',
        'section-favorites': '#favorites'
    };
    window.location.hash = hashMap[sectionId] || '';
}

// On page load
window.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash;
    const hashToSection = {
        '#weather': 'section-weather',
        '#fish': 'section-fish',
        '#favorites': 'section-favorites'
    };
    const targetSection = hashToSection[hash];
    if (targetSection) {
        switchTab(/* derive tab ID */, targetSection);
    }
});
```

### Pattern 2: Optimistic UI for Favorites Toggle
**What:** Update UI immediately on click, then persist to IndexedDB asynchronously
**When to use:** Actions that almost always succeed and users expect instant feedback
**Example:**
```javascript
// Source: Optimistic UI pattern from freecodecamp.org/derekndavis.com
async function toggleFavorite(fishId) {
    // Optimistic update
    const idx = favoriteIds.indexOf(fishId);
    const wasAdding = idx === -1;

    if (wasAdding) {
        favoriteIds.push(fishId);
    } else {
        favoriteIds.splice(idx, 1);
    }

    // Update UI immediately
    updateHeartButton(fishId, wasAdding);

    // Persist to IndexedDB (async)
    try {
        if (wasAdding) {
            await addFavorite(fishId);
        } else {
            await removeFavorite(fishId);
        }
    } catch (e) {
        // Rollback on error
        if (wasAdding) {
            favoriteIds.splice(favoriteIds.indexOf(fishId), 1);
        } else {
            favoriteIds.push(fishId);
        }
        updateHeartButton(fishId, !wasAdding);
        console.error('Favorit toggle fehlgeschlagen:', e);
    }
}
```

### Pattern 3: Favorites Section as Filtered Fish List
**What:** Reuse `renderFishList()` with filtered data, different `onSelect` callback
**When to use:** When favorites display is same format as main fish catalog
**Example:**
```javascript
// Source: Existing app.js pattern
async function renderFavoritesSection() {
    favoriteIds = await getFavorites();
    const favFish = fishData.filter(f => favoriteIds.indexOf(f.id) !== -1);
    const favContainer = document.getElementById('favorites-list');

    if (favFish.length === 0) {
        favContainer.innerHTML = '<p class="empty-state">Noch keine Favoriten...</p>';
    } else {
        // Reuse renderFishList, override onSelect to switch to fish tab
        renderFishList(favContainer, favFish, function(fish) {
            switchTab('tab-fish', 'section-fish');
            onFishSelect(fish);
        });
    }
}
```

### Anti-Patterns to Avoid
- **Storing full fish objects in favorites:** Store only IDs, not full objects (storage bloat, data duplication)
- **Re-rendering favorites on every toggle:** Only update the affected card, don't re-render entire list
- **Blocking UI on IndexedDB writes:** Use optimistic updates, persist asynchronously
- **Forgetting to refresh favorites tab:** When user toggles favorite, invalidate favorites tab cache

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL routing | Custom router with regex parsing | Hash-based routing with simple object map | Hash routing is trivial (`window.location.hash`), works with static hosting, no server-side config |
| State synchronization across tabs | Custom event bus | Existing function calls | App is single-page, no cross-tab sync needed |
| Favorites conflict resolution | Custom CRDT or merge logic | IndexedDB last-write-wins | Single user app, no concurrent edits from multiple devices |
| Touch gesture detection | Custom touch event parsing | Native click events with CSS active states | Tab bar uses simple clicks, no swipe gestures needed |

**Key insight:** This phase is mostly integration work, not building new systems. The hard parts (IndexedDB transactions, image lazy loading, section switching) are already solved. Focus on wiring existing pieces correctly.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Event Listeners on Removed DOM
**What goes wrong:** Adding event listeners to fish cards, then removing cards without cleaning up listeners causes memory leaks in SPAs
**Why it happens:** JavaScript keeps references to DOM elements through event listeners even after elements are removed from the tree
**How to avoid:** Use event delegation on parent container OR ensure cleanup when re-rendering
**Warning signs:** Heap size grows on repeated tab switches, DevTools memory profiler shows detached DOM nodes
**Solution:**
```javascript
// GOOD: Event delegation (already used in renderFishList)
grid.addEventListener('click', function(e) {
    const card = e.target.closest('.fish-card');
    if (card) {
        const fishId = card.dataset.fishId;
        onSelect(findFishById(fishId));
    }
});

// BAD: Direct listeners on each card (avoid if re-rendering frequently)
cards.forEach(card => {
    card.addEventListener('click', () => { /* ... */ }); // No cleanup!
});
```

### Pitfall 2: IndexedDB Transaction Inactive Errors
**What goes wrong:** Calling async APIs (like `fetch()`) inside IndexedDB transaction scope causes `TransactionInactiveError`
**Why it happens:** IndexedDB commits transactions within a single event tick. Awaiting external async work leaves the transaction scope
**How to avoid:** Complete all IndexedDB operations synchronously in transaction scope, do async work before/after
**Warning signs:** Errors like "The transaction has finished" or "The transaction is not active"
**Solution:**
```javascript
// GOOD: All IndexedDB work in one scope
async function addFavorite(fishId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('favorites', 'readwrite');
        const store = tx.objectStore('favorites');
        store.put({ fishId, addedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
    });
}

// BAD: Mixing IndexedDB with external async
async function addFavorite(fishId) {
    const db = await getDB();
    const tx = db.transaction('favorites', 'readwrite');
    await fetch('/api/sync'); // ERROR! Transaction commits before this returns
    tx.objectStore('favorites').put({ fishId }); // TransactionInactiveError
}
```

### Pitfall 3: Race Condition on Rapid Tab Switches
**What goes wrong:** User clicks Fish tab, then immediately clicks Favorites before Fish section finishes loading, causing stale data or orphaned loaders
**Why it happens:** Section transitions are async (lazy load images, fetch data), but tab clicks are sync
**How to avoid:** Track "loading" state per section, cancel pending work on tab switch
**Warning signs:** Loading spinners that never clear, stale data from previous tab visible momentarily
**Solution:**
```javascript
let currentLoadingSection = null;

function switchTab(tabId, sectionId) {
    // Cancel previous section's pending work
    if (currentLoadingSection && currentLoadingSection.abort) {
        currentLoadingSection.abort();
    }

    // ... existing section switching ...

    if (sectionId === 'section-favorites') {
        currentLoadingSection = renderFavoritesSection();
    }
}
```

### Pitfall 4: Forgetting Accessibility for Dynamically Updated Content
**What goes wrong:** Screen readers don't announce when favorites count changes or tab content loads
**Why it happens:** Dynamic DOM updates don't trigger accessibility announcements without ARIA live regions
**How to avoid:** Use `aria-live="polite"` for result counters, set focus on new content
**Warning signs:** Screen reader users report confusion about app state changes
**Solution:**
```javascript
// HTML: aria-live region for favorites count
<div id="favorites-count" aria-live="polite" class="sr-only"></div>

// JS: Announce changes
function updateFavoritesCount(count) {
    const announcer = document.getElementById('favorites-count');
    announcer.textContent = `${count} Favoriten gespeichert`;
}
```

### Pitfall 5: Tab Bar Visibility on iOS Safari Safe Area
**What goes wrong:** Bottom tab bar obscured by iPhone home indicator or notch in landscape
**Why it happens:** Forgetting to account for `env(safe-area-inset-bottom)` in iOS
**How to avoid:** Use CSS environment variables for padding
**Warning signs:** Tab bar partially hidden on iOS devices, user complaints about tap targets
**Solution:**
```css
/* Already likely present, verify: */
.tab-bar {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

## Code Examples

### Example 1: Hash-Based Tab Routing on Page Load
```javascript
// Source: Vanilla SPA patterns (dev.to/managervcf, accreditly.io)
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash.slice(1); // Remove '#'

    const routes = {
        'weather': { tab: 'tab-weather', section: 'section-weather' },
        'fish': { tab: 'tab-fish', section: 'section-fish' },
        'favorites': { tab: 'tab-favorites', section: 'section-favorites' }
    };

    const route = routes[hash] || routes['weather']; // Default to weather
    switchTab(route.tab, route.section);
});
```

### Example 2: Optimistic Heart Button Toggle with Rollback
```javascript
// Source: Optimistic UI pattern (derekndavis.com, freecodecamp.org)
async function toggleFavorite(fishId) {
    const idx = favoriteIds.indexOf(fishId);
    const wasAdding = idx === -1;

    // Optimistic UI update
    if (wasAdding) {
        favoriteIds.push(fishId);
    } else {
        favoriteIds.splice(idx, 1);
    }

    const favBtn = document.getElementById('fish-fav-btn');
    if (favBtn) {
        favBtn.classList.toggle('is-favorite', wasAdding);
        favBtn.innerHTML = wasAdding ? '&#9829;' : '&#9825;';
        favBtn.setAttribute('aria-pressed', String(wasAdding));
    }

    // Persist asynchronously
    try {
        if (wasAdding) {
            await addFavorite(fishId);
        } else {
            await removeFavorite(fishId);
        }
    } catch (e) {
        // Rollback on failure
        if (wasAdding) {
            favoriteIds.splice(favoriteIds.indexOf(fishId), 1);
        } else {
            favoriteIds.push(fishId);
        }
        if (favBtn) {
            favBtn.classList.toggle('is-favorite', !wasAdding);
            favBtn.innerHTML = !wasAdding ? '&#9829;' : '&#9825;';
            favBtn.setAttribute('aria-pressed', String(!wasAdding));
        }
        console.error('Favorit toggle fehlgeschlagen:', e);
        alert('Favorit konnte nicht gespeichert werden.');
    }
}
```

### Example 3: Reusing renderFishList for Favorites
```javascript
// Source: Existing app.js pattern
async function renderFavoritesSection() {
    try {
        favoriteIds = await getFavorites();
    } catch (e) {
        console.error('Favoriten laden fehlgeschlagen:', e);
        favoriteIds = [];
    }

    const favContainer = document.getElementById('favorites-list');
    if (!favContainer) return;

    const favFish = fishData.filter(f => favoriteIds.indexOf(f.id) !== -1);

    if (favFish.length === 0) {
        favContainer.innerHTML = '<p class="empty-state">Noch keine Favoriten gespeichert. Tippe auf das Herz bei einem Fisch, um ihn hier zu sehen.</p>';
    } else {
        // Reuse renderFishList with custom onSelect
        renderFishList(favContainer, favFish, function(fish) {
            // Switch to fish tab and show detail
            switchTab('tab-fish', 'section-fish');
            onFishSelect(fish);
        });
    }
}
```

### Example 4: Event Delegation for Heart Button in Fish Detail
```javascript
// Source: Existing fish-ui.js pattern, enhanced for favorites
function renderFishDetail(container, fish, catchProb, isFav, onFavToggle) {
    // ... existing rendering logic ...

    container.innerHTML = /* ... fish detail HTML with heart button ... */;

    // Event delegation: single listener on container
    container.addEventListener('click', function(e) {
        if (e.target.matches('#fish-fav-btn')) {
            e.preventDefault();
            onFavToggle(); // Calls toggleFavorite(fish.id)
        } else if (e.target.matches('#fish-back-btn')) {
            // ... back button logic ...
        }
    });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `hidden` attribute toggle | CSS `.active` class with transitions | Phase 2 (Dark Theme) | Smoother animations, centralized transition logic |
| Imperative `addEventListener` on each element | Event delegation on parent | Best practice since 2015+ | Fewer listeners, better memory management |
| Callbacks for async ops | Promises / async-await | ES2017 (async-await) | Cleaner error handling, no callback hell |
| `localStorage` for structured data | IndexedDB for favorites | Phase 3+ (modern PWAs) | Larger storage quota, structured queries, offline-first |

**Deprecated/outdated:**
- `window.onhashchange` direct assignment: Use `addEventListener('hashchange')` instead (supports multiple listeners)
- Storing favorites in `localStorage` as JSON string: Use IndexedDB for structured data (scales better, avoids parse overhead)

## Open Questions

1. **Should favorites sync across devices?**
   - What we know: Current implementation is local-only IndexedDB
   - What's unclear: User expectation for multi-device sync
   - Recommendation: Ship local-only for Phase 5, consider cloud sync in Phase 7 if user feedback requests it. Cloud sync adds significant complexity (auth, conflict resolution, API endpoint).

2. **Should tab switches preserve scroll position?**
   - What we know: Current code has `_fishListScrollY` to preserve scroll on fish detail → list transition
   - What's unclear: Whether each tab should remember scroll position or reset to top
   - Recommendation: Reset scroll to top on tab switch (user expects fresh view), but preserve scroll within fish catalog pagination.

3. **Should URL hash update trigger history entries?**
   - What we know: `window.location.hash = '#fish'` creates history entry, back button works
   - What's unclear: Whether users expect back button to navigate tabs or exit app
   - Recommendation: Use hash routing (creates history), common mobile pattern. If user reports confusion, add `replaceState` option.

4. **Maximum favorites limit?**
   - What we know: IndexedDB quota varies by browser (50MB+), each favorite is ~100 bytes (just ID + timestamp)
   - What's unclear: Whether to impose artificial limit (e.g., 100 favorites max)
   - Recommendation: No artificial limit for Phase 5. IndexedDB can easily handle all 200 fish as favorites. Monitor in Phase 6 (Offline Enhancement) if storage becomes issue.

## Sources

### Primary (HIGH confidence)
- [MDN: ARIA tab role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role) - ARIA accessibility standards for tab navigation
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - IndexedDB transaction best practices
- [javascript.info: IndexedDB](https://javascript.info/indexeddb) - Error handling patterns
- [W3C: WAI-ARIA 1.3](https://w3c.github.io/aria/) - 2026 accessibility specifications

### Secondary (MEDIUM confidence)
- [Mobile Navigation Patterns 2026 - Phone Simulator](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) - Bottom tab bar UX best practices (3-5 items, thumb zone)
- [Derek N. Davis: Optimistic UI](https://derekndavis.com/posts/lightning-fast-front-end-build-optimistic-ui) - Optimistic update pattern with rollback
- [FreeCodeCamp: Optimistic UI Pattern](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) - Heart button toggle examples
- [Auth0: 4 Types of Memory Leaks](https://auth0.com/blog/four-types-of-leaks-in-your-javascript-code-and-how-to-get-rid-of-them/) - Event listener cleanup patterns
- [DEV.to: Vanilla JS SPA](https://dev.to/melguachun/relearning-the-past-vanilla-javascript-single-page-application-437i) - Hash routing implementation

### Tertiary (LOW confidence - framework-specific, adapted for vanilla JS)
- [Accreditly: Vanilla JS SPA](https://accreditly.io/articles/creating-single-page-applications-with-vanilla-javascript) - General SPA patterns
- [Medium: State Management Trends 2026](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de) - State sync patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native APIs (IndexedDB, History API, IntersectionObserver) are well-documented and already integrated in codebase
- Architecture: HIGH - Existing patterns (`setupTabs`, `renderFishList`, `storage.js` methods) are proven and tested
- Pitfalls: HIGH - Memory leaks, IndexedDB transaction errors, and accessibility issues are well-documented with clear solutions

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable browser APIs, unlikely to change)

**Notes for planner:**
- Phase 5 is mostly integration work, not greenfield development
- HTML/CSS for tab bar and favorites section already exists (lines 298-333, 270-287 in index.html)
- IndexedDB storage layer is complete and tested (storage.js)
- Fish detail view has heart button placeholder ready (fish-ui.js line 279)
- Focus tasks on: (1) hash routing, (2) optimistic toggleFavorite, (3) renderFavoritesSection wiring
