import { useMemo } from 'react'
import { AlertCircle, CalendarDays, Compass, Info } from 'lucide-react'
import {
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OceanGrid, SelectedOceanPoint, TemperatureProfilePoint } from '../types/ocean'
import { getGridIndex } from '../data/oceanData'

interface TemperatureProfileProps {
  grid: OceanGrid
  dateIndex: number
  selected: SelectedOceanPoint
  compact?: boolean
  dateLabel?: string
}

function extractProfile(
  grid: OceanGrid,
  dateIndex: number,
  selected: SelectedOceanPoint,
): TemperatureProfilePoint[] {
  if (!grid || !grid.depths || !grid.temperature) {
    return []
  }

  const profile: TemperatureProfilePoint[] = []

  for (let depthIndex = 0; depthIndex < grid.depths.length; depthIndex += 1) {
    const depth = Number(grid.depths[depthIndex].toFixed(2))
    const index = getGridIndex(
      grid,
      dateIndex,
      depthIndex,
      selected.latitudeIndex,
      selected.longitudeIndex,
    )

    if (index < 0 || index >= grid.temperature.length) continue

    const estimate = grid.temperature[index]
    const rawUncertainty = grid.uncertainty ? grid.uncertainty[index] : null
    const rawReference = grid.reference ? grid.reference[index] : null

    // If land or missing value
    if (estimate === null || estimate === undefined || !Number.isFinite(estimate)) {
      continue
    }

    const uncertainty =
      rawUncertainty !== null && rawUncertainty !== undefined && Number.isFinite(rawUncertainty)
        ? Number(rawUncertainty.toFixed(2))
        : 0.20

    const reference =
      rawReference !== null && rawReference !== undefined && Number.isFinite(rawReference)
        ? Number(rawReference.toFixed(2))
        : null

    profile.push({
      depth,
      estimate: Number(estimate.toFixed(2)),
      uncertainty,
      reference,
      lower: Number((estimate - uncertainty).toFixed(2)),
      upper: Number((estimate + uncertainty).toFixed(2)),
    })
  }

  return profile
}

function ProfileTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: TemperatureProfilePoint }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const diff =
    point.reference !== null && point.estimate !== null
      ? (point.estimate - point.reference).toFixed(2)
      : null

  return (
    <div className="scientific-chart-tooltip">
      <div className="tooltip-header">
        <strong>Depth: {point.depth.toFixed(1)} m</strong>
      </div>
      <div className="tooltip-body">
        <div className="tooltip-row text-teal">
          <span>SAMUDRA:</span>
          <strong>{point.estimate?.toFixed(2) ?? '—'} °C</strong>
        </div>
        {point.reference !== null && (
          <div className="tooltip-row text-amber">
            <span>GLORYS12:</span>
            <strong>{point.reference.toFixed(2)} °C</strong>
          </div>
        )}
        {diff !== null && (
          <div className="tooltip-row text-slate">
            <span>Residual:</span>
            <strong>{Number(diff) > 0 ? `+${diff}` : diff} °C</strong>
          </div>
        )}
        <div className="tooltip-row text-navy">
          <span>Uncertainty:</span>
          <strong>± {point.uncertainty?.toFixed(2) ?? '0.20'} °C (1σ)</strong>
        </div>
      </div>
    </div>
  )
}

export function TemperatureProfile({
  grid,
  dateIndex,
  selected,
  compact = false,
  dateLabel,
}: TemperatureProfileProps) {
  const profile = useMemo(
    () => extractProfile(grid, dateIndex, selected),
    [grid, dateIndex, selected],
  )

  const isLand = profile.length === 0
  const hasReference = profile.some((p) => p.reference !== null)

  const chartHeight = compact ? 340 : 400

  // Calculate tight domain bounds around available temperatures
  const temps = profile.flatMap((p) =>
    [p.estimate, p.reference].filter((v): v is number => v !== null && Number.isFinite(v)),
  )
  const minTemp = temps.length > 0 ? Math.floor(Math.min(...temps) - 1.5) : 4
  const maxTemp = temps.length > 0 ? Math.ceil(Math.max(...temps) + 1.5) : 32

  return (
    <div className={`scientific-profile-panel ${compact ? 'scientific-profile-panel--compact' : ''}`}>
      {/* Header */}
      <div className="profile-panel-header">
        <div>
          <span className="profile-eyebrow">VERTICAL WATER COLUMN ANALYSIS</span>
          <h3 className="profile-title">
            Subsurface Temperature Profile ({selected.latitude.toFixed(2)}°N, {selected.longitude.toFixed(2)}°E)
          </h3>
        </div>
        <div className="profile-header-chips">
          <span className="scientific-chip">
            <CalendarDays size={13} className="text-ocean" />
            {dateLabel ?? grid.dates[dateIndex]}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="profile-chart-legend">
        <span className="legend-item">
          <i className="legend-indicator legend-indicator--teal" />
          <strong>SAMUDRA</strong> (Reconstruction)
        </span>
        {hasReference && (
          <span className="legend-item">
            <i className="legend-indicator legend-indicator--amber-dash" />
            <strong>GLORYS12</strong> (Reference Target)
          </span>
        )}
        <span className="legend-item">
          <i className="legend-indicator legend-indicator--error-bar" />
          Estimated ±1σ Uncertainty
        </span>
        <span className="legend-item">
          <i className="legend-indicator legend-indicator--isotherm" />
          26°C Isotherm (D26)
        </span>
      </div>

      {/* Chart Canvas or Land Empty State */}
      <div className="profile-plot-wrapper" style={{ position: 'relative', width: '100%', minHeight: chartHeight }}>
        {isLand ? (
          <div className="profile-empty-state" style={{ height: chartHeight }}>
            <AlertCircle size={28} className="text-amber" />
            <h4>Land Coordinate Selected</h4>
            <p>
              Coordinate <strong>{selected.latitude.toFixed(2)}°N, {selected.longitude.toFixed(2)}°E</strong> is located on a continental or island landmass.
            </p>
            <small>
              Subsurface temperature reconstruction is defined exclusively for oceanic water columns. Please select an ocean grid cell in the Bay of Bengal map.
            </small>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart
              layout="vertical"
              data={profile}
              margin={{ top: 16, right: 28, bottom: 20, left: 10 }}
            >
              <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.65} horizontal vertical />

              <XAxis
                type="number"
                domain={[Math.max(2, minTemp), Math.min(34, maxTemp)]}
                tick={{ fill: '#475569', fontSize: 11 }}
                tickLine={{ stroke: '#CBD5E1' }}
                axisLine={{ stroke: '#94A3B8' }}
                unit="°C"
                label={{
                  value: 'Potential Temperature (°C)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#12304A',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <YAxis
                type="number"
                dataKey="depth"
                reversed
                domain={[0, 950]}
                ticks={[0, 50, 100, 200, 300, 500, 700, 902]}
                tick={{ fill: '#475569', fontSize: 11 }}
                tickLine={{ stroke: '#CBD5E1' }}
                axisLine={{ stroke: '#94A3B8' }}
                width={54}
                label={{
                  value: 'Depth (m)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 8,
                  fill: '#12304A',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <ReferenceLine
                x={26}
                stroke="#D97706"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '26°C (D26)',
                  fill: '#B45309',
                  fontSize: 10,
                  fontWeight: 600,
                  position: 'top',
                }}
              />

              <Tooltip content={<ProfileTooltip />} />

              <Line
                type="monotone"
                dataKey="estimate"
                name="SAMUDRA Reconstruction"
                stroke="#138A8A"
                strokeWidth={2.4}
                dot={{ r: 3.2, fill: '#138A8A', stroke: '#0D6E6E', strokeWidth: 1 }}
                activeDot={{ r: 5.5, fill: '#138A8A' }}
                isAnimationActive={false}
              >
                <ErrorBar
                  dataKey="uncertainty"
                  direction="x"
                  width={5}
                  stroke="#0D6E6E"
                  strokeWidth={1.2}
                  strokeOpacity={0.8}
                />
              </Line>

              {hasReference && (
                <Line
                  type="monotone"
                  dataKey="reference"
                  name="GLORYS12 Reference"
                  stroke="#D97706"
                  strokeWidth={2.0}
                  strokeDasharray="4 3"
                  dot={{ r: 2.8, fill: '#D97706', stroke: '#B45309', strokeWidth: 1 }}
                  activeDot={{ r: 5.0, fill: '#D97706' }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Caption & Metadata Footer */}
      <div className="profile-chart-footer">
        <span className="profile-footer-meta">
          <Compass size={13} />
          {isLand
            ? 'Land topography — bathymetric masking applied'
            : `${profile.length} validated depth levels (0.49 m to 902.34 m)`}
        </span>
        <span className="profile-footer-note">
          <Info size={13} />
          {hasReference
            ? 'Model vs GLORYS12 reanalysis comparison'
            : 'Reconstructed profile from 28 surface satellite channels'}
        </span>
      </div>
    </div>
  )
}
