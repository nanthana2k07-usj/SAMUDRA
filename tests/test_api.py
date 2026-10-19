import numpy as np
import pytest
import xarray as xr
from fastapi.testclient import TestClient

zarr = pytest.importorskip("zarr")

from backend.app.main import create_app


def _write_product(path):
    temperature = np.arange(2 * 3 * 5 * 9, dtype=np.float32).reshape(2, 3, 5, 9)
    temperature[0, 0, 0, 0] = np.nan
    dataset = xr.Dataset(
        {
            "temperature": (("time", "depth", "latitude", "longitude"), temperature),
            "temperature_std": (
                ("time", "depth", "latitude", "longitude"),
                np.full_like(temperature, 0.4),
            ),
        },
        coords={
            "time": np.array(["2023-06-01", "2023-06-02"], dtype="datetime64[D]"),
            "depth": [0.5, 10.0, 50.0],
            "latitude": np.arange(5, dtype=float),
            "longitude": np.arange(9, dtype=float),
        },
    )
    dataset.to_zarr(path, mode="w", zarr_format=2, consolidated=True)


def test_api_serves_sampled_grid_and_explicit_missing_reference(tmp_path):
    product = tmp_path / "ocean.zarr"
    _write_product(product)

    with TestClient(create_app(data_path=product)) as client:
        assert client.get("/health").json() == {"status": "ready"}
        response = client.get("/api/v1/ocean-grid")

    assert response.status_code == 200
    payload = response.json()
    assert payload["dates"] == ["2023-06-01", "2023-06-02"]
    assert payload["gridShape"] == [2, 3, 2, 3]
    assert payload["latitudes"] == [0.0, 4.0]
    assert payload["longitudes"] == [0.0, 4.0, 8.0]
    assert payload["temperature"][0] is None
    assert payload["temperature"][4] == 40.0
    assert len(payload["temperature"]) == 2 * 3 * 2 * 3
    assert len(payload["uncertainty"]) == len(payload["temperature"])
    assert all(value is None for value in payload["reference"])
    assert payload["caseStudy"] == []


def test_api_includes_optional_case_study_csv(tmp_path):
    product = tmp_path / "ocean.zarr"
    _write_product(product)
    case_study = tmp_path / "casestudy.csv"
    case_study.write_text(
        "date,SST_satellite,MLD_m_glorys,MLD_m_model,MLD_m_model_spread,"
        "D26_m_glorys,D26_m_model,D26_m_model_spread,TCHP_kJcm2_glorys,"
        "TCHP_kJcm2_model,TCHP_kJcm2_model_spread\n"
        "2023-07-18,29.5,42,41,1,72,71,0.5,85,84,1\n",
        encoding="utf-8",
    )

    with TestClient(create_app(data_path=product, case_study_path=case_study)) as client:
        payload = client.get("/api/v1/ocean-grid").json()

    assert payload["caseStudy"] == [{
        "date": "2023-07-18",
        "SST_satellite": 29.5,
        "MLD_m_glorys": 42.0,
        "MLD_m_model": 41.0,
        "MLD_m_model_spread": 1.0,
        "D26_m_glorys": 72.0,
        "D26_m_model": 71.0,
        "D26_m_model_spread": 0.5,
        "TCHP_kJcm2_glorys": 85.0,
        "TCHP_kJcm2_model": 84.0,
        "TCHP_kJcm2_model_spread": 1.0,
    }]


def test_api_fails_startup_when_zarr_is_missing(tmp_path):
    with pytest.raises(FileNotFoundError, match="Zarr product not found"), TestClient(
        create_app(data_path=tmp_path / "missing.zarr")
    ):
        pass


def test_api_rejects_invalid_product_layout(tmp_path):
    invalid = tmp_path / "invalid.zarr"
    dataset = xr.Dataset(
        {"temperature": (("time", "depth"), np.ones((2, 3), dtype=np.float32))},
        coords={"time": np.arange(2), "depth": np.arange(3)},
    )
    dataset.to_zarr(invalid, mode="w", zarr_format=2, consolidated=True)

    with pytest.raises(ValueError, match="missing dimensions"), TestClient(create_app(data_path=invalid)):
        pass
