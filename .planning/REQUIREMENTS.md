# Requirements: FishCast - Angel-Wetter-App

**Defined:** 2026-02-07
**Core Value:** Angler sehen auf einen Blick, ob das Wetter heute gut zum Angeln ist und welche Fische bei den aktuellen Bedingungen beißen - auch offline.

## v1 Requirements

### Wetter (WETTER)

- [x] **WETTER-01**: Nutzer sieht 7-Tage-Wettervorhersage als Accordion (heute aufgeklappt, restliche 6 Tage eingeklappt)
- [x] **WETTER-02**: Pro Tag werden Luftdruck (aktuell + Trend steigend/fallend/stabil) angezeigt
- [x] **WETTER-03**: Pro Tag werden Wind-Daten angezeigt (Geschwindigkeit, Richtung, Böen)
- [x] **WETTER-04**: Pro Tag werden Solunar-Zeiten angezeigt (2 Major, 2 Minor Fressperioden)
- [x] **WETTER-05**: Pro Tag werden Temperatur (Luft) und Niederschlag angezeigt
- [x] **WETTER-06**: Pro Tag werden Mondphase und Mondauf-/untergang angezeigt
- [x] **WETTER-07**: Pro Tag werden UV-Index und Sichtweite angezeigt
- [x] **WETTER-08**: Pro Tag werden Wellenhöhe und Marine-Daten angezeigt (für Küstenstandorte)
- [x] **WETTER-09**: Pro Tag werden Sonnenauf- und -untergangszeiten angezeigt
- [x] **WETTER-10**: Pro Tag wird Gezeiteninformation angezeigt (Hoch-/Niedrigwasser für Küstenstandorte)
- [x] **WETTER-11**: Pro Tag wird ein berechneter Fang-Score (0-100) mit Bewertung angezeigt
- [x] **WETTER-12**: Luftdruck-Trend wird als 48h-Verlaufsgraph visualisiert
- [x] **WETTER-13**: Wetter-API liefert genaue, angel-relevante Daten (Open-Meteo Marine + Standard)

### Fischkatalog (FISCH)

- [ ] **FISCH-01**: App enthält 200+ Fischarten und Meeresfrüchte (Adriaküste + europäisches Süßwasser)
- [ ] **FISCH-02**: Pro Fisch werden Bild, deutscher Name und lateinischer Name angezeigt
- [ ] **FISCH-03**: Pro Fisch werden beste Köder angezeigt (Typ, Farbe, spezifische Empfehlungen)
- [ ] **FISCH-04**: Pro Fisch werden Angel-Methoden und Techniken beschrieben
- [ ] **FISCH-05**: Pro Fisch werden Saison und Schonzeiten angezeigt
- [ ] **FISCH-06**: Pro Fisch wird Lebensraum beschrieben (Tiefe, Gewässertyp, Region, Struktur)
- [ ] **FISCH-07**: Pro Fisch werden Essbarkeit (Rating), Geschmack und Zubereitungstipps angezeigt
- [ ] **FISCH-08**: Fisch-Daten sind fest in der App eingebaut (kein Server nötig, offline verfügbar)

### Filter & Suche (FILTER)

- [ ] **FILTER-01**: Nutzer kann Fische nach Gewässertyp filtern (Salzwasser/Süßwasser)
- [ ] **FILTER-02**: Nutzer kann Fische nach Saison filtern ("Was beißt jetzt?")
- [ ] **FILTER-03**: Nutzer kann Fische nach Essbarkeit filtern
- [ ] **FILTER-04**: Nutzer kann Fische per Freitext suchen (Name, deutscher + lateinischer)
- [ ] **FILTER-05**: Filter können kombiniert werden (UND-Logik: Süßwasser + essbar + Saison)
- [ ] **FILTER-06**: Aktive Filter zeigen Ergebnis-Zähler ("23 Arten gefunden")

### Favoriten (FAV)

- [ ] **FAV-01**: Nutzer kann Fische als Favorit speichern/entfernen
- [ ] **FAV-02**: Eigener Tab zeigt alle gespeicherten Lieblingsfische
- [ ] **FAV-03**: Favoriten sind offline verfügbar und persistent (IndexedDB)

### Navigation & UI (UI)

- [ ] **UI-01**: Bottom Tab Bar mit 3 Tabs: Wetter | Fische | Favoriten
- [x] **UI-02**: Dunkles Marine-Design (Dark Theme mit Blau/Türkis-Akzenten)
- [x] **UI-03**: App ist Mobile-First optimiert (Touch-friendly, responsive)
- [x] **UI-04**: Accordion-Animation für Wetter-Tage (smooth open/close)

### Offline & PWA (PWA)

- [ ] **PWA-01**: Fischkatalog ist komplett offline verfügbar
- [ ] **PWA-02**: Wetterdaten werden gecacht und bei fehlendem Internet aus Cache geladen
- [ ] **PWA-03**: App ist als PWA installierbar (manifest.json, Service Worker)
- [ ] **PWA-04**: Standort-Auswahl und letzte Position bleiben über Sessions erhalten

## v2 Requirements

### Erweiterte Features

- **V2-01**: Fangtagebuch - Nutzer kann Fänge mit Datum, Ort, Art, Größe und Foto loggen
- **V2-02**: Gespeicherte Angel-Orte mit Schnellzugriff
- **V2-03**: Angel-Vorschriften-Datenbank (regional, Adria + EU-Süßwasser)
- **V2-04**: Erweiterte Filter (Kampfstärke, Trophäen-Potenzial, Größenklasse)
- **V2-05**: Wetter-Benachrichtigungen bei idealen Bedingungen
- **V2-06**: Historische Wetter-Korrelation ("Beste Fänge bei diesen Bedingungen")

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social Features / Community | Fokus auf persönliches Werkzeug, nicht Social Network |
| Öffentliches GPS-Spot-Sharing | Privatsphäre der Angler, "Spot-Burning" vermeiden |
| Backend-Server / Accounts | Bleibt reine Client-Side-App |
| Bezahl-APIs | Nur kostenlose, schlüsselfreie APIs |
| Multi-Sprache | Nur Deutsch (de-AT) für v1 |
| Native App (iOS/Android) | PWA reicht für den Anwendungsfall |
| Echtzeit-Updates / Live-Feeds | Unnötig für Angeln, Batterie-Fresser |
| Sonar/Bluetooth-Integration | Hardware-Abhängigkeit, nicht für alle Nutzer |
| KI-Vorhersagen ("Perfekter Zeitpunkt") | Überverspricht, Angeln zu variabel |
| Catch-Leaderboards | Fördert Überfischung |

## Traceability

<!-- Updated during roadmap creation -->

| Requirement | Phase | Status |
|-------------|-------|--------|
| WETTER-01 | Phase 1 | Complete |
| WETTER-02 | Phase 1 | Complete |
| WETTER-03 | Phase 1 | Complete |
| WETTER-04 | Phase 1 | Complete |
| WETTER-05 | Phase 1 | Complete |
| WETTER-06 | Phase 1 | Complete |
| WETTER-07 | Phase 1 | Complete |
| WETTER-08 | Phase 1 | Complete |
| WETTER-09 | Phase 1 | Complete |
| WETTER-10 | Phase 1 | Complete |
| WETTER-11 | Phase 1 | Complete |
| WETTER-12 | Phase 1 | Complete |
| WETTER-13 | Phase 1 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| UI-04 | Phase 2 | Complete |
| FISCH-01 | Phase 3 | Pending |
| FISCH-02 | Phase 3 | Pending |
| FISCH-03 | Phase 3 | Pending |
| FISCH-04 | Phase 3 | Pending |
| FISCH-05 | Phase 3 | Pending |
| FISCH-06 | Phase 3 | Pending |
| FISCH-07 | Phase 3 | Pending |
| FISCH-08 | Phase 3 | Pending |
| FILTER-01 | Phase 4 | Pending |
| FILTER-02 | Phase 4 | Pending |
| FILTER-03 | Phase 4 | Pending |
| FILTER-04 | Phase 4 | Pending |
| FILTER-05 | Phase 4 | Pending |
| FILTER-06 | Phase 4 | Pending |
| FAV-01 | Phase 5 | Pending |
| FAV-02 | Phase 5 | Pending |
| FAV-03 | Phase 5 | Pending |
| UI-01 | Phase 5 | Pending |
| PWA-01 | Phase 6 | Pending |
| PWA-02 | Phase 6 | Pending |
| PWA-03 | Phase 6 | Pending |
| PWA-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after Phase 2 completion*
