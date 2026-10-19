from datetime import datetime
from types import SimpleNamespace

import numpy as np

from oceanembed.reproducibility import build_run_manifest, sha256_file, write_run_manifest


class FakeData:
    times = np.array(["2023-06-01", "2023-06-02"], dtype="datetime64[D]")
    depths = np.array([0.5, 10.0, 100.0], dtype=np.float32)
    lat = np.array([5.0, 5.25], dtype=np.float32)
    lon = np.array([80.0, 80.25], dtype=np.float32)
    idx = {"train": np.array([0]), "val": np.array([1]), "test": np.array([], dtype=int)}


def test_manifest_records_available_run_metadata(tmp_path):
    dataset = tmp_path / "cube.nc"
    dataset.write_bytes(b"test dataset content")
    args = SimpleNamespace(
        data=str(dataset), out="runs/cyclone_s0", variant="oceanembed", physics=True,
        phys_mode="cyclone", seed=0, epochs=3,
    )

    manifest = build_run_manifest(
        args=args, data=FakeData(), checkpoint_path="runs/cyclone_s0/model.pt",
        timestamp=datetime(2026, 10, 4),
    )

    assert manifest["experiment_id"] == "cyclone_s0"
    assert manifest["model_name"] == "OceanEmbed-Cyclone"
    assert manifest["seed"] == 0
    assert manifest["dataset_identifier"] == "cube.nc"
    assert manifest["input_file_hash_sha256"] == sha256_file(dataset)
    assert manifest["split"]["train"]["days"] == 1
    assert manifest["split"]["test"]["start"] is None
    assert manifest["region"]["latitude"] == [5.0, 5.25]
    assert manifest["depth_levels_m"] == [0.5, 10.0, 100.0]
    assert "python_version" in manifest and "dependency_versions" in manifest
    assert manifest["source_revision"] is None or isinstance(manifest["source_revision"], str)
    assert manifest["checkpoint_path"] == "runs/cyclone_s0/model.pt"
    assert manifest["output_path"] == "runs/cyclone_s0"


def test_manifest_writer_emits_strict_json_and_hash_handles_missing_file(tmp_path):
    assert sha256_file(tmp_path / "missing.nc") is None
    path = write_run_manifest(tmp_path / "nested" / "manifest.json", {"available": None})
    assert '"available": null' in path.read_text(encoding="utf-8")