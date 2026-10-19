"""SIH demo over validated artifacts or the existing OceanEmbed inference pipeline."""

from __future__ import annotations

import argparse
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import xarray as xr

from oceanembed.inference import data_for, load_model, predict_all
from oceanembed.physics.products import all_products
from oceanembed.sih.preflight import PreflightReport, preflight_path
from oceanembed.sih.report import build_validated_report, write_validated_report

LOGGER = logging.getLogger("oceanembed.sih.demo")
CHECKPOINT_SUFFIXES = {".pt", ".pth", ".ckpt"}
PRODUCT_VARIABLES = {
    "D26": ("d26", "D26_m"),
    "D20": ("d20", "D20_m"),
    "TCHP": ("tchp", "TCHP_kJcm2"),
    "MLD": ("mld", "MLD_m"),
}


@dataclass(frozen=True)
class RunArtifact:
    """One discovered run and its checkpoint candidates."""

    run_id: str
    run_dir: Path
    checkpoints: tuple[Path, ...]


def _looks_like_artifact_root(path: Path) -> bool:
    results = path / "results"
    outputs = path / "outputs"
    has_results = results.is_dir() and (any(results.glob("*.csv")) or (results / "validation.json").is_file())
    has_outputs = outputs.is_dir() and (any(outputs.glob("*.nc")) or any(outputs.glob("*.zarr")))
    return has_results or has_outputs


def resolve_artifact_root(path: str | Path | None = None) -> Path:
    """Resolve an explicit bundle or discover a nearby generated artifact directory."""
    if path is not None:
        root = Path(path).expanduser().resolve()
        if not root.is_dir():
            raise FileNotFoundError(f"Artifact directory does not exist: {root}")
        if not _looks_like_artifact_root(root):
            raise FileNotFoundError(f"No generated result/output artifacts found under {root}")
        return root

    current = Path.cwd().resolve()
    for ancestor in (current, *current.parents):
        for candidate in (ancestor / "oceanembed_results", ancestor / "artifacts", ancestor):
            if candidate.is_dir() and _looks_like_artifact_root(candidate):
                return candidate
    raise FileNotFoundError("Could not discover generated artifacts; pass --artifacts PATH.")


def discover_runs(artifacts_root: str | Path) -> list[RunArtifact]:
    """Find runs by inspecting checkpoint extensions, never by assuming a checkpoint filename."""
    runs_root = Path(artifacts_root) / "runs"
    if not runs_root.is_dir():
        return []
    found: list[RunArtifact] = []
    for run_dir in sorted(path for path in runs_root.iterdir() if path.is_dir()):
        checkpoints = tuple(sorted(
            path for path in run_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in CHECKPOINT_SUFFIXES
        ))
        if checkpoints:
            found.append(RunArtifact(run_dir.name, run_dir, checkpoints))
    return found


def select_run(
    artifacts_root: str | Path,
    *,
    run_id: str | None = None,
    checkpoint_path: str | Path | None = None,
) -> tuple[RunArtifact | None, Path]:
    """Select one available run/checkpoint or raise with actionable choices."""
    if checkpoint_path is not None:
        checkpoint = Path(checkpoint_path).expanduser().resolve()
        if not checkpoint.is_file() or checkpoint.suffix.lower() not in CHECKPOINT_SUFFIXES:
            raise FileNotFoundError(f"Checkpoint path is not an available model artifact: {checkpoint}")
        matching = [run for run in discover_runs(artifacts_root) if checkpoint in run.checkpoints]
        if run_id:
            matching = [run for run in matching if run.run_id == run_id]
        return (matching[0] if matching else None), checkpoint

    runs = discover_runs(artifacts_root)
    if run_id:
        runs = [run for run in runs if run.run_id == run_id]
        if not runs:
            available = ", ".join(item.run_id for item in discover_runs(artifacts_root)) or "none"
            raise FileNotFoundError(f"Run {run_id!r} was not found. Available runs: {available}")
    if len(runs) != 1:
        available = ", ".join(item.run_id for item in runs) or "none"
        raise ValueError(f"Choose one run with --run. Available runs: {available}")
    run = runs[0]
    if len(run.checkpoints) != 1:
        available = ", ".join(str(item) for item in run.checkpoints)
        raise ValueError(f"Run {run.run_id!r} has multiple checkpoints; pass --checkpoint from: {available}")
    return run, run.checkpoints[0]


def _load_validation_metadata(root: Path) -> dict[str, Any]:
    for path in (root / "results" / "validation.json", root / "validation.json"):
        if path.is_file():
            with path.open(encoding="utf-8") as stream:
                value = json.load(stream)
            return value if isinstance(value, dict) else {}
    return {}


def _open_product_store(outputs: Path) -> tuple[xr.Dataset, Path] | None:
    if not outputs.is_dir():
        return None
    candidates = sorted(outputs.glob("*.zarr")) + sorted(outputs.glob("*.nc"))
    for path in candidates:
        try:
            dataset = xr.open_zarr(path) if path.is_dir() else xr.open_dataset(path)
        except (ImportError, OSError, ValueError):
            continue
        if "temperature" in dataset.data_vars:
            return dataset, path
        dataset.close()
    return None


def _find_embedding(outputs: Path) -> Path | None:
    for path in sorted(outputs.glob("*.nc")) + sorted(outputs.glob("*.zarr")):
        try:
            dataset = xr.open_zarr(path) if path.is_dir() else xr.open_dataset(path)
        except (ImportError, OSError, ValueError):
            continue
        try:
            if "embedding" in dataset.data_vars:
                return path
        finally:
            dataset.close()
    return None


def _number_summary(array: Any) -> dict[str, float | None]:
    values = np.asarray(array, dtype=float)
    finite = values[np.isfinite(values)]
    return {"mean": float(np.mean(finite)) if finite.size else None,
            "min": float(np.min(finite)) if finite.size else None,
            "max": float(np.max(finite)) if finite.size else None}


def _format_metric(entry: dict[str, Any] | None, key: str = "rmse") -> str:
    if not entry:
        return "unavailable"
    metrics = entry.get("metrics", {})
    value = metrics.get(key)
    if not value or value.get("mean") is None:
        return "unavailable"
    spread = value.get("std")
    return f"{value['mean']:.4f}" + (f" ± {spread:.4f}" if spread is not None else "")


def _main_rows(rows: list[dict[str, Any]], model_name: str, subset: str | None = None) -> dict[str, Any] | None:
    for row in rows:
        if row.get("model_type") == model_name and (subset is None or row.get("subset") == subset):
            return row
    return None


def _display_report(report: dict[str, Any]) -> dict[str, Any]:
    scope = report.get("dataset_scope", {})
    period = scope.get("period") or {}
    region = scope.get("region") or {}
    model = report.get("model", {}).get("main_model") or "unknown"
    return {
        "model": model,
        "dataset": f"{period.get('start') or 'unknown'} to {period.get('end') or 'unknown'}",
        "region": region,
    }


def run_precomputed(artifacts_root: str | Path, report_output: str | Path | None = None) -> dict[str, Any]:
    """Display validated precomputed outputs and aggregate their actual result tables."""
    root = Path(artifacts_root)
    report = build_validated_report(root)
    if report_output is not None:
        write_validated_report(report, report_output)
    metadata = _load_validation_metadata(root)
    outputs = root / "outputs"
    opened = _open_product_store(outputs)
    if opened is None:
        raise FileNotFoundError(f"No temperature NetCDF/Zarr product found under {outputs}")
    dataset, product_path = opened
    try:
        temperature = dataset["temperature"]
        if "time" not in temperature.dims or temperature.sizes["time"] == 0:
            raise ValueError("Precomputed temperature output has no available time steps.")
        latest = temperature.isel(time=-1).values
        date = str(dataset.time.values[-1])[:10]
        depth = np.asarray(dataset.depth.values, dtype=float)
        if "temperature_std" in dataset.data_vars:
            uncertainty = "available in the validated output"
        else:
            uncertainty = "not present in the selected output"
        computed = all_products(latest, depth, axis=0)
        product_summaries: dict[str, dict[str, float | None]] = {}
        for label, (store_name, core_name) in PRODUCT_VARIABLES.items():
            product_summaries[label] = _number_summary(computed[core_name])
        coords = {
            "latitude": np.asarray(dataset.latitude.values, dtype=float),
            "longitude": np.asarray(dataset.longitude.values, dtype=float),
        }
        region = metadata.get("region") or {
            "lat": [float(coords["latitude"].min()), float(coords["latitude"].max())],
            "lon": [float(coords["longitude"].min()), float(coords["longitude"].max())],
        }
    finally:
        dataset.close()

    model_name = str(metadata.get("main_model") or report.get("model", {}).get("main_model") or "unknown")
    display = _display_report(report)
    if metadata.get("period"):
        dataset_period = metadata["period"]
        date_range = f"{dataset_period.get('start', 'unknown')} to {dataset_period.get('end', 'unknown')}"
    else:
        date_range = display["dataset"]
    runs = discover_runs(root)
    model_label = "OceanEmbed-Cyclone" if model_name == "oceanembed_cyclone" else model_name.replace("_", " ")
    print(f"Mode: PRECOMPUTED validated artifacts (no model inference performed)")
    print(f"Model: {model_label}")
    print(f"Dataset: {date_range}")
    print(f"Date: {date}")
    print(f"Region: {region}")
    print(f"Temperature reconstruction availability: available ({product_path.name})")
    print(f"Uncertainty availability: {uncertainty}")
    print(f"Embeddings availability: {'available' if _find_embedding(outputs) else 'not present'}")
    for label, values in product_summaries.items():
        mean = values["mean"]
        print(f"{label}: {mean:.4f} (daily spatial mean)" if mean is not None else f"{label}: unavailable")
    print("Validation summary:")
    print(f"  GLORYS held-out RMSE: {_format_metric(_main_rows(report['glorys_test']['metrics_by_model'], model_name))} °C")
    print(f"  ARGO all-days RMSE: {_format_metric(_main_rows(report['argo']['metrics_by_subset_and_model'], model_name, 'all_days'))} °C")
    print(f"  ARGO test-days-only RMSE: {_format_metric(_main_rows(report['argo']['metrics_by_subset_and_model'], model_name, 'test_days_only'))} °C")
    glorys_coverage = next((row for row in report["uncertainty"]["coverage_rows"]
                            if row.get("against") == "GLORYS" and row.get("subset") == "test_days"), None)
    if glorys_coverage and glorys_coverage.get("90%") is not None:
        print(f"  GLORYS 90% interval coverage: {float(glorys_coverage['90%']):.3f}")
    for case_row in report["case_study"]["metrics"]:
        if case_row.get("quantity") in {"D26_m", "TCHP_kJcm2", "MLD_m"}:
            print(f"  Case-study {case_row['quantity']} correlation: {float(case_row['corr_daily']):.4f}")
    print(f"Available trained runs: {', '.join(item.run_id for item in runs) or 'none'}")
    if report_output is not None:
        print(f"Report written: {Path(report_output)}")
    return {"report": report, "date": date, "products": product_summaries, "product_path": str(product_path)}


def _checkpoint_metadata(checkpoint_path: Path) -> dict[str, Any]:
    import torch

    value = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    if not isinstance(value, dict):
        raise ValueError("Checkpoint does not contain the expected OceanEmbed metadata mapping.")
    return value


def run_inference(
    *,
    artifacts_root: str | Path,
    input_path: str | Path,
    run_id: str | None = None,
    checkpoint_path: str | Path | None = None,
) -> dict[str, Any]:
    """Run one actual checkpoint through OceanEmbed's existing inference functions."""
    run, checkpoint = select_run(artifacts_root, run_id=run_id, checkpoint_path=checkpoint_path)
    checkpoint_metadata = _checkpoint_metadata(checkpoint)
    quality = preflight_path(input_path, checkpoint=checkpoint_metadata)
    print(f"Input preflight: {quality.status}")
    for warning in quality.warnings:
        LOGGER.warning("%s", warning)
    if quality.status == "FAIL":
        raise ValueError("Input preflight failed: " + "; ".join(quality.errors))

    model, loaded = load_model(str(checkpoint))
    data = data_for(loaded, str(input_path))
    channel_names = loaded.get("channels")
    if data.n_inputs != int(loaded.get("in_ch", -1)):
        raise ValueError(f"Input channels ({data.n_inputs}) do not match checkpoint ({loaded.get('in_ch')}).")
    if channel_names is not None and data.channel_names != list(channel_names):
        raise ValueError("Ordered input channels do not match the checkpoint metadata.")
    indices = np.array([len(data.times) - 1], dtype=int)
    temperature, salinity, embedding, sigma = predict_all(
        model, data, indices=indices, return_sigma=True
    )
    products = all_products(temperature, data.depths, axis=1)
    quantities = {name: _number_summary(values[0]) for name, values in products.items()}
    date = str(data.times[indices[0]])[:10]
    region = {
        "lat": [float(data.lat.min()), float(data.lat.max())],
        "lon": [float(data.lon.min()), float(data.lon.max())],
    }
    uncertainty = "raw single-checkpoint sigma available; not validation-calibrated" if sigma is not None else "not available"
    model_name = loaded.get("variant", "unknown")
    if model_name == "oceanembed" and loaded.get("physics") and loaded.get("phys_mode") == "cyclone":
        model_name = "OceanEmbed-Cyclone"
    print("Mode: MODEL INFERENCE (existing OceanEmbed checkpoint and inference pipeline)")
    print(f"Model: {model_name} | run: {run.run_id if run else checkpoint.parent.name}")
    print(f"Dataset: {Path(input_path).name}")
    print(f"Date: {date}")
    print(f"Region: {region}")
    print("Temperature reconstruction availability: available from model inference")
    print(f"Uncertainty availability: {uncertainty}")
    print("Embeddings availability: available from model encoder")
    for label, (_, core_name) in PRODUCT_VARIABLES.items():
        values = quantities.get(core_name, {}).get("mean")
        print(f"{label}: {values:.4f} (daily spatial mean)" if values is not None else f"{label}: unavailable")
    print("Validation summary: existing artifact report only; this input-day prediction is not a new validation result.")
    return {
        "mode": "inference",
        "model": model_name,
        "run_id": run.run_id if run else checkpoint.parent.name,
        "date": date,
        "region": region,
        "temperature": temperature,
        "salinity": salinity,
        "embedding": embedding,
        "sigma": sigma,
        "products": quantities,
        "preflight": quality.to_dict(),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m oceanembed.sih.demo")
    parser.add_argument("--mode", choices=("precomputed", "inference"), default="precomputed")
    parser.add_argument("--artifacts", default=None, help="Generated oceanembed_results bundle or run-artifact root")
    parser.add_argument("--input", default=None, help="Harmonized NetCDF cube for model inference")
    parser.add_argument("--run", default=None, help="Run directory name selected from discovered artifacts")
    parser.add_argument("--checkpoint", default=None, help="Explicit checkpoint path when a run has multiple checkpoints")
    parser.add_argument("--report-out", default=None, help="Optional path for the generated validated JSON report")
    parser.add_argument("--strict-inference", action="store_true", help="Do not fall back to precomputed outputs if inference fails")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    try:
        root = resolve_artifact_root(args.artifacts)
    except (FileNotFoundError, OSError) as exc:
        if args.mode == "inference" and args.strict_inference:
            LOGGER.error("Inference artifacts unavailable: %s", exc)
            return 2
        if args.mode == "inference":
            LOGGER.error("Inference artifacts unavailable: %s", exc)
            LOGGER.error("No precomputed validated artifact bundle is available for fallback.")
            return 2
        LOGGER.error("%s", exc)
        return 2

    if args.mode == "precomputed":
        try:
            run_precomputed(root, args.report_out)
            return 0
        except (FileNotFoundError, ValueError, OSError) as exc:
            LOGGER.error("Precomputed demo could not run: %s", exc)
            return 2

    if not args.input:
        error = "--input is required for model inference"
        if args.strict_inference:
            LOGGER.error("%s", error)
            return 2
        LOGGER.error("%s", error)
    else:
        try:
            run_inference(
                artifacts_root=root,
                input_path=args.input,
                run_id=args.run,
                checkpoint_path=args.checkpoint,
            )
            return 0
        except Exception as exc:
            LOGGER.exception("Model inference unavailable: %s", exc)
            if args.strict_inference:
                return 2
    LOGGER.warning("FALLBACK: using PRECOMPUTED validated output; no model inference was performed.")
    try:
        run_precomputed(root, args.report_out)
        return 0
    except (FileNotFoundError, ValueError, OSError) as exc:
        LOGGER.error("Precomputed fallback could not run: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())