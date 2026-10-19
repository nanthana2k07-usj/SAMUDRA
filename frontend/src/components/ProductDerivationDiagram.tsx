import { ArrowDown, ArrowRight, Layers, Sparkles, Waves } from 'lucide-react'

export function ProductDerivationDiagram() {
  return (
    <div className="product-derivation-card">
      <div className="derivation-card-header">
        <div>
          <span className="gov-section-eyebrow">PHYSICAL ENGINE FORMULATION</span>
          <h3 className="derivation-card-title">Deriving Ocean Intelligence from 3D Temperature Fields</h3>
          <p className="derivation-card-sub">
            All four ocean indicators are mathematically computed directly from the 35-level subsurface temperature column using thermodynamic integration and isotherm tracking.
          </p>
        </div>
        <span className="scientific-chip">
          <Sparkles size={13} className="text-teal" /> PHYSICAL INTEGRATION ENGINE
        </span>
      </div>

      <div className="derivation-pipeline-flow">
        {/* Step 1: Input Column */}
        <div className="derivation-stage derivation-stage--input">
          <div className="stage-top">
            <span className="stage-num-badge">STAGE 1: INPUT FIELD</span>
            <Layers size={18} className="text-navy" />
          </div>
          <strong className="stage-title">Reconstructed 3D Column</strong>
          <small className="stage-sub">35 Vertical Depths (~0.49 m to 902.34 m)</small>
          <p className="stage-desc">
            Full potential temperature column predicted at each 0.25° grid coordinate across the Bay of Bengal basin.
          </p>
          <div className="stage-tag-pill">35-Channel Tensor [B, 35, H, W]</div>
        </div>

        <div className="derivation-arrow-box">
          <ArrowRight size={22} className="desktop-arrow text-ocean" />
          <ArrowDown size={22} className="mobile-arrow text-ocean" />
        </div>

        {/* Step 2: Physical Computation Engine */}
        <div className="derivation-stage derivation-stage--engine">
          <div className="stage-top">
            <span className="stage-num-badge">STAGE 2: DERIVATION ENGINE</span>
            <Sparkles size={18} className="text-teal" />
          </div>
          <strong className="stage-title">Isotherm & Heat Integral Engine</strong>
          <small className="stage-sub">Continuous Downward Linear Interpolation & Integration</small>
          <div className="engine-formulas-list">
            <div className="formula-item">
              <strong>D26 & D20:</strong>
              <span>Linear interpolation of downward crossing depths: z₀ + ((T₀ - T_iso)/(T₀ - T₁))·Δz</span>
            </div>
            <div className="formula-item">
              <strong>TCHP:</strong>
              <span>Q = ρ₀ · cₚ · ∫₀^{'{D26}'} (T(z) - 26) dz / 10⁷ [kJ/cm²]</span>
            </div>
            <div className="formula-item">
              <strong>MLD:</strong>
              <span>Depth where T(z) drops by 0.5°C relative to 10 m temperature: T(z) ≤ T₁₀ₘ - 0.5°C</span>
            </div>
          </div>
        </div>

        <div className="derivation-arrow-box">
          <ArrowRight size={22} className="desktop-arrow text-ocean" />
          <ArrowDown size={22} className="mobile-arrow text-ocean" />
        </div>

        {/* Step 3: 4 Derived Products */}
        <div className="derivation-stage derivation-stage--output">
          <div className="stage-top">
            <span className="stage-num-badge">STAGE 3: ACTIONABLE PRODUCTS</span>
            <Waves size={18} className="text-ocean" />
          </div>
          <strong className="stage-title">Four Physical Ocean Products</strong>
          <small className="stage-sub">Operational & Research Indicators</small>
          <div className="products-output-grid">
            <div className="product-chip-item" style={{ borderColor: '#0284c7' }}>
              <span className="chip-code text-ocean">D26</span>
              <strong>26°C Depth</strong>
              <small>Upper-ocean heat boundary</small>
            </div>
            <div className="product-chip-item" style={{ borderColor: '#0d9488' }}>
              <span className="chip-code text-teal">D20</span>
              <strong>20°C Depth</strong>
              <small>Thermocline proxy</small>
            </div>
            <div className="product-chip-item" style={{ borderColor: '#d97706' }}>
              <span className="chip-code text-amber">TCHP</span>
              <strong>Heat Potential</strong>
              <small>Available cyclone energy</small>
            </div>
            <div className="product-chip-item" style={{ borderColor: '#6366f1' }}>
              <span className="chip-code text-purple">MLD</span>
              <strong>Mixed Layer</strong>
              <small>Uniform surface layer</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
