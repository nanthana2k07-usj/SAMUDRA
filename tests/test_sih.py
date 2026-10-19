import json

import numpy as np
import pandas as pd
import pytest
import xarray as xr

from oceanembed.physics.products import all_products
from oceanembed.sih.demo import discover_runs, run_precomputed, select_run
from oceanembed.sih.preflight import preflight_dataset
from oceanembed.sih.report import build_validated_report, write_validated_report


def _cube_dataset():
    times = np.array(["2023-06-01", "2023-06-02"], dtype="datetime64[D]")
    depth = np.array([0.5, 10.0, 100.0], dtype=np.float32)
    lat = np.array([5.0, 5.25], dtype=np.float32)
    lon = np.array([80.0, 80.25], dtype=np.float32)
    surface = np.ones((2, 2, 2), dtype=np.float32)
    profile = np.array([29.0, 28.9, 20.0], dtype=np.float32)
    temperature = np.broadcast_to(profile[None, :, None, None], (2, 3, 2, 2)).copy()
    variables = {
        name: (("time", "lat", "lon"), surface.copy())
        for name in ("analysed_sst", "sos", "sla", "adt", "u", "v", "uwnd", "vwnd")
    }
    variables["thetao"] = (("time", "depth", "lat", "lon"), temperature)
    return xr.Dataset(variables, coords={"time": times, "depth": depth, "lat": lat, "lon": lon})


def _artifact_bundle(root):
    results = root / "results"
    outputs = root / "outputs"
    results.mkdir(parents=True)
    outputs.mkdir()
    (results / "validation.json").write_text(json.dumps({
        "main_model": "oceanembed_cyclone",
        "region": {"name": "Bay of Bengal", "lat": [5.0, 22.0], "lon": [80.0, 100.0]},
        "period": {
            "start": "2023-06-01", "end": "2023-08-31",
            "train": ["2023-06-01", "2023-07-31"],
            "val": ["2023-08-01", "2023-08-15"],
            "test": ["2023-08-16", "2023-08-31"],
        },
        "notes": ["ARGO test days are reported separately."],
    }), encoding="utf-8")
    pd.DataFrame([
        {"model": f"oceanembed_cyclone_s{seed}", "rmse": value, "D26_m_rmse": 8.0 + seed,
         "D20_m_rmse": 9.0 + seed, "TCHP_kJcm2_rmse": 13.0 + seed, "MLD_m_rmse": 12.0 + seed}
        for seed, value in enumerate((0.61, 0.63, 0.64))
    ] + [{"model": "climatology", "rmse": 0.97, "D26_m_rmse": 15.0,
          "D20_m_rmse": 17.0, "TCHP_kJcm2_rmse": 21.0, "MLD_m_rmse": 12.0}]
    ).to_csv(results / "glorys_test_overall.csv", index=False)
    pd.DataFrame([
        {"model": f"oceanembed_cyclone_s{seed}", "subset": subset, "profiles": 10,
         "points": 100, "rmse": value}
        for subset, values in (("all_days", (0.66, 0.71, 0.74)),
                               ("test_days_only", (0.75, 0.90, 0.99)))
        for seed, value in enumerate(values)
    ]).to_csv(results / "argo_summary.csv", index=False)
    pd.DataFrame([{
        "model": f"oceanembed_cyclone_s{seed}", "subset": "test_days_only", "profiles": 5,
        "D26_m_rmse": 12.0 + seed, "D20_m_rmse": 13.0 + seed,
        "TCHP_kJcm2_rmse": 16.0 + seed, "MLD_m_rmse": 14.0 + seed,
    } for seed in range(3)]).to_csv(results / "argo_products_summary.csv", index=False)
    pd.DataFrame([{
        "against": "GLORYS", "subset": "test_days", "90%": 0.84,
        "mean_std_degC": 0.47, "rmse_degC": 0.62,
    }]).to_csv(results / "uncertainty_coverage.csv", index=False)
    (results / "uncertainty_members.json").write_text(json.dumps([
        {"run": f"oceanembed_cyclone_s{seed}", "calibration_factor_k": 1.1 + seed / 10}
        for seed in range(3)
    ]), encoding="utf-8")
    (results / "uncertainty_representativeness.json").write_text(json.dumps({
        "depth_edges_m": [0, 10, 50], "fitted_on": "non-test days",
    }), encoding="utf-8")
    pd.DataFrame([
        {"quantity": "D26_m", "corr_daily": 0.88, "rmse": 1.5},
        {"quantity": "TCHP_kJcm2", "corr_daily": 0.94, "rmse": 3.5},
        {"quantity": "MLD_m", "corr_daily": 0.53, "rmse": 3.0},
    ]).to_csv(results / "casestudy_stats.csv", index=False)
    for seed, value in enumerate((0.61, 0.63, 0.64)):
        pd.DataFrame({"depth_m": [0.5, 10.0], "rmse": [value, value + 0.1]}).to_csv(
            results / f"glorys_test_per_depth_oceanembed_cyclone_s{seed}.csv", index=False
        )

    source = _cube_dataset()
    source = source.rename({"lat": "latitude", "lon": "longitude"})
    source = source.assign_coords(time=np.array(["2023-08-30", "2023-08-31"], dtype="datetime64[D]")).isel(time=[0, 1])
    source["temperature"] = source["thetao"].rename("temperature")
    source["temperature_std"] = xr.zeros_like(source["temperature"]) + 0.2
    source.to_netcdf(outputs / "temperature_product.nc")
    embedding = xr.Dataset({"embedding": (("time", "channel", "y", "x"), np.zeros((2, 1, 1, 1)))})
    embedding.to_netcdf(outputs / "embedding_product.nc")
    return results, outputs, source


def test_preflight_passes_compatible_cube_and_fails_out_of_scope():
    dataset = _cube_dataset()
    passed = preflight_dataset(dataset)
    assert passed.status == "PASS"
    assert passed.metadata["nan_percentage"] == 0.0
    assert passed.checks["time_availability"]["status"] == "PASS"

    outside = dataset.assign_coords(lon=np.array([80.0, 101.0]))
    failed = preflight_dataset(outside)
    assert failed.status == "FAIL"
    assert any("trained PoC scope" in error for error in failed.errors)


def test_preflight_checks_channel_and_checkpoint_compatibility():
    dataset = _cube_dataset()
    good = preflight_dataset(dataset, checkpoint={
        "history": 0, "in_ch": 12, "grid": (8, 8), "depths": np.array([0.5, 10.0, 100.0]),
    })
    assert good.status == "PASS"
    bad = preflight_dataset(dataset, checkpoint={"history": 0, "in_ch": 13})
    assert bad.status == "FAIL"
    assert bad.checks["channel_compatibility"]["status"] == "FAIL"


def test_run_selection_discovers_checkpoint_without_filename_assumption(tmp_path):
    run_dir = tmp_path / "runs" / "oceanembed_cyclone_s1"
    run_dir.mkdir(parents=True)
    checkpoint = run_dir / "weights_epoch_20.pt"
    checkpoint.write_bytes(b"checkpoint")

    assert [run.run_id for run in discover_runs(tmp_path)] == ["oceanembed_cyclone_s1"]
    selected_run, selected_checkpoint = select_run(tmp_path, run_id="oceanembed_cyclone_s1")
    assert selected_run.run_id == "oceanembed_cyclone_s1"
    assert selected_checkpoint == checkpoint


def test_report_aggregates_real_artifact_shapes_and_explicit_test_split(tmp_path):
    _artifact_bundle(tmp_path)
    report = build_validated_report(tmp_path)
    main = next(row for row in report["glorys_test"]["metrics_by_model"]
                if row["model_type"] == "oceanembed_cyclone")
    assert main["metrics"]["rmse"]["mean"] == pytest.approx(np.mean([0.61, 0.63, 0.64]))
    assert main["metrics"]["rmse"]["std"] == pytest.approx(np.std([0.61, 0.63, 0.64], ddof=1))
    assert report["glorys_test"]["test_days"] == ["2023-08-16", "2023-08-31"]
    assert {row["subset"] for row in report["argo"]["metrics_by_subset_and_model"]} == {
        "all_days", "test_days_only"
    }
    assert report["uncertainty"]["coverage_rows"][0]["subset"] == "test_days"
    assert report["uncertainty"]["metadata"]["calibration_fit_split"] == "validation days"
    assert len(report["uncertainty"]["metadata"]["calibration_members"]) == 3
    assert report["dataset_scope"]["depth_levels_m"] == [0.5, 10.0]
    assert len(report["depth_wise_performance"]) == 2
    assert len(report["case_study"]["metrics"]) == 3
    output = write_validated_report(report, tmp_path / "report.json")
    assert json.loads(output.read_text(encoding="utf-8"))["glorys_test"]["test_days"] == [
        "2023-08-16", "2023-08-31"
    ]


def test_precomputed_demo_uses_core_product_definitions(tmp_path, capsys):
    _, _, source = _artifact_bundle(tmp_path)
    summary = run_precomputed(tmp_path)
    output = capsys.readouterr().out
    assert "PRECOMPUTED validated artifacts (no model inference performed)" in output
    assert "Model: OceanEmbed-Cyclone" in output
    assert "Uncertainty availability: available" in output
    temperature = source["temperature"].isel(time=-1).values
    expected = all_products(temperature, source.depth.values, axis=0)
    expected_d26_mean = float(np.nanmean(expected["D26_m"]))
    assert summary["products"]["D26"]["mean"] == pytest.approx(expected_d26_mean)
    assert "GLORYS held-out RMSE" in output