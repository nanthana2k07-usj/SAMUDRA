import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { ArgoScatterPlot } from '../components/ArgoScatterPlot'
import { DepthBandChart, ValidationChart } from '../components/Charts'
import { PageHeading } from '../components/PageHeading'
import { argoDepthBands, validationMetrics } from '../data/validationData'
import type { PageProps } from './shared'

export function ValidationPage({ onNavigate }: PageProps) {
  const [showProtocol, setShowProtocol] = useState(false)

  return (
    <div className="gov-page gov-page--validation">
      <PageHeading
        eyebrow="MULTI-SOURCE BENCHMARKING"
        title="Validation Evidence & Rigorous Evaluation"
        description="Comprehensive evaluation comparing SAMUDRA against strictly held-out ocean reanalysis (GLORYS12) and independent physical in-situ profiling floats (ARGO) across contiguous temporal splits."
      />

      {/* Top Benchmark Summary Cards */}
      <section className="validation-kpi-summary" aria-label="Key Validation Indicators">
        <article className="val-kpi-card val-kpi-card--primary">
          <span className="val-kpi-eyebrow">HELD-OUT GLORYS12</span>
          <div className="val-kpi-row">
            <strong className="val-kpi-val text-teal">0.626 °C</strong>
            <span className="val-kpi-unit">RMSE</span>
          </div>
          <span className="val-kpi-label">SAMUDRA-Cyclone (3-Seed Mean)</span>
          <small className="val-kpi-detail">
            Exact: 0.625608 °C · 16 held-out test dates (16–31 Aug 2023)
          </small>
        </article>

        <article className="val-kpi-card val-kpi-card--secondary">
          <span className="val-kpi-eyebrow">BEST CHECKPOINT</span>
          <div className="val-kpi-row">
            <strong className="val-kpi-val text-ocean">0.610 °C</strong>
            <span className="val-kpi-unit">RMSE</span>
          </div>
          <span className="val-kpi-label">Top Individual Model Checkpoint</span>
          <small className="val-kpi-detail">
            Exact: 0.609873 °C · Seed 0 individual training run
          </small>
        </article>

        <article className="val-kpi-card val-kpi-card--amber">
          <span className="val-kpi-eyebrow">ARGO FLOAT PROFILES</span>
          <div className="val-kpi-row">
            <strong className="val-kpi-val text-amber">0.753 °C</strong>
            <span className="val-kpi-unit">RMSE</span>
          </div>
          <span className="val-kpi-label">Best Checkpoint vs In-Situ Floats</span>
          <small className="val-kpi-detail">
            17 unseen test profiles · 1,769 matched points (3-seed mean: 0.910 °C)
          </small>
        </article>

        <article className="val-kpi-card val-kpi-card--slate">
          <span className="val-kpi-eyebrow">CLIMATOLOGY BASELINE</span>
          <div className="val-kpi-row">
            <strong className="val-kpi-val text-slate">0.974 °C</strong>
            <span className="val-kpi-unit">RMSE</span>
          </div>
          <span className="val-kpi-label">Historical Average Reference</span>
          <small className="val-kpi-detail">
            SAMUDRA achieves <strong>+35.8% error reduction</strong> over baseline
          </small>
        </article>
      </section>

      {/* Contiguous Evaluation Protocol Banner */}
      <div className="gov-protocol-banner">
        <ShieldCheck size={20} className="text-teal" />
        <div className="protocol-banner-content">
          <strong>Strict Contiguous Time Split Protocol:</strong>
          <span>
            Training: 1 June – 31 July 2023 (61 days) · Validation: 1 – 15 August 2023 (15 days) · Held-Out Test: 16 – 31 August 2023 (16 days). No temporal data leakage. All reported test metrics were evaluated on un-seen future dates.
          </span>
        </div>
      </div>

      {/* GLORYS12 Model Comparison Section */}
      <section className="gov-section" aria-label="GLORYS12 Benchmark Comparison">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">REANALYSIS TARGET BENCHMARK</span>
            <h2 className="gov-section-title">GLORYS12 Held-Out Model Comparison</h2>
            <p className="gov-section-sub">
              Comparison of baseline and model architectures on the 16 held-out test dates (16–31 August 2023). Lower RMSE indicates higher reconstruction accuracy.
            </p>
          </div>
          <span className="scientific-chip">
            <Database size={13} /> 16 HELD-OUT DATES
          </span>
        </div>

        <div className="chart-panel-card">
          <ValidationChart data={validationMetrics} />

          {/* Model Comparison Table */}
          <div className="table-responsive-container" style={{ marginTop: '24px' }}>
            <table className="scientific-data-table">
              <thead>
                <tr>
                  <th>MODEL ARCHITECTURE</th>
                  <th>HELD-OUT TEST RMSE</th>
                  <th>GAIN OVER CLIMATOLOGY</th>
                  <th>CONFIGURATION & SEEDS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Climatology Baseline</strong></td>
                  <td className="font-mono">0.974 °C</td>
                  <td className="text-slate">— (Baseline)</td>
                  <td>Historical training-period mean at each grid cell and depth</td>
                </tr>
                <tr>
                  <td><strong>U-Net Baseline</strong></td>
                  <td className="font-mono">0.654 °C</td>
                  <td className="text-teal font-semibold">+32.8%</td>
                  <td>CNN encoder-decoder architecture (3-seed mean: 0.654463 °C)</td>
                </tr>
                <tr>
                  <td><strong>SAMUDRA · No Physics</strong></td>
                  <td className="font-mono">0.628 °C</td>
                  <td className="text-teal font-semibold">+35.5%</td>
                  <td>ViT + FNO + CNN latent fusion without physical loss terms</td>
                </tr>
                <tr>
                  <td><strong>SAMUDRA · Constraints</strong></td>
                  <td className="font-mono">0.633 °C</td>
                  <td className="text-teal font-semibold">+35.0%</td>
                  <td>ViT + FNO with physical density stability constraint terms</td>
                </tr>
                <tr className="highlight-row">
                  <td>
                    <strong>SAMUDRA · Cyclone (Main)</strong>
                  </td>
                  <td className="font-mono text-teal font-bold">0.626 °C</td>
                  <td className="text-teal font-bold">+35.8%</td>
                  <td>
                    ViT + FNO + CNN with cyclone-aware physical loss (3-seed mean: <strong>0.625608 °C</strong>, best checkpoint: <strong>0.609873 °C</strong>)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Independent In-Situ ARGO Float Observational Benchmark */}
      <section className="gov-section" aria-label="Independent ARGO Float Observational Benchmark">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">PHYSICAL IN-SITU OBSERVATIONS</span>
            <h2 className="gov-section-title">Independent ARGO Float Profile Validation</h2>
            <p className="gov-section-sub">
              Direct pointwise verification against autonomous physical ARGO floats deployed across the Bay of Bengal. Floats measure in-situ water column temperature profiles completely independent of satellite observations.
            </p>
          </div>
        </div>

        <ArgoScatterPlot />
      </section>

      {/* Depth-Wise Reconstruction Error Profile */}
      <section className="gov-section" aria-label="Depth-Wise Error Distribution">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">VERTICAL ERROR BREAKDOWN</span>
            <h2 className="gov-section-title">Reconstruction Error Across Vertical Depth Bands</h2>
            <p className="gov-section-sub">
              Mean RMSE and sample standard deviation across three SAMUDRA-Cyclone seeds evaluated on test-day ARGO float observations.
            </p>
          </div>
          <span className="scientific-chip">
            <Layers size={13} /> RMSE BY DEPTH BAND
          </span>
        </div>

        <div className="chart-panel-card">
          <DepthBandChart data={argoDepthBands} />
          <p className="chart-caption-text">
            <strong>Oceanographic Interpretation:</strong> Reconstruction error is minimal at the surface (0–10 m: 0.49 °C) and in the deep ocean (500–950 m: 0.24 °C). Peak error occurs within the main thermocline (50–200 m: ~1.38–1.84 °C), where sharp vertical gradients and internal solitary waves generate intense high-frequency variance.
          </p>
        </div>
      </section>

      {/* Evaluation Protocol Collapsible Details */}
      <section className="gov-section" aria-label="Evaluation Protocol Details">
        <div className="protocol-summary-card">
          <div className="protocol-summary-top">
            <div>
              <span className="protocol-eyebrow">RIGOROUS EXPERIMENTAL DESIGN</span>
              <h3 className="protocol-title">Contiguous Time Split & Multi-Seed Protocol</h3>
              <p className="protocol-sub">
                Train: 1 June – 31 July (61 days) | Validation: 1 – 15 August (15 days) | Held-Out Test: 16 – 31 August 2023 (16 days).
              </p>
            </div>
            <button
              type="button"
              className="gov-btn gov-btn--outline"
              onClick={() => setShowProtocol((v) => !v)}
              aria-expanded={showProtocol}
            >
              {showProtocol ? 'HIDE PROTOCOL SPECIFICATIONS' : 'EXPAND PROTOCOL SPECIFICATIONS'}
              {showProtocol ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showProtocol && (
            <div className="protocol-details-expanded">
              <div className="protocol-splits-grid">
                <div className="split-card">
                  <span className="split-badge split-badge--train">TRAINING SPLIT</span>
                  <strong>61 Days</strong>
                  <small>1 June 2023 – 31 July 2023</small>
                  <p>Used for model parameter optimization via AdamW optimizer and cosine annealing schedule.</p>
                </div>
                <div className="split-card">
                  <span className="split-badge split-badge--val">VALIDATION SPLIT</span>
                  <strong>15 Days</strong>
                  <small>1 August 2023 – 15 August 2023</small>
                  <p>Used strictly for model checkpoint selection, learning rate decay, and calibration tuning.</p>
                </div>
                <div className="split-card">
                  <span className="split-badge split-badge--test">HELD-OUT TEST SPLIT</span>
                  <strong>16 Days</strong>
                  <small>16 August 2023 – 31 August 2023</small>
                  <p>Strictly locked during training. Final benchmarks reported across 3 independent training seeds.</p>
                </div>
              </div>

              <div className="protocol-callout">
                <p>
                  <strong>Non-Leakage Verification:</strong> Due to strong oceanic temporal autocorrelation, random shuffling of dates causes severe performance over-estimation. SAMUDRA enforces a strict contiguous temporal boundary to ensure valid out-of-sample generalization.
                </p>
                <button
                  type="button"
                  className="gov-text-link"
                  onClick={() => onNavigate('technical')}
                >
                  Review Technical Architecture <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
