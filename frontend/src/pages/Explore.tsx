import { useState } from 'react'
import {
  Compass,
  Layers,
  MapPin,
  Thermometer,
  Waves,
} from 'lucide-react'
import { OceanMap } from '../components/OceanMap'
import { PageHeading } from '../components/PageHeading'
import { TemperatureProfile } from '../components/TemperatureProfile'
import type { MapVariable } from '../types/ocean'
import type { PageProps } from './shared'
import { formatDate } from './shared'

export function ExplorePage(props: PageProps) {
  const {
    grid,
    dateIndex,
    setDateIndex,
    depthIndex,
    setDepthIndex,
    selected,
    setSelected,
    mode,
    setMode,
    onNavigate,
  } = props

  const [selectedVar, setSelectedVar] = useState<MapVariable>('reconstructed')

  const currentDepthM = grid.depths[depthIndex]
  const currentDepthLabel =
    currentDepthM < 1.0 ? `Surface (${currentDepthM.toFixed(2)} m)` : `${currentDepthM.toFixed(1)} m`

  return (
    <div className="gov-page gov-page--explore">
      {/* Page Title & Mission Scope */}
      <PageHeading
        eyebrow="GEOSPATIAL & VERTICAL EXPLORER"
        title="Interactive Bay of Bengal Ocean Explorer"
        description="Explore 3D ocean temperature reconstructions across the Bay of Bengal (5°N–22°N, 80°E–100°E). Select any date, depth layer, or physical variable. Click any ocean grid cell to inspect the continuous vertical temperature profile down to 902 m."
      />

      {/* Main Map-Centred Scientific Dashboard Layout */}
      <div className="explore-grid-layout">
        {/* Left/Primary Column: Dominant Working Ocean Map */}
        <section className="explore-map-primary" aria-label="Bay of Bengal Interactive Ocean Map">
          <OceanMap
            grid={grid}
            dateIndex={dateIndex}
            setDateIndex={setDateIndex}
            depthIndex={depthIndex}
            setDepthIndex={setDepthIndex}
            mode={mode}
            setMode={setMode}
            selected={selected}
            onSelect={setSelected}
            selectedVariable={selectedVar}
            onSelectVariable={setSelectedVar}
          />
        </section>

        {/* Right/Secondary Column: Vertical Profile & Scientific Diagnostics */}
        <aside className="explore-side-panel" aria-label="Vertical Column & Cell Inspector">
          {/* Vertical Temperature Profile Card */}
          <div className="explore-profile-container">
            <TemperatureProfile
              grid={grid}
              dateIndex={dateIndex}
              selected={selected}
              compact
              dateLabel={formatDate(grid.dates[dateIndex], { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          </div>

          {/* Oceanographic Depth Layer Context */}
          <div className="scientific-card">
            <div className="scientific-card__header">
              <span className="scientific-card__eyebrow">DEPTH LAYER CONTEXT</span>
              <h4 className="scientific-card__title">Current Layer: {currentDepthLabel}</h4>
            </div>
            <div className="depth-zone-explanation">
              {currentDepthM <= 25 && (
                <p>
                  <strong>Surface Mixed Layer (0–25 m):</strong> Directly influenced by solar insolation and wind stress. High sea-surface temperature (~28.5–29.5°C) and strong air-sea heat flux.
                </p>
              )}
              {currentDepthM > 25 && currentDepthM <= 80 && (
                <p>
                  <strong>Upper Thermocline & Barrier Layer (25–80 m):</strong> Contains the 26°C isotherm (D26). Governs heat exchange and thermodynamic energy supply for tropical cyclones.
                </p>
              )}
              {currentDepthM > 80 && currentDepthM <= 200 && (
                <p>
                  <strong>Main Thermocline (80–200 m):</strong> Steepest vertical temperature gradient in the water column. Characterized by highest reconstruction RMSE (~1.38°C) due to internal wave variability.
                </p>
              )}
              {currentDepthM > 200 && currentDepthM <= 500 && (
                <p>
                  <strong>Subsurface Intermediate Water (200–500 m):</strong> Gradual temperature decay toward cold deep water (~8–14°C). Highly stable thermal characteristics with low RMSE (~0.30°C).
                </p>
              )}
              {currentDepthM > 500 && (
                <p>
                  <strong>Deep Ocean Boundary (500–902 m):</strong> Cold, dense water mass (~6.5–8°C). Highly predictable thermal structure with minimum model RMSE (~0.24°C).
                </p>
              )}
            </div>

            <div className="quick-nav-actions">
              <button
                type="button"
                className="gov-btn gov-btn--outline"
                onClick={() => onNavigate('temperature')}
              >
                <Thermometer size={14} /> Full 35-Level Profile Details
              </button>
              <button
                type="button"
                className="gov-btn gov-btn--outline"
                onClick={() => onNavigate('ocean-intelligence')}
              >
                <Waves size={14} /> Ocean Intelligence (D26/TCHP)
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Geospatial Explorer Guidelines Strip */}
      <section className="scientific-info-strip">
        <div className="info-strip-item">
          <MapPin size={16} className="text-teal" />
          <div>
            <strong>Interactive Grid Selection:</strong>
            <span>Click any coordinate cell on the map to inspect its 35-depth vertical temperature profile.</span>
          </div>
        </div>
        <div className="info-strip-item">
          <Layers size={16} className="text-ocean" />
          <div>
            <strong>Multi-Variable Switching:</strong>
            <span>Toggle between Reconstructed Temperature, SST, D26, D20, TCHP, MLD, and 1σ Uncertainty layers.</span>
          </div>
        </div>
        <div className="info-strip-item">
          <Compass size={16} className="text-navy" />
          <div>
            <strong>Autonomous Offline Operation:</strong>
            <span>High-precision vector SVG coastline and bathymetric grids render without external tile server dependencies.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
