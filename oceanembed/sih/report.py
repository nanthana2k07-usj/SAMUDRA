"""Build SIH reports from OceanEmbed's generated validation artifacts."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        number = float(value)
        return number if math.isfinite(number) else None
    if isinstance(value, np.ndarray):
        return _json_safe(value.tolist())
    if pd.isna(value):
        return None
    return value


def _model_type(value: str) -> str:
    return re.sub(r"_s\d+$", "", str(value))


def _read_json(path: Path) -> Any:
    if not path.is_file():
        return None
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def _read_csv(path: Path) -> pd.DataFrame | None:
    return pd.read_csv(path) if path.is_file() else None


def _aggregate(frame: pd.DataFrame | None, group_columns: list[str], model_column: str = "model") -> list[dict[str, Any]]:
    if frame is None or frame.empty or model_column not in frame:
        return []
    table = frame.copy()
    table["model_type"] = table[model_column].map(_model_type)
    keys = [*group_columns, "model_type"]
    numeric = [column for column in table.select_dtypes(include=[np.number]).columns if column not in keys]
    rows: list[dict[str, Any]] = []
    for key, group in table.groupby(keys, dropna=False):
        values = key if isinstance(key, tuple) else (key,)
        row: dict[str, Any] = dict(zip(keys, values))
        row["n_seeds"] = int(len(group))
        row["metrics"] = {
            column: {
                "mean": float(group[column].mean()),
                "std": float(group[column].std(ddof=1)) if len(group) > 1 else None,
            }
            for column in numeric
        }
        rows.append(row)
    return rows


def _main_depth_performance(results: Path, model_name: str) -> list[dict[str, Any]]:
    per_seed = sorted(results.glob(f"glorys_test_per_depth_{model_name}_s*.csv"))
    frames = [pd.read_csv(path) for path in per_seed]
    if not frames:
        wide = _read_csv(results / "glorys_test_per_depth.csv")
        if wide is None or "depth_m" not in wide:
            return []
        columns = [column for column in wide if re.fullmatch(rf"rmse_{re.escape(model_name)}_s\d+", column)]
        if not columns:
            return []
        frames = [pd.DataFrame({"depth_m": wide["depth_m"], "rmse": wide[column]}) for column in columns]
    if any("depth_m" not in frame or "rmse" not in frame for frame in frames):
        return []
    stacked = pd.concat(frames, keys=range(len(frames)), names=["seed", "row"]).reset_index()
    grouped = stacked.groupby("depth_m")["rmse"]
    return [
        {
            "depth_m": float(depth),
            "rmse_degC_mean": float(values.mean()),
            "rmse_degC_std": float(values.std(ddof=1)) if values.count() > 1 else None,
            "n_seeds": int(values.count()),
        }
        for depth, values in grouped
    ]


def _depth_levels(validation: dict[str, Any], results: Path, model_name: str) -> list[float] | None:
    levels = validation.get("depth_levels_m")
    if levels is None:
        levels = validation.get("glorys_rmse_by_depth", {}).get("depth_m")
    if levels is None:
        paths = sorted(results.glob(f"glorys_test_per_depth_{model_name}_s*.csv"))
        if paths:
            frame = pd.read_csv(paths[0])
            if "depth_m" in frame:
                levels = frame["depth_m"].tolist()
    return [float(value) for value in levels] if levels is not None else None


def _limitations(repository_root: Path | None) -> list[str]:
    if repository_root is None:
        return []
    path = repository_root / "docs" / "METHODOLOGY.md"
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    match = re.search(r"^##\s+7\. Limitations\s*$(.*?)(?=^##\s|\Z)", text, re.M | re.S)
    if not match:
        return []
    return [line.strip()[2:].strip() for line in match.group(1).splitlines() if line.strip().startswith("- ")]


def _training_configuration(runs_root: Path, main_model: str) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if not runs_root.is_dir():
        return records
    for run_dir in sorted(path for path in runs_root.iterdir() if path.is_dir()):
        if _model_type(run_dir.name) != main_model:
            continue
        manifest = _read_json(run_dir / "manifest.json")
        summary = _read_json(run_dir / "summary.json")
        if manifest or summary:
            records.append({"run_id": run_dir.name, "manifest": manifest, "summary": summary})
    return records


def build_validated_report(
    artifacts_root: str | Path,
    repository_root: str | Path | None = None,
) -> dict[str, Any]:
    """Aggregate available run/result artifacts into a report with explicit missing sections."""
    root = Path(artifacts_root)
    results = root / "results" if (root / "results").is_dir() else root
    loaded_validation = _read_json(results / "validation.json")
    validation = loaded_validation if isinstance(loaded_validation, dict) else {}
    if not validation and not any(results.glob("*.csv")):
        raise FileNotFoundError(f"No validation JSON or CSV result artifacts found under {results}")
    main_model = str(validation.get("main_model") or "oceanembed_cyclone")
    period = validation.get("period") or {}
    region = validation.get("region") or {}

    glorys_frame = _read_csv(results / "glorys_test_overall.csv")
    argo_frame = _read_csv(results / "argo_summary.csv")
    argo_products_frame = _read_csv(results / "argo_products_summary.csv")
    uncertainty_frame = _read_csv(results / "uncertainty_coverage.csv")
    uncertainty_members = _read_json(results / "uncertainty_members.json")
    representativeness = _read_json(results / "uncertainty_representativeness.json")
    case_frame = _read_csv(results / "casestudy_stats.csv")
    if case_frame is not None and len(case_frame.columns):
        first = case_frame.columns[0]
        if first not in {"corr_daily", "rmse"}:
            case_frame = case_frame.rename(columns={first: "quantity"})

    model_column = "model_type"
    glorys_rows = _aggregate(glorys_frame, [])
    argo_rows = _aggregate(argo_frame, ["subset"])
    argo_product_rows = _aggregate(argo_products_frame, ["subset"])

    uncertainty_rows = []
    if uncertainty_frame is not None:
        uncertainty_rows = [_json_safe(row) for row in uncertainty_frame.to_dict(orient="records")]
    case_rows = []
    if case_frame is not None:
        case_rows = [_json_safe(row) for row in case_frame.to_dict(orient="records")]

    docs_root = Path(repository_root) if repository_root else Path(__file__).resolve().parents[2]
    notes = validation.get("notes", [])
    report = {
        "dataset_scope": {
            "region": region or None,
            "period": period or None,
            "depth_levels_m": _depth_levels(validation, results, main_model),
            "source": "results/validation.json" if validation else None,
        },
        "model": {
            "main_model": main_model,
            "training_configuration": _training_configuration(root / "runs", main_model),
        },
        "glorys_test": {
            "test_days": period.get("test"),
            "metrics_by_model": glorys_rows,
        },
        "argo": {
            "metrics_by_subset_and_model": argo_rows,
            "product_metrics_by_subset_and_model": argo_product_rows,
        },
        "depth_wise_performance": _main_depth_performance(results, main_model),
        "uncertainty": {
            "coverage_rows": uncertainty_rows,
            "metadata": {
                "calibration_fit_split": "validation days",
                "coverage_evaluation_split": "test days",
                "calibration_members": uncertainty_members,
                "argo_representativeness": representativeness,
            },
        },
        "cyclone_products": {
            "glorys_test_metrics": next(
                (row for row in glorys_rows if row.get(model_column) == main_model), None
            ),
            "argo_metrics": [row for row in argo_product_rows if row.get(model_column) == main_model],
        },
        "case_study": {
            "summary": validation.get("case_study", {}).get("summary"),
            "metrics": case_rows,
        },
        "limitations": _limitations(docs_root),
        "validation_notes": notes,
        "artifact_sources": sorted(
            path.name for path in results.iterdir() if path.is_file() and path.suffix.lower() in {".csv", ".json"}
        ),
    }
    return _json_safe(report)


def write_validated_report(report: dict[str, Any], path: str | Path) -> Path:
    """Write a generated report as strict JSON without NaN/Infinity tokens."""
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as stream:
        json.dump(_json_safe(report), stream, indent=2, allow_nan=False)
        stream.write("\n")
    return destination