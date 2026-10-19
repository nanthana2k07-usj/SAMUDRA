# SIH Scope and Contributions

## Base Research Implementation

The OceanEmbed model, scientific methods, and v2.1 training/evaluation implementation are the
existing research base in this repository. The SIH engineering work wraps and organizes that
implementation; it does not claim authorship of the original architecture, research results,
or scientific methods. Existing team attribution, repository provenance, citations, and any
applicable licensing information remain authoritative.

## Current Proof-of-Concept Scope

- Region: Bay of Bengal, 5–22°N and 80–100°E.
- Period: June–August 2023.
- Vertical grid: 35 depth levels, approximately 0.5–902 m.
- Validation: held-out GLORYS dates, ARGO profiles, uncertainty diagnostics, and one cyclone
  case study.

This is **not** yet the full North Indian Ocean implementation described by the SIH problem
scope (5–30°N, 45–105°E). Results and demo output must remain labeled as Bay of Bengal PoC
results; extrapolation to the broader region is not established.

## SIH Engineering Contribution

The SIH-specific engineering layer is isolated under `oceanembed/sih/` and reuses the core
OceanEmbed data, inference, and cyclone-product implementations. It provides:

- Run reproducibility manifests with input hashes and available configuration, split,
  environment, checkpoint, and source-revision metadata.
- Read-only input and checkpoint preflight with structured PASS, WARNING, or FAIL results.
- Discovery and selection of available trained runs without assuming a checkpoint filename.
- Explicit precomputed and model-inference demo modes. Precomputed mode labels itself as such;
  inference mode calls the existing `oceanembed.inference` pipeline and never substitutes
  fabricated predictions.
- Aggregation of generated GLORYS, ARGO, depth-wise, uncertainty, cyclone-product, and case-study
  artifacts into a report, with test-day and calibration metadata made explicit.
- A local demo entry point and focused contract tests for SIH integration and artifact handling.

These are software integration and evaluation-organization contributions, not new scientific
claims. The precomputed demo reports products derived using
`oceanembed.physics.products.all_products`. It does not imply a deployed API, automated data
ingest, operational forecast, or full North Indian Ocean coverage.

## Validated Results and Caveats

The SIH report reads generated result files; it does not contain scientific metric constants.
The current approved bundle reports a 3-seed held-out GLORYS temperature RMSE of
0.6256 ± 0.0149 °C, ARGO all-days RMSE of 0.7027 ± 0.0419 °C, and ARGO test-days-only RMSE of
0.9098 ± 0.1364 °C. ARGO all-days includes training-period dates. GLORYS assimilates ARGO, so
ARGO is independent of model inputs/training but not fully independent of the training target.
The cyclone case-study window includes training dates and represents one event, not a blind
multi-event evaluation.

The local inference path uses the existing OceanEmbed pipeline. That pipeline currently expects
the harmonized cube including `thetao`; it is not yet a target-free live satellite inference
service. When inference prerequisites are absent, the CLI clearly identifies precomputed
validated output as its fallback.

## Demo Commands

From the repository root, with the project environment active:

```bash
python -m oceanembed.sih.demo --mode precomputed
python -m oceanembed.sih.demo --mode precomputed --artifacts path/to/oceanembed_results
python -m oceanembed.sih.demo --mode inference --artifacts path/to/oceanembed_results \
    --input path/to/cube.nc --run oceanembed_cyclone_s0
```

The precomputed bundle is external to this source checkout unless the user supplies it. Run
selection lists checkpoint artifacts discovered under the bundle's `runs/` directory; when a
run has multiple checkpoint files, pass the desired path with `--checkpoint`.