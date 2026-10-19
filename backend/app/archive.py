"""Read a precomputed OceanEmbed Zarr product for the dashboard API."""

import csv
from pathlib import Path
from typing import Any

import numpy as np
import xarray as xr

REQUIRED_DIMS = ("time", "depth", "latitude", "longitude")
REQUIRED_VARIABLES = {"temperature", "temperature_std"}
CASE_STUDY_COLUMNS = (
    "date",
    "SST_satellite",
    "MLD_m_glorys",
    "MLD_m_model",
    "MLD_m_model_spread",
    "D26_m_glorys",
    "D26_m_model",
    "D26_m_model_spread",
    "TCHP_kJcm2_glorys",
    "TCHP_kJcm2_model",
    "TCHP_kJcm2_model_spread",
)


def _json_values(values: np.ndarray) -> list[float | None]:
    flat = np.asarray(values, dtype=np.float32).ravel()
    return [float(value) if np.isfinite(value) else None for value in flat]


def _read_case_study(path: Path | None) -> list[dict[str, Any]]:
    if path is None or not path.is_file():
        return []

    with path.open(newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        missing = set(CASE_STUDY_COLUMNS) - set(reader.fieldnames or ())
        if missing:
            raise ValueError(f"{path} is missing case-study columns: {', '.join(sorted(missing))}")
        return [
            {
                key: row[key] if key == "date" else float(row[key])
                for key in CASE_STUDY_COLUMNS
            }
            for row in reader
        ]


class OceanArchive:
    """A validated, read-only view over exported temperature and uncertainty arrays."""

    def __init__(self, dataset: xr.Dataset, source_path: Path, case_study_path: Path | None = None):
        missing_dims = set(REQUIRED_DIMS) - set(dataset.dims)
        if missing_dims:
            raise ValueError(f"Zarr product is missing dimensions: {', '.join(sorted(missing_dims))}")
        missing_variables = REQUIRED_VARIABLES - set(dataset.data_vars)
        if missing_variables:
            raise ValueError(f"Zarr product is missing variables: {', '.join(sorted(missing_variables))}")
        for variable in REQUIRED_VARIABLES:
            if dataset[variable].dims != REQUIRED_DIMS:
                raise ValueError(
                    f"{variable} has dimensions {dataset[variable].dims}; expected {REQUIRED_DIMS}"
                )
        for coordinate in REQUIRED_DIMS:
            if coordinate not in dataset.coords:
                raise ValueError(f"Zarr product is missing coordinate: {coordinate}")
            if dataset.sizes[coordinate] == 0:
                raise ValueError(f"Zarr product coordinate is empty: {coordinate}")

        self._dataset = dataset
        self._source_path = source_path
        self._case_study_path = case_study_path
        self._grid: dict[str, Any] | None = None

    @classmethod
    def open(cls, path: Path, case_study_path: Path | None = None) -> "OceanArchive":
        if not path.exists():
            raise FileNotFoundError(f"OceanEmbed Zarr product not found: {path}")
        dataset = xr.open_zarr(path, consolidated=True)
        try:
            return cls(dataset, path, case_study_path)
        except Exception:
            dataset.close()
            raise

    def close(self) -> None:
        self._dataset.close()

    def as_ocean_grid(self, sample_step: int = 4) -> dict[str, Any]:
        if sample_step < 1:
            raise ValueError("sample_step must be a positive integer")
        if self._grid is not None:
            return self._grid

        lat_indices = np.arange(0, self._dataset.sizes["latitude"], sample_step)
        lon_indices = np.arange(0, self._dataset.sizes["longitude"], sample_step)
        sampled = self._dataset.isel(
            latitude=lat_indices,
            longitude=lon_indices,
        )
        temperature = sampled["temperature"].transpose(*REQUIRED_DIMS).values
        uncertainty = sampled["temperature_std"].transpose(*REQUIRED_DIMS).values
        dates = np.datetime_as_string(
            np.asarray(sampled["time"].values).astype("datetime64[D]"),
            unit="D",
        ).tolist()
        depth_count = sampled.sizes["depth"]
        latitude_count = sampled.sizes["latitude"]
        longitude_count = sampled.sizes["longitude"]
        cell_count = len(dates) * depth_count * latitude_count * longitude_count

        self._grid = {
            "dates": dates,
            "depths": np.asarray(sampled["depth"].values, dtype=float).tolist(),
            "latitudes": np.asarray(sampled["latitude"].values, dtype=float).tolist(),
            "longitudes": np.asarray(sampled["longitude"].values, dtype=float).tolist(),
            "gridShape": [len(dates), depth_count, latitude_count, longitude_count],
            "temperature": _json_values(temperature),
            "uncertainty": _json_values(uncertainty),
            "reference": [None] * cell_count,
            "caseStudy": _read_case_study(self._case_study_path),
            "source": "OceanEmbed exported Zarr product",
            "displayNote": (
                "Every fourth source-grid cell is shown for browser performance. "
                "The Zarr prediction product contains no GLORYS reference field."
            ),
        }
        return self._grid
