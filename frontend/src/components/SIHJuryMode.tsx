import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  X,
} from 'lucide-react'
import type { PageKey } from '../types/ocean'

interface SIHJuryModeProps {
  active: boolean
  onToggle: () => void
  onNavigate: (page: PageKey) => void
  currentPage: PageKey
}

export interface PresentationStep {
  id: number
  title: string
  subtitle: string
  page: PageKey
  badge: string
  description: string
  keyPoints: string[]
  metrics?: { label: string; value: string; detail: string }[]
}

export const PRESENTATION_STEPS: PresentationStep[] = [
  {
    id: 1,
    title: '1. Problem & Scientific Scope',
    subtitle: 'From Surface Satellite Skin to 3D Subsurface Intelligence',
    page: 'overview',
    badge: 'SCIENTIFIC PROBLEM STATEMENT',
    description: 'Satellites only observe the ocean surface skin. The thermal heat content that drives cyclone intensification and monsoon dynamics lies hundreds of metres underwater.',
    keyPoints: [
      'Multi-satellite sensors observe surface SST, SSS, SLA, ADT, currents, and winds',
      'SAMUDRA reconstructs continuous 3D subsurface temperature down to 902 m',
      'Target domain: Bay of Bengal (5°N–22°N, 80°E–100°E) at 0.25° resolution',
    ],
    metrics: [
      { label: 'REGION', value: 'Bay of Bengal', detail: '5.0°N–22.0°N | 80.0°E–100.0°E' },
      { label: 'SPATIAL GRID', value: '69 × 81', detail: '0.25° horizontal spatial resolution' },
    ],
  },
  {
    id: 2,
    title: '2. Multi-Satellite Input Tensor',
    subtitle: '28-Channel Harmonized Representation',
    page: 'technical',
    badge: 'MULTISPECTRAL HARMONIZATION',
    description: 'Harmonizes 8 dynamic physical surface fields sampled across a 3-day temporal memory window (t-2, t-1, t) plus 4 spatio-temporal coordinates into a unified 28-channel input tensor.',
    keyPoints: [
      'Dynamic fields: OSTIA SST, SMOS/SMAP SSS, DUACS SLA/ADT, OSCAR U/V, CCMP Wind U/V',
      '3-day temporal memory preserves momentum and thermal memory',
      'Day-of-year sine/cosine, latitude, and longitude spatial channels',
    ],
    metrics: [
      { label: 'INPUT CHANNELS', value: '28', detail: '8 fields × 3 days + 4 spatio-temporal coords' },
      { label: 'TIME SPAN', value: '92 Days', detail: '1 June 2023 – 31 August 2023' },
    ],
  },
  {
    id: 3,
    title: '3. Hybrid Neural Backbone',
    subtitle: 'CNN + FNO + ViT Latent Fusion & U-Net',
    page: 'technical',
    badge: 'DEEP LEARNING ARCHITECTURE',
    description: 'Tri-branch parallel neural encoders capture multi-scale physics: CNN stem for local features, FNO for basin-scale Fourier spectral modes, and ViT for long-range patch attention.',
    keyPoints: [
      'CNN stem extracts high-resolution spatial pyramids and skip connections',
      'Fourier Neural Operator (FNO) models continuous fluid dynamics in frequency space',
      'Vision Transformer (ViT) captures atmospheric forcing teleconnections',
      'Fused 128-channel latent embedding decoded by U-Net into 35 depth levels',
    ],
    metrics: [
      { label: 'PARAMETERS', value: '3.73 M', detail: 'Full uncertainty-enabled SAMUDRA' },
      { label: 'DECODER', value: 'U-Net', detail: 'Skip-connected 35-depth levels' },
    ],
  },
  {
    id: 4,
    title: '4. Geospatial Ocean Explorer',
    subtitle: 'Interactive 3D Grid & Vertical Water Column',
    page: 'explore',
    badge: 'MISSION-CRITICAL DASHBOARD',
    description: 'Working, map-centred geospatial interface providing interactive spatial slicing across 35 depth levels, temporal playback, and pointwise vertical temperature profile inspection.',
    keyPoints: [
      'Interactive vector map of Bay of Bengal with accurate coastline and graticule',
      '35 depth levels (~0.5 m to ~902 m) with quick presets and calendar selector',
      'Pointwise vertical temperature profile with ±1σ uncertainty envelopes',
    ],
    metrics: [
      { label: 'DEPTH LEVELS', value: '35 Levels', detail: '0.49 m to 902.34 m depth' },
      { label: 'VARIABLES', value: '8 Layers', detail: 'Temp, SST, D26, D20, TCHP, MLD, Uncertainty' },
    ],
  },
  {
    id: 5,
    title: '5. Derived Ocean Intelligence',
    subtitle: 'D26, D20, TCHP & MLD Products',
    page: 'ocean-intelligence',
    badge: 'ACTIONABLE OCEAN STATE PRODUCTS',
    description: 'Converts 3D temperature profiles into four mission-critical oceanographic indicators essential for ocean heat content and cyclone intensification analysis.',
    keyPoints: [
      'D26: 26°C isotherm depth (8.36 m RMSE vs 14.95 m Climatology, +44.1% improvement)',
      'D20: 20°C isotherm depth (9.14 m RMSE vs 17.14 m Climatology, +46.7% improvement)',
      'TCHP: Tropical Cyclone Heat Potential (13.35 kJ/cm² vs 21.48 kJ/cm², +37.9% improvement)',
      'MLD: Mixed Layer Depth (11.82 m RMSE vs 12.29 m Climatology)',
    ],
    metrics: [
      { label: 'D26 RMSE', value: '8.36 m', detail: 'Climatology: 14.95 m (+44.1%)' },
      { label: 'TCHP RMSE', value: '13.35 kJ/cm²', detail: 'Climatology: 21.48 kJ/cm² (+37.9%)' },
    ],
  },
  {
    id: 6,
    title: '6. Held-Out GLORYS12 Validation',
    subtitle: '+35.8% Error Reduction Over Climatology',
    page: 'validation',
    badge: 'HELD-OUT TEST SET BENCHMARK',
    description: 'Strict contiguous 16-day held-out test evaluation (16–31 August 2023). SAMUDRA-Cyclone achieves 0.626 °C mean RMSE compared to 0.974 °C Climatology.',
    keyPoints: [
      'SAMUDRA-Cyclone 3-Seed Mean: 0.626 °C RMSE (+35.8% over climatology)',
      'Best Individual Checkpoint (Seed 0): 0.610 °C RMSE',
      'U-Net Baseline: 0.654 °C RMSE (+32.8% over climatology)',
      'Strict contiguous temporal split ensures zero future data leakage',
    ],
    metrics: [
      { label: '3-SEED MEAN RMSE', value: '0.626 °C', detail: 'SAMUDRA-Cyclone held-out test' },
      { label: 'TOP CHECKPOINT', value: '0.610 °C', detail: 'Seed 0 individual model run' },
    ],
  },
  {
    id: 7,
    title: '7. Independent In-Situ ARGO Validation',
    subtitle: 'Float Profile Agreement (r = 0.995, R² = 0.989)',
    page: 'validation',
    badge: 'IN-SITU OBSERVATIONAL VALIDATION',
    description: 'Direct pointwise validation against un-seen independent physical ARGO profiling floats deployed in the Bay of Bengal. Achieves 0.753 °C best-seed test RMSE and 0.479 °C MAE.',
    keyPoints: [
      '17 test-day ARGO float profiles with 1,769 matched point measurements',
      'Best-seed test RMSE: 0.753 °C | Mean MAE: 0.479 °C | Bias: +0.082 °C',
      'Pearson correlation r = 0.995 | Determination coefficient R² = 0.989',
      'Validates generalization against real-world physical in-situ sensor floats',
    ],
    metrics: [
      { label: 'ARGO TEST RMSE', value: '0.753 °C', detail: 'Best seed on test days' },
      { label: 'CORRELATION (R²)', value: '0.989', detail: 'In-situ ARGO vs SAMUDRA' },
    ],
  },
]

export function SIHJuryModeBar({
  active,
  onToggle,
  onNavigate,
  currentPage: _currentPage,
}: SIHJuryModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const step = PRESENTATION_STEPS[currentStepIndex]

  if (!active) return null

  function goToStep(index: number) {
    const nextStep = PRESENTATION_STEPS[index]
    setCurrentStepIndex(index)
    if (nextStep) {
      onNavigate(nextStep.page)
    }
  }

  function handleNext() {
    if (currentStepIndex < PRESENTATION_STEPS.length - 1) {
      goToStep(currentStepIndex + 1)
    }
  }

  function handlePrev() {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }

  return (
    <div className="gov-jury-banner" role="region" aria-label="Scientific Presentation Walkthrough">
      <div className="gov-jury-banner__inner">
        {/* Header Row */}
        <div className="gov-jury-topline">
          <div className="gov-jury-badge-group">
            <span className="jury-sih-tag">
              <Award size={14} /> SCIENTIFIC PRESENTATION MODE
            </span>
            <span className="jury-step-indicator">
              STAGE {step.id} OF {PRESENTATION_STEPS.length}
            </span>
          </div>

          <div className="gov-jury-nav-controls">
            <button
              type="button"
              className="gov-jury-btn-nav"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              aria-label="Previous presentation stage"
            >
              <ArrowLeft size={13} /> PREV
            </button>
            <button
              type="button"
              className="gov-jury-btn-nav gov-jury-btn-nav--primary"
              onClick={handleNext}
              disabled={currentStepIndex === PRESENTATION_STEPS.length - 1}
              aria-label="Next presentation stage"
            >
              NEXT <ArrowRight size={13} />
            </button>
            <button
              type="button"
              className="gov-jury-close"
              onClick={onToggle}
              title="Close Jury Walkthrough"
              aria-label="Close Jury Walkthrough"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Stage Stepper Tabs */}
        <div className="gov-jury-stepper" role="tablist">
          {PRESENTATION_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === currentStepIndex}
              className={`jury-step-tab ${idx === currentStepIndex ? 'is-active' : ''} ${idx < currentStepIndex ? 'is-completed' : ''}`}
              onClick={() => goToStep(idx)}
            >
              <span className="step-tab-num">{s.id}</span>
              <span className="step-tab-title">{s.title.split('. ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Active Stage Content Card */}
        <div className="gov-jury-content-box">
          <div className="jury-content-main">
            <span className="jury-content-badge">{step.badge}</span>
            <h3 className="jury-content-title">
              {step.title}: {step.subtitle}
            </h3>
            <p className="jury-content-desc">{step.description}</p>
            <ul className="jury-content-bullets">
              {step.keyPoints.map((point, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={14} className="text-teal" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {step.metrics && step.metrics.length > 0 && (
            <div className="jury-content-metrics">
              {step.metrics.map((m, idx) => (
                <div key={idx} className="jury-metric-pill">
                  <span className="jury-metric-label">{m.label}</span>
                  <strong className="jury-metric-val">{m.value}</strong>
                  <small className="jury-metric-detail">{m.detail}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
