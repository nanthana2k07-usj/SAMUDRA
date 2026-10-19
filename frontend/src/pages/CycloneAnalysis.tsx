import { useState } from 'react'
import { CalendarDays, ShieldAlert, Waves } from 'lucide-react'
import { CaseStudyChart } from '../components/Charts'
import { OceanMap } from '../components/OceanMap'
import { PageHeading } from '../components/PageHeading'
import { caseStudyProducts } from '../data/cycloneData'
import type { MapVariable } from '../types/ocean'
import type { PageProps } from './shared'

export function CycloneAnalysisPage(props: PageProps) {
  const [activeProductKey, setActiveProductKey] = useState<'tchp' | 'd26' | 'mld' | 'sst'>('tchp')
  const product = caseStudyProducts.find((p) => p.key === activeProductKey) ?? caseStudyProducts[1]
  const activeMapVar: MapVariable = activeProductKey === 'sst' ? 'surface' : activeProductKey

  return (
    <div className="gov-page gov-page--cyclone-analysis">
      <PageHeading
        eyebrow="CASE STUDY EVALUATION"
        title="Cyclone–Ocean Interaction Analysis"
        description="A retrospective oceanographic case study evaluating subsurface thermal response, heat potential depletion, and thermocline shoaling during a storm passage event in the Northeastern Bay of Bengal (18 July – 15 August 2023)."
      />

      {/* Mandatory Scientific Non-Forecasting Disclaimer */}
      <div className="gov-disclaimer-alert" role="note">
        <ShieldAlert size={20} className="text-amber" />
        <div className="disclaimer-text">
          <strong>Retrospective Research Case Study Only:</strong>
          <span>
            SAMUDRA reconstructs same-day subsurface ocean thermal state relevant to upper-ocean thermodynamic energy availability. This platform does <strong>NOT</strong> forecast future cyclone tracks, predict storm formation, or issue operational landfall warnings.
          </span>
        </div>
      </div>

      {/* Case Study Event Context Banner */}
      <section className="cyclone-event-card">
        <div className="event-card-header">
          <div>
            <span className="event-badge">CASE STUDY EVENT</span>
            <h3 className="event-title">Deep Depression Passage · Northeastern Bay of Bengal</h3>
            <p className="event-sub">
              18 July 2023 — 15 August 2023 · Evaluated over the Northeastern Bay of Bengal storm study box
            </p>
          </div>
          <span className="event-dates-pill">
            <CalendarDays size={13} /> 29-Day Study Period
          </span>
        </div>

        {/* 3-Phase Oceanographic Timeline */}
        <div className="event-phases-grid">
          <div className="phase-card">
            <span className="phase-num">PHASE 1</span>
            <span className="phase-date">18 — 31 JULY 2023</span>
            <strong className="phase-name">Pre-Storm Heat Storage</strong>
            <p className="phase-desc">
              High upper-ocean heat reservoir with elevated Tropical Cyclone Heat Potential (TCHP ~85 kJ/cm²) and deep 26°C isotherm (D26 ~72 m). Favorable thermodynamic conditions for atmospheric convection.
            </p>
          </div>

          <div className="phase-card phase-card--active">
            <span className="phase-num phase-num--active">PHASE 2</span>
            <span className="phase-date text-amber font-semibold">1 — 2 AUGUST 2023</span>
            <strong className="phase-name">Storm Passage & Cold Entrainment</strong>
            <p className="phase-desc">
              Passage of the cyclonic depression induces strong surface wind stress, intense shear mixing, and entrainment of subsurface cold water. Sea Surface Temperature drops by ~0.6°C and D26 shoals rapidly.
            </p>
          </div>

          <div className="phase-card">
            <span className="phase-num">PHASE 3</span>
            <span className="phase-date">3 — 15 AUGUST 2023</span>
            <strong className="phase-name">Post-Storm Thermal Recovery</strong>
            <p className="phase-desc">
              TCHP remains depressed at ~70 kJ/cm² following upper-ocean energy extraction. Gradual re-stratification of the mixed layer occurs slowly over a 12–14 day ocean recovery period.
            </p>
          </div>
        </div>
      </section>

      {/* Daily Box-Mean Time Series Evolution */}
      <section className="gov-section" aria-label="Daily Box-Mean Time Series">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">DIAGNOSTIC TIME SERIES</span>
            <h2 className="gov-section-title">Subsurface Ocean Indicator Evolution</h2>
            <p className="gov-section-sub">
              Comparison between SAMUDRA reconstructions and GLORYS12 reanalysis targets across the storm evaluation window.
            </p>
          </div>

          <div className="gov-tabs-group" role="group" aria-label="Select cyclone indicator">
            {caseStudyProducts.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`gov-tab-btn ${activeProductKey === item.key ? 'is-active' : ''}`}
                onClick={() => setActiveProductKey(item.key as any)}
              >
                <i className="tab-dot" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chart-panel-card">
          <div className="chart-panel-topline">
            <strong>{product.label} ({product.unit})</strong>
            <span className="chart-panel-caption">
              Daily Storm Box-Mean Evolution (18 Jul – 15 Aug 2023) · SAMUDRA vs GLORYS12 Reference
            </span>
          </div>

          {props.grid.caseStudy && props.grid.caseStudy.length > 0 ? (
            <CaseStudyChart data={props.grid.caseStudy} product={product} />
          ) : (
            <div className="gov-empty-box">
              <Waves size={24} className="text-teal" />
              <strong>Case study time series data unavailable</strong>
            </div>
          )}

          <div className="chart-legend-row">
            <span className="legend-chip">
              <i className="legend-dot legend-dot--amber" /> GLORYS12 Reference Target
            </span>
            <span className="legend-chip">
              <i className="legend-dot legend-dot--teal" /> SAMUDRA Reconstructed Product
            </span>
            <span className="legend-chip-muted">
              Shaded spread represents 3-seed ensemble standard deviation
            </span>
          </div>
        </div>
      </section>

      {/* Case Study Quantitative Scientific Findings */}
      <section className="gov-section" aria-label="Scientific Verification Results">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">QUANTITATIVE FIDELITY</span>
            <h2 className="gov-section-title">Case Study Verification Metrics</h2>
            <p className="gov-section-sub">
              Agreement between reconstructed subsurface indicators and ocean reanalysis reference targets during storm passage.
            </p>
          </div>
        </div>

        <div className="cyclone-findings-grid">
          {/* Finding 1: TCHP Correlation */}
          <article className="finding-card finding-card--positive">
            <div className="finding-header">
              <span className="finding-badge">EXCELLENT AGREEMENT</span>
              <strong className="finding-metric">r = 0.943</strong>
            </div>
            <h4 className="finding-title">TCHP Daily Correlation</h4>
            <p className="finding-desc">
              Daily box-mean Tropical Cyclone Heat Potential matches GLORYS12 reanalysis closely across all phases of storm transit (RMSE = <strong>3.48 kJ/cm²</strong>). Correctly captures the magnitude and timing of heat extraction.
            </p>
          </article>

          {/* Finding 2: D26 Isotherm Fidelity */}
          <article className="finding-card finding-card--positive">
            <div className="finding-header">
              <span className="finding-badge">HIGH THERMAL FIDELITY</span>
              <strong className="finding-metric">r = 0.884</strong>
            </div>
            <h4 className="finding-title">D26 Isotherm Shoaling</h4>
            <p className="finding-desc">
              26°C isotherm depth accurately reproduces storm-induced shoaling with high statistical correlation (RMSE = <strong>1.47 m</strong>). Successfully tracks upper-layer thinning.
            </p>
          </article>

          {/* Finding 3: MLD Fidelity */}
          <article className="finding-card finding-card--caution">
            <div className="finding-header">
              <span className="finding-badge finding-badge--caution">MODERATE SKILL</span>
              <strong className="finding-metric">r = 0.529</strong>
            </div>
            <h4 className="finding-title">MLD Deepening & Recovery</h4>
            <p className="finding-desc">
              Moderate agreement for Mixed Layer Depth (RMSE = <strong>3.04 m</strong>). Model post-storm MLD recovery is slightly faster than reanalysis, reflecting the challenge of parameterizing wind-driven turbulence from surface observations.
            </p>
          </article>
        </div>
      </section>

      {/* Spatial Field View */}
      <section className="gov-section" aria-label="Storm Period Ocean Map">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">SPATIAL CONTEXT</span>
            <h2 className="gov-section-title">Storm Period Ocean Thermal Field</h2>
            <p className="gov-section-sub">
              Spatial distribution of {product.label} across the Bay of Bengal for the active date.
            </p>
          </div>
        </div>

        <div className="cyclone-map-wrapper">
          <OceanMap
            grid={props.grid}
            dateIndex={props.dateIndex}
            setDateIndex={props.setDateIndex}
            depthIndex={props.depthIndex}
            setDepthIndex={props.setDepthIndex}
            mode={props.mode}
            setMode={props.setMode}
            selected={props.selected}
            onSelect={props.setSelected}
            selectedVariable={activeMapVar}
          />
        </div>
      </section>
    </div>
  )
}
