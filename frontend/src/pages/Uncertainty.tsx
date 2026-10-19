import {
  Activity,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { UncertaintyChart } from '../components/Charts'
import { PageHeading } from '../components/PageHeading'
import { TemperatureProfile } from '../components/TemperatureProfile'
import { uncertaintyMetrics } from '../data/uncertaintyData'
import type { PageProps } from './shared'

export function UncertaintyPage(props: PageProps) {
  return (
    <div className="gov-page gov-page--uncertainty">
      <PageHeading
        eyebrow="UNCERTAINTY QUANTIFICATION & CALIBRATION"
        title="Heteroscedastic Uncertainty & Empirical Coverage"
        description="Every reconstructed temperature value is accompanied by a calibrated 1σ uncertainty estimate. Empirical coverage benchmarks evaluate whether the stated confidence intervals faithfully capture the reference truth across depth layers."
      />

      {/* Uncertainty Mathematical Decomposition */}
      <section className="uncertainty-formula-card" aria-label="Uncertainty Decomposition">
        <div className="formula-part">
          <span className="formula-label">MODEL PREDICTION</span>
          <strong className="formula-term text-navy">Reconstructed State (μ̂)</strong>
          <small>SAMUDRA 3-seed ensemble mean</small>
        </div>

        <span className="formula-op">±</span>

        <div className="formula-part formula-part--highlight">
          <span className="formula-label">LEARNED CONFIDENCE BOUND</span>
          <strong className="formula-term text-teal">Calibrated 1σ Spread (σ̂)</strong>
          <small>Heteroscedastic log-variance head</small>
        </div>

        <div className="formula-explainer">
          <p>
            Heteroscedastic neural prediction allows confidence intervals to vary continuously by depth, geographic location, and temporal weather regimes—reflecting lower confidence in highly dynamic thermocline waters.
          </p>
        </div>
      </section>

      {/* Profile-Level Uncertainty Section */}
      <section className="gov-section" aria-label="Profile-Level Uncertainty Plot">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">POINTWISE UNCERTAINTY ENVELOPE</span>
            <h2 className="gov-section-title">Vertical Column Confidence Variation</h2>
            <p className="gov-section-sub">
              Horizontal error bars indicate ±1σ around the precomputed temperature reconstruction at {props.selected.latitude.toFixed(2)}°N, {props.selected.longitude.toFixed(2)}°E.
            </p>
          </div>
          <span className="scientific-chip">
            <Activity size={13} /> ENSEMBLE SPREAD (3 SEEDS)
          </span>
        </div>

        <div className="chart-panel-card">
          <TemperatureProfile
            grid={props.grid}
            dateIndex={props.dateIndex}
            selected={props.selected}
          />
        </div>
      </section>

      {/* Empirical Interval Coverage Benchmark */}
      <section className="gov-section" aria-label="Empirical Interval Coverage">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">INTERVAL CALIBRATION</span>
            <h2 className="gov-section-title">Empirical Coverage vs Nominal Confidence Bands</h2>
            <p className="gov-section-sub">
              For a well-calibrated confidence interval, a nominal 90% interval should contain the true reference observation approximately 90% of the time.
            </p>
          </div>
          <span className="scientific-chip">
            <ShieldCheck size={13} /> TEST-DAY BENCHMARKS
          </span>
        </div>

        <div className="chart-panel-card">
          <div className="coverage-legend-strip">
            <span className="legend-chip">
              <i className="legend-dot legend-dot--teal" /> GLORYS12 Held-Out Test
            </span>
            <span className="legend-chip">
              <i className="legend-dot legend-dot--ocean" /> ARGO Float (Model σ Only)
            </span>
            <span className="legend-chip">
              <i className="legend-dot legend-dot--purple" /> ARGO Float (+ Representativeness)
            </span>
            <span className="legend-chip-muted">
              Dashed line represents perfect ideal calibration (1:1)
            </span>
          </div>

          <UncertaintyChart data={uncertaintyMetrics} />

          {/* Key Calibration Outcomes Grid */}
          <div className="coverage-metrics-summary-grid">
            <div className="coverage-metric-box">
              <span className="cov-label">90% NOMINAL · GLORYS12 TEST</span>
              <strong className="cov-val text-teal">83.56%</strong>
              <small>Empirical Coverage</small>
              <p>Slightly under-dispersed relative to ideal 90% coverage on held-out reanalysis days.</p>
            </div>

            <div className="coverage-metric-box">
              <span className="cov-label">90% NOMINAL · ARGO (MODEL σ)</span>
              <strong className="cov-val text-ocean">85.08%</strong>
              <small>Empirical Coverage</small>
              <p>Evaluated pointwise on independent in-situ float observations without spatial error terms.</p>
            </div>

            <div className="coverage-metric-box">
              <span className="cov-label">90% NOMINAL · ARGO (+ REPRESENTATIVENESS)</span>
              <strong className="cov-val text-purple">97.46%</strong>
              <small>Empirical Coverage</small>
              <p>Conservative coverage when accounting for physical sub-grid spatial representativeness.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explanatory Scientific Callout regarding Representativeness Error */}
      <div className="gov-callout-banner gov-callout-banner--caution">
        <ShieldAlert size={22} className="text-amber" />
        <div>
          <strong>Physical Note on Representativeness Error:</strong>
          <span>
            Model uncertainty (σ_model) and observational representativeness error (σ_rep) represent distinct physical phenomena. An ARGO float observes a localized point measurement in the ocean water column, whereas SAMUDRA reconstructs an area-averaged 0.25° × 0.25° grid cell (~28 km × 28 km). Sub-grid sub-mesoscale eddies and internal waves create a natural variance between the point float and grid-mean state. The representativeness term was fitted exclusively from non-test days and is reported separately.
          </span>
        </div>
      </div>
    </div>
  )
}
