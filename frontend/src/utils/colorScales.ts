/**
 * Scientific colormaps and scales for oceanographic data visualization.
 * Formulated according to perceptual uniformity and oceanographic conventions (cmocean thermal, Turbo).
 */

import type { MapVariable } from '../types/ocean'

export interface ColorScaleConfig {
  min: number
  max: number
  unit: string
  label: string
  formatValue: (val: number | null) => string
  ticks: number[]
  gradientCss: string
}

export const VARIABLE_CONFIGS: Record<MapVariable, ColorScaleConfig> = {
  reconstructed: {
    min: 6,
    max: 32,
    unit: '°C',
    label: 'Reconstructed Temperature',
    formatValue: (v) => (v !== null ? `${v.toFixed(2)} °C` : 'Land / No Data'),
    ticks: [6, 12, 18, 24, 28, 32],
    gradientCss: 'linear-gradient(to right, #1e3a8a, #0284c7, #0d9488, #10b981, #f59e0b, #ef4444, #991b1b)',
  },
  surface: {
    min: 26,
    max: 32,
    unit: '°C',
    label: 'Sea Surface Temperature (SST)',
    formatValue: (v) => (v !== null ? `${v.toFixed(2)} °C` : 'Land / No Data'),
    ticks: [26, 27.5, 29, 30.5, 32],
    gradientCss: 'linear-gradient(to right, #0d9488, #10b981, #facc15, #f97316, #dc2626)',
  },
  subsurface: {
    min: 6,
    max: 32,
    unit: '°C',
    label: 'Subsurface Temperature',
    formatValue: (v) => (v !== null ? `${v.toFixed(2)} °C` : 'Land / No Data'),
    ticks: [6, 12, 18, 24, 28, 32],
    gradientCss: 'linear-gradient(to right, #1e3a8a, #0284c7, #0d9488, #10b981, #f59e0b, #ef4444, #991b1b)',
  },
  d26: {
    min: 20,
    max: 120,
    unit: 'm',
    label: '26°C Isotherm Depth (D26)',
    formatValue: (v) => (v !== null ? `${v.toFixed(1)} m` : 'Land / Surface < 26°C'),
    ticks: [20, 40, 60, 80, 100, 120],
    gradientCss: 'linear-gradient(to right, #0284c7, #06b6d4, #14b8a6, #84cc16, #eab308, #f97316)',
  },
  d20: {
    min: 40,
    max: 160,
    unit: 'm',
    label: '20°C Isotherm Depth (D20)',
    formatValue: (v) => (v !== null ? `${v.toFixed(1)} m` : 'Land / Surface < 20°C'),
    ticks: [40, 65, 90, 115, 140, 160],
    gradientCss: 'linear-gradient(to right, #1d4ed8, #0ea5e9, #06b6d4, #10b981, #eab308)',
  },
  tchp: {
    min: 0,
    max: 120,
    unit: 'kJ/cm²',
    label: 'Tropical Cyclone Heat Potential',
    formatValue: (v) => (v !== null ? `${v.toFixed(1)} kJ/cm²` : 'Land / No Data'),
    ticks: [0, 25, 50, 75, 100, 120],
    gradientCss: 'linear-gradient(to right, #0284c7, #10b981, #eab308, #f97316, #dc2626, #7f1d1d)',
  },
  mld: {
    min: 10,
    max: 80,
    unit: 'm',
    label: 'Mixed Layer Depth (MLD)',
    formatValue: (v) => (v !== null ? `${v.toFixed(1)} m` : 'Land / No Data'),
    ticks: [10, 25, 40, 55, 70, 80],
    gradientCss: 'linear-gradient(to right, #38bdf8, #6366f1, #8b5cf6, #a855f7, #6b21a8)',
  },
  uncertainty: {
    min: 0.05,
    max: 0.90,
    unit: '°C σ',
    label: 'Learned 1σ Uncertainty',
    formatValue: (v) => (v !== null ? `± ${v.toFixed(2)} °C` : 'Land / No Data'),
    ticks: [0.05, 0.20, 0.40, 0.60, 0.75, 0.90],
    gradientCss: 'linear-gradient(to right, #f8fafc, #93c5fd, #60a5fa, #4f46e5, #312e81)',
  },
}

// 7-stop high-precision scientific thermal palette
const THERMAL_STOPS: [number, number, number][] = [
  [30, 58, 138],   // 6°C: Deep Indigo Blue
  [2, 132, 199],   // 11°C: Ocean Blue
  [13, 148, 136],  // 17°C: Teal
  [16, 185, 129],  // 22°C: Emerald Green
  [245, 158, 11],  // 26°C: Amber (26°C threshold marker)
  [239, 68, 68],   // 29°C: Red-Orange
  [153, 27, 27],   // 32°C: Crimson
]

const UNCERTAINTY_STOPS: [number, number, number][] = [
  [248, 250, 252], // 0.05°C: Clean Off-White
  [191, 219, 254], // 0.20°C: Pale Ice Blue
  [96, 165, 250],  // 0.40°C: Sky Blue
  [79, 70, 229],   // 0.65°C: Indigo
  [49, 46, 129],   // 0.90°C: Deep Navy-Indigo
]

const TCHP_STOPS: [number, number, number][] = [
  [2, 132, 199],   // 0 kJ/cm²: Blue
  [16, 185, 129],  // 30 kJ/cm²: Green
  [234, 179, 8],   // 60 kJ/cm²: Yellow
  [249, 115, 22],  // 85 kJ/cm²: Orange
  [220, 38, 38],   // 105 kJ/cm²: Red
  [127, 29, 29],   // 120 kJ/cm²: Dark Crimson
]

const D26_STOPS: [number, number, number][] = [
  [2, 132, 199],   // 20 m: Shallow - Sky Blue
  [6, 182, 212],   // 40 m: Cyan
  [20, 184, 166],  // 60 m: Teal
  [132, 204, 22],  // 80 m: Lime Green
  [234, 179, 8],   // 100 m: Amber
  [249, 115, 22],  // 120 m: Deep Orange
]

function interpolateStops(normalizedT: number, stops: [number, number, number][]): string {
  const t = Math.max(0, Math.min(1, normalizedT))
  const pos = t * (stops.length - 1)
  const lower = Math.floor(pos)
  const upper = Math.min(stops.length - 1, lower + 1)
  const frac = pos - lower

  const r = Math.round(stops[lower][0] + (stops[upper][0] - stops[lower][0]) * frac)
  const g = Math.round(stops[lower][1] + (stops[upper][1] - stops[lower][1]) * frac)
  const b = Math.round(stops[lower][2] + (stops[upper][2] - stops[lower][2]) * frac)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Maps a numeric value to an RGB string for the given variable.
 * Returns null or fallback fill for null/land values.
 */
export function getColorForValue(value: number | null, variable: MapVariable): string {
  if (value === null || !Number.isFinite(value)) {
    return '#E2E8F0' // Topographical land / no data fill
  }

  const config = VARIABLE_CONFIGS[variable] ?? VARIABLE_CONFIGS.reconstructed
  const normalized = (value - config.min) / (config.max - config.min)

  switch (variable) {
    case 'uncertainty':
      return interpolateStops(normalized, UNCERTAINTY_STOPS)
    case 'tchp':
      return interpolateStops(normalized, TCHP_STOPS)
    case 'd26':
    case 'd20':
      return interpolateStops(normalized, D26_STOPS)
    case 'mld': {
      // Purple-indigo scale for mixed layer depth
      const t = Math.max(0, Math.min(1, normalized))
      const h = Math.round(200 + t * 75)
      const s = Math.round(70 - t * 20)
      const l = Math.round(65 - t * 35)
      return `hsl(${h}, ${s}%, ${l}%)`
    }
    case 'surface':
    case 'subsurface':
    case 'reconstructed':
    default:
      return interpolateStops(normalized, THERMAL_STOPS)
  }
}
