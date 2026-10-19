import numpy as np
import pandas as pd

from app.dashboard import profile_products, validation_values
from app.presentation import (
    OPENING_EXPLANATION,
    SURFACE_UNAVAILABLE_MESSAGE,
    _argo_reference_figure,
    _profile_figure,
    inference_available,
)
from oceanembed.physics.products import all_products


def test_dashboard_products_delegate_to_core_definitions():
    depths = np.array([0.5, 10.0, 30.0, 60.0, 120.0, 900.0])
    profile = np.array([29.0, 29.0, 28.8, 26.0, 20.0, 8.0])
    actual = profile_products(profile, depths)
    expected = all_products(profile[None, :, None, None], depths, axis=1)
    for name in expected:
        assert actual[name] == expected[name][0, 0, 0]


def test_dashboard_validation_cards_select_main_model_and_explicit_subsets():
    report = {
        "model": {"main_model": "oceanembed_cyclone"},
        "glorys_test": {"metrics_by_model": [{
            "model_type": "oceanembed_cyclone", "metrics": {"rmse": {"mean": 0.6256, "std": 0.0149}},
        }]},
        "argo": {"metrics_by_subset_and_model": [
            {"model_type": "oceanembed_cyclone", "subset": "all_days",
             "metrics": {"rmse": {"mean": 0.7027, "std": 0.0416}}},
            {"model_type": "oceanembed_cyclone", "subset": "test_days_only",
             "metrics": {"rmse": {"mean": 0.9098, "std": 0.1358}}},
        ]},
        "case_study": {"metrics": [
            {"quantity": "D26_m", "corr_daily": 0.8837},
            {"quantity": "TCHP_kJcm2", "corr_daily": 0.9431},
            {"quantity": "MLD_m", "corr_daily": 0.5294},
        ]},
    }
    values = validation_values(report)
    assert values["glorys_rmse"] == {"mean": 0.6256, "std": 0.0149}
    assert values["argo_all_rmse"]["mean"] == 0.7027
    assert values["argo_test_rmse"]["mean"] == 0.9098
    assert values["d26_correlation"] == 0.8837
    assert values["tchp_correlation"] == 0.9431
    assert values["mld_correlation"] == 0.5294


def test_judge_facing_copy_explains_the_reconstruction_and_missing_inputs():
    assert "Satellites observe the ocean surface" in OPENING_EXPLANATION
    assert "reconstruct subsurface temperature profiles" in OPENING_EXPLANATION
    assert "current demonstration is using our validated reconstructed outputs" in SURFACE_UNAVAILABLE_MESSAGE


def test_profile_plot_reverses_depth_and_marks_selected_level():
    depths = np.array([0.5, 10.0, 50.0, 100.0])
    temperature = np.array([29.0, 28.8, 27.0, 24.0])
    sigma = np.array([0.1, 0.15, 0.2, 0.25])

    figure = _profile_figure(depths, temperature, sigma, 50.0)

    assert figure.layout.yaxis.autorange == "reversed"
    assert "Temperature (°C)" in figure.layout.xaxis.title.text
    assert "Depth (m)" in figure.layout.yaxis.title.text
    assert any(trace.name == "Selected depth" for trace in figure.data)
    assert any(trace.fill == "tonextx" for trace in figure.data)


def test_argo_reference_plot_uses_stored_float_matches(tmp_path):
    results = tmp_path / "results"
    results.mkdir()
    pd.DataFrame({
        "depth": [5.0, 20.0, 100.0],
        "argo": [28.0, 26.0, 20.0],
        "model": [27.8, 26.2, 19.7],
    }).to_csv(results / "argo_matches_oceanembed_cyclone_s0.csv", index=False)

    figure = _argo_reference_figure(tmp_path)

    assert figure is not None
    assert "ARGO measured temperature" in figure.layout.xaxis.title.text
    assert "OceanEmbed reconstructed temperature" in figure.layout.yaxis.title.text
    assert len(figure.data[0].x) == 3


def test_inference_action_requires_existing_compatible_inputs(tmp_path):
    input_path = tmp_path / "cube.nc"
    checkpoint = tmp_path / "model.pt"
    input_path.write_bytes(b"cube")
    checkpoint.write_bytes(b"checkpoint")
    compatible = {"status": "PASS"}

    assert not inference_available("Model inference", tmp_path, input_path, checkpoint, None)
    assert not inference_available("Model inference", tmp_path, tmp_path / "missing.nc", checkpoint, compatible)
    assert not inference_available("Model inference", tmp_path, input_path, checkpoint, {"status": "FAIL"})
    assert inference_available("Model inference", tmp_path, input_path, checkpoint, compatible)