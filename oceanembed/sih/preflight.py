"""Read-only data and checkpoint checks for SIH demo/inference workflows."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import xarray as xr

from oceanembed.data.cube import DEFAULT_INPUTS, TARGET_S, TARGET_T

POC_SCOPE = {"latitude": (5.0, 22.0), "longitude": (80.0, 100.0)}
SPATIAL_DIMS = {"lat": "lat", "latitude": "lat", "lon": "lon", "longitude": "lon"}


@dataclass
class PreflightReport:
    """Structured PASS/WARNING/FAIL result with check details and no input repairs."""

    status: str
    checks: dict[str, dict[str, Any]] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _result(report: PreflightReport, name: str, passed: bool, detail: Any, warning: bool = False) -> None:
    status = "PASS" if passed else ("WARNING" if warning else "FAIL")
    report.checks[name] = {"status": status, "detail": detail}
    if not passed:
        (report.warnings if warning else report.errors).append(f"{name}: {detail}")


def _coordinate(dataset: xr.Dataset, *names: str) -> np.ndarray | None:
    for name in names:
        if name in dataset.coords or name in dataset.variables:
            return np.asarray(dataset[name].values)
    return None


def _monotonic(values: np.ndarray) -> bool:
    if values.size < 2:
        return values.size == 1
    differences = np.diff(values.astype(float))
    return bool(np.all(differences > 0) or np.all(differences < 0))


def _expected_channels(inputs: list[str], history: int) -> list[str]:
    static = ["doy_sin", "doy_cos", "lat", "lon"]
    lagged = [f"{channel}_t-{lag}" for lag in range(history, 0, -1) for channel in inputs]
    return lagged + inputs + static


def preflight_dataset(
    dataset: xr.Dataset,
    *,
    inputs: list[str] | None = None,
    expected_region: dict[str, tuple[float, float]] | None = None,
    checkpoint: dict[str, Any] | None = None,
    warning_nan_percentage: float = 50.0,
    failure_nan_percentage: float = 90.0,
) -> PreflightReport:
    """Inspect a cube and optional checkpoint; never reorder, fill, or otherwise repair data."""
    inputs = list(inputs if inputs is not None else DEFAULT_INPUTS)
    expected_region = expected_region or POC_SCOPE
    report = PreflightReport(status="PASS")
    latitude = _coordinate(dataset, "lat", "latitude")
    longitude = _coordinate(dataset, "lon", "longitude")
    depth = _coordinate(dataset, "depth")
    times = _coordinate(dataset, "time")
    required = inputs + [TARGET_T]
    if checkpoint and int(checkpoint.get("out_vars", 1)) > 1:
        required.append(TARGET_S)
    missing = [name for name in required if name not in dataset.data_vars]
    _result(report, "required_variables", not missing, {"required": required, "missing": missing})

    dimension_errors: list[str] = []
    expected_dims = {name: ("time", "lat", "lon") for name in inputs}
    expected_dims[TARGET_T] = ("time", "depth", "lat", "lon")
    if TARGET_S in required:
        expected_dims[TARGET_S] = ("time", "depth", "lat", "lon")
    alias_dims = {dim: SPATIAL_DIMS.get(dim, dim) for dim in dataset.dims}
    for variable, dims in expected_dims.items():
        if variable not in dataset.data_vars:
            continue
        normalized_dims = tuple(alias_dims.get(dim, dim) for dim in dataset[variable].dims)
        if set(normalized_dims) != set(dims):
            dimension_errors.append(f"{variable}: expected dimensions {dims}, got {normalized_dims}")
    _result(report, "dimensions", not dimension_errors, dimension_errors or "Required variable dimensions are compatible.")

    coordinate_errors: list[str] = []
    coordinate_ranges: dict[str, list[float] | None] = {}
    for name, values, bounds, allowed in (
        ("latitude", latitude, (-90.0, 90.0), expected_region["latitude"]),
        ("longitude", longitude, (-180.0, 180.0), expected_region["longitude"]),
    ):
        if values is None or values.size == 0 or not np.isfinite(values.astype(float)).all():
            coordinate_errors.append(f"{name} coordinate is unavailable or non-finite")
            coordinate_ranges[name] = None
            continue
        low, high = float(np.min(values)), float(np.max(values))
        coordinate_ranges[name] = [low, high]
        if low < bounds[0] or high > bounds[1] or not _monotonic(values):
            coordinate_errors.append(f"{name} values are invalid or not monotonic")
        if low < allowed[0] or high > allowed[1]:
            coordinate_errors.append(
                f"{name} range [{low:g}, {high:g}] is outside the trained PoC scope {allowed}"
            )
    _result(report, "coordinate_ranges", not coordinate_errors, coordinate_errors or coordinate_ranges)

    depth_valid = bool(
        depth is not None
        and depth.size > 0
        and np.isfinite(depth.astype(float)).all()
        and (depth.size == 1 or np.all(np.diff(depth.astype(float)) > 0))
    )
    _result(report, "depth_order", depth_valid, "Depth coordinate must be finite and strictly increasing.")

    time_valid = bool(times is not None and times.size > 0)
    time_detail: dict[str, Any] = {"available": time_valid}
    if time_valid:
        time_values = times.astype("datetime64[ns]")
        time_valid = not np.isnat(time_values).any() and (time_values.size == 1 or np.all(np.diff(time_values) > np.timedelta64(0, "ns")))
        time_detail.update(start=str(time_values[0]), end=str(time_values[-1]), increasing=time_valid)
        if time_valid and time_values.size > 1:
            gaps = np.diff(time_values) != np.timedelta64(1, "D")
            if gaps.any():
                _result(report, "daily_time_continuity", False, "Time is increasing but contains non-daily gaps.", warning=True)
    _result(report, "time_availability", time_valid, time_detail)

    array_variables = [name for name in required if name in dataset.data_vars]
    total = 0
    nonfinite = 0
    per_variable: dict[str, float] = {}
    for name in array_variables:
        values = np.asarray(dataset[name].values)
        count = int(values.size)
        invalid = int((~np.isfinite(values)).sum())
        total += count
        nonfinite += invalid
        per_variable[name] = 100.0 * invalid / count if count else 100.0
    nan_percentage = 100.0 * nonfinite / total if total else 100.0
    report.metadata.update(
        coordinate_ranges=coordinate_ranges,
        nan_percentage=nan_percentage,
        nonfinite_percentage_by_variable=per_variable,
        dimensions={name: int(size) for name, size in dataset.sizes.items()},
        depth_levels_m=depth.astype(float).tolist() if depth is not None else None,
    )
    if nan_percentage > failure_nan_percentage:
        _result(report, "nonfinite_values", False, f"{nan_percentage:.2f}% non-finite across required fields.")
    elif nan_percentage > warning_nan_percentage:
        _result(report, "nonfinite_values", False, f"{nan_percentage:.2f}% non-finite; land/seabed masks may contribute.", warning=True)
    else:
        _result(report, "nonfinite_values", True, f"{nan_percentage:.2f}% non-finite across required fields.")

    channel_compatible = True
    channel_detail: Any = "Checkpoint not supplied; checked configured core input channels."
    if checkpoint is not None:
        history = int(checkpoint.get("history", 0))
        expected = _expected_channels(inputs, history)
        actual = checkpoint.get("channels")
        compatible = int(checkpoint.get("in_ch", -1)) == len(expected)
        if actual is not None:
            compatible = compatible and list(actual) == expected
        channel_compatible = compatible
        channel_detail = {"expected_channels": expected, "checkpoint_channels": actual,
                          "checkpoint_in_ch": checkpoint.get("in_ch")}
    _result(report, "channel_compatibility", channel_compatible, channel_detail)

    if checkpoint is not None:
        grid = checkpoint.get("grid")
        if latitude is not None and longitude is not None and grid is not None:
            height, width = len(latitude), len(longitude)
            padded = (-(-height // 8) * 8, -(-width // 8) * 8)
            grid_ok = tuple(int(x) for x in grid) == padded
            _result(report, "checkpoint_grid_compatibility", grid_ok,
                    {"expected_padded_grid": padded, "checkpoint_grid": list(grid)})
        saved_depths = checkpoint.get("depths")
        if depth is not None and saved_depths is not None:
            saved = np.asarray(saved_depths, dtype=float)
            same_depths = saved.shape == depth.shape and np.allclose(saved, depth.astype(float), rtol=0, atol=1e-4)
            _result(report, "checkpoint_depth_compatibility", bool(same_depths),
                    {"input_levels": depth.astype(float).tolist(), "checkpoint_levels": saved.tolist()})

    report.status = "FAIL" if report.errors else ("WARNING" if report.warnings else "PASS")
    return report


def preflight_path(path: str | Path, **kwargs: Any) -> PreflightReport:
    """Open a NetCDF input read-only, run preflight, and close it before returning."""
    source = Path(path)
    if not source.is_file():
        report = PreflightReport(status="FAIL")
        _result(report, "input_file", False, f"Input file does not exist: {source}")
        return report
    try:
        dataset = xr.open_dataset(source)
    except (OSError, ValueError) as exc:
        report = PreflightReport(status="FAIL")
        _result(report, "input_file", False, f"Could not open input dataset: {exc}")
        return report
    try:
        report = preflight_dataset(dataset, **kwargs)
        report.metadata["dataset_identifier"] = source.name
        return report
    finally:
        dataset.close()