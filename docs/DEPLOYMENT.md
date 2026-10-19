# Deployment

How OceanEmbed's outputs reach users, and how to run it as a daily product.

## What gets deployed

| artifact | produced by | size / format |
|---|---|---|
| trained weights | `python -m oceanembed train` → `best.pt` (one per seed) | ~15 MB each (3.73 M float32 parameters + normalization) |
| daily 3D temperature + uncertainty | `python -m oceanembed uncertainty ... --outputs <dir>` | CF-1.8 NetCDF, `temperature`, `temperature_std` on `(time, depth, latitude, longitude)` |
| latent embeddings | same step | NetCDF, `embedding (time, channel, y, x)` |
| backend data store | `python -m oceanembed export-backend` | Zarr: `temperature`, `temperature_std` (time, depth, lat, lon) + `tchp`, `d26`, `d20`, `mld` (time, lat, lon) |
| validation results | `python -m oceanembed export-results` | `validation.json`: all metrics, seeds aggregated (mean, std), case study; NaN → null |

## Local API and dashboard integration

This checkout includes a read-only FastAPI service under `backend/`. It reads the exported
**Zarr** store at `data/ocean_temperature.zarr` by default and serves the sampled
temperature/uncertainty archive at `/api/v1/ocean-grid`. To create the store:

```bash
python -m oceanembed export-backend --nc <outputs>/oceanembed_temperature_daily_0p25.nc \
    --out data/ocean_temperature.zarr
```

Start the API from the repository root with:

```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Configure `frontend/.env.local` with `VITE_OCEAN_GRID_API_URL=/api/v1/ocean-grid` and
`OCEAN_API_PROXY_TARGET=http://127.0.0.1:8000`, then run the Vite app. The API product includes
`temperature_std` but no GLORYS reference field. The React dashboard's validation metrics and
uncertainty/cyclone summaries remain bundled reviewed snapshots; `validation.json` is not
currently loaded by the React app.

## Precompute, don't predict on request

Inputs arrive daily and the grid is small (69 × 81 × 35), so the whole domain is predicted once
per day and stored; requests then only read the file. Prediction for all 92 days takes seconds
on a GPU and is feasible on a CPU.

## Daily operational loop (proposed, not yet automated)

```
1. download yesterday's OSTIA, SMOS/SMAP, DUACS, OSCAR, CCMP fields for the box
2. regrid to the 0.25 deg grid and append to the cube (same steps as the team data notebook)
3. run the 3-seed ensemble on the new day (needs the previous 2 days as context)
4. append temperature, temperature_std and products to the NetCDF
5. python -m oceanembed export-backend  ->  backend reads the new day
```

Notes:
- Satellite products have different latencies (near-real-time vs reprocessed versions);
  an operational run must use the near-real-time versions, whose statistics can differ from
  the reprocessed data the model was trained on. This has not been tested.
- The model has seen only June–August 2023. Running it outside that season or region is
  extrapolation; retrain on multiple years first (see [`PREREGISTRATION.md`](PREREGISTRATION.md)).

## Environments

- **Colab (tested):** `notebooks/run_pipeline_colab.ipynb`, T4 GPU.
- **Local (tested on CPU with the synthetic cube):** `make install && make smoke`.
