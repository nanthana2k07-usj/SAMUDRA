import { useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import type { PageProps } from './shared'

export function TechnicalPage(_props: PageProps) {
  const [hyperparamsOpen, setHyperparamsOpen] = useState(false)

  return (
    <div className="gov-page gov-page--technical">
      <PageHeading
        eyebrow="SYSTEM ARCHITECTURE & METHODOLOGY"
        title="Technical Architecture & Neural Pipeline"
        description="A source-grounded technical overview of the 28-channel input tensor, hybrid CNN + FNO + ViT feature encoders, latent fusion manifold, U-Net decoder, and physics-informed loss formulation."
      />

      {/* System Specifications Facts Strip */}
      <section className="gov-specs-strip" aria-label="Core Specifications">
        <div className="spec-strip-box">
          <span className="spec-strip-label">FRAMEWORK</span>
          <strong className="spec-strip-val">PyTorch</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">DATASET FORMAT</span>
          <strong className="spec-strip-val">NetCDF (`cube.nc`)</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">SPATIAL GRID</span>
          <strong className="spec-strip-val">69 × 81 (0.25°)</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">DEPTH LEVELS</span>
          <strong className="spec-strip-val">35 Levels (~0.5–902 m)</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">TIME COVERAGE</span>
          <strong className="spec-strip-val">Daily (92 Days, Jun–Aug 2023)</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">INPUT TENSOR</span>
          <strong className="spec-strip-val">28 Channels</strong>
        </div>
        <div className="spec-strip-box">
          <span className="spec-strip-label">PARAMETERS</span>
          <strong className="spec-strip-val">3.73 M (Full Model)</strong>
        </div>
      </section>

      {/* Primary Workflow Diagram: Surface Inputs to 35-Level Output */}
      <section className="gov-section" aria-label="End-to-End Workflow Diagram">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">DIAGRAM 1: END-TO-END PIPELINE</span>
            <h2 className="gov-section-title">Surface Observations → 3D Temperature Reconstruction</h2>
            <p className="gov-section-sub">
              Complete data transformation from raw satellite products to 35-level subsurface temperature and uncertainty fields.
            </p>
          </div>
          <span className="scientific-chip">
            <Cpu size={13} /> 3.73M TRAINABLE PARAMETERS
          </span>
        </div>

        <div className="technical-flow-card">
          <div className="flow-steps-sequence">
            {/* Stage 1: Satellite Inputs */}
            <div className="flow-node flow-node--input">
              <span className="node-step-tag">STAGE 1: INPUTS</span>
              <strong className="node-title">Multi-Source Satellite Data</strong>
              <small className="node-sub">8 Dynamic Surface Fields</small>
              <div className="node-tag-list">
                <span>OSTIA SST</span>
                <span>SMOS/SMAP SSS</span>
                <span>DUACS SLA/ADT</span>
                <span>OSCAR U/V</span>
                <span>CCMP Wind U/V</span>
              </div>
            </div>

            <div className="flow-arrow-separator">
              <ArrowRight size={18} />
            </div>

            {/* Stage 2: 28-Channel Harmonization */}
            <div className="flow-node flow-node--tensor">
              <span className="node-step-tag">STAGE 2: TENSOR</span>
              <strong className="node-title">28-Channel Representation</strong>
              <small className="node-sub">(B, 28, H, W) Tensor</small>
              <p className="node-desc">
                8 physical variables × 3 daily lag dates (t-2, t-1, t) + DOY sin/cos + Lat + Lon.
              </p>
            </div>

            <div className="flow-arrow-separator">
              <ArrowRight size={18} />
            </div>

            {/* Stage 3: Tri-Branch Encoders */}
            <div className="flow-node flow-node--encoders">
              <span className="node-step-tag">STAGE 3: ENCODERS</span>
              <strong className="node-title">Hybrid Neural Encoders</strong>
              <small className="node-sub">Parallel Multi-Scale Paths</small>
              <div className="encoder-branches-box">
                <div><strong>CNN:</strong> Local spatial pyramids</div>
                <div><strong>FNO:</strong> 12×12 Fourier spectral modes</div>
                <div><strong>ViT:</strong> Global spatial patch attention</div>
              </div>
            </div>

            <div className="flow-arrow-separator">
              <ArrowRight size={18} />
            </div>

            {/* Stage 4: Latent Fusion & U-Net */}
            <div className="flow-node flow-node--decoder">
              <span className="node-step-tag">STAGE 4: DECODER</span>
              <strong className="node-title">Latent Fusion & U-Net</strong>
              <small className="node-sub">128-Dim Shared Manifold</small>
              <p className="node-desc">
                Cross-attention concatenation with multi-scale skip connections.
              </p>
            </div>

            <div className="flow-arrow-separator">
              <ArrowRight size={18} />
            </div>

            {/* Stage 5: 35-Level Output */}
            <div className="flow-node flow-node--output">
              <span className="node-step-tag">STAGE 5: OUTPUT</span>
              <strong className="node-title">35-Level 3D Field</strong>
              <small className="node-sub">+ Calibrated 1σ Uncertainty</small>
              <p className="node-desc">
                Potential temperature (0.49 m to 902.34 m) + per-depth log-variance head.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Technical Pillars Grid */}
      <section className="gov-section" aria-label="Technical Architectural Pillars">
        <div className="technical-pillars-grid">
          {/* Pillar 1: 28 Surface Channels */}
          <article className="tech-pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">INPUT HARMONIZATION</span>
              <h3 className="pillar-title">28 Surface Channels</h3>
            </div>
            <div className="pillar-tags-row">
              {['OSTIA SST', 'SMOS SSS', 'DUACS SLA', 'DUACS ADT', 'OSCAR U', 'OSCAR V', 'CCMP Wind U', 'CCMP Wind V', 'DOY Sin/Cos', 'Latitude/Longitude'].map((item) => (
                <span key={item} className="pillar-tag">{item}</span>
              ))}
            </div>
            <p className="pillar-text">
              Eight dynamic ocean surface fields sampled over a 3-day causal temporal window (t-2, t-1, t) to preserve upper-ocean momentum and thermal memory, augmented by four spatial and calendar coordinate channels. All fields are bilinearly re-gridded to a common 0.25° grid and standardized using training-period statistics.
            </p>
          </article>

          {/* Pillar 2: Physics-Informed Losses */}
          <article className="tech-pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">PHYSICS REGULARIZATION</span>
              <h3 className="pillar-title">Physics-Informed Losses</h3>
            </div>
            <ul className="pillar-bullets-list">
              <li>
                <strong>Heteroscedastic Gaussian NLL:</strong> Unsupervised uncertainty head predicting log-variance alongside mean temperature.
              </li>
              <li>
                <strong>Gravitational Density Stability:</strong> Soft penalty enforcing stable vertical stratification: ∂ρ/∂z ≤ 0, preventing unphysical buoyant inversions.
              </li>
              <li>
                <strong>Steric Height & SLA Consistency:</strong> Penalizes discrepancies between integrated thermal expansion and altimetric sea level anomaly.
              </li>
              <li>
                <strong>Cyclone-Aware Loss:</strong> Preserves D26 isotherm gradients and Tropical Cyclone Heat Potential (TCHP) in the upper 150 metres.
              </li>
            </ul>
          </article>

          {/* Pillar 3: Contiguous Time Split */}
          <article className="tech-pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">EXPERIMENTAL PROTOCOL</span>
              <h3 className="pillar-title">Contiguous Time Split</h3>
            </div>
            <div className="split-bars-group">
              <div className="split-bar-box">
                <span className="split-bar-title">TRAIN</span>
                <strong className="split-bar-days">61 Days</strong>
                <small>1 Jun – 31 Jul 2023</small>
              </div>
              <div className="split-bar-box">
                <span className="split-bar-title">VALIDATION</span>
                <strong className="split-bar-days">15 Days</strong>
                <small>1 – 15 Aug 2023</small>
              </div>
              <div className="split-bar-box">
                <span className="split-bar-title">HELD-OUT TEST</span>
                <strong className="split-bar-days">16 Days</strong>
                <small>16 – 31 Aug 2023</small>
              </div>
            </div>
            <p className="pillar-text" style={{ marginTop: '12px' }}>
              Enforces a strict future temporal boundary. Unlike randomized cross-validation which allows temporal leakage between adjacent days, contiguous splitting provides an honest, reliable benchmark of real-world operational skill.
            </p>
          </article>
        </div>
      </section>

      {/* Advanced Hyperparameters & Limitations Collapsible */}
      <section className="gov-section" aria-label="Hyperparameters and Model Limitations">
        <div className="protocol-summary-card">
          <div className="protocol-summary-top">
            <div>
              <span className="protocol-eyebrow">REPRODUCIBILITY & LIMITATIONS</span>
              <h3 className="protocol-title">Training Hyperparameters & Documented Scientific Limitations</h3>
              <p className="protocol-sub">
                AdamW optimizer, cosine annealing, hardware constraints, and scientific operating boundaries.
              </p>
            </div>
            <button
              type="button"
              className="gov-btn gov-btn--outline"
              onClick={() => setHyperparamsOpen((v) => !v)}
              aria-expanded={hyperparamsOpen}
            >
              {hyperparamsOpen ? 'COLLAPSE DETAILS' : 'EXPAND SPECIFICATIONS'}
              {hyperparamsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {hyperparamsOpen && (
            <div className="protocol-details-expanded">
              <div className="hyperparams-grid">
                <div className="hyperparam-box">
                  <strong>Optimizer & Learning Rate</strong>
                  <p>AdamW optimizer · Initial learning rate 0.001 · Weight decay 0.0005 · Cosine annealing schedule with T_max = 200 epochs · Warm-up ramp of 5 epochs.</p>
                </div>
                <div className="hyperparam-box">
                  <strong>Batching & Regularization</strong>
                  <p>Batch size 4 · Gradient clipping norm 1.0 · Input gaussian noise augmentation σ = 0.05 applied to satellite channels during training.</p>
                </div>
                <div className="hyperparam-box">
                  <strong>Uncertainty Calibration</strong>
                  <p>Heteroscedastic log-variance head with detached mean during Gaussian NLL loss · Validation temperature scaling factor per seed · Ensemble spread across 3 seeds.</p>
                </div>
                <div className="hyperparam-box">
                  <strong>Documented Research Limitations</strong>
                  <p>Reconstructions depend on satellite swath availability · Thermocline errors increase during violent internal solitary wave events · Coastal shelf waters below 50 m depth exhibit bathymetric truncation.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
