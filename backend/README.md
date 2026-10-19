# OceanEmbed Data API

This local, read-only FastAPI service exposes the model's exported Zarr product to
the React dashboard. It serves archived predictions, not a live observation feed,
and does not run model inference per request.

## Prepare data

From the repository root, export the model NetCDF to the API's default Zarr path:

```powershell
python -m oceanembed export-backend --nc artifacts/outputs/oceanembed_temperature_daily_0p25.nc --out data/ocean_temperature.zarr
```

Optionally export or copy `results/casestudy_timeseries.csv` into the repository's
`results/` directory so the API can serve the event series. Case-study data is
optional; if absent, the dashboard shows its existing unavailable-data state.

## Start the API

Install the project dependencies, then run from the repository root:

```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The API validates the Zarr dimensions and variables at startup. Configure a
different location with `OCEAN_DATA_PATH`; configure a different case-study CSV
with `OCEAN_CASE_STUDY_PATH`. `/health` reports readiness and `/docs` provides the
OpenAPI UI.

`GET /api/v1/ocean-grid` returns the date/depth/coordinate arrays and sampled
temperature and 1σ uncertainty fields expected by the dashboard. The response is
gzip-compressed when the client supports it. The Zarr export does not include a
GLORYS reference field, so API-backed profiles intentionally omit that comparison.

## Connect the React dashboard

In `frontend/.env.local`:

```dotenv
VITE_OCEAN_GRID_API_URL=/api/v1/ocean-grid
OCEAN_API_PROXY_TARGET=http://127.0.0.1:8000
```

Then run `npm run dev` from `frontend/`. The Vite development server proxies
`/api` requests to FastAPI. For a deployed frontend, set
`VITE_OCEAN_GRID_API_URL` to the API's HTTPS URL and configure
`OCEAN_CORS_ORIGINS` on the API to include the frontend origin. If
`VITE_OCEAN_GRID_API_URL` is unset, the dashboard uses its bundled archived demo
artifact; if it is set and the API fails, the app reports the error rather than
silently falling back to different data.
