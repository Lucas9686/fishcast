# FishCast - Angel-Wetter-App

## What This Is

Eine Progressive Web App (PWA) zum Angeln, die umfassende Wetterdaten mit einem detaillierten Fischkatalog kombiniert. Fokus auf Adriaküste und europäische Süßwassergebiete. Gebaut für Angler, die am Wasser schnell die relevanten Bedingungen und Fischinfos brauchen - auch offline.

## Core Value

Angler sehen auf einen Blick, ob das Wetter heute gut zum Angeln ist und welche Fische bei den aktuellen Bedingungen beißen - alles in einer App, auch ohne Internet.

## Requirements

### Validated

- ✓ Wetterdaten von Open-Meteo API abrufen und anzeigen — existing
- ✓ Standort per GPS, Suche oder Kartenklick wählen — existing
- ✓ Mondphasen und Solunar-Zeiten berechnen — existing
- ✓ Fang-Wahrscheinlichkeit berechnen und anzeigen — existing
- ✓ Fischkatalog mit Arten, Bildern und Details — existing
- ✓ Favoriten-System (Fische als Favorit speichern) — existing
- ✓ Offline-Funktionalität via Service Worker — existing
- ✓ Standort-Verlauf und letzte Position merken — existing
- ✓ Leaflet-Karte mit Marker-Interaktion — existing

### Active

- [ ] **Wetter-Seite mit 7-Tage-Accordion**: Heute aufgeklappt, restliche 6 Tage als Dropdowns eingeklappt
- [ ] **Umfassende Angel-Wetterdaten pro Tag**: Wind (Geschwindigkeit, Richtung, Böen), Luftdruck + Trend (steigend/fallend), Temperatur, Niederschlag, UV-Index, Sichtweite, Wellenhöhe, Sonnenauf-/untergang, Mondphase, Gezeiten, Solunar-Zeiten
- [ ] **Genaueste Wetter-API**: Recherche und Auswahl der genauesten verfügbaren Wetter-API für Angel-Zwecke
- [ ] **Fischkatalog erweitern**: Alle relevanten Fische und Meeresfrüchte der Adriaküste + europäische Süßwasserfische
- [ ] **Detaillierte Fisch-Infos**: Pro Fisch: Bild, deutscher + lateinischer Name, beste Köder (Typ + Farbe), Angel-Methode/Technik, Saison, Schonzeiten, Lebensraum (Tiefe, Gewässertyp, Region), Essbarkeit, Geschmack, Zubereitungstipps
- [ ] **Fisch-Filter & Suche**: Filter nach Gewässertyp (Adria/Süßwasser), Saison, Essbarkeit + Freitext-Suchfeld
- [ ] **Favoriten-Seite**: Eigener Tab für gespeicherte Lieblingsfische mit schnellem Zugriff
- [ ] **Bottom Tab Bar Navigation**: Tabs: Wetter | Fische | Favoriten
- [ ] **Dunkles Marine-Design**: Dark Theme mit Blau/Türkis-Akzenten, passend zum Angel-/Meeres-Thema
- [ ] **Offline-fähig**: Wetterdaten cachen, Fischkatalog immer verfügbar, PWA installierbar

### Out of Scope

- Social Features (Fänge teilen, Community) — Fokus auf persönliches Werkzeug
- Backend/Server — bleibt reine Client-Side-App mit öffentlichen APIs
- Fangtagebuch/Log — v2 Feature, erstmal nur Katalog und Favoriten
- Bezahl-APIs — nur kostenlose, schlüsselfreie APIs
- Multi-Sprache — nur Deutsch (de-AT)

## Context

### Bestehende Codebasis
Die App baut auf einer existierenden fishing-app auf (./fishing-app/). Diese enthält bereits:
- Vanilla JavaScript (ES2020+), kein Build-System, kein Framework
- Modulares IIFE-Pattern mit zentraler Config (config.js)
- Open-Meteo API für Wetter + Geocoding
- Leaflet 1.9.4 für Karten
- IndexedDB für Offline-Storage (Favoriten, History, Settings, WeatherCache)
- Service Worker für Offline-Caching
- 80+ Fisch-SVGs und fish-data.json Katalog
- Solunar/Mondphasen-Berechnung mit Fang-Wahrscheinlichkeit
- Grünes Theme (wird zu dunklem Marine-Theme umgebaut)

### Script-Ladereihenfolge (kritisch)
config.js → utils.js → api.js → solunar.js → storage.js → map.js → fish-ui.js → app.js

### Bestehende Datenstruktur
- FishSpecies: id, name, scientificName, image, family, description, size, habitat, waterTypes, techniques, baits, tips, weatherPrefs, season, closedSeason, difficulty, catchAndRelease, minSize, category
- LocationData: lat, lon, name, timezone
- WeatherData: current conditions, hourly (48h), daily (7d)
- CatchProbability: score (0-100), rating, color, factor breakdown, tip

## Constraints

- **Tech Stack**: Vanilla JavaScript, kein Framework, kein Build-System — bestehende Architektur beibehalten
- **APIs**: Nur kostenlose, schlüsselfreie APIs (Open-Meteo oder vergleichbar)
- **Hosting**: Statisches Hosting, kein Backend-Server
- **Offline**: Muss ohne Internet nutzbar sein (Fischkatalog komplett, Wetter gecacht)
- **Mobile-First**: Primär für Smartphone-Nutzung am Wasser optimiert
- **Browser**: Moderne Browser (Chrome 90+, Firefox 88+, Safari 14+)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auf bestehender App aufbauen | Spart Entwicklungszeit, bewährte Architektur | — Pending |
| Dunkles Marine-Design | Passt zum Angel-/Meeres-Thema, angenehm bei frühem Morgen | — Pending |
| Fisch-Daten fest eingebaut | Offline-Verfügbarkeit garantiert, kein Server nötig | — Pending |
| Bottom Tab Bar | Standard Mobile-Navigation, schneller Wechsel zwischen Seiten | — Pending |
| Open-Meteo beibehalten (vorbehaltlich Recherche) | Kostenlos, kein API-Key, gute Marine-Daten, bereits integriert | — Pending |

---
*Last updated: 2026-02-07 after initialization*
