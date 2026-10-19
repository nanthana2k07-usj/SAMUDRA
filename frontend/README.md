# OceanEmbed Dashboard

The OceanEmbed dashboard is a responsive React application for exploring the
project's Bay of Bengal subsurface-temperature reconstruction proof of concept.
It presents archived model outputs and evaluation artifacts; it is not a live
ocean-data service, cyclone forecast, or operational decision-support system.
It can load either its bundled archive or an archived Zarr product through the
repository's FastAPI service.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm (use the lockfile with `npm ci`)
- A modern browser with `DecompressionStream` gzip support

## Run locally

From this directory:

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite. To check a production build:

```powershell
npm run build
npm run preview
```

Run the configured linter with:

```powershell
npm run lint
```

## Dashboard pages

- **Overview** — project scope, dataset summary, model pipeline, and entry points.
- **Explore** — sampled map, date/depth selection, temperature/uncertainty layers,
  cell selection, profile context, and day-by-day replay of the archived period.
- **Temperature** — vertical reconstruction profile and model architecture overview.
- **Cyclone intelligence** — derived ocean-product results and a single archived
  event case study. This does not predict cyclone formation, track, landfall, or
  intensity.
- **Validation** — held-out GLORYS12 metrics, ARGO results, depth-band results,
  and evaluation protocol.
- **Uncertainty** — profile uncertainty and reference-specific empirical coverage.
- **Technical** — data inputs, architecture, training setup, scope, and provenance.

The selected date, depth, display mode, and grid cell are shared across views where
those values apply. Use the map's arrow keys to move the selected cell. The
dashboard supports hash-based links, including browser Back and Forward navigation.

## Data sources

By default, the browser loads `public/data/ocean-demo.data`. This file contains gzip-compressed
JSON, so the `.data` extension is intentional: Vite should serve the bytes without
automatically applying HTTP gzip content-encoding. `src/services/oceanService.ts`
fetches, decompresses, and validates the payload before displaying the dashboard.

The browser artifact is spatially sampled for performance (18 × 21 cells) and
retains the precomputed dates and depths. It is not the full-resolution source
cube. To load a generated Zarr product instead, follow [the backend setup](../backend/README.md).
Set `VITE_OCEAN_GRID_API_URL` to `/api/v1/ocean-grid` for local Vite proxying, and
`OCEAN_API_PROXY_TARGET` to the FastAPI origin. An API-configured dashboard reports
connection/schema errors rather than falling back to the demo artifact. The API
also samples the source grid for browser performance and does not provide a
GLORYS reference field because the exported prediction Zarr does not contain one.

## Project structure

- `src/App.tsx` — application shell, shared exploration state, navigation, and
  data-loading/error states.
- `src/pages/` — the seven dashboard views.
- `src/components/` — map, profile, charts, navigation, and reusable presentation.
- `src/data/` — typed result metrics used by validation, uncertainty, and
  cyclone-product views.
- `src/services/oceanService.ts` — browser artifact loading and schema validation.
- `public/data/` — static browser-ready research artifact.
- `../backend/` — read-only API for exported Zarr prediction products.

## Current boundaries

- The map replay advances through archived daily results; it does not connect to
  an external real-time feed.
- The current displayed map is a sampled browser visualization, not the original
  0.25° source grid.
- Model outputs and reported metrics are precomputed. The dashboard does not run
  training or inference in the browser. The local API serves exported predictions
  and does not provide live inference.
- The tested research scope is the Bay of Bengal, June–August 2023. Full North
  Indian Ocean coverage and operational deployment are not established.
- No automated frontend component or end-to-end test suite is configured yet;
  `npm run build` checks TypeScript and creates the production bundle, while
  `npm run lint` runs Oxlint.
