"""Build reproducibility records for OceanEmbed runs without inventing missing metadata."""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import platform
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np


DEPENDENCIES = (
    "matplotlib",
    "netCDF4",
    "numpy",
    "pandas",
    "PyYAML",
    "requests",
    "scikit-learn",
    "scipy",
    "torch",
    "xarray",
    "zarr",
)


def sha256_file(path: str | Path, chunk_size: int = 1024 * 1024) -> str | None:
    """Return a streamed SHA-256 digest, or None when the file is unavailable."""
    source = Path(path)
    if not source.is_file():
        return None
    digest = hashlib.sha256()
    try:
        with source.open("rb") as stream:
            for chunk in iter(lambda: stream.read(chunk_size), b""):
                digest.update(chunk)
    except OSError:
        return None
    return digest.hexdigest()


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, np.datetime64):
        if np.isnat(value):
            return None
        return np.datetime_as_string(value, unit="s")
    method = getattr(value, "isoformat", None)
    return method() if callable(method) else str(value)


def _json_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_value(item) for item in value]
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, np.ndarray):
        return [_json_value(item) for item in value.tolist()]
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _source_revision() -> str | None:
    repository = Path(__file__).resolve().parent.parent
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repository,
            check=True,
            capture_output=True,
            text=True,
            timeout=2,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    revision = result.stdout.strip()
    return revision or None


def _dependency_versions() -> dict[str, str | None]:
    versions: dict[str, str | None] = {}
    for name in DEPENDENCIES:
        try:
            versions[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            versions[name] = None
    return versions


def _split_metadata(data: Any) -> dict[str, dict[str, Any]]:
    splits: dict[str, dict[str, Any]] = {}
    for name, raw_indices in getattr(data, "idx", {}).items():
        indices = np.asarray(raw_indices, dtype=int)
        times = getattr(data, "times", [])
        splits[name] = {
            "days": int(indices.size),
            "start": _iso(times[indices[0]]) if indices.size else None,
            "end": _iso(times[indices[-1]]) if indices.size else None,
        }
    return splits


def build_run_manifest(
    *,
    args: Any,
    data: Any,
    checkpoint_path: str | Path | None = None,
    output_path: str | Path | None = None,
    experiment_id: str | None = None,
    timestamp: datetime | None = None,
) -> dict[str, Any]:
    """Create a JSON-safe run manifest from the training arguments and loaded cube."""
    values = vars(args) if hasattr(args, "__dict__") else dict(args)
    input_path = values.get("data")
    out_path = output_path if output_path is not None else values.get("out")
    run_id = experiment_id or (Path(out_path).name if out_path else None)
    times = getattr(data, "times", [])
    depths = getattr(data, "depths", [])
    lat = np.asarray(getattr(data, "lat", []), dtype=float)
    lon = np.asarray(getattr(data, "lon", []), dtype=float)
    region = None
    if lat.size and lon.size:
        region = {
            "latitude": [float(np.nanmin(lat)), float(np.nanmax(lat))],
            "longitude": [float(np.nanmin(lon)), float(np.nanmax(lon))],
        }
    model = values.get("variant")
    if model == "oceanembed" and values.get("physics") and values.get("phys_mode") == "cyclone":
        model = "OceanEmbed-Cyclone"
    stamp = timestamp or datetime.now(timezone.utc)
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)

    try:
        import torch

        torch_version = torch.__version__
    except ImportError:
        torch_version = None

    return {
        "experiment_id": run_id,
        "model_name": model,
        "seed": values.get("seed"),
        "dataset_identifier": Path(input_path).name if input_path else None,
        "input_file_hash_sha256": sha256_file(input_path) if input_path else None,
        "region": region,
        "date_range": {
            "start": _iso(times[0]) if len(times) else None,
            "end": _iso(times[-1]) if len(times) else None,
        },
        "split": _split_metadata(data),
        "depth_levels_m": _json_value(depths),
        "configuration": _json_value(values),
        "python_version": platform.python_version(),
        "pytorch_version": torch_version,
        "dependency_versions": _dependency_versions(),
        "source_revision": _source_revision(),
        "checkpoint_path": str(checkpoint_path) if checkpoint_path is not None else None,
        "output_path": str(out_path) if out_path is not None else None,
        "timestamp": stamp.astimezone(timezone.utc).isoformat(),
    }


def write_run_manifest(path: str | Path, manifest: dict[str, Any]) -> Path:
    """Write a manifest as strict JSON, creating its parent directory if needed."""
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as stream:
        json.dump(manifest, stream, indent=2, allow_nan=False)
        stream.write("\n")
    return destination