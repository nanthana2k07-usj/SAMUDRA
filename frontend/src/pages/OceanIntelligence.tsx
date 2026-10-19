import { useState } from 'react'
import { Waves } from 'lucide-react'
import { CaseStudyChart } from '../components/Charts'
import { OceanMap } from '../components/OceanMap'
import { PageHeading } from '../components/PageHeading'
import { ProductDerivationDiagram } from '../components/ProductDerivationDiagram'
import { caseStudyProducts } from '../data/cycloneData'
import type { MapVariable } from '../types/ocean'
import type { PageProps } from './shared'

export function OceanIntelligencePage(props: PageProps) {
  const [selectedProductKey, setSelectedProductKey] = useState<'tchp' | 'd26' | 'd20' | 'mld'>('tchp')

  const activeProduct =
    caseStudyProducts.find((p) => p.key === selectedProductKey) ?? caseStudyProducts[1]

  const activeMapVariable: MapVariable = selectedProductKey

  return (
    <div className="gov-page gov-page--ocean-intelligence">
      <PageHeading
        eyebrow="ACTIONABLE DERIVED PRODUCTS"
        title="Ocean Intelligence Indicators"
        description="Transforming reconstructed 3D subsurface temperature fields into four mission-critical oceanographic indicators: D26, D20, Tropical Cyclone Heat Potential (TCHP), and Mixed Layer Depth (MLD)."
      />

      {/* Four Primary Ocean Intelligence Cards */}
      <section className="intelligence-cards-grid" aria-label="Four Core Derived Ocean Products">
        {/* D26 Isotherm Card */}
        <article className="intel-card intel-card--d26">
          <div className="intel-card__header">
            <span className="intel-badge intel-badge--blue">ISOTHERM BOUNDARY</span>
            <span className="intel-code">D26</span>
          </div>
          <h3 className="intel-card__title">26°C Isotherm Depth</h3>
          <div className="intel-card__metric-row">
            <strong className="intel-metric-val text-ocean">8.36 m</strong>
            <span className="intel-metric-label">RMSE vs GLORYS12</span>
          </div>
          <p className="intel-card__desc">
            Vertical depth at which potential temperature drops to 26.0°C. Represents the thickness of the warm upper ocean reservoir available for storm thermodynamic interaction.
          </p>
          <div className="intel-card__comparison">
            <span>Climatology Baseline: <strong>14.95 m</strong></span>
            <span className="gain-chip text-teal font-semibold">+44.1% Error Reduction</span>
          </div>
        </article>

        {/* D20 Isotherm Card */}
        <article className="intel-card intel-card--d20">
          <div className="intel-card__header">
            <span className="intel-badge intel-badge--teal">THERMOCLINE PROXY</span>
            <span className="intel-code">D20</span>
          </div>
          <h3 className="intel-card__title">20°C Isotherm Depth</h3>
          <div className="intel-card__metric-row">
            <strong className="intel-metric-val text-teal">9.14 m</strong>
            <span className="intel-metric-label">RMSE vs GLORYS12</span>
          </div>
          <p className="intel-card__desc">
            Vertical depth where temperature drops to 20.0°C. Acts as a key oceanographic proxy for the main thermocline and resistance to cold-water upwelling.
          </p>
          <div className="intel-card__comparison">
            <span>Climatology Baseline: <strong>17.14 m</strong></span>
            <span className="gain-chip text-teal font-semibold">+46.7% Error Reduction</span>
          </div>
        </article>

        {/* TCHP Card */}
        <article className="intel-card intel-card--tchp">
          <div className="intel-card__header">
            <span className="intel-badge intel-badge--amber">HEAT POTENTIAL</span>
            <span className="intel-code">TCHP</span>
          </div>
          <h3 className="intel-card__title">Tropical Cyclone Heat Potential</h3>
          <div className="intel-card__metric-row">
            <strong className="intel-metric-val text-amber">13.35 kJ/cm²</strong>
            <span className="intel-metric-label">RMSE vs GLORYS12</span>
          </div>
          <p className="intel-card__desc">
            Integrated ocean thermal energy from the surface down to the 26°C isotherm: Q = ρ₀·cₚ·∫(T - 26)dz. Quantifies upper ocean thermal energy available to intensify storms.
          </p>
          <div className="intel-card__comparison">
            <span>Climatology Baseline: <strong>21.48 kJ/cm²</strong></span>
            <span className="gain-chip text-teal font-semibold">+37.9% Error Reduction</span>
          </div>
        </article>

        {/* MLD Card */}
        <article className="intel-card intel-card--mld">
          <div className="intel-card__header">
            <span className="intel-badge intel-badge--purple">MIXED LAYER</span>
            <span className="intel-code">MLD</span>
          </div>
          <h3 className="intel-card__title">Mixed Layer Depth</h3>
          <div className="intel-card__metric-row">
            <strong className="intel-metric-val text-slate">11.82 m</strong>
            <span className="intel-metric-label">RMSE vs GLORYS12</span>
          </div>
          <p className="intel-card__desc">
            Depth of the near-surface quasi-homogeneous temperature layer, defined by a 0.5°C drop relative to the 10 m temperature.
          </p>
          <div className="intel-card__comparison">
            <span>Climatology Baseline: <strong>12.29 m</strong></span>
            <span className="neutral-chip text-slate font-semibold">Modest Skill Difference</span>
          </div>
        </article>
      </section>

      {/* Physics Derivation Engine Diagram */}
      <section className="gov-section" aria-label="Mathematical Derivation Diagram">
        <ProductDerivationDiagram />
      </section>

      {/* Time-Series Trend Panel (SAMUDRA vs GLORYS12) */}
      <section className="gov-section" aria-label="Derived Product Time Series">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">DIAGNOSTIC TIME SERIES</span>
            <h2 className="gov-section-title">Daily Product Evolution: SAMUDRA vs GLORYS12</h2>
            <p className="gov-section-sub">
              Comparison of daily box-mean time series during the summer monsoon and cyclone period (18 July – 15 August 2023).
            </p>
          </div>

          <div className="gov-tabs-group" role="group" aria-label="Select indicator time series">
            {caseStudyProducts.slice(1).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`gov-tab-btn ${selectedProductKey === item.key ? 'is-active' : ''}`}
                onClick={() => setSelectedProductKey(item.key as 'tchp' | 'd26' | 'mld')}
              >
                <i className="tab-dot" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chart-panel-card">
          <div className="chart-panel-topline">
            <strong>{activeProduct.label} ({activeProduct.unit})</strong>
            <span className="chart-panel-caption">
              Daily Box-Mean Comparison · SAMUDRA Ensemble vs GLORYS12 Reference Target
            </span>
          </div>

          {props.grid.caseStudy && props.grid.caseStudy.length > 0 ? (
            <CaseStudyChart data={props.grid.caseStudy} product={activeProduct} />
          ) : (
            <div className="gov-empty-box">
              <Waves size={24} className="text-teal" />
              <strong>Case study time series data unavailable</strong>
            </div>
          )}

          <div className="chart-legend-row">
            <span className="legend-chip">
              <i className="legend-dot legend-dot--amber" /> GLORYS12 Target
            </span>
            <span className="legend-chip">
              <i className="legend-dot legend-dot--teal" /> SAMUDRA Estimate
            </span>
            <span className="legend-chip-muted">
              Error bars represent 3-seed ensemble standard deviation
            </span>
          </div>
        </div>
      </section>

      {/* Spatial Distribution Map of Active Intelligence Product */}
      <section className="gov-section" aria-label="Spatial Distribution Map">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">SPATIAL FIELD DISTRIBUTION</span>
            <h2 className="gov-section-title">
              Spatial Distribution: {activeProduct.label} ({activeProduct.unit})
            </h2>
            <p className="gov-section-sub">
              Computed directly from the reconstructed 35-depth temperature field across the Bay of Bengal for the selected date.
            </p>
          </div>
        </div>

        <div className="intelligence-map-wrapper">
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
            selectedVariable={activeMapVariable}
          />
        </div>
      </section>
    </div>
  )
}
