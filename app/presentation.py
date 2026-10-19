"""Judge-facing presentation for the validated OceanEmbed proof of concept."""

from __future__ import annotations

import logging
import os
import platform
from datetime import date
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import xarray as xr
from plotly.subplots import make_subplots

from oceanembed.physics.products import all_products
from oceanembed.sih.demo import discover_runs, resolve_artifact_root, run_inference, select_run
from oceanembed.sih.preflight import preflight_path
from oceanembed.sih.report import build_validated_report

LOGGER = logging.getLogger("oceanembed.sih.presentation")
DEFAULT_ARTIFACTS = os.environ.get("OCEANEMBED_ARTIFACTS", "../../oceanembed_results")
DEFAULT_INPUT = os.environ.get("OCEANEMBED_INPUT_CUBE", "data/processed/cube.nc")
OPENING_EXPLANATION = (
    "Satellites observe the ocean surface, but much of the ocean's temperature structure lies below the surface. "
    "OceanEmbed uses surface ocean observations and deep learning to reconstruct subsurface temperature profiles."
)
SURFACE_UNAVAILABLE_MESSAGE = (
    "Surface observation maps require the harmonized input dataset. "
    "The current demonstration is using our validated reconstructed outputs."
)
PRODUCT_LABELS = {
    "D26_m": ("D26", "m"),
    "D20_m": ("D20", "m"),
    "TCHP_kJcm2": ("TCHP", "kJ/cm²"),
    "MLD_m": ("MLD", "m"),
}
SURFACE_GROUPS = {
    "SST": ("analysed_sst",),
    "SSS": ("sos",),
    "SLA": ("sla",),
    "ADT": ("adt",),
    "Surface currents": ("u", "v"),
    "Surface winds": ("uwnd", "vwnd"),
}
SURFACE_DESCRIPTIONS = {
    "SST": "Sea-surface temperature",
    "SSS": "Sea-surface salinity",
    "SLA": "Sea-level anomaly",
    "ADT": "Absolute height of the sea surface",
    "Surface currents": "Eastward and northward surface flow",
    "Surface winds": "Eastward and northward winds above the sea",
}


def resolve_user_path(value: str) -> Path:
    """Resolve a configurable path relative to the current working directory."""
    return Path(value).expanduser().resolve()


def validation_values(report: dict[str, Any]) -> dict[str, Any]:
    """Select the main model metrics from the existing generated report structure."""
    model = report.get("model", {}).get("main_model")
    glorys = _find_row(report.get("glorys_test", {}).get("metrics_by_model", []), model)
    argo_rows = report.get("argo", {}).get("metrics_by_subset_and_model", [])
    argo_all = _find_row(argo_rows, model, "all_days")
    argo_test = _find_row(argo_rows, model, "test_days_only")
    case = {row.get("quantity"): row for row in report.get("case_study", {}).get("metrics", [])}
    return {
        "model": model,
        "glorys_rmse": _metric(glorys, "rmse"),
        "argo_all_rmse": _metric(argo_all, "rmse"),
        "argo_test_rmse": _metric(argo_test, "rmse"),
        "d26_correlation": _finite(case.get("D26_m", {}).get("corr_daily")),
        "tchp_correlation": _finite(case.get("TCHP_kJcm2", {}).get("corr_daily")),
        "mld_correlation": _finite(case.get("MLD_m", {}).get("corr_daily")),
    }


def _find_row(rows: list[dict[str, Any]], model: str | None, subset: str | None = None) -> dict[str, Any] | None:
    return next((row for row in rows if row.get("model_type") == model
                 and (subset is None or row.get("subset") == subset)), None)


def _metric(row: dict[str, Any] | None, key: str) -> dict[str, float | None] | None:
    value = row.get("metrics", {}).get(key) if row else None
    return {"mean": value.get("mean"), "std": value.get("std")} if value else None


def _finite(value: Any) -> float | None:
    return float(value) if value is not None and np.isfinite(float(value)) else None


def profile_products(profile: np.ndarray, depths: np.ndarray) -> dict[str, float | None]:
    """Use the core OceanEmbed product definitions for a selected profile."""
    values = all_products(np.asarray(profile)[None, :, None, None], depths, axis=1)
    return {name: _finite(np.asarray(values[name])[0, 0, 0]) for name in PRODUCT_LABELS}


@st.cache_resource(show_spinner=False)
def _open_product(path_string: str) -> xr.Dataset:
    path = Path(path_string)
    return xr.open_zarr(path) if path.is_dir() else xr.open_dataset(path)


@st.cache_resource(show_spinner=False)
def _open_cube(path_string: str) -> xr.Dataset:
    return xr.open_dataset(path_string)


@st.cache_data(show_spinner=False)
def _load_report(root_string: str) -> dict[str, Any]:
    return build_validated_report(root_string)


@st.cache_data(show_spinner=False)
def _load_case_table(path_string: str, modified: float) -> pd.DataFrame:
    return pd.read_csv(path_string, parse_dates=["date"])


@st.cache_data(show_spinner=False)
def _load_argo_matches(path_string: str, modified: float) -> pd.DataFrame:
    return pd.read_csv(path_string)


@st.cache_data(show_spinner=False)
def _preflight_cached(path_string: str, modified: float,
                      checkpoint_string: str | None = None,
                      checkpoint_modified: float | None = None) -> dict[str, Any]:
    checkpoint = None
    if checkpoint_string:
        import torch

        checkpoint = torch.load(checkpoint_string, map_location="cpu", weights_only=False)
    return preflight_path(path_string, checkpoint=checkpoint).to_dict()


def _set_page_style() -> None:
    st.markdown(
        """
        <style>
        :root { --ink:#17363b; --muted:#557176; --sea:#168b88; --coral:#d97859;
                --gold:#c48b2c; --paper:#f1f6f4; --line:#cbdad6; }
        .stApp { background:var(--paper); color:var(--ink); }
        [data-testid="stHeader"] { background:rgba(241,246,244,.9); }
        .block-container { max-width:1380px; padding-top:1.4rem; padding-bottom:3rem; }
        h1,h2,h3 { color:var(--ink); font-family:'Aptos Display','Trebuchet MS',sans-serif; }
        h1 { font-size:2.6rem !important; line-height:1.08 !important; }
        h2 { font-size:1.75rem !important; margin-bottom:.2rem !important; }
        h3 { font-size:1.25rem !important; }
        .hero { padding:1rem 0 1.25rem; border-bottom:2px solid var(--line); margin-bottom:1rem; }
        .hero-subtitle { color:var(--sea); font-size:1.25rem; font-weight:650; margin:.35rem 0 .7rem; }
        .hero-copy { color:#34575c; font-size:1.03rem; line-height:1.55; max-width:1000px; }
        .section-note { color:var(--muted); font-size:1rem; margin:.1rem 0 1rem; }
        .pipeline-step { min-height:90px; background:#fff; border-top:4px solid var(--sea);
                         padding:1rem .9rem; text-align:center; font-weight:700; color:var(--ink); }
        .pipeline-arrow { text-align:center; color:var(--coral); font-size:1.6rem; padding-top:1.35rem; }
        .meaning-band { color:#34575c; background:#e4efec; border-left:4px solid var(--sea);
                        padding:.8rem 1rem; margin:.5rem 0 1.1rem; }
        .soft-band { color:#34575c; background:#e8f0ee; padding:.8rem 1rem; border-radius:4px; }
        .section-rule { border-top:1px solid var(--line); padding-top:1.1rem; margin-top:1.2rem; }
        .scope-card { border:1px solid var(--line); background:#fff; padding:1rem 1.1rem; }
        .scope-card strong { color:var(--sea); }
        div[data-testid="stMetric"] { background:#fff; border-top:3px solid var(--sea); padding:.75rem .9rem; }
        div[data-testid="stMetric"] label { color:var(--muted); }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _product_path(outputs: Path) -> Path | None:
    for path in sorted(outputs.glob("*.zarr")) + sorted(outputs.glob("*.nc")):
        try:
            dataset = xr.open_zarr(path) if path.is_dir() else xr.open_dataset(path)
        except (ImportError, OSError, ValueError):
            continue
        try:
            if "temperature" in dataset.data_vars:
                return path
        finally:
            dataset.close()
    return None


def _nearest(values: np.ndarray, selected: float) -> int:
    return int(np.abs(np.asarray(values, dtype=float) - float(selected)).argmin())


def _date_index(dataset: xr.Dataset, chosen: date | str) -> int:
    values = np.asarray(dataset.time.values).astype("datetime64[D]")
    return int(np.abs(values - np.datetime64(str(chosen), "D")).argmin())


def _region_text(report: dict[str, Any]) -> str:
    region = report.get("dataset_scope", {}).get("region") or {}
    lat = region.get("lat") or region.get("latitude") or [5, 22]
    lon = region.get("lon") or region.get("longitude") or [80, 100]
    return f"{lat[0]:g}–{lat[1]:g}°N · {lon[0]:g}–{lon[1]:g}°E"


def _format_rmse(value: dict[str, float | None] | None, include_spread: bool = True) -> str:
    if not value or value.get("mean") is None:
        return "Unavailable"
    text = f"{float(value['mean']):.4f}"
    spread = value.get("std")
    if include_spread and spread is not None and np.isfinite(float(spread)):
        text += f" ± {float(spread):.4f}"
    return text


def _converted_surface(variable: str, value: float, attrs: dict[str, Any]) -> tuple[float, str]:
    units = str(attrs.get("units", ""))
    if variable == "analysed_sst" and (units.lower() in {"k", "kelvin"} or value > 100):
        return value - 273.15, "°C"
    defaults = {"analysed_sst": "°C", "sos": "PSU", "sla": "m", "adt": "m",
                "u": "m/s", "v": "m/s", "uwnd": "m/s", "vwnd": "m/s"}
    return value, units or defaults[variable]


def _surface_values(dataset: xr.Dataset | None, chosen: date,
                    latitude: float, longitude: float) -> dict[str, dict[str, tuple[float, str]]]:
    values: dict[str, dict[str, tuple[float, str]]] = {}
    if dataset is None:
        return values
    lat_name = "latitude" if "latitude" in dataset.coords else "lat"
    lon_name = "longitude" if "longitude" in dataset.coords else "lon"
    time_index = _date_index(dataset, chosen)
    for group, names in SURFACE_GROUPS.items():
        present = {}
        for variable in names:
            if variable not in dataset.data_vars:
                continue
            field = dataset[variable]
            selected = field.isel(time=time_index).sel(
                {lat_name: latitude, lon_name: longitude}, method="nearest"
            )
            value = float(selected.values)
            if np.isfinite(value):
                present[variable] = _converted_surface(variable, value, field.attrs)
        if present:
            values[group] = present
    return values


def _profile_figure(depths: np.ndarray, temperatures: np.ndarray,
                    uncertainty: np.ndarray | None, selected_depth: float,
                    uncertainty_name: str = "Estimated uncertainty band") -> go.Figure:
    figure = go.Figure()
    temperatures = np.asarray(temperatures, dtype=float)
    valid = np.isfinite(temperatures)
    if uncertainty is not None:
        sigma = np.asarray(uncertainty, dtype=float)
        low, high = temperatures - sigma, temperatures + sigma
        figure.add_trace(go.Scatter(x=high[valid], y=depths[valid], mode="lines",
                                    line={"width": 0}, showlegend=False, hoverinfo="skip"))
        figure.add_trace(go.Scatter(x=low[valid], y=depths[valid], mode="lines",
                                    fill="tonextx", fillcolor="rgba(22,139,136,.17)",
                                    line={"width": 0}, name=uncertainty_name, hoverinfo="skip"))
    figure.add_trace(go.Scatter(x=temperatures[valid], y=depths[valid], mode="lines+markers",
                                line={"color": "#d97859", "width": 3}, marker={"size": 5},
                                name="Reconstructed temperature"))
    selected_index = int(np.abs(np.asarray(depths) - selected_depth).argmin())
    if np.isfinite(temperatures[selected_index]):
        figure.add_trace(go.Scatter(x=[temperatures[selected_index]], y=[depths[selected_index]],
                                    mode="markers", marker={"size": 12, "color": "#17363b",
                                                             "symbol": "circle-open", "line": {"width": 2}},
                                    name="Selected depth"))
    figure.add_hline(y=selected_depth, line_dash="dot", line_color="#17363b", opacity=.6)
    figure.update_layout(height=570, margin={"l": 10, "r": 15, "t": 20, "b": 15},
                         xaxis_title="Temperature (°C)", yaxis_title="Depth (m)",
                         legend={"orientation": "h", "y": 1.08},
                         paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="white")
    figure.update_yaxes(autorange="reversed", gridcolor="#dce7e4")
    figure.update_xaxes(gridcolor="#dce7e4")
    return figure


def _uncertainty_figure(depths: np.ndarray, sigma: np.ndarray) -> go.Figure:
    figure = go.Figure(go.Scatter(x=sigma, y=depths, mode="lines+markers",
                                  line={"color": "#168b88", "width": 2.5},
                                  marker={"size": 5, "color": "#d97859"},
                                  name="Estimated uncertainty"))
    figure.update_layout(height=360, margin={"l": 10, "r": 15, "t": 15, "b": 15},
                         xaxis_title="Temperature uncertainty (°C)", yaxis_title="Depth (m)",
                         paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="white")
    figure.update_yaxes(autorange="reversed", gridcolor="#dce7e4")
    figure.update_xaxes(gridcolor="#dce7e4")
    return figure


def _case_study_figure(root: Path) -> go.Figure | None:
    path = root / "results" / "casestudy_timeseries.csv"
    if not path.is_file():
        return None
    frame = _load_case_table(str(path), path.stat().st_mtime)
    rows = [("TCHP_kJcm2", "Heat stored below the surface (kJ/cm²)"),
            ("D26_m", "Depth of 26°C water (m)"),
            ("MLD_m", "Mixed upper-layer depth (m)")]
    figure = make_subplots(rows=3, cols=1, shared_xaxes=True, vertical_spacing=.1,
                           subplot_titles=[label for _, label in rows])
    for row_number, (field, label) in enumerate(rows, start=1):
        for suffix, name, color, dash in (
            ("glorys", "Reference reconstruction", "#17363b", "dash"),
            ("model", "OceanEmbed", "#168b88", "solid"),
        ):
            column = f"{field}_{suffix}"
            if column in frame:
                figure.add_trace(go.Scatter(
                    x=frame.date, y=frame[column], mode="lines", name=name,
                    legendgroup=name, showlegend=row_number == 1,
                    line={"color": color, "width": 2.5 if suffix == "model" else 1.8, "dash": dash},
                ), row=row_number, col=1)
        figure.add_vline(x="2023-08-01", line_dash="dot", line_color="#d97859",
                         row=row_number, col=1)
        figure.update_yaxes(title_text=label, row=row_number, col=1, gridcolor="#dce7e4")
    figure.update_xaxes(title_text="Date", row=3, col=1, gridcolor="#dce7e4")
    figure.update_layout(height=700, margin={"l": 15, "r": 15, "t": 55, "b": 15},
                         legend={"orientation": "h", "y": 1.04},
                         paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="white")
    return figure


def _argo_reference_figure(root: Path) -> go.Figure | None:
    path = root / "results" / "argo_matches_oceanembed_cyclone_s0.csv"
    if not path.is_file():
        return None
    frame = _load_argo_matches(str(path), path.stat().st_mtime)
    valid = frame[np.isfinite(frame["argo"]) & np.isfinite(frame["model"])]
    if valid.empty:
        return None
    low = float(min(valid["argo"].min(), valid["model"].min()))
    high = float(max(valid["argo"].max(), valid["model"].max()))
    figure = go.Figure()
    figure.add_trace(go.Scattergl(x=valid["argo"], y=valid["model"], mode="markers",
                                  marker={"size": 4, "opacity": .3, "color": valid["depth"],
                                          "colorscale": "Viridis", "colorbar": {"title": "Depth (m)"}},
                                  name="Measured profile points",
                                  hovertemplate="Measured %{x:.2f}°C<br>Reconstructed %{y:.2f}°C<extra></extra>"))
    figure.add_trace(go.Scatter(x=[low, high], y=[low, high], mode="lines",
                                line={"color": "#d97859", "dash": "dash"}, name="Equal values"))
    figure.update_layout(height=380, margin={"l": 10, "r": 15, "t": 15, "b": 15},
                         xaxis_title="ARGO measured temperature (°C)",
                         yaxis_title="OceanEmbed reconstructed temperature (°C)",
                         paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="white")
    figure.update_xaxes(range=[low, high], gridcolor="#dce7e4")
    figure.update_yaxes(range=[low, high], gridcolor="#dce7e4", scaleanchor="x", scaleratio=1)
    return figure


def _show_surface(dataset: xr.Dataset | None, selected_date: date,
                  latitude: float, longitude: float) -> None:
    st.header("What can satellites observe?")
    if dataset is None:
        st.info(SURFACE_UNAVAILABLE_MESSAGE)
        return
    values = _surface_values(dataset, selected_date, latitude, longitude)
    if not values:
        st.info("No finite surface observations are available at this location and date.")
        return
    columns = st.columns(3)
    for index, (name, description) in enumerate(SURFACE_DESCRIPTIONS.items()):
        item = values.get(name)
        if not item:
            continue
        formatted = " · ".join(f"{value:.3f} {units}" for value, units in item.values())
        columns[index % 3].metric(name, formatted, help=description)
        columns[index % 3].caption(description)


def _show_products(profile: np.ndarray, depths: np.ndarray) -> None:
    st.header("What does the reconstructed temperature tell us?")
    st.markdown("The vertical temperature profile also gives useful summaries of the ocean’s upper layers.")
    descriptions = {
        "D26_m": "Depth of the 26°C water layer",
        "D20_m": "Depth of the 20°C water layer",
        "TCHP_kJcm2": "Heat stored below the surface",
        "MLD_m": "Depth of the ocean’s mixed upper layer",
    }
    values = profile_products(profile, depths)
    columns = st.columns(4)
    for column, (field, (acronym, units)) in zip(columns, PRODUCT_LABELS.items()):
        value = values[field]
        column.metric(acronym, f"{value:.2f} {units}" if value is not None else "Unavailable",
                      help=descriptions[field])
        column.caption(descriptions[field])


def _technical_controls(root_default: str) -> dict[str, Any]:
    with st.expander("Developer / Technical Details", expanded=False):
        st.caption("Optional paths and execution controls for the demonstration.")
        artifact_text = st.text_input("Artifact bundle path", value=root_default, key="sih_artifact_path")
        input_text = st.text_input("Input cube path", value=DEFAULT_INPUT, key="sih_input_cube_path")
        try:
            root = resolve_artifact_root(resolve_user_path(artifact_text))
            runs = discover_runs(root)
            run_ids = [item.run_id for item in runs]
        except (OSError, FileNotFoundError, ValueError) as exc:
            root = None
            runs = []
            run_ids = []
            st.error(f"Validated demonstration files could not be found: {exc}")
        selected_run = None
        selected_checkpoint = None
        if run_ids:
            preferred = "oceanembed_cyclone_s0" if "oceanembed_cyclone_s0" in run_ids else run_ids[0]
            selected_run = st.selectbox("Model run", run_ids, index=run_ids.index(preferred), key="sih_model_run")
            run = next(item for item in runs if item.run_id == selected_run)
            checkpoint_paths = list(run.checkpoints)
            selected_checkpoint_text = st.selectbox(
                "Checkpoint artifact", [str(path) for path in checkpoint_paths], key="sih_checkpoint"
            )
            selected_checkpoint = Path(selected_checkpoint_text)
        mode = st.radio("Execution mode", ["Validated precomputed output", "Model inference"],
                        index=0, key="sih_execution_mode")
        input_path = resolve_user_path(input_text) if input_text.strip() else None
        preflight_report = None
        if input_path is not None and input_path.is_file():
            try:
                checkpoint_string = str(selected_checkpoint) if selected_checkpoint else None
                checkpoint_modified = selected_checkpoint.stat().st_mtime if selected_checkpoint else None
                preflight_report = _preflight_cached(
                    str(input_path), input_path.stat().st_mtime,
                    checkpoint_string, checkpoint_modified,
                )
            except Exception as exc:
                LOGGER.exception("Configured input data failed preflight")
                preflight_report = {"status": "FAIL", "errors": [str(exc)]}
        can_infer = inference_available(mode, root, input_path, selected_checkpoint, preflight_report)
        run_requested = st.button("Run model inference", disabled=not can_infer,
                                   type="primary", key="sih_run_inference")
        st.caption("Model inference requires a compatible source dataset and trained run. The validated output remains available when those are absent.")
        st.markdown("**Data and software**")
        st.write({
            "Dataset identifier": "Bay of Bengal daily reconstruction",
            "Date range": "2023-06-01 to 2023-08-31",
            "Depth levels": 35,
            "Depth range": "approximately 0.5–902 m",
            "Region": "Bay of Bengal, 5–22°N, 80–100°E",
            "Python": platform.python_version(),
            "Streamlit": st.__version__,
            "Model run": selected_run or "unavailable",
            "Checkpoint path": str(selected_checkpoint) if selected_checkpoint else "unavailable",
            "Input cube path": input_text or "unavailable",
            "Artifact bundle path": str(root) if root else artifact_text,
            "Preflight status": (preflight_report or {}).get("status", "not run · input dataset unavailable"),
        })
        if preflight_report:
            st.markdown("**Input preflight result**")
            st.json(preflight_report)
    return {
        "root": root,
        "input_path": input_path,
        "selected_run": selected_run,
        "checkpoint": selected_checkpoint,
        "preflight": preflight_report,
        "inference_requested": run_requested,
        "mode": mode,
    }


def _run_selected_inference(controls: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any] | None, str | None]:
    root = controls["root"]
    input_path = controls["input_path"]
    checkpoint_path = controls["checkpoint"]
    run_id = controls["selected_run"]
    if root is None or input_path is None or checkpoint_path is None or run_id is None:
        return None, None, "A compatible input dataset and model run are not available."
    if not input_path.is_file():
        return None, None, f"Input dataset not found: {input_path.name}"
    try:
        import torch

        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        report = preflight_path(input_path, checkpoint=checkpoint).to_dict()
        if report["status"] == "FAIL":
            return None, report, "The selected dataset is not compatible with this model."
        result = run_inference(artifacts_root=root, input_path=input_path,
                               run_id=run_id, checkpoint_path=checkpoint_path)
        return result, report, None
    except Exception as exc:
        LOGGER.exception("Model inference could not be started")
        return None, None, str(exc)


def inference_available(mode: str, root: Path | None, input_path: Path | None,
                        checkpoint_path: Path | None,
                        preflight: dict[str, Any] | None) -> bool:
    """Return whether the real inference action has all required compatible artifacts."""
    return bool(
        mode == "Model inference"
        and root is not None
        and input_path is not None
        and input_path.is_file()
        and checkpoint_path is not None
        and checkpoint_path.is_file()
        and preflight is not None
        and preflight.get("status") in {"PASS", "WARNING"}
    )


def _pipeline() -> None:
    columns = st.columns([1, .18, 1, .18, 1, .18, 1])
    steps = [
        (0, "SURFACE OBSERVATIONS"), (2, "OceanEmbed AI"),
        (4, "SUBSURFACE TEMPERATURE"), (6, "OCEAN INTELLIGENCE"),
    ]
    for index, label in steps:
        with columns[index]:
            st.markdown(f'<div class="pipeline-step">{label}</div>', unsafe_allow_html=True)
    for index in (1, 3, 5):
        with columns[index]:
            st.markdown('<div class="pipeline-arrow">→</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="meaning-band"><strong>Surface observations → AI reconstruction → temperature at depth → D26 / D20 / TCHP / MLD</strong></div>',
        unsafe_allow_html=True,
    )


def _scope_card() -> None:
    st.header("Current validated PoC")
    st.markdown(
        '<div class="scope-card"><strong>Bay of Bengal</strong> · 5–22°N · 80–100°E · '
        'June–August 2023 · 35 depth levels · approximately 0.5–902 m</div>',
        unsafe_allow_html=True,
    )
    st.caption("This is the current research prototype scope. Expansion to the full North Indian Ocean target region is planned. This is not cyclone forecasting.")


def main() -> None:
    st.set_page_config(page_title="OceanEmbed SIH", layout="wide")
    _set_page_style()

    st.markdown(
        '<div class="hero"><h1>OceanEmbed SIH</h1>'
        '<div class="hero-subtitle">Reconstructing the Hidden Ocean Beneath the Surface</div>'
        f'<div class="hero-copy">{OPENING_EXPLANATION}</div></div>',
        unsafe_allow_html=True,
    )

    controls = _technical_controls(DEFAULT_ARTIFACTS)
    root = controls["root"]
    if root is None:
        st.error("The validated demonstration files are unavailable. Set their location under Developer / Technical Details.")
        return

    try:
        report = _load_report(str(root))
        output_path = _product_path(root / "outputs")
        if output_path is None:
            st.error("The validated reconstructed temperature output is unavailable in this bundle.")
            return
        outputs = _open_product(str(output_path))
    except Exception as exc:
        LOGGER.exception("Failed to load validated OceanEmbed outputs")
        st.error("The validated ocean reconstruction could not be loaded. Technical details are available below.")
        with st.expander("Load details"):
            st.code(str(exc))
        return

    dates = np.asarray(outputs.time.values).astype("datetime64[D]")
    latitudes = np.asarray(outputs.latitude.values, dtype=float)
    longitudes = np.asarray(outputs.longitude.values, dtype=float)
    depths = np.asarray(outputs.depth.values, dtype=float)
    available_runs = [item.run_id for item in discover_runs(root)]
    main_model = report.get("model", {}).get("main_model")
    scope = report.get("dataset_scope", {})
    validation = validation_values(report)

    st.header("How OceanEmbed works")
    st.markdown('<p class="section-note">We use what satellites can see at the surface to estimate the temperature structure hidden below.</p>',
                unsafe_allow_html=True)
    _pipeline()
    st.markdown("**Why look below the surface?** Warm water beneath the surface can keep supplying heat to a tropical cyclone even after the surface cools.")
    opening_metrics = st.columns(3)
    opening_metrics[0].metric("GLORYS12 reference", f"{_format_rmse(validation['glorys_rmse'])} °C RMSE")
    opening_metrics[1].metric("Independent float check", f"{_format_rmse(validation['argo_all_rmse'], include_spread=False)} °C RMSE")
    opening_metrics[2].metric("Ocean profile", f"{len(depths)} depths · {depths.min():.0f}–{depths.max():.0f} m")
    st.caption("Lower RMSE means smaller temperature prediction error. Independent float results include all dates; details are below.")

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    st.header("Explore the ocean")
    st.markdown('<p class="section-note">Choose a location and date to explore the reconstructed ocean profile.</p>',
                unsafe_allow_html=True)
    selector_date, selector_lat, selector_lon = st.columns([1, 1, 1])
    with selector_date:
        selected_date = st.date_input("Date", value=pd.Timestamp(dates[-1]).date(),
                                      min_value=pd.Timestamp(dates[0]).date(),
                                      max_value=pd.Timestamp(dates[-1]).date(), key="ocean_date")
    with selector_lat:
        selected_lat = st.number_input("Latitude", min_value=float(latitudes.min()),
                                       max_value=float(latitudes.max()),
                                       value=float(latitudes[len(latitudes) // 2]), step=.25,
                                       format="%.2f", key="ocean_latitude")
    with selector_lon:
        selected_lon = st.number_input("Longitude", min_value=float(longitudes.min()),
                                       max_value=float(longitudes.max()),
                                       value=float(longitudes[len(longitudes) // 2]), step=.25,
                                       format="%.2f", key="ocean_longitude")
    time_index = _date_index(outputs, selected_date)
    latitude_index = _nearest(latitudes, selected_lat)
    longitude_index = _nearest(longitudes, selected_lon)
    actual_lat = float(latitudes[latitude_index])
    actual_lon = float(longitudes[longitude_index])
    date_label = str(dates[time_index])

    input_cube: xr.Dataset | None = None
    input_preflight: dict[str, Any] | None = None
    input_path = controls["input_path"]
    if input_path is not None and input_path.is_file():
        try:
            input_preflight = _preflight_cached(str(input_path), input_path.stat().st_mtime)
            if input_preflight.get("status") != "FAIL":
                input_cube = _open_cube(str(input_path))
        except Exception:
            LOGGER.exception("Unable to inspect optional surface observations")

    inference_result = None
    inference_preflight = None
    inference_issue = None
    if controls["mode"] == "Model inference":
        if controls["inference_requested"]:
            inference_result, inference_preflight, inference_issue = _run_selected_inference(controls)
            inference_key = (str(input_path), controls["selected_run"], str(controls["checkpoint"]))
            if inference_result is not None:
                st.session_state["oceanembed_judge_inference"] = inference_result
                st.session_state["oceanembed_judge_inference_key"] = inference_key
        inference_key = (str(input_path), controls["selected_run"], str(controls["checkpoint"]))
        if (inference_result is None
                and st.session_state.get("oceanembed_judge_inference_key") == inference_key):
            inference_result = st.session_state.get("oceanembed_judge_inference")
        if inference_result is not None:
            inference_preflight = inference_result.get("preflight")
        elif input_path is None or not input_path.is_file():
            inference_issue = "No compatible source dataset is available for new inference."
        else:
            inference_preflight = input_preflight
            if inference_preflight and inference_preflight.get("status") == "FAIL":
                inference_issue = "The selected dataset did not pass the model compatibility checks."

    if inference_result is None and inference_issue:
        st.markdown('<div class="soft-band">This view is using the validated reconstruction output because a compatible input dataset is not available.</div>',
                    unsafe_allow_html=True)
    elif inference_result is not None:
        st.markdown('<div class="soft-band">Showing a new reconstruction from the selected location and date.</div>',
                    unsafe_allow_html=True)

    if inference_result is None:
        profile = np.asarray(outputs.temperature.isel(time=time_index, latitude=latitude_index,
                                                     longitude=longitude_index).values, dtype=float)
        sigma = (np.asarray(outputs["temperature_std"].isel(time=time_index, latitude=latitude_index,
                                                             longitude=longitude_index).values, dtype=float)
                 if "temperature_std" in outputs.data_vars else None)
    else:
        profile = np.asarray(inference_result["temperature"][0, :, latitude_index, longitude_index], dtype=float)
        sigma = (np.asarray(inference_result["sigma"][0, :, latitude_index, longitude_index], dtype=float)
                 if inference_result["sigma"] is not None else None)

    _show_surface(input_cube, selected_date, actual_lat, actual_lon)

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    st.header("What is happening below the surface?")
    st.markdown('<p class="section-note">The model reconstructs the vertical temperature structure that cannot be directly observed from surface measurements alone.</p>',
                unsafe_allow_html=True)
    suggested_depth = float(depths[_nearest(depths, 100.0)])
    selected_depth = st.selectbox("Highlight a depth", depths.tolist(),
                                  index=int(np.abs(depths - suggested_depth).argmin()),
                                  format_func=lambda value: f"{value:.1f} m", key="profile_depth")
    profile_column, table_column = st.columns([1.55, 1])
    with profile_column:
        st.plotly_chart(_profile_figure(depths, profile, sigma, float(selected_depth)),
                        width="stretch", key="main_temperature_profile")
        st.caption(f"Selected point: {profile[_nearest(depths, float(selected_depth))]:.2f}°C at {float(selected_depth):.1f} m, where available.")
    with table_column:
        uncertainty_values = sigma if sigma is not None else np.full_like(profile, np.nan)
        profile_table = pd.DataFrame({
            "Depth (m)": depths,
            "Temperature (°C)": profile,
            "Estimated uncertainty (°C)": uncertainty_values,
        })
        profile_table = profile_table.replace({np.nan: None})
        st.dataframe(profile_table, height=570, hide_index=True, width="stretch",
                     column_config={
                         "Depth (m)": st.column_config.NumberColumn(format="%.1f"),
                         "Temperature (°C)": st.column_config.NumberColumn(format="%.2f"),
                         "Estimated uncertainty (°C)": st.column_config.NumberColumn(format="%.3f"),
                     })
        if sigma is not None:
            st.caption("Uncertainty is shown as a temperature spread, not a measure of percent accuracy.")
        else:
            st.caption("Uncertainty values are not present in this output.")

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    _show_products(profile, depths)

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    st.header("Why does subsurface temperature matter for cyclones?")
    st.markdown("Warm water below the surface can continue supplying heat to a tropical cyclone even after the surface cools.")
    st.caption("Historical subsurface ocean/cyclone analysis for one event. This is not cyclone forecasting.")
    case_figure = _case_study_figure(root)
    if case_figure is not None:
        st.plotly_chart(case_figure, width="stretch", key="case_study_timeseries")
    case_metrics = [
        ("D26 correlation", validation["d26_correlation"]),
        ("TCHP correlation", validation["tchp_correlation"]),
        ("MLD correlation", validation["mld_correlation"]),
    ]
    case_columns = st.columns(3)
    for column, (label, value) in zip(case_columns, case_metrics):
        column.metric(label, f"{value:.4f}" if value is not None else "Unavailable",
                      help="Model vs GLORYS case-study correlation")
        column.caption("Model vs GLORYS case-study correlation")

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    st.header("Independent Validation")
    st.markdown("To evaluate the reconstruction, we compare the model against independent ocean reference data.")
    valid_columns = st.columns(2)
    valid_columns[0].metric("GLORYS12", f"{_format_rmse(validation['glorys_rmse'])} °C RMSE",
                            help="Held-out reference comparison. Lower RMSE means a smaller temperature error.")
    valid_columns[0].caption("Held-out comparison with an ocean reference reconstruction")
    valid_columns[1].metric("ARGO profiling floats", f"{_format_rmse(validation['argo_all_rmse'], include_spread=False)} °C RMSE",
                            help="All-days aggregate from float profiles. Lower RMSE means a smaller temperature error.")
    valid_columns[1].caption("All-days result includes training dates; test-days-only RMSE: "
                             f"{_format_rmse(validation['argo_test_rmse'], include_spread=False)} °C")
    st.markdown("**Lower RMSE = smaller temperature prediction error.**")
    st.markdown("ARGO profiling floats directly measure temperature at different ocean depths and provide an independent validation source.")
    reference_figure = _argo_reference_figure(root)
    if reference_figure is not None:
        st.plotly_chart(reference_figure, width="stretch", key="argo_reference_comparison")
        st.caption("Each point is a measured float temperature compared with the model at the same place and depth. The dashed line marks equal values.")

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    st.header("How confident is the model?")
    st.markdown("The model also estimates uncertainty. Larger uncertainty means the reconstruction is less certain.")
    if sigma is not None:
        if inference_result is None:
            st.caption("This validated output contains calibration from the three-seed ensemble. Calibration is useful, but not perfect.")
        else:
            st.caption("This new single-run estimate has not been validation-calibrated; it is distinct from the validated ensemble uncertainty.")
        uncertainty_column, note_column = st.columns([1.3, 1])
        with uncertainty_column:
            st.plotly_chart(_uncertainty_figure(depths, sigma), width="stretch", key="uncertainty_profile")
        with note_column:
            uncertainty_table = pd.DataFrame({"Depth (m)": depths, "Estimated uncertainty (°C)": sigma})
            st.dataframe(uncertainty_table, hide_index=True, height=360, width="stretch")
    else:
        st.info("The selected reconstruction does not include an uncertainty profile.")

    st.markdown('<div class="section-rule"></div>', unsafe_allow_html=True)
    _scope_card()

    with st.expander("Developer / Technical Details", expanded=False):
        st.markdown("Technical paths, execution state, data checks, and software details are kept here.")
        st.write({
            "Artifact bundle path": str(root),
            "Output file": str(output_path),
            "Input cube path": str(input_path) if input_path else "not configured",
            "Selected run": controls["selected_run"] or main_model or "unavailable",
            "Checkpoint path": str(controls["checkpoint"]) if controls["checkpoint"] else "unavailable",
            "Execution mode": controls["mode"],
            "Inference status": "completed" if inference_result is not None else
                               (inference_issue or "precomputed validated output"),
            "Dataset date range": f"{dates[0]} to {dates[-1]}",
            "Dataset dimensions": {key: int(value) for key, value in outputs.sizes.items()},
            "Depth levels": int(len(depths)),
            "Preflight": (inference_preflight or input_preflight or {}).get("status", "not run"),
            "Python": platform.python_version(),
            "Streamlit": st.__version__,
        })
        if input_preflight:
            st.markdown("**Input data preflight**")
            st.json(input_preflight)
        if inference_preflight:
            st.markdown("**Inference compatibility preflight**")
            st.json(inference_preflight)
        if inference_issue:
            st.caption(f"Inference status: {inference_issue}")


if __name__ == "__main__":
    main()