# OceanEmbed Project Report Source of Truth

**Purpose.** This document consolidates repository-verified technical facts and generated-result artifacts for use by a later AI/ML academic-report writer. It is not a new experiment or a claim of independent replication. Numerical values are reported at the precision present in the named artifact; aggregate values calculated from run-level CSVs are identified as such.

**Evidence priority.** Source code and configuration establish implemented behavior; generated CSV/JSON artifacts establish run results; the project documentation provides interpretation and context. Where documentation and artifacts differ, both are reported in §42. The result bundle used for exact run-level metrics is located at `C:\Users\nanth\OneDrive\Desktop\oceanembed_results\results\` and is outside the source checkout. The repository's own `results/` contains only a README and figures placeholder, not this generated result bundle.

## 1. Project Identity

- **Title:** OceanEmbed — satellite-embedding reconstruction of subsurface ocean temperature.
- **Domain:** ocean state reconstruction from satellite-observed surface fields, with subsurface temperature products relevant to tropical-cyclone ocean conditions.
- **SIH context:** Smart India Hackathon 2026, Problem Statement 26066 (INCOIS); team name BitShifters98.
- **Current code line:** OceanEmbed v2.1 under `oceanembed/`. The repository also retains a legacy v1 CNN baseline; v1 is not the current scientific model.
- **Task type:** same-day subsurface state reconstruction conditioned on surface observations and the previous two days of surface inputs. It is not cyclone prediction or an operational forecast.

## 2. Problem Statement

The project addresses the gap between remotely observed ocean-surface conditions and the subsurface temperature structure required to characterize ocean heat content and cyclone-relevant quantities. It reconstructs a temperature profile at each grid cell from surface satellite products and evaluates derived TCHP, D26, D20 and MLD against reanalysis and in-situ profiles. This describes the implementation's technical objective; it is not a verbatim quotation of the official SIH problem statement. The official problem framing covers the North Indian Ocean more broadly than this PoC.

## 3. Existing System

The repository identifies its ViT/FNO/CNN/U-Net architecture, v2.1 training/evaluation methods, and scientific results as an existing research-codebase contribution. This checkout also contains SIH-specific integration around that core: reproducibility manifests, input/checkpoint preflight checks, run discovery, a local demo, aggregation of generated validation artifacts, and focused interface/contract tests. The legacy v1 CNN exists under `legacy/v1/`; it is not the current implementation. The present system is not a Random Forest, and the old AIML report's Random Forest method must not be attributed to it.

## 4. Proposed System

The implemented pipeline harmonizes satellite and reanalysis fields to a common daily grid; constructs a 28-channel surface input; encodes it with parallel Fourier Neural Operator (FNO), Vision Transformer (ViT), and CNN-stem paths; fuses a latent embedding; decodes with a U-Net; and predicts 35-level temperature plus heteroscedastic log-variance. Training adds soft physical/ocean-state terms in the cyclone-aware variant. TCHP, D26, D20 and MLD are derived from the reconstructed profile. Validation comprises held-out GLORYS dates, ARGO profiles, uncertainty diagnostics, and a single cyclone case study.

## 5. Objectives

1. Reconstruct the subsurface temperature column from surface-only ocean observations.
2. Evaluate full-profile skill against a contiguous held-out GLORYS period and independent ARGO observations.
3. Improve the fidelity of cyclone-relevant ocean products derived from the reconstructed column.
4. Estimate and evaluate pointwise predictive uncertainty.
5. Package the existing research pipeline and generated artifacts in an inspectable local demonstration and reproducible-evaluation workflow.

These are technical objectives reflected in the code and documentation, not claims that all objectives are achieved equally well.

## 6. Scope

- **Implemented PoC:** Bay of Bengal, 5–22°N and 80–100°E; daily data from 1 June through 31 August 2023; 0.25° grid; 35 temperature depths reaching 902.3393 m.
- **Temporal purpose:** same-day reconstruction using present and prior two days of surface fields.
- **Not in scope of validated claims:** full North Indian Ocean coverage, cyclone-track/intensity prediction, real-time ingest, a production forecast service, or operational deployment.
- **Validation:** held-out dates versus GLORYS, ARGO comparisons, and one documented deep-depression case study. The case study includes dates that overlap training/validation, so it is not a blind event test.

## 7. Dataset Overview

The model-ready dataset is `data/processed/cube.nc`, a harmonized NetCDF cube. The data README describes its grid, region, period, variables, units, source products, and target. The source checkout contains the cube, but the documented pipeline describes it as a generated input rather than a version-controlled research result. The previous audit read the file's metadata directly and verified the dimensions and extents below.

The training target is GLORYS12 potential temperature (`thetao`). ARGO is loaded for evaluation from Ifremer ERDDAP with QC flag 1; ARGO observations are not used as training inputs or targets. GLORYS assimilates ARGO, so ARGO validation is independent of model inputs/training but not fully independent of the training target.

## 8. Dataset Dimensions and Metadata

| Property | Verified value |
|---|---|
| File | `data/processed/cube.nc` |
| Dimensions | `time=92`, `lat=69`, `lon=81`, `depth=35` |
| Region | latitude 5–22°N; longitude 80–100°E |
| Period | 2023-06-01 through 2023-08-31 (92 daily samples) |
| Horizontal grid | 0.25°; 69 × 81 |
| Vertical coverage | 35 GLORYS levels; documentation gives 0.49–902 m; generated validation lists depth levels from 0.494025 m through 902.3393 m |
| Variables in the verified cube | `analysed_sst`, `sos`, `sla`, `adt`, `u`, `v`, `uwnd`, `vwnd`, `ascat_uwnd`, `ascat_vwnd`, `thetao` |
| Approximate file size | About 176.9 MB as recorded in the prior repository audit; the size was not remeasured while creating this report |

The optional `so` variable is described in the data/model documentation as enabling salinity prediction if present; it is not in the verified variable list above. Therefore, this report describes the present verified target as temperature only.

## 9. Raw Data Sources

The source mappings documented for the model-ready cube are:

| Field(s) | Product/source | Role and verified notes |
|---|---|---|
| `analysed_sst` | OSTIA | Sea-surface temperature input; cube may store Kelvin or °C, and loader converts Kelvin to °C when detected |
| `sos` | SMOS/SMAP | Sea-surface salinity input |
| `sla`, `adt` | DUACS | Sea-level anomaly and absolute dynamic topography inputs |
| `u`, `v` | OSCAR | Surface-current inputs |
| `uwnd`, `vwnd` | CCMP v3.1 | 10 m wind inputs; native six-hourly product is daily averaged during harmonization |
| `ascat_uwnd`, `ascat_vwnd` | ASCAT L2 | Present in the cube but intentionally excluded from model input channels; documentation notes swath regridding is not a valid grid-field representation and CCMP already assimilates ASCAT |
| `thetao` | GLORYS12 reanalysis | Potential-temperature training/evaluation target |
| ARGO profiles | Ifremer ERDDAP (`ArgoFloats`, QC flag 1) | Independent in-situ evaluation profiles; fetched/cached for evaluation |

Native product resolutions and source descriptions are documented in `docs/METHODOLOGY.md` and `data/README.md`; they are not independently re-derived here.

## 10. Data Harmonization and Preprocessing

- Inputs and GLORYS target are aligned in time and regridded to the common 0.25° grid with the team's xESMF-based data notebook (documented as conservative/bilinear regridding).
- Six-hourly CCMP winds are daily averaged.
- SST is converted from Kelvin to Celsius when values indicate Kelvin.
- Ocean/validity masks are built from target availability and input coverage. A level is retained only when target is valid across the time series; a horizontal cell is retained when all required inputs meet at least 90% temporal coverage.
- Statistics for each input channel and target depth are fit using training dates only.
- Invalid masked values are filled with zeros after normalization for model input.
- The native 69 × 81 grid is padded to 72 × 88 (multiples of 8) for the encoder/decoder and patch-token geometry.
- Inputs use present and lagged surface observations only; future fields and target values are not placed in the input tensor.

## 11. Input Features

The eight dynamic surface fields are SST, SSS, SLA, ADT, OSCAR current components `u`/`v`, and CCMP wind components `uwnd`/`vwnd`. Four additional static/time features are sine and cosine of day of year, latitude, and longitude. The 35-level GLORYS `thetao` is the target, not an input. ASCAT variables are excluded from inputs.

## 12. Input Channel Construction

Exact construction is 8 dynamic fields × 3 dates (t−2, t−1, t) = 24 channels, plus 4 current-date features (day-of-year sine, day-of-year cosine, latitude, longitude) = **28 channels**. Tensor size after padding is `(B, 28, 72, 88)` as documented in `docs/ARCHITECTURE.md`. The source data loader stores the base channel names and appends the two lagged dynamic-field stacks before present-day dynamic/static features.

## 13. Target Variable

The mandatory target is GLORYS12 `thetao`, potential temperature in °C, represented as 35 normalized output channels and de-normalized by depth for evaluation. The verified depth coordinates span 0.494025–902.3393 m in the generated artifact's per-depth table. If a compatible cube supplies optional GLORYS salinity `so`, the model can additionally emit 35 salinity means, but this is not confirmed for the listed cube variables.

## 14. Model Architecture

The actual current model is not a generic CNN-only or Random Forest system:

1. **FNO branch:** 1×1 lifting convolution; four spectral-convolution/pointwise-convolution blocks with GELU; 32 channels and 12×12 Fourier modes in the documented default architecture.
2. **ViT branch:** 8×8 patch embedding; learned positional embedding; four pre-normalized transformer layers, embedding dimension 128 and four attention heads; 9×11 tokens for the padded grid.
3. **CNN stem:** four convolutional feature stages at 72×88 (32 channels), 36×44 (64), 18×22 (128), and 9×11 (128), used for local representation and U-Net skips.
4. **Fusion:** concatenate bottleneck stem features (128), ViT features (128), and average-pooled FNO features (32); convolutional fusion produces a 128-channel latent embedding; 2D dropout 0.1 follows fusion.
5. **U-Net decoder:** bilinear upsampling and skip concatenation through 18×22, 36×44, and full-resolution stages; the FNO features are also joined at the full-resolution stage.
6. **Output head:** 1×1 convolution emits 35 temperature mean channels and, when enabled, an additional 35 temperature log-variance channels. Salinity means are added only when the optional salinity target is configured and present.

The documented parameter count is 3,734,438 (3.73 M) for the full uncertainty-enabled OceanEmbed architecture; plain U-Net ablation is documented as 1.57 M. Parameter counts depend on input/output configuration.

## 15. OceanEmbed-Cyclone Architecture

`configs/main.yaml` selects `variant: oceanembed`, `uncertainty: true`, `history: 2`, and `phys_mode: cyclone`. OceanEmbed-Cyclone is the full ViT+FNO+CNN-stem/U-Net-decoder model with the heteroscedastic head and cyclone-aware ocean-state losses, plus static-stability and steric/SLA terms. It is the main model in the generated bundle (`oceanembed_cyclone`). It reconstructs temperature and derives cyclone-relevant ocean products; it does not predict cyclone occurrence, track, or intensity.

## 16. Baseline Models

- **Climatology:** training-period mean at each grid cell and depth; it is the primary baseline.
- **U-Net:** CNN-only encoder/decoder ablation (`variant: unet`), with no ViT/FNO and no physics losses in `ablation_unet.yaml`.
- **ViT+FNO, no physics:** OceanEmbed architecture but physics disabled (`ablation_nophys.yaml`).
- **ViT+FNO, v2 constraints:** OceanEmbed architecture using the `constraints` physics mode (`ablation_constraints.yaml`).

These four learned configurations are distinct. OceanEmbed-Cyclone must not be collapsed with U-Net, OceanEmbed-NoPhysics, or OceanEmbed-Constraints.

## 17. Physics-Informed Components

All penalties are soft terms applied to de-normalized predictions:

- **Static stability:** simplified density equation of state, requiring density not to decrease with depth. If salinity is absent, fallback penalizes warming with depth only below 150 m, allowing shallow inversions.
- **Steric-height/SLA consistency:** steric height inferred from the density column is compared spatially to observed SLA; penalty applies only when predicted correlation is worse than target correlation.
- **Constraint-mode MLD homogeneity:** in `constraints` mode, temperature within target mixed layer is penalized for deviation from the 10 m reference.
- **Cyclone mode quantities:** differentiable D26, D20, TCHP, and MLD predictions are matched to quantities derived from the target temperature.
- **Not implemented:** mass conservation, because the model does not predict a 3D velocity field.

`docs/METHODOLOGY.md` and `oceanembed/physics/losses.py` define exact implementations and weights. Results show physics terms do not yield a significant overall-temperature RMSE gain over no-physics in this small sample; the cyclone mode's product advantages are modest and within seed variation for several comparisons.

## 18. Cyclone-Aware Components

The main cyclone-aware loss uses smooth versions of the derived ocean-state products: D26, TCHP, D20, and MLD. Its soft crossing uses τ=0.3°C for isotherm-depth terms; TCHP uses softplus of temperature above 26°C; MLD uses a 0.5°C criterion relative to approximately 10 m. Errors are normalized by configured scales (D26 10 m, D20 15 m, MLD 5 m, TCHP 10 kJ/cm²) and combined with weight `w_quant=0.1`. Stability and steric terms remain enabled. This encourages plausible/correct profile structure; it does not create a cyclone forecast.

## 19. Uncertainty Estimation

- Per-depth heteroscedastic head predicts log σ² for temperature.
- Gaussian negative log-likelihood is applied with the mean prediction detached, so uncertainty learning does not back-propagate through and degrade the mean estimate.
- A per-seed multiplicative calibration factor is fit on validation days using standardized residuals.
- Three calibrated members are ensembled: ensemble predictive variance includes member aleatoric variance and variance among member means.
- ARGO coverage is assessed both without and with an additional representativeness-error term, fitted from ARGO-minus-GLORYS residuals by depth band on non-test days.
- **Terminology:** the `model sigma only` coverage rows in `uncertainty_coverage.csv` are ensemble model-sigma results without the ARGO representativeness term; they are not raw, uncalibrated per-member σ. The calibration factors are in `uncertainty_members.json`. Raw pre-calibration coverage is not separately summarized in the inspected report artifact.

## 20. Training Configuration

`configs/main.yaml` and the trainer establish:

| Setting | Main configuration |
|---|---|
| Maximum epochs | 200 |
| Batch size | 4 |
| Optimizer | AdamW |
| Learning rate | 0.001 |
| Weight decay | 0.0005 |
| Scheduler | Cosine annealing |
| Input-noise augmentation | σ=0.05 in normalized units |
| Gradient clipping | 1.0 |
| Early-stopping patience | 40 epochs |
| Physics warm-up/ramp | 5 warm-up epochs, then 5-epoch ramp |
| Seeds | 0, 1, 2 |
| Checkpoint selection | Lowest validation RMSE after physics ramp has completed |

The data objective is masked temperature MSE (plus weighted salinity MSE only if that target exists), with `0.1 × Gaussian NLL` when uncertainty is enabled, and physics terms when enabled.

## 21. Train/Validation/Test Split

The contiguous time split is fixed in `DataConfig` and described in methodology:

| Split | Dates | Days |
|---|---|---:|
| Train | 2023-06-01–2023-07-31 | 61 |
| Validation | 2023-08-01–2023-08-15 | 15 |
| Test | 2023-08-16–2023-08-31 | 16 |

The held-out GLORYS test dates were not used for training or checkpoint/model selection according to the project documentation and result metadata. The result documentation also explicitly says the test window was examined during iterative development and results were not pre-registered; see §38 and §42.

## 22. Hardware and Software Environment

- The README recommends a Google Colab T4 runtime for reproduction. That is a recommended workflow, not proof that the inspected run bundle was trained on a T4.
- `oceanembed/reproducibility.py` records Python, PyTorch, dependency versions, input hash, source revision, configuration, and split in manifests when produced.
- The inspected `oceanembed_results/runs/oceanembed_cyclone_s0` directory has `best.pt`, `history.json`, and `summary.json`, but no `manifest.json`; the bundle therefore does not verify the exact hardware, Python version, PyTorch version, or source revision for the run.
- Python and PyTorch versions for the generated result bundle: **not verified**. Hardware used for that exact bundle: **not verified**.
- Requirements are listed in `requirements.txt`; no fixed versions are declared there. Do not infer run environment versions from the current machine.

## 23. Experiments and Model Variants

The result bundle has 12 trained run identifiers: three seeds each for `oceanembed_cyclone`, `oceanembed_nophys`, `oceanembed_constraints`, and `unet`, plus a single climatology baseline. The run-level overall results are in `glorys_test_overall.csv`; aggregate model results are in `validation.json`. ARGO and uncertainty artifacts provide corresponding separate evaluations.

An additional no-previous-day-input experiment (`0.661 ± 0.016 °C` in docs) is described in `docs/RESULTS.md`, but a corresponding run row is absent from the inspected current bundle's `glorys_test_overall.csv`. Treat it as documentation-reported and not part of the bundle's 12 runs.

## 24. Training Results

The inspected `runs/oceanembed_cyclone_s0/summary.json` records one main-model run with `best_val_rmse_degC=0.4166573037717908`, `best_epoch=76`, `params=3734438`, and `train_seconds=110.60524797439575`. These describe that run only, not the test metric or all seeds. Its run directory has no manifest in the inspected result bundle.

No training-curve values are reproduced here; `history.json` is the artifact for per-epoch curves. `results/fig_training.png` is an available figure.

## 25. Held-Out GLORYS Results

All metrics in this subsection are over 16 test dates and evaluated against GLORYS. The 3-seed statistics below are calculated from the exact `glorys_test_overall.csv` run values using sample standard deviation (ddof=1); the `validation.json` aggregate rounds them to four decimals.

| Model | RMSE mean ± sample SD (°C) | Individual seed RMSE (°C) |
|---|---:|---|
| Climatology | 0.974168598651886 (single baseline) | n/a |
| OceanEmbed-Cyclone | 0.6256081064542135 ± 0.01489469400749008 | s0 0.6098731160163879; s1 0.6394888758659363; s2 0.6274623274803162 |
| OceanEmbed-NoPhysics | 0.62807389100392663 ± 0.009992102655572273 | s0 0.6174461841583252; s1 0.6294978857040405; s2 0.6372776031494141 |
| OceanEmbed-Constraints | 0.6333952943483988 ± 0.013886693049946048 | s0 0.6201223731040955; s1 0.6322399377822876; s2 0.6478235721588135 |
| U-Net | 0.6544634501139323 ± 0.05318150138250348 | s0 0.6484041810035706; s1 0.6045711040496826; s2 0.7104150652885437 |

**Best individual run overall:** U-Net s1, RMSE 0.6045711040496826 °C. **Best individual OceanEmbed-Cyclone run:** s0, RMSE 0.6098731160163879 °C. The best single run should not be substituted for the 3-seed main-model statistic.

The improvement in mean RMSE of OceanEmbed-Cyclone over the exact climatology value is `(0.974168598651886 − 0.6256081064542135) / 0.974168598651886 × 100`, approximately 35.78% (about 36%). The aggregate artifact reports 0.6256 ± 0.0149 °C versus 0.9742 °C. State the formula/inputs if quoting a derived percentage.

## 26. Depth-Wise Results

The table lists per-depth OceanEmbed-Cyclone mean RMSE ± sample SD across the three seeds, calculated from `glorys_test_per_depth.csv`. Values are in °C; exact per-seed depth RMSE/bias columns are present in that source CSV. Reported coordinates are the artifact's depth coordinates.

| Depth (m) | RMSE mean ± SD (°C) |
|---:|---:|
| 0.494025 | 0.4957290192445119 ± 0.029473537127749305 |
| 1.541375 | 0.4876248339811961 ± 0.03447455960649344 |
| 2.645669 | 0.4808203876018524 ± 0.03551222427507693 |
| 3.819495 | 0.4692392547925313 ± 0.027595003052550887 |
| 5.078224 | 0.4706104397773743 ± 0.02292030373528317 |
| 6.440614 | 0.4698646267255147 ± 0.02583461798892944 |
| 7.929560 | 0.46113820870717365 ± 0.02154401322101581 |
| 9.572997 | 0.4801647166411082 ± 0.03506178643450513 |
| 11.405000 | 0.4576052923997243 ± 0.02767458197759678 |
| 13.467140 | 0.4546377758185069 ± 0.02486831492123827 |
| 15.810070 | 0.4512697160243988 ± 0.02792822506554409 |
| 18.495560 | 0.4651179413000743 ± 0.02675042197749801 |
| 21.598820 | 0.4615088899930318 ± 0.01757637750029342 |
| 25.211410 | 0.48865068952242535 ± 0.00836162930717318 |
| 29.444730 | 0.5161470969518026 ± 0.009102657807864064 |
| 34.434150 | 0.5484351714452108 ± 0.01342981137992313 |
| 40.344050 | 0.5922754605611166 ± 0.01666721358548631 |
| 47.373690 | 0.6300466259320577 ± 0.02060081843941378 |
| 55.764290 | 0.7144402066866556 ± 0.01729049529092307 |
| 65.807270 | 0.8395863572756449 ± 0.01544845199912776 |
| 77.853850 | 1.038455128669739 ± 0.0107307921719172 |
| 92.326070 | 1.325150012969971 ± 0.04436069157489562 |
| 109.729300 | 1.384050091107686 ± 0.04358257953205609 |
| 130.666000 | 1.259938637415568 ± 0.03854371343582318 |
| 155.850700 | 0.9413201014200846 ± 0.04336426295912029 |
| 186.125600 | 0.615619162718455 ± 0.0266844402678872 |
| 222.475200 | 0.4062242110570272 ± 0.01342031444217388 |
| 266.040300 | 0.3114670813083649 ± 0.002445433159193227 |
| 318.127400 | 0.2361758102973302 ± 0.003698979038884108 |
| 380.213000 | 0.1866577466328939 ± 0.008695192462191224 |
| 453.937700 | 0.1871405194203059 ± 0.005936960312720336 |
| 541.088900 | 0.2010870526234309 ± 0.004852126099111221 |
| 643.566800 | 0.2143453806638718 ± 0.005845060835755327 |
| 763.333100 | 0.2094055910905202 ± 0.005732698919154474 |
| 902.339300 | 0.2386074761549632 ± 0.01160855432634407 |

The largest reported main-model mean error is in the thermocline region: 1.384050091107686 °C at 109.7293 m in this grid. Overall R² is not a substitute for depth-resolved error; the project warns that R² pooled across the strong surface-to-deep temperature range is inflated.

## 27. Independent ARGO Validation

ARGO temperature profiles were not used in training. `argo_summary.csv` contains 106 profiles and 13,364 matched points for all days, and 17 profiles and 1,769 points for test days only. The all-days sample includes training dates and is not a test-only metric.

Run-level OceanEmbed-Cyclone temperature RMSE from the CSV:

| Subset | s0 | s1 | s2 | Mean ± sample SD calculated from CSV |
|---|---:|---:|---:|---:|
| All days | 0.6561286418463855 | 0.71583627947332 | 0.7362420488624292 | 0.7027356567273782 ± 0.041632430065733396 (`validation.json` stores 0.7027 ± 0.0416) |
| Test days only | 0.7530063968715759 | 0.9914488171935185 | 0.9847969545898935 | 0.909750722884996 ± 0.13578530709202438 |

The per-artifact aggregate is primary. ARGO is independent of the model's surface inputs and training samples, but GLORYS assimilates ARGO; it is therefore not fully independent of the training target. See also the exact documentation/artifact spread differences in §42.

## 28. ARGO Depth-Band Results

The following test-days-only band means ± sample SD were calculated across three OceanEmbed-Cyclone seed files (`argo_test_days_only_oceanembed_cyclone_s0.csv` through `_s2.csv`). Bands and point counts follow those files; point counts are the same for each seed.

| ARGO depth band | RMSE mean ± sample SD (°C) | Points per seed |
|---|---:|---:|
| 0–10 m | 0.4909198592231554 ± 0.05612308638789731 | 137 |
| 10–50 m | 1.295470024805802 ± 0.07272155692826572 | 125 |
| 50–100 m | 1.842514012919920 ± 0.4197440001060817 | 154 |
| 100–200 m | 1.382823628929971 ± 0.2320531186709184 | 321 |
| 200–500 m | 0.3020661237232501 ± 0.02860518202930406 | 511 |
| 500–950 m | 0.2366188616705459 ± 0.006236349805379913 | 521 |

These bands show substantially higher test-day errors in the 50–200 m interval than in the deep bands; they should be interpreted with the small ARGO sample and the documented ARGO/GLORYS dependence caveat.

## 29. Uncertainty Calibration Results

`uncertainty_coverage.csv` stores fractions (not percentages); values below reproduce the CSV. The nominal 50%, 68%, 80%, 90%, and 95% intervals are compared on the listed subset.

| Comparison | Subset | 50% coverage | 68% | 80% | 90% | 95% | Mean σ (°C) | RMSE (°C) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| GLORYS | test days | 0.4651844179466451 | 0.626465238480194 | 0.7363601455133387 | 0.8355941794664511 | 0.8946089329021827 | 0.4776565134525299 | 0.586561918258667 |
| ARGO, model sigma only (no representativeness term) | all days | 0.4542053277461838 | 0.6288536366357378 | 0.7574827895839569 | 0.8595480395091291 | 0.9140975755761748 | 0.46686922599874536 | 0.68884703072279 |
| ARGO, model + representativeness | all days | 0.6893145764741095 | 0.8425621071535468 | 0.9219545046393296 | 0.9697695300808141 | 0.9860071834780006 | 0.7187794495505107 | 0.68884703072279 |
| ARGO, model sigma only (no representativeness term) | test days | 0.42227247032221593 | 0.5799886941775014 | 0.7060486150367439 | 0.8507631430186546 | 0.924816280384398 | 0.5088902653185738 | 0.8627504240782015 |
| ARGO, model + representativeness | test days | 0.6302996042962126 | 0.789711701526286 | 0.8880723572639909 | 0.9745618993781797 | 0.9875635952515546 | 0.7476541122848079 | 0.8627504240782015 |

The per-seed validation calibration factors are s0 3.4560859203338623, s1 3.462691307067871, and s2 3.3651773929595947. At nominal 90% on test days, GLORYS coverage is 0.8355941794664511 (83.5594%); ARGO model sigma only is 0.8507631430186546 (85.0763%); adding representativeness yields 0.9745618993781797 (97.4562%). The latter is conservative relative to nominal. These are calibrated ensemble coverage results, not pre-calibration raw σ performance.

## 30. Cyclone-Derived Products

The model reconstructs temperature; products are computed from that temperature. Implemented product definitions in `oceanembed/physics/products.py` are:

- **D26:** depth of the 26°C isotherm with linear interpolation of the first downward crossing.
- **D20:** depth of the 20°C isotherm with linear interpolation.
- **TCHP:** integral of `rho × cp × max(T − 26°C, 0)` over valid depth, in kJ/cm².
- **MLD:** depth at the 0.5°C drop from the approximately 10 m reference.

Exact held-out GLORYS product RMSE for the main model, mean ± sample SD calculated from the three model-run rows in `glorys_test_overall.csv`:

| Product | OceanEmbed-Cyclone mean ± sample SD | Climatology |
|---|---:|---:|
| D26 | 8.356435863906929 ± 0.1078961240768315 m | 14.945309761029375 m |
| D20 | 9.142209625664167 ± 0.1811937478447141 m | 17.14087248697346 m |
| TCHP | 13.34682934379217 ± 0.5689810494025015 kJ/cm² | 21.483248406052855 kJ/cm² |
| MLD | 11.81929355671124 ± 0.6730648549562639 m | 12.286312738185313 m |

MLD's main-model average is numerically a little below the climatology RMSE in this artifact, but the project documentation characterizes MLD as not improved; do not present this small difference as an established MLD advance. Seed-to-seed spread and documentation/artifact mismatch are relevant.

## 31. Cyclone Case Study

The case study concerns a deep depression in the northeastern Bay of Bengal on 1 August 2023. The documentation reports an approximately 0.6°C SST drop in the storm box; GLORYS TCHP falls from about 81 to about 70 kJ/cm² and stays low for approximately two weeks. OceanEmbed captures the initial 1–2 August drop but recovers too quickly, overestimating TCHP by about 5 kJ/cm² and D26 by about 3 m, while its MLD deepens where GLORYS shoals. These approximate narrative values are documentation values, not exact CSV aggregates.

Exact case-study statistics in `casestudy_stats.csv` (box-mean comparison with GLORYS):

| Product | Daily correlation | RMSE |
|---|---:|---:|
| D26_m | 0.8837168927613438 | 1.4705397468623753 |
| TCHP_kJcm2 | 0.94308075319457 | 3.4804045255760117 |
| MLD_m | 0.5293680284575885 | 3.0368384733081117 |

The case-study range is 18 July–15 August in `docs/RESULTS.md`, so July training dates and August validation dates occur in the window. This is not an independent, blind cyclone-event test.

## 32. Dashboard / User Interface

The project contains two local presentation layers. The Python SIH demo is a Streamlit interface (`app/dashboard.py` and `app/presentation.py`) with Plotly charts and xarray/pandas artifact reads; it can display precomputed validated outputs or invoke the existing inference pipeline when compatible artifacts are present. The separate `frontend/` folder contains a React 19, TypeScript, Vite, and Recharts dashboard with Overview, Explore, Temperature, Cyclone Intelligence, Validation, Uncertainty, and Technical views. By default, React loads the bundled `frontend/public/data/ocean-demo.data` archive and typed result data. When `VITE_OCEAN_GRID_API_URL` is configured, it can instead load the read-only Zarr API implemented in `backend/app/`; that API serves precomputed temperature and uncertainty and does not run model inference. API-backed profiles do not contain a GLORYS reference because the exported prediction Zarr does not include one. Map date playback replays archived daily values, not live observations. Neither interface establishes live data ingestion or a deployed operational system.

## 33. Testing and Verification

The repository includes focused tests for data loading and channel construction, model variants, physics/product definitions, pipeline, exports, reproducibility manifests, and SIH preflight/report/dashboard contracts (`tests/`). The SIH tests verify behavior including scope/channel compatibility, checkpoint discovery, artifact aggregation, explicit test-day metadata, and reuse of core product definitions. On 2026-10-05, the complete Python suite was run from the project root with the configured Python 3.10.11 environment: **39 passed in 147.44 seconds**. The React dashboard was production-built and linted during its UI changes; desktop/mobile route loading and browser history/navigation were also manually checked. No automated frontend component or end-to-end test suite is configured.

Verified numerical evidence is from generated `oceanembed_results/results/*.csv` and `validation.json`; it is not the result of re-running training or evaluation while preparing this report.

## 34. Reproducibility

- The project provides configs, fixed train/validation/test dates, seeds 0/1/2, a full experiment script, and tests.
- `oceanembed/reproducibility.py` can save input SHA-256, config, split, environment versions, checkpoint path, and source revision into each run's `manifest.json`.
- The inspected external result bundle includes run checkpoints, training histories, and summaries, but the observed main run directory lacks `manifest.json`; exact input hash, run-time software environment, and source revision are therefore unverified for this bundle.
- The dataset is an essential input; its source/version/hash should accompany any final paper package.
- The project documents GPU nondeterminism and reports three seeds. The August test period was examined during iterative development and results were not pre-registered; the existing pre-registration applies to a future multi-year study, not these results.
- Reproduction commands and dependency names are in the README, Makefile, requirements, and `scripts/run_experiments.sh`. No training was run for this report.

## 35. Project File Structure

| Path | Purpose |
|---|---|
| `oceanembed/data/` | Cube loading, features, masks, data splits |
| `oceanembed/models/` | ViT/FNO/CNN-stem/U-Net model |
| `oceanembed/physics/` | Physics losses and derived ocean products |
| `oceanembed/train/` | Training loop and checkpoint selection |
| `oceanembed/eval/` | GLORYS, ARGO, uncertainty, and case-study evaluation |
| `oceanembed/sih/` | SIH preflight, report aggregation, and demo integration |
| `configs/` | Main, smoke, and ablation configurations |
| `docs/` | Methodology, architecture, scope, results, reproducibility guidance |
| `data/` | Dataset README and generated/ignored data locations |
| `results/` | Result README and figures location; generated bundle is separate |
| `app/` | Streamlit dashboard/presentation |
| `frontend/` | Standalone React/TypeScript dashboard, static browser data artifact, and dashboard-specific run documentation |
| `backend/` | Local read-only FastAPI API for precomputed Zarr temperature and uncertainty |
| `tests/` | Unit, pipeline, artifact, and SIH contract tests |
| `notebooks/` | Colab/research workflow |
| `legacy/v1/` | Earlier CNN baseline and legacy documentation |

## 36. Available Figures

The external generated bundle lists these image artifacts under `C:\Users\nanth\OneDrive\Desktop\oceanembed_results\results\`:

- `fig_argo_profiles.png`
- `fig_casestudy_tchp_change.png`
- `fig_casestudy_timeseries.png`
- `fig_depth_slices.png`
- `fig_rmse_by_depth.png`
- `fig_training.png`
- `fig_uncertainty_calibration.png`

They were inventoried but not visually re-analyzed for this report.

## 37. Available Tables / Result Files

The generated artifact bundle includes:

- `glorys_test_overall.csv`, `glorys_test_summary.json`, `glorys_test_per_depth.csv`, `glorys_test_per_depth_<run>.csv`
- `argo_summary.csv`, `argo_all_days_<run>.csv`, `argo_test_days_only_<run>.csv`, `argo_matches_<run>.csv`, `argo_cache.csv`
- `argo_products_summary.csv`, `argo_products_<run>.csv`
- `uncertainty_coverage.csv`, `uncertainty_by_depth.csv`, `uncertainty_members.json`, `uncertainty_representativeness.json`, `uncertainty_argo_points.csv`
- `casestudy_stats.csv`, `casestudy_timeseries.csv`
- `validation.json`
- Under `runs/`: per-run `best.pt`, `history.json`, and `summary.json`; the inspected run lacked the manifest expected by the code.

`results/README.md` in the repository documents these artifact types and notes that results/checkpoints/products are generated and are not committed in the source checkout.

## 38. Scientific Limitations

- Only 92 days (three summer-monsoon months) and one basin are evaluated.
- Current model scope is not the broader North Indian Ocean.
- The number of training days is small (61); the case study indicates weakly learned post-storm recovery.
- MLD is not established as improved over climatology.
- GLORYS assimilates ARGO, so ARGO is not fully independent of the model's training target.
- ARGO all-days includes dates in the train split; test-days-only values must be used for a held-out comparison.
- ARGO pressure in dbar is used as depth in m, and in-situ temperature is compared with GLORYS potential temperature; the methodology describes these differences as small (≤ approximately 0.1°C above 900 m).
- Overall R² across the full depth domain is inflated by the surface-to-deep temperature range; depth-wise RMSE is more informative.
- The iterative development process examined the test period more than once; results were not pre-registered and should be framed as proof-of-concept, not confirmatory evidence.
- The present inference path is not target-free because the harmonized cube currently requires `thetao`.

## 39. Current PoC Scope vs Original SIH Scope

The original SIH problem scope is North Indian Ocean, documented as 5–30°N and 45–105°E. The trained/current PoC covers Bay of Bengal, 5–22°N and 80–100°E, June–August 2023 only. Results and dashboard outputs must be labeled Bay of Bengal PoC results; no extrapolation to the complete SIH geography is validated.

## 40. Future Work

Documented next directions include multi-year coverage with multiple monsoon/cyclone seasons, an unseen-year test protocol, more cyclone events, improved post-storm recovery, and a pre-registered comparison of cyclone-aware and no-physics variants against ARGO TCHP. Broadening the geographical domain, achieving target-free live inference, and operational data ingestion are future engineering/science work, not current capabilities. Mass conservation would require adding a predicted velocity field.

## 41. Provenance / Research Integrity

- The repository explicitly says OceanEmbed's model, scientific methods, and v2.1 training/evaluation implementation are the existing research base. SIH-specific work wraps and organizes that base; it does not claim authorship of the original architecture, scientific method, or original results.
- The README identifies the development-history repository as [`dhriti-goswami/Ocean_Embed`](https://github.com/dhriti-goswami/Ocean_Embed/tree/pinn-pipeline) and says the Colab notebook clones it. This provenance must not be concealed. Preserve repository/team attribution, citations, and applicable license notices when preparing external reports or distributions.
- The SIH contribution is the engineering layer under `oceanembed/sih/`: manifests, read-only preflight, run discovery/selection, explicit demo modes, artifact aggregation, and contract tests.
- The current numerical results are not pre-registered and were iteratively developed. They must be described as proof-of-concept evidence, not as confirmatory results.
- No claim of independent replication is made by creating this document. It compiles repository and generated-bundle evidence only.

## 42. Contradictions and Items Requiring Human Review

1. **Geographic scope:** broad SIH North Indian Ocean framing versus validated Bay of Bengal PoC. State both and never imply full-area implementation.
2. **ARGO all-days interpretation:** 106 profiles across all dates includes training-period days; it is not a fully held-out ARGO score. The held-out ARGO test subset has 17 profiles.
3. **ARGO/GLORYS dependence:** ARGO is unseen by the model but assimilated by GLORYS, which supplies the training target. Do not call ARGO fully statistically independent of the target.
4. **Test-period research integrity:** docs say test dates were never used for checkpoint/model selection, while pre-registration docs state the test window was inspected repeatedly during iterative development. Use “held-out from training/model selection, but not pre-registered and repeatedly examined during development.”
5. **ARGO all-days spread:** direct calculation from `argo_summary.csv` gives OceanEmbed-Cyclone all-days RMSE mean 0.7027356567273782°C and sample SD 0.041632430065733396°C; the result JSON reports 0.7027 ± 0.0416. `docs/RESULTS.md` and README say 0.7027 ± 0.0419. The means agree, the spread differs slightly; use the exact run-level CSV calculation/aggregate and flag the documentation discrepancy.
6. **ARGO test spread:** `argo_summary.csv` gives mean 0.9097507229°C and sample SD 0.1357853071°C from the three exact test-day run values. `docs/RESULTS.md` reports 0.9098 ± 0.1364. Mean agrees after rounding; SD differs. Use the CSV-derived/JSON aggregate after verifying its exact `validation.json` ARGO row.
7. **Held-out GLORYS summaries:** raw CSV gives exact main mean 0.6256081064542135°C and sample SD 0.01489469400749008°C; validation JSON/docs report 0.6256 ± 0.0149. These agree at the published precision. The best single run (U-Net s1, 0.6045711040°C) is not the main model's 3-seed result.
8. **Cyclone product metrics:** raw `glorys_test_overall.csv` aggregation gives TCHP 13.3468293438 ± 0.5689810494 kJ/cm² and MLD 11.8192935567 ± 0.673064855 m; docs report 13.2 ± 0.4 and 12.0 ± 0.6. D26 raw 8.3564358639 ± 0.1078961241 m is consistent with docs 8.4 ± 0.1; D20 raw 9.1422096257 ± 0.1811937478 m is consistent with docs 9.2 ± 0.2. For quantitative publication, prefer regenerating aggregate tables from the exact raw CSVs, then reconciling the JSON/docs.
9. **ARGO product metrics:** `argo_products_summary.csv` has exact per-seed rows. Test-days-only 3-seed means calculated from it are D26 13.1709799172 ± 1.2711405901 m; D20 14.8806339559 ± 1.6149776340 m; TCHP 16.3681355737 ± 1.0921496671 kJ/cm²; MLD 13.8774795938 ± 1.1351737869 m. `docs/RESULTS.md` instead reports 13.4, 14.9, 16.5, and 14.5 respectively, without spreads. D20 aligns roughly; other rounding/aggregation discrepancies need reconciliation before formal publication.
10. **MLD interpretation:** main artifact's point estimate is lower than climatology, but project documentation explicitly says MLD is not improved. Treat as no demonstrated meaningful improvement; avoid a success claim.
11. **Depth-coordinate prose:** methodology/docs use approximately 0.5–902 m; artifact per-depth CSV precisely lists 0.494025–902.3393 m. Use the exact artifact coordinate when a precise value is needed.
12. **Previous-day ablation:** docs report 0.661 ± 0.016°C without previous-day inputs, but that run is not among the inspected current bundle's overall CSV model rows. Clearly identify it as documentation-only unless its run artifact is supplied.
13. **Environment provenance:** manifests are implemented in code but absent from the inspected main run artifact directory. Exact training hardware, Python/PyTorch version, source revision, and input hash cannot be verified for these runs.
14. **Uncertainty coverage precision:** `uncertainty_coverage.csv` is authoritative for the displayed coverage fractions; the values in §29 were checked against its exact rows.

## 43. Final Verified Technical Summary

| Field | Verified value | Source |
|---|---|---|
| Project Title | OceanEmbed — satellite-embedding reconstruction of subsurface ocean temperature | `README.md` |
| SIH Problem Statement | Smart India Hackathon 2026, PS 26066 (INCOIS) | `README.md`, `docs/SIH_SCOPE_AND_CONTRIBUTIONS.md` |
| Application Domain | Satellite-conditioned subsurface ocean-temperature reconstruction and derived cyclone-relevant ocean products | `README.md`, `docs/METHODOLOGY.md` |
| Current PoC Region | Bay of Bengal, 5–22°N, 80–100°E | `docs/SIH_SCOPE_AND_CONTRIBUTIONS.md`, `results/validation.json` in generated bundle |
| Time Period | 2023-06-01–2023-08-31 | `data/README.md`, generated `results/validation.json` |
| Dataset | `data/processed/cube.nc` | `data/README.md` |
| Dataset Size | Approximately 176.9 MB, noted in prior audit; not remeasured for report | `data/processed/cube.nc` metadata from audit; file size is not stated in `data/README.md` |
| Dataset Dimensions | time 92, lat 69, lon 81, depth 35 | `data/README.md`, prior direct cube metadata inspection |
| Depth Levels | 35; 0.494025–902.3393 m in generated per-depth artifact | `data/README.md`, generated `results/glorys_test_per_depth.csv` |
| Input Variables | `analysed_sst`, `sos`, `sla`, `adt`, `u`, `v`, `uwnd`, `vwnd`; ASCAT fields present but excluded | `oceanembed/data/cube.py`, `data/README.md` |
| Input Channels | 28 = 8 fields × 3 dates + 4 time/location features | `oceanembed/data/cube.py`, `docs/ARCHITECTURE.md` |
| Target | GLORYS12 `thetao`, 35-level temperature; optional salinity only if `so` is supplied | `oceanembed/data/cube.py`, `docs/METHODOLOGY.md` |
| Model | OceanEmbed-Cyclone / `oceanembed_cyclone` | `configs/main.yaml`, generated `results/validation.json` |
| Architecture | CNN stem + parallel ViT and FNO branches + latent fusion + U-Net decoder + log-variance head | `oceanembed/models/network.py`, `docs/ARCHITECTURE.md` |
| Best Model | 3-seed main model OceanEmbed-Cyclone; best individual run overall is U-Net s1, a distinct single run | Generated `results/glorys_test_overall.csv`, `results/validation.json` |
| Best Held-Out GLORYS RMSE | Main 3-seed mean 0.6256081064542135 ± 0.01489469400749008 °C; best single run 0.6045711040496826 °C (U-Net s1) | Generated `results/glorys_test_overall.csv` |
| Mean 3-Seed RMSE | OceanEmbed-Cyclone 0.6256081064542135 °C mean; sample SD 0.01489469400749008 °C | Generated `results/glorys_test_overall.csv`; aggregate in `results/validation.json` |
| ARGO Test RMSE | 0.909750722884996 °C mean; sample SD 0.13578530709202438 °C from three seeds; 17 profiles, 1,769 points | Generated `results/argo_summary.csv`; depth bands in `argo_test_days_only_oceanembed_cyclone_s*.csv` |
| Climatology RMSE | 0.974168598651886 °C against held-out GLORYS | Generated `results/glorys_test_overall.csv` |
| Main Improvement | About 35.78% lower held-out GLORYS RMSE than climatology, derived from the exact means above | Generated `results/glorys_test_overall.csv` |
| Uncertainty | Heteroscedastic log-variance head; validation-calibrated 3-seed ensemble; ARGO representativeness term also evaluated | `oceanembed/train/trainer.py`, `docs/METHODOLOGY.md`, generated uncertainty CSV/JSON |
| Cyclone Products | D26, D20, TCHP, MLD derived from reconstructed temperature; no cyclone prediction | `oceanembed/physics/products.py`, `oceanembed/physics/losses.py` |
| Dashboard Technology | Streamlit/Plotly SIH demo and React 19/TypeScript/Vite/Recharts browser dashboard; React defaults to bundled archive and can optionally use the local read-only FastAPI Zarr API | `app/dashboard.py`, `app/presentation.py`, `frontend/package.json`, `frontend/src/App.tsx`, `backend/app/main.py`, `frontend/README.md` |
| Validation Method | Contiguous held-out GLORYS test dates, ARGO profile matching, uncertainty coverage, one cyclone case study | `docs/METHODOLOGY.md`, generated result artifacts |
| Hardware | Exact hardware for generated runs not verified; Colab T4 is a documented recommended runtime | `README.md`; missing run `manifest.json` |
| Python Version | Not verified for generated runs; manifest would record it but is absent in inspected bundle | `oceanembed/reproducibility.py`; absent external run manifest |
| PyTorch Version | Not verified for generated runs; manifest would record it but is absent in inspected bundle | `oceanembed/reproducibility.py`; absent external run manifest |

### SOURCE FILES CONSULTED

Repository files consulted in the prior audit and report preparation:

- `README.md`
- `docs/SIH_SCOPE_AND_CONTRIBUTIONS.md`
- `docs/METHODOLOGY.md`
- `docs/RESULTS.md`
- `docs/ARCHITECTURE.md`
- `docs/TRAINING_METHODOLOGY.md`
- `docs/PREREGISTRATION.md`
- `data/README.md`
- `data/processed/cube.nc` (metadata inspected in prior audit)
- `pyproject.toml`
- `requirements.txt`
- `Makefile`
- `TROUBLESHOOTING.md`
- `configs/main.yaml`
- `configs/ablation_constraints.yaml`
- `configs/ablation_nophys.yaml`
- `configs/ablation_unet.yaml`
- `oceanembed/data/cube.py`
- `oceanembed/models/network.py`
- `oceanembed/physics/losses.py`
- `oceanembed/physics/products.py`
- `oceanembed/train/trainer.py`
- `oceanembed/reproducibility.py`
- `oceanembed/sih/demo.py`
- `oceanembed/sih/report.py`
- `app/dashboard.py`
- `app/presentation.py`
- `frontend/README.md`
- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/components/OceanMap.tsx`
- `frontend/src/pages/Explore.tsx`
- `frontend/src/services/oceanService.ts`
- `frontend/src/types/ocean.ts`
- `backend/app/archive.py`
- `backend/app/main.py`
- `tests/test_api.py`
- `scripts/run_experiments.sh`
- `results/README.md`
- `tests/test_sih.py`
- `legacy/v1/README.md`

Generated result-bundle files consulted under `C:\Users\nanth\OneDrive\Desktop\oceanembed_results\`:

- `results/README.md`
- `results/validation.json`
- `results/glorys_test_overall.csv`
- `results/glorys_test_summary.json`
- `results/glorys_test_per_depth.csv`
- `results/argo_summary.csv`
- `results/argo_test_days_only_oceanembed_cyclone_s0.csv`
- `results/argo_test_days_only_oceanembed_cyclone_s1.csv`
- `results/argo_test_days_only_oceanembed_cyclone_s2.csv`
- `results/argo_products_summary.csv`
- `results/uncertainty_coverage.csv`
- `results/uncertainty_members.json`
- `results/uncertainty_representativeness.json`
- `results/casestudy_stats.csv`
- `results/casestudy_timeseries.csv`
- `runs/oceanembed_cyclone_s0/summary.json`

### ITEMS NOT VERIFIED

- Exact Python and PyTorch versions, GPU/CPU hardware, source revision, input hash, and run timestamp for the generated run bundle; the inspected main run has no manifest.
- Exact source-download URLs, retrieval timestamps, and checksums for every raw satellite/reanalysis file beyond the product/provider descriptions in project documentation.
- Whether the current cube includes optional `so`; `so` is absent from the verified variable list supplied by the audit.
- Any full North Indian Ocean model performance or operational/real-time capability.
- Independent replication of the reported experiment; no training or evaluation was run to prepare this document.
- Whether the slight documentation/artifact metric differences are caused by stale docs, different bundle revision, aggregation precision, or changed data. Reconcile raw tables and report-generation revision before publication.
- The complete official SIH problem statement wording; this document verifies PS identifier/context, not a verbatim government prompt.
- Raw, pre-calibration per-member uncertainty coverage; the inspected artifact reports calibrated ensemble coverage.
