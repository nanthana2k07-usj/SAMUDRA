import { useState } from 'react'
import {
  CalendarDays,
  Compass,
  Database,
  Table,
  Waves,
} from 'lucide-react'
import { TemperatureProfile } from '../components/TemperatureProfile'
import { PageHeading } from '../components/PageHeading'
import type { PageProps } from './shared'
import { getGridIndex } from '../data/oceanData'

export function TemperaturePage(props: PageProps) {
  const { grid, dateIndex, setDateIndex, selected, onNavigate } = props
  const [showDataTable, setShowDataTable] = useState(false)

  const hasReference = grid.reference.some((val) => val !== null)

  const depthZones = [
    {
      range: '0 – 10 m',
      name: 'Surface Boundary & Mixed Layer Top',
      tempRange: '~28.5°C – 29.8°C',
      rmse: '0.49 °C',
      description: 'Satellite-observed surface skin and mixed boundary layer. Strong thermal signatures and direct solar heating.',
      badgeColor: '#0D9488',
    },
    {
      range: '10 – 50 m',
      name: 'Upper Ocean Stratified Layer',
      tempRange: '~26.5°C – 28.5°C',
      rmse: '0.48 °C',
      description: 'Quasi-homogeneous mixed upper layer. Contains the primary heat reservoir that directly interacts with atmospheric cyclonic forcing.',
      badgeColor: '#176B9A',
    },
    {
      range: '50 – 100 m',
      name: 'Upper Thermocline Transition',
      tempRange: '~20.0°C – 26.5°C',
      rmse: '0.84 °C',
      description: 'Rapid vertical thermal gradient. Houses the critical 26.0°C isotherm (D26) threshold depth.',
      badgeColor: '#12304A',
    },
    {
      range: '100 – 200 m',
      name: 'Main Thermocline Zone',
      tempRange: '~14.0°C – 20.0°C',
      rmse: '1.38 °C',
      description: 'Steepest temperature drop with depth. Maximum observed reconstruction error due to strong internal solitary wave oscillations.',
      badgeColor: '#D97706',
    },
    {
      range: '200 – 500 m',
      name: 'Subsurface Intermediate Layer',
      tempRange: '~8.0°C – 14.0°C',
      rmse: '0.30 °C',
      description: 'Intermediate transitional waters. Stable thermal stratification and gradual cooling towards deep ocean temperatures.',
      badgeColor: '#6366F1',
    },
    {
      range: '500 – 902 m',
      name: 'Deep Ocean Boundary',
      tempRange: '~6.4°C – 8.0°C',
      rmse: '0.24 °C',
      description: 'Deepest reconstructed water column (down to 902.34 m). Highly quiescent thermal conditions and lowest model RMSE.',
      badgeColor: '#475569',
    },
  ]

  // Extract 35 levels data for selected cell
  const columnData = grid.depths.map((depth, d) => {
    const idx = getGridIndex(grid, dateIndex, d, selected.latitudeIndex, selected.longitudeIndex)
    const est = grid.temperature[idx]
    const uncert = grid.uncertainty[idx]
    const ref = grid.reference ? grid.reference[idx] : null
    const diff = est !== null && ref !== null ? est - ref : null
    return {
      level: d + 1,
      depth: Number(depth.toFixed(2)),
      estimate: est !== null ? Number(est.toFixed(2)) : null,
      uncertainty: uncert !== null ? Number(uncert.toFixed(2)) : null,
      reference: ref !== null ? Number(ref.toFixed(2)) : null,
      residual: diff !== null ? Number(diff.toFixed(2)) : null,
    }
  })

  return (
    <div className="gov-page gov-page--temperature">
      <PageHeading
        eyebrow="SUBSURFACE TEMPERATURE PROFILES"
        title="35-Level Vertical Temperature Column Analysis"
        description="Continuous vertical thermal structure reconstructed from surface satellite observations across 35 depth levels (~0.49 m to ~902.34 m). Depicts thermal stratification, thermocline steepness, and 26°C isotherm boundaries."
      />

      {/* Main Profile & Vertical Geometry Grid */}
      <div className="temperature-main-grid">
        {/* Left Column: Full Vertical Temperature Profile */}
        <section className="temp-profile-card" aria-label="Vertical Profile Plot">
          <div className="temp-card-header">
            <div>
              <span className="temp-card-eyebrow">CONTINUOUS THERMAL PROFILE</span>
              <h3 className="temp-card-title">
                Pointwise Profile: {selected.latitude.toFixed(2)}°N, {selected.longitude.toFixed(2)}°E
              </h3>
            </div>

            <div className="temp-card-controls">
              <label htmlFor="temp-date-select" className="control-label-inline">
                <CalendarDays size={13} /> Observation Date:
              </label>
              <select
                id="temp-date-select"
                className="scientific-select"
                value={dateIndex}
                onChange={(e) => setDateIndex(Number(e.target.value))}
              >
                {grid.dates.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TemperatureProfile grid={grid} dateIndex={dateIndex} selected={selected} />

          <div className="profile-actions-bar">
            <button
              type="button"
              className="gov-btn gov-btn--outline"
              onClick={() => setShowDataTable((v) => !v)}
            >
              <Table size={14} /> {showDataTable ? 'HIDE 35-LEVEL DATA TABLE' : 'VIEW 35-LEVEL DATA TABLE'}
            </button>
            <button
              type="button"
              className="gov-btn gov-btn--secondary"
              onClick={() => onNavigate('explore')}
            >
              <Compass size={14} /> PICK ANOTHER CELL ON MAP
            </button>
          </div>
        </section>

        {/* Right Column: Vertical Column Schematic & Scientific Zones */}
        <aside className="vertical-geometry-card" aria-label="Oceanographic Depth Zones">
          <div className="geometry-header">
            <span className="geometry-eyebrow">COLUMN ANATOMY</span>
            <h3 className="geometry-title">Thirty-Five Depths · One Continuous Column</h3>
            <p className="geometry-sub">
              Logarithmically spaced vertical grid matching CMEMS GLORYS12 physical levels. High density near the surface to capture sharp thermocline boundaries.
            </p>
          </div>

          <div className="geometry-zones-list">
            {depthZones.map((z) => (
              <div key={z.range} className="geometry-zone-item">
                <div className="zone-indicator-bar" style={{ backgroundColor: z.badgeColor }} />
                <div className="zone-info">
                  <div className="zone-topline">
                    <strong className="zone-range" style={{ color: z.badgeColor }}>{z.range}</strong>
                    <span className="zone-rmse">RMSE: {z.rmse}</span>
                  </div>
                  <span className="zone-name">{z.name}</span>
                  <small className="zone-temp">Est. Temp: {z.tempRange}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="geometry-callout">
            <Waves size={18} className="text-teal" />
            <p>
              Unlike surface-only models, SAMUDRA predicts the complete 3D subsurface thermal state down to 902 metres depth.
            </p>
          </div>
        </aside>
      </div>

      {/* Discrete 35-Depth Levels Data Table */}
      {showDataTable && (
        <section className="discrete-table-section" aria-label="35-Level Data Table">
          <div className="gov-section-header">
            <div>
              <span className="gov-section-eyebrow">NUMERICAL DATA VALUES</span>
              <h3 className="gov-section-title">Discrete 35-Depth Level Measurements</h3>
              <p className="gov-section-sub">
                Reconstructed values, 1σ uncertainty, and GLORYS12 reference at {selected.latitude.toFixed(2)}°N, {selected.longitude.toFixed(2)}°E on {grid.dates[dateIndex]}.
              </p>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="scientific-data-table">
              <thead>
                <tr>
                  <th>LEVEL</th>
                  <th>DEPTH (m)</th>
                  <th>RECONSTRUCTION (°C)</th>
                  <th>1σ UNCERTAINTY (±°C)</th>
                  <th>GLORYS12 REFERENCE (°C)</th>
                  <th>RESIDUAL (°C)</th>
                </tr>
              </thead>
              <tbody>
                {columnData.map((row) => (
                  <tr key={row.level} className={row.estimate !== null && row.estimate >= 26.0 ? 'row-warm' : ''}>
                    <td>Level {row.level}</td>
                    <td><strong>{row.depth.toFixed(2)}</strong> m</td>
                    <td className="text-teal font-mono">
                      {row.estimate !== null ? `${row.estimate.toFixed(2)} °C` : '—'}
                    </td>
                    <td className="font-mono">
                      {row.uncertainty !== null ? `± ${row.uncertainty.toFixed(2)} °C` : '—'}
                    </td>
                    <td className="text-amber font-mono">
                      {row.reference !== null ? `${row.reference.toFixed(2)} °C` : '—'}
                    </td>
                    <td className="font-mono">
                      {row.residual !== null ? (
                        <span className={row.residual >= 0 ? 'text-amber' : 'text-teal'}>
                          {row.residual >= 0 ? `+${row.residual.toFixed(2)}` : row.residual.toFixed(2)} °C
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6 Scientifically Defined Depth Zones Detailed Grid */}
      <section className="gov-section" aria-label="Detailed Scientific Depth Zones">
        <div className="gov-section-header">
          <div>
            <span className="gov-section-eyebrow">DEPTH ZONE CHARACTERIZATION</span>
            <h2 className="gov-section-title">Thermal Stratification Across Vertical Zones</h2>
            <p className="gov-section-sub">
              Performance breakdown and physical characteristics across the 6 major oceanographic depth domains in the Bay of Bengal.
            </p>
          </div>
        </div>

        <div className="depth-zones-detailed-grid">
          {depthZones.map((z) => (
            <article key={z.range} className="depth-zone-detail-card">
              <div className="zone-card-topline">
                <span className="zone-chip" style={{ color: z.badgeColor, borderColor: z.badgeColor }}>
                  {z.range}
                </span>
                <span className="zone-rmse-tag">RMSE: {z.rmse}</span>
              </div>
              <h4 className="zone-card-title">{z.name}</h4>
              <span className="zone-temp-lead">Typical Temperature: {z.tempRange}</span>
              <p className="zone-card-desc">{z.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Provenance Footer */}
      <div className="scientific-provenance-bar">
        <Database size={15} className="text-teal" />
        <span>
          <strong>Profile Provenance:</strong> {hasReference ? 'SAMUDRA 3-Seed Model Output + GLORYS12 Reanalysis Target' : 'SAMUDRA Diagnostic Reconstruction'}
        </span>
        <span className="divider">·</span>
        <span>Vertical Coordinate: 0.494 m to 902.339 m (35 Logarithmic Levels)</span>
      </div>
    </div>
  )
}
