---
project: Acrybia Tracker
version: 1.0.0
type: progressive-web-app
language: de
author_context: personal-productivity-tracking
last_updated: 2026-07-26
---

# ACrybia Tracker — Maschinenlesbare Projektspezifikation

## 1. Projekt-Metadaten

| Feld | Wert |
|------|------|
| `project_id` | `acrybia-tracker-pwa` |
| `primary_goal` | Tägliche Zielverfolgung (Tasks + Body) mit strukturierter Reflexion und Offline-First-Datenspeicherung |
| `target_platform` | Mobile Browser (PWA, installierbar) |
| `architecture` | Vanilla JS ES-Module, Modular/Lego-Prinzip, keine Build-Tools nötig |
| `offline_strategy` | IndexedDB (local) + optionale Supabase-Sync (background) |
| `ui_framework` | Tailwind CSS (CDN) |
| `chart_library` | Chart.js 4.x (CDN) |
| `icons` | Inline SVG (Data-URI), keine externen Assets |

---

## 2. Datenbank-Schema (IndexedDB + Supabase)

### 2.1 Store: `days` (Primary Key: `date` STRING "YYYY-MM-DD")

```json
{
  "date": "2026-07-26",
  "weekId": "2026-W30",
  "tasks": [
    {
      "id": "uuid-v4-string",
      "category": "arbeit|acrybia|sport|chinesisch|custom",
      "subcategory": "homeoffice|office|blank|krafttraining|schwimmen|boxen|fitnessboxen|pause|hsk1|hsk2|hsk3|hsk4|hsk5|hsk6",
      "detail": "string | freitext | 'fahrrad' | 'oepnv' | 'Thema | Unterthemen'",
      "startTime": "HH:MM | null",
      "endTime": "HH:MM | null",
      "priority": 1|2|3,
      "completed": true|false,
      "achievement": "string | was wurde erreicht | leer wenn nicht completed"
    }
  ],
  "reflection": {
    "biggestProblem": {
      "category": "arbeit|acrybia|sport|chinesisch|body|other",
      "text": "string"
    },
    "blocker": "string | was hat aufgehalten",
    "blockerWhy": "string | ursache",
    "tags": ["müdigkeit", "zeitdruck", "ablenkung", "technik", "gesundheit", "motivation"],
    "mood": 1|2|3|4|5,
    "energy": 1|2|3|4|5
  },
  "body": {
    "weight": 94.2,
    "startWeight": 102.0,
    "targetWeight": 89.0,
    "meals": {
      "morning": "string",
      "lunch": "string",
      "dinner": "string",
      "snack": "string"
    },
    "protein": 110
  },
  "completed": true|false
}
```

### 2.2 Store: `settings` (Primary Key: `key` STRING)

| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `startWeight` | FLOAT | Erstes eingetragenes Gewicht, Referenz für Kreisdiagramm |
| `targetWeight` | FLOAT | Default: 89.0 |

### 2.3 Store: `weekGoals` (Primary Key: `id` AUTO_INCREMENT)

```json
{
  "id": 1,
  "weekId": "2026-W30",
  "text": "string | ziel-beschreibung",
  "category": "arbeit|acrybia|sport|chinesisch|custom",
  "created": "ISO-8601-datetime"
}
```

### 2.4 Indexe

- `days.weekId` → für Wochenübersicht
- `weekGoals.weekId` → für Wochenziele

---

## 3. Kategorie-Konfiguration (Frontend)

Definiert in `js/app.js` → `app.categories`

```javascript
{
  "arbeit": {
    "icon": "briefcase",
    "color": "blue",
    "label": "Arbeit",
    "subs": {
      "homeoffice": { "label": "Homeoffice", "hasTime": true, "detailType": "blank" },
      "office": {
        "label": "Office",
        "hasTime": true,
        "detailType": "subsub",
        "children": {
          "fahrrad": { "label": "Fahrrad", "hasTime": true, "timeLabel": "Arbeitsweg" },
          "oepnv": { "label": "Öffentliche Verkehrsmittel", "hasTime": true, "timeLabel": "Arbeitsweg" }
        }
      }
    }
  },
  "acrybia": {
    "icon": "rocket",
    "color": "purple",
    "label": "Acrybia",
    "subs": {
      "blank": { "label": "Blank (Selbst eingeben)", "hasTime": true, "detailType": "text" }
    }
  },
  "sport": {
    "icon": "dumbbell",
    "color": "orange",
    "label": "Sport",
    "subs": {
      "krafttraining": { "label": "Krafttraining", "hasTime": true },
      "schwimmen": { "label": "Schwimmen", "hasTime": true },
      "boxen": { "label": "Boxen", "hasTime": true },
      "fitnessboxen": { "label": "Fitness Boxen", "hasTime": true },
      "pause": { "label": "Pause", "hasTime": true }
    }
  },
  "chinesisch": {
    "icon": "language",
    "color": "red",
    "label": "Chinesisch",
    "subs": {
      "hsk1": { "label": "HSK 1", "hasTime": true, "detailType": "hsk" },
      "hsk2": { "label": "HSK 2", "hasTime": true, "detailType": "hsk" },
      "hsk3": { "label": "HSK 3", "hasTime": true, "detailType": "hsk" },
      "hsk4": { "label": "HSK 4", "hasTime": true, "detailType": "hsk" },
      "hsk5": { "label": "HSK 5", "hasTime": true, "detailType": "hsk" },
      "hsk6": { "label": "HSK 6", "hasTime": true, "detailType": "hsk" }
    }
  },
  "custom": {
    "icon": "plus-circle",
    "color": "emerald",
    "label": "Weiteres",
    "subs": {
      "blank": { "label": "Blank (Selbst eingeben)", "hasTime": true, "detailType": "text" }
    }
  }
}
```

**detailType-Regeln:**
- `null/undefined` → kein Detail-Feld
- `"blank"` → Freitext-Input (Beschreibung)
- `"text"` → Freitext-Input (Beschreibung)
- `"subsub"` → Button-Grid aus `children`, gewählter Key wird in `detail` gespeichert
- `"hsk"` → Zwei Inputs: Thema + Unterthemen, gepiped als `"Thema | Unterthemen"`

---

## 4. UI-Tabs & Navigation

| Tab-ID | Label | Icon (FontAwesome) | Hauptfunktion |
|--------|-------|-------------------|---------------|
| `tasks` | Tasks | `fa-tasks` | Aufgaben erstellen, abschließen, Tagesfortschritt-Kreisdiagramm |
| `body` | Body | `fa-heartbeat` | Gewicht, Mahlzeiten, Protein, Gewichts-Ziel-Kreisdiagramm |
| `dashboard` | Dashboard | `fa-chart-pie` | Wochenübersicht (7 Tage), Kategorie-Statistik (lifetime) |
| `week` | Woche | `fa-calendar-week` | Wochenziele CRUD |

**Navigation:** Fixed bottom nav, `active`-Klasse auf aktuellem Tab.

---

## 5. Modale / Dialoge

| Modal-ID | Trigger | Felder | Aktion bei Speichern |
|----------|---------|--------|---------------------|
| `taskModal` | "Neue Aufgabe"-Button | Kategorie-Grid → Subkategorie-Grid → Detail-Input → Zeit (Start/Ende) → Priorität (1/2/3) | `app.saveTask()` → push zu `currentDay.tasks` → `db.saveDay()` |
| `completeTaskModal` | Check-Button auf Task | Textarea `achievement` | `app.completeTask()` → markiert Task als completed |
| `dayCompleteModal` | "Tagesabschluss"-Button (erscheint nur wenn alle Tasks completed) | Problem-Kategorie, Problem-Text, Blocker, Blocker-Why, Tags (Multi-Select), Mood-Slider (1-5), Energy-Slider (1-5) | `app.saveDayComplete()` → speichert in `day.reflection`, setzt `day.completed = true` |
| `weightSettingsModal` | Zahnrad-Icon im Body-Tab | Startgewicht (Float), Zielgewicht (Float, default 89) | `app.saveWeightSettings()` → speichert in IndexedDB `settings` |

---

## 6. Chart-Konfiguration

### 6.1 Tagesfortschritt (`taskChart`)
- **Typ:** Doughnut (Chart.js)
- **Daten:** `[completed_count, total - completed_count]`
- **Farben:** `[completed===total ? '#10b981' : '#3b82f6', '#1e293b']`
- **Cutout:** 75%
- **Anzeige:** Prozent-Text über dem Chart

### 6.2 Gewichts-Ziel (`weightChart`)
- **Typ:** Doughnut (Chart.js)
- **Berechnung:** `pct = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100`
- **Daten:** `[pct, 100 - pct]`
- **Farben:** `[pct >= 100 ? '#10b981' : '#f97316', '#1e293b']`
- **Cutout:** 75%

---

## 7. Service Worker (Caching-Strategie)

- **Cache-Name:** `acrybia-v1`
- **Strategie:** Cache-First für statische Assets, Network-Fallback für API
- **Offline-Fallback:** `index.html` für alle document-Requests
- **Gecachte Assets:** HTML, CSS, JS, CDN-Links (Tailwind, Chart.js, FontAwesome)

---

## 8. Supabase-Integration

```javascript
// Konfiguration in js/db.js
const SUPABASE_URL = "";  // MUSSTE GEFÜLLT WERDEN
const SUPABASE_KEY = "";  // MUSSTE GEFÜLLT WERDEN

// Sync-Methode
async syncToSupabase(day) {
  if (!supabase) return;
  await supabase.from('days').upsert(day);
}
```

**Tabellenname in Supabase:** `days` (Schema muss dem IndexedDB-Schema entsprechen)
**Sync-Verhalten:** Fire-and-forget im Hintergrund, Fehler werden geloggt aber nicht blockierend.

---

## 9. Export-Format

**Trigger:** Download-Button (Header, rechts)
**Dateiname:** `acrybia-export-YYYY-MM-DD.json`
**Struktur:**
```json
{
  "days": [ /* Array aller Day-Objekte */ ],
  "settings": [ /* Array von {key, value} */ ],
  "exportedAt": "2026-07-26T19:48:00.000Z"
}
```

---

## 10. Wochen-ID-Berechnung

**Algorithmus:** ISO-8601 Wochennummer
```javascript
function getWeekId(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
```

---

## 11. Dateistruktur

```
acrybia-pwa/
├── index.html              # App-Shell, alle Tabs, alle Modals
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker (Cache-First)
├── css/
│   └── style.css           # Custom Styles, Animationen, Tab-States
└── js/
    ├── db.js               # IndexedDB-Layer, Supabase-Connector, UUID, Week-ID
    ├── charts.js           # Chart.js Initialisierung & Update-Wrapper
    └── app.js              # Hauptcontroller, UI-Logik, Event-Handler
```

---

## 12. Farb-Mapping (Kategorien → Tailwind/CSS)

| Kategorie | CSS-Klasse | Hex (Primary) | Chart-Farbe |
|-----------|-----------|---------------|-------------|
| arbeit | `cat-arbeit` | `#3b82f6` (blue-500) | blue |
| acrybia | `cat-acrybia` | `#a855f7` (purple-500) | purple |
| sport | `cat-sport` | `#f97316` (orange-500) | orange |
| chinesisch | `cat-chinesisch` | `#ef4444` (red-500) | red |
| custom | `cat-custom` | `#10b981` (emerald-500) | emerald |

**Prioritäts-Farben:**
- P1: `#ef4444` (red)
- P2: `#eab308` (yellow)
- P3: `#3b82f6` (blue)

---

## 13. Erweiterungspunkte (für andere KIs)

Um eine neue Kategorie hinzuzufügen:
1. Eintrag in `app.categories` in `js/app.js` erstellen
2. `icon`, `color`, `label`, `subs` definieren
3. Bei Bedarf neuen `detailType` in `renderDetailInput()` behandeln
4. CSS-Klasse `.cat-[name]` in `style.css` definieren

Um ein neues Reflexionsfeld hinzuzufügen:
1. Input-Feld in `dayCompleteModal` in `index.html` ergänzen
2. Feld in `app.saveDayComplete()` erfassen
3. Schema in `day.reflection` erweitern
4. `db.js` Schema-Dokumentation aktualisieren

Um Supabase-Tabellen anzupassen:
1. Tabelle in Supabase anlegen mit Spalten, die dem JSON-Schema entsprechen
2. RLS-Policies konfigurieren (anon-key = read/write für authentifizierte Nutzer)
3. `syncToSupabase()` anpassen falls Tabellenname ändert

---

## 14. Abhängigkeiten (CDN)

| Bibliothek | URL | Zweck |
|------------|-----|-------|
| Tailwind CSS | `https://cdn.tailwindcss.com` | Styling |
| Chart.js | `https://cdn.jsdelivr.net/npm/chart.js` | Kreisdiagramme |
| FontAwesome 6 | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css` | Icons |

Keine npm-Abhängigkeiten. Kein Build-Schritt nötig.

---

## 15. Offline-Verhalten

- **Lesen:** Immer aus IndexedDB
- **Schreiben:** Immer in IndexedDB, dann optional Supabase
- **Kein Internet:** App funktioniert 100%, Daten bleiben lokal
- **Wiederverbindung:** Kein Auto-Sync-Retry implementiert (manueller Export als Backup empfohlen)

---

END OF SPEC
