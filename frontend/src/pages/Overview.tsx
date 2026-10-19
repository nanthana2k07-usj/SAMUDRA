import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Cpu,
  Database,
  Globe2,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Waves,
} from 'lucide-react'
import { OceanMap } from '../components/OceanMap'
import type { MapVariable, PageProps } from './shared'

export function OverviewPage(props: PageProps) {
  const [activeVar, setActiveVar] = useState<MapVariable>('reconstructed')

  return (
    <div className="gov-page gov-page--overview">
      {/* Top Institutional Scientific Banner */}
      <section className="gov-hero-banner" aria-label="Portal Overview Banner">
        <div className="gov-hero-banner__content">
          <div className="gov-hero-badge-row">
            <span className="gov-pill-tag">
              <Award size={13} className="inline-icon" /> Ocean Intelligence Research Platform
            </span>
            <span className="gov-pill-domain">
              Bay of Bengal (5.0°N–22.0°N, 80.0°E–100.0°E)
            </span>
          </div>

          <h1 className="gov-hero-title">SAMUDRA</h1>
          <p className="gov-hero-subtitle">
            Satellite-Based Subsurface Ocean Temperature Reconstruction
          </p>

          <p className="gov-hero-lead">
            An advanced hybrid deep learning platform that reconstructs the 3D continuous subsurface ocean temperature field down to 902 metres from surface satellite observations. Built for oceanographic research, air-sea flux modeling, and cyclone thermal structure diagnostics across the North Indian Ocean.
          </p>

          <div className="gov-hero-actions">
            <button
              type="button"
              className="gov-btn gov-btn--primary"
              onClick={() => props.onNavigate('explore')}
            >
              <Globe2 size={16} /> LAUNCH OCEAN EXPLORER <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="gov-btn gov-btn--secondary"
              onClick={() => props.onNavigate('validation')}
            >
              <ShieldCheck size={16} /> VIEW VALIDATION BENCHMARKS
            </button>
          </div>
        </div>

        {/* Domain Specifications Summary Card */}
        <div className="gov-hero-specs-card">
          <span className="specs-card-eyebrow">RESEARCH DOMAIN & MODEL SPECIFICATIONS</span>
          <h3 className="specs-card-title">Study Domain Profile</h3>

          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">STUDY REGION</span>
              <strong className="spec-val">Bay of Bengal</strong>
              <small>5.0°N–22.0°N, 80.0°E–100.0°E</small>
            </div>
            <div className="spec-item">
              <span className="spec-label">STUDY PERIOD</span>
              <strong className="spec-val">Jun – Aug 2023</strong>
              <small>92 daily reconstructions</small>
            </div>
            <div className="spec-item">
              <span className="spec-label">HORIZONTAL GRID</span>
              <strong className="spec-val">69 × 81</strong>
              <small>0.25° resolution (18×21 core)</small>
            </div>
            <div className="spec-item">
              <span className="spec-label">VERTICAL DEPTHS</span>
              <strong className="spec-val">35 Levels</strong>
              <small>~0.49 m to 902.34 m depth</small>
            </div>
            <div className="spec-item">
              <span className="spec-label">INPUT TENSOR</span>
              <strong className="spec-val">28 Channels</strong>
              <small>8 variables × 3 lags + 4 coords</small>
            </div>
            <div className="spec-item">
              <span className="spec-label">NEURAL BACKBONE</span>
              <strong className="spec-val">CNN + FNO + ViT</strong>
              <small>Multi-scale latent fusion + U-Net</small>
            </div>
          </div>
        </div>
      </section>

      {/* Validated Key Scientific Benchmarks */}
      <section className="gov-section" aria-label="Validated Scientific Metrics">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">VALIDATED SCIENTIFIC BENCHMARKS</span>
            <h2 className="gov-section-title">Rigorous Multi-Source Accuracy Metrics</h2>
            <p className="gov-section-sub">
              Strictly distinguishing between the 3-seed ensemble mean and the single best individual checkpoint. All test evaluations performed on strictly held-out dates and unseen physical in-situ ARGO float profiles.
            </p>
          </div>
        </div>

        <div className="metrics-kpi-grid">
          {/* KPI 1: Main 3-Seed Mean */}
          <article className="metric-kpi-card metric-kpi-card--primary">
            <div className="kpi-card-header">
              <span className="kpi-tag">HELD-OUT GLORYS12 TEST</span>
              <span className="kpi-seed-badge">3-SEED ENSEMBLE MEAN</span>
            </div>
            <div className="kpi-value-row">
              <strong className="kpi-number text-teal">0.626 °C</strong>
              <span className="kpi-unit">RMSE</span>
            </div>
            <h4 className="kpi-label">SAMUDRA-Cyclone Mean</h4>
            <p className="kpi-desc">
              Mean root-mean-square error across 3 independent training seeds (0, 1, 2) on 16 held-out test dates (16–31 August 2023). Achieves <strong>+35.8% error reduction</strong> over Climatology (0.974 °C).
            </p>
          </article>

          {/* KPI 2: Best Individual Seed Checkpoint */}
          <article className="metric-kpi-card metric-kpi-card--secondary">
            <div className="kpi-card-header">
              <span className="kpi-tag">BEST SINGLE CHECKPOINT</span>
              <span className="kpi-seed-badge">INDIVIDUAL SEED 0</span>
            </div>
            <div className="kpi-value-row">
              <strong className="kpi-number text-ocean">0.610 °C</strong>
              <span className="kpi-unit">RMSE</span>
            </div>
            <h4 className="kpi-label">Top Checkpoint GLORYS12 RMSE</h4>
            <p className="kpi-desc">
              Exact held-out test set performance of the single best checkpoint (Seed 0: 0.609873 °C RMSE). Represents the highest individual fidelity model state.
            </p>
          </article>

          {/* KPI 3: In-Situ ARGO Float Validation */}
          <article className="metric-kpi-card metric-kpi-card--amber">
            <div className="kpi-card-header">
              <span className="kpi-tag">INDEPENDENT IN-SITU FLOATS</span>
              <span className="kpi-seed-badge">PHYSICAL OBSERVATIONS</span>
            </div>
            <div className="kpi-value-row">
              <strong className="kpi-number text-amber">0.753 °C</strong>
              <span className="kpi-unit">RMSE</span>
            </div>
            <h4 className="kpi-label">Held-Out Test ARGO Float RMSE</h4>
            <p className="kpi-desc">
              Evaluated against 17 unseen test-day ARGO float profiles (1,769 matched points). Pearson correlation <strong>r = 0.995</strong>, determination coefficient <strong>R² = 0.989</strong>, Mean Absolute Error <strong>0.479 °C</strong>.
            </p>
          </article>

          {/* KPI 4: Climatology Baseline */}
          <article className="metric-kpi-card metric-kpi-card--slate">
            <div className="kpi-card-header">
              <span className="kpi-tag">BASELINE REFERENCE</span>
              <span className="kpi-seed-badge">TRAINING MEAN</span>
            </div>
            <div className="kpi-value-row">
              <strong className="kpi-number text-slate">0.974 °C</strong>
              <span className="kpi-unit">RMSE</span>
            </div>
            <h4 className="kpi-label">Historical Climatology Baseline</h4>
            <p className="kpi-desc">
              Standard oceanographic reference computed from long-term training period averages at each spatial grid coordinate and depth level.
            </p>
          </article>
        </div>
      </section>

      {/* Reconstruction Workflow Section */}
      <section className="gov-section" aria-label="End-to-End Reconstruction Workflow">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">RECONSTRUCTION WORKFLOW</span>
            <h2 className="gov-section-title">End-to-End Deep Learning Architecture</h2>
            <p className="gov-section-sub">
              How multi-satellite surface observations are harmonized and processed through hybrid feature extraction to reconstruct full 3D subsurface temperature fields and derived ocean products.
            </p>
          </div>
        </div>

        <div className="workflow-stepper-grid">
          <article className="workflow-step-card">
            <span className="step-badge">STEP 01</span>
            <span className="step-icon"><Globe2 size={20} className="text-teal" /></span>
            <strong>Multi-Satellite Observations</strong>
            <p>8 surface variables: OSTIA SST, SMOS/SMAP SSS, DUACS SLA & ADT, OSCAR currents (U, V), and CCMP wind stress (U, V).</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 02</span>
            <span className="step-icon"><Layers size={20} className="text-ocean" /></span>
            <strong>28-Channel Harmonization</strong>
            <p>8 physical variables sampled across a 3-day temporal memory window (t-2, t-1, t) plus 4 spatio-temporal coordinates (DOY sin/cos, Lat, Lon).</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 03</span>
            <span className="step-icon"><Cpu size={20} className="text-navy" /></span>
            <strong>Tri-Branch Encoders</strong>
            <p>Parallel CNN stem (local features), FNO branch (12×12 Fourier spectral modes for basin-scale dynamics), and ViT branch (long-range patch attention).</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 04</span>
            <span className="step-icon"><Sparkles size={20} className="text-teal" /></span>
            <strong>Latent Feature Fusion</strong>
            <p>Cross-attention and concatenation mechanism projecting multi-modal representations into a unified 128-dimensional latent manifold.</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 05</span>
            <span className="step-icon"><Database size={20} className="text-ocean" /></span>
            <strong>U-Net Decoder Engine</strong>
            <p>Multi-scale skip-connected convolutional decoder recovering fine spatial and vertical thermal gradients across the basin.</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 06</span>
            <span className="step-icon"><Thermometer size={20} className="text-teal" /></span>
            <strong>35-Level Output & Uncertainty</strong>
            <p>Reconstructs potential temperature and calibrated 1σ heteroscedastic uncertainty across 35 depth levels from 0.49 m down to 902.34 m.</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 07</span>
            <span className="step-icon"><Waves size={20} className="text-ocean" /></span>
            <strong>Physics-Derived Products</strong>
            <p>Differentiable physical integration calculates D26, D20 isotherm depths, Tropical Cyclone Heat Potential (TCHP), and Mixed Layer Depth (MLD).</p>
          </article>

          <article className="workflow-step-card">
            <span className="step-badge">STEP 08</span>
            <span className="step-icon"><Scale size={20} className="text-navy" /></span>
            <strong>Dual-Source Validation</strong>
            <p>Benchmarked against 16 held-out GLORYS12 test days (0.626°C RMSE) and independent in-situ ARGO profiling floats (0.753°C RMSE).</p>
          </article>
        </div>
      </section>

      {/* Embedded Working Ocean Map Preview */}
      <section className="gov-section" aria-label="Interactive Ocean Map Preview">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">INTERACTIVE RECONSTRUCTION PREVIEW</span>
            <h2 className="gov-section-title">Bay of Bengal Subsurface Thermal Field</h2>
            <p className="gov-section-sub">
              Live interactive interface. Adjust dates, depth layers, or variables. Click on any grid cell to inspect temperature values.
            </p>
          </div>
          <button
            type="button"
            className="gov-btn gov-btn--outline"
            onClick={() => props.onNavigate('explore')}
          >
            Open Full Ocean Explorer <ArrowRight size={14} />
          </button>
        </div>

        <div className="overview-map-wrapper">
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
            selectedVariable={activeVar}
            onSelectVariable={setActiveVar}
          />
        </div>
      </section>

      {/* Research Module Directory */}
      <section className="gov-section" aria-label="SAMUDRA Research Modules">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">PORTAL DIRECTORY</span>
            <h2 className="gov-section-title">Scientific Decision-Support Modules</h2>
            <p className="gov-section-sub">
              Dedicated interfaces designed for oceanographers, climate scientists, and mission-critical decision support.
            </p>
          </div>
        </div>

        <div className="modules-directory-grid">
          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('explore')}
          >
            <div className="module-dir-icon"><Globe2 size={22} className="text-teal" /></div>
            <strong className="module-dir-title">Ocean Explorer</strong>
            <p className="module-dir-desc">
              Interactive geospatial map of the Bay of Bengal with 35 depth layers, date selection, and pointwise vertical profile inspection.
            </p>
            <span className="module-dir-link">Access Explorer <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('temperature')}
          >
            <div className="module-dir-icon"><Thermometer size={22} className="text-ocean" /></div>
            <strong className="module-dir-title">Temperature Profiles</strong>
            <p className="module-dir-desc">
              35-level continuous vertical temperature column analysis with 6 oceanographic depth zones and discrete measurement tables.
            </p>
            <span className="module-dir-link">Inspect Profiles <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('ocean-intelligence')}
          >
            <div className="module-dir-icon"><Waves size={22} className="text-teal" /></div>
            <strong className="module-dir-title">Ocean Intelligence</strong>
            <p className="module-dir-desc">
              Derived upper-ocean metrics: 26°C isotherm (D26), 20°C isotherm (D20), Cyclone Heat Potential (TCHP), and Mixed Layer Depth (MLD).
            </p>
            <span className="module-dir-link">View Products <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('cyclone-analysis')}
          >
            <div className="module-dir-icon"><Activity size={22} className="text-amber" /></div>
            <strong className="module-dir-title">Cyclone–Ocean Analysis</strong>
            <p className="module-dir-desc">
              Case study analyzing subsurface thermal response and heat potential evolution during the Bay of Bengal Deep Depression event.
            </p>
            <span className="module-dir-link">Analyze Event <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('validation')}
          >
            <div className="module-dir-icon"><ShieldCheck size={22} className="text-teal" /></div>
            <strong className="module-dir-title">Validation Benchmarks</strong>
            <p className="module-dir-desc">
              Multi-source validation results comparing SAMUDRA against held-out GLORYS12 reanalysis and independent in-situ ARGO float profiles.
            </p>
            <span className="module-dir-link">Examine Benchmarks <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('uncertainty')}
          >
            <div className="module-dir-icon"><Scale size={22} className="text-ocean" /></div>
            <strong className="module-dir-title">Uncertainty Quantification</strong>
            <p className="module-dir-desc">
              Heteroscedastic 1σ confidence intervals, empirical coverage testing across nominal bands, and representativeness error analysis.
            </p>
            <span className="module-dir-link">Inspect Calibration <ArrowRight size={13} /></span>
          </button>

          <button
            type="button"
            className="module-dir-card"
            onClick={() => props.onNavigate('technical')}
          >
            <div className="module-dir-icon"><Cpu size={22} className="text-navy" /></div>
            <strong className="module-dir-title">Technical Details</strong>
            <p className="module-dir-desc">
              Comprehensive architectural blueprint, 28-channel input tensor harmonization, physics-informed losses, and evaluation protocol.
            </p>
            <span className="module-dir-link">Read Blueprint <ArrowRight size={13} /></span>
          </button>
        </div>
      </section>

      {/* Institutional Research Notice */}
      <div className="gov-callout-banner">
        <AlertCircle size={20} className="text-ocean" />
        <div>
          <strong>Institutional Research Platform Notice:</strong>
          <span>
            SAMUDRA is an advanced oceanographic research platform. Subsurface temperature predictions are retrospective reconstructions derived from historical satellite observations. This platform is intended for scientific research and evaluation, not operational real-time forecasting.
          </span>
        </div>
      </div>
    </div>
  )
}
