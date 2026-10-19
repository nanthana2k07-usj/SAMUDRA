"""FastAPI service for archived OceanEmbed model products."""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend.app.archive import OceanArchive


def _path_from_env(name: str, default: str) -> Path:
    return Path(os.environ.get(name, default)).expanduser().resolve()


def create_app(
    data_path: Path | None = None,
    case_study_path: Path | None = None,
) -> FastAPI:
    zarr_path = data_path or _path_from_env("OCEAN_DATA_PATH", "data/ocean_temperature.zarr")
    case_path = case_study_path or _path_from_env("OCEAN_CASE_STUDY_PATH", "results/casestudy_timeseries.csv")
    allowed_origins = [
        origin.strip()
        for origin in os.environ.get(
            "OCEAN_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.archive = OceanArchive.open(zarr_path, case_path)
        try:
            yield
        finally:
            app.state.archive.close()

    application = FastAPI(
        title="OceanEmbed Data API",
        description="Read-only API for precomputed OceanEmbed temperature products.",
        version="1.0.0",
        lifespan=lifespan,
    )
    application.add_middleware(GZipMiddleware, minimum_size=1000)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_methods=["GET"],
        allow_headers=["Accept"],
    )

    @application.get("/health")
    def health(request: Request) -> dict[str, str]:
        archive: OceanArchive | None = getattr(request.app.state, "archive", None)
        return {"status": "ready" if archive is not None else "not_ready"}

    @application.get("/api/v1/ocean-grid")
    def ocean_grid(request: Request) -> dict[str, Any]:
        archive: OceanArchive | None = getattr(request.app.state, "archive", None)
        if archive is None:
            raise HTTPException(status_code=503, detail="OceanEmbed Zarr product is not loaded.")
        return archive.as_ocean_grid()

    return application


app = create_app()
