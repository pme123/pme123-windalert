# Wind Alert

Browser-based wind monitoring app with WhatsApp alerts. Monitors one or more weather stations and sends a notification when wind speed or gust thresholds are exceeded.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

```bash
npm run build   # type-check + production build → dist/
npm run preview # serve the built dist/ locally
```

## Deployment

Pushing to `main` automatically builds and deploys to GitHub Pages via the included workflow (`.github/workflows/deploy.yml`). The app is served under the path `/pme123-windalert/` (set in `vite.config.ts`).

## Tech stack

| | |
|---|---|
| Vue 3 + TypeScript | UI framework with Composition API |
| Vite | Build tool and dev server |
| Pinia | State management (two stores: `config`, `stations`) |
| Chart.js | Wind history chart |
| Leaflet | Station location map (CartoDB Voyager tiles) |

## Data sources

| Source | ID format | Notes |
|---|---|---|
| **Pioupiou / OpenWindMap** | numeric (e.g. `2172`) | Default source. Archive data available for chart. |
| **MeteoSwiss SMN** | 3-letter abbreviation (e.g. `ALT`) | Automatic Swiss weather stations. 10-min data, chart supported. |
| **Weather Underground** | alphanumeric PWS ID (e.g. `IZURI12`) | Requires API key in settings. No history available. |

Station IDs can be found via the in-app search or at [openwindmap.org](https://www.openwindmap.org), [meteoswiss.admin.ch](https://www.meteoswiss.admin.ch), or [wunderground.com/wundermap](https://www.wunderground.com/wundermap).

## Alerts

Alerts are fired when the configured threshold is exceeded and the cooldown period has elapsed. Four notification types can be enabled independently:

- **WhatsApp** via [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) (requires phone number + API key)
- **Browser notification** (requires permission grant)
- **On-screen banner**
- **Sound** (Web Audio API beep)
- **Dialog** (browser alert popup)

Thresholds, cooldown, and poll interval are configured per station in the Settings card.

## Project structure

```
src/
  components/       Vue single-file components
    AppHeader.vue
    TabBar.vue        multi-station tabs
    StationPanel.vue  panel grid layout
    WindCard.vue      current readings + unit switcher
    CompassCard.vue   wind direction compass
    ChartCard.vue     history chart (auto-refresh every 15 min)
    MapCard.vue       Leaflet station map
    ThresholdsCard.vue  alert thresholds per station
    StationSelector.vue  station search + tab name
    SettingsCard.vue  global settings (WhatsApp, WU key, units, etc.)
    LogCard.vue       event log
    AlertBanner.vue   on-screen alert banner
  services/
    pioupiou.ts       Pioupiou/OpenWindMap API
    meteoswiss.ts     MeteoSwiss CSV + archive fetch
    wunderground.ts   Weather Underground PWS API
  stores/
    config.ts         global settings (Pinia)
    stations.ts       station list, polling, alerts, log (Pinia)
  composables/
    useUnits.ts       km/h ↔ kn ↔ Bft conversion
  types/index.ts      shared TypeScript types
  style.css           global styles
```

## localStorage

Settings are stored in `localStorage` under the key `waCfg2`. The app migrates automatically from the legacy key `waCfg`.
