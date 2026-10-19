import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Layers,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Thermometer,
} from 'lucide-react'
import type { DisplayMode, MapVariable, OceanGrid, SelectedOceanPoint } from '../types/ocean'
import { getGridIndex } from '../data/oceanData'
import { calculateIsothermDepth, calculateMLD, calculateTCHP, computeCellProducts } from '../utils/oceanPhysics'
import { getColorForValue, VARIABLE_CONFIGS } from '../utils/colorScales'

interface OceanMapProps {
  grid: OceanGrid
  dateIndex: number
  setDateIndex: (idx: number) => void
  depthIndex: number
  setDepthIndex: (idx: number) => void
  mode: DisplayMode
  setMode: (mode: DisplayMode) => void
  selected: SelectedOceanPoint
  onSelect: (point: SelectedOceanPoint) => void
  compact?: boolean
  selectedVariable?: MapVariable
  onSelectVariable?: (variable: MapVariable) => void
}

// Bounding box for Bay of Bengal scientific projection
// Latitude: 5.0°N to 22.0°N (span: 17°); Longitude: 80.0°E to 100.0°E (span: 20°)
const mapView = {
  x: 64,
  y: 32,
  width: 580,
  height: 380,
}

const QUICK_DEPTH_PRESETS = [
  { label: 'Surface (0.5m)', index: 0 },
  { label: '11 m', index: 8 },
  { label: '28 m', index: 14 },
  { label: '50 m', index: 18 },
  { label: '114 m', index: 23 },
  { label: '196 m', index: 26 },
  { label: '486 m', index: 31 },
  { label: '902 m', index: 34 },
]

export function OceanMap({
  grid,
  dateIndex,
  setDateIndex,
  depthIndex,
  setDepthIndex,
  setMode,
  selected,
  onSelect,
  compact = false,
  selectedVariable = 'reconstructed',
  onSelectVariable,
}: OceanMapProps) {
  const [internalVariable, setInternalVariable] = useState<MapVariable>(selectedVariable)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  const activeVar = onSelectVariable ? selectedVariable : internalVariable

  function handleVariableChange(variable: MapVariable) {
    if (onSelectVariable) {
      onSelectVariable(variable)
    } else {
      setInternalVariable(variable)
    }

    if (variable === 'uncertainty') {
      setMode('uncertainty')
    } else {
      setMode('temperature')
    }
  }

  // Precompute 2D spatial fields for derived physical products (D26, D20, TCHP, MLD)
  // for the currently selected date across all (lat, lon) coordinates
  const derivedGrid2D = useMemo(() => {
    if (
      activeVar !== 'd26' &&
      activeVar !== 'd20' &&
      activeVar !== 'tchp' &&
      activeVar !== 'mld'
    ) {
      return null
    }

    const { latitudes, longitudes, depths, temperature } = grid
    const numLats = latitudes.length
    const numLons = longitudes.length
    const values = new Float32Array(numLats * numLons)

    for (let y = 0; y < numLats; y += 1) {
      for (let x = 0; x < numLons; x += 1) {
        const col: Array<number | null> = []
        for (let d = 0; d < depths.length; d += 1) {
          const idx = getGridIndex(grid, dateIndex, d, y, x)
          col.push(temperature[idx] ?? null)
        }

        let val: number | null = null
        if (activeVar === 'd26') {
          val = calculateIsothermDepth(col, depths, 26.0)
        } else if (activeVar === 'd20') {
          val = calculateIsothermDepth(col, depths, 20.0)
        } else if (activeVar === 'tchp') {
          val = calculateTCHP(col, depths)
        } else if (activeVar === 'mld') {
          val = calculateMLD(col, depths)
        }

        const outIdx = y * numLons + x
        values[outIdx] = val !== null && Number.isFinite(val) ? val : -999.0
      }
    }

    return values
  }, [grid, dateIndex, activeVar])

  // Coordinate projections
  const minLat = grid.latitudes[0]
  const maxLat = grid.latitudes[grid.latitudes.length - 1]
  const minLon = grid.longitudes[0]
  const maxLon = grid.longitudes[grid.longitudes.length - 1]

  const cellWidth = mapView.width / grid.longitudes.length
  const cellHeight = mapView.height / grid.latitudes.length

  const xForLon = (lon: number) =>
    mapView.x + ((lon - minLon) / (maxLon - minLon)) * (mapView.width - cellWidth) + cellWidth / 2
  const yForLat = (lat: number) =>
    mapView.y + ((maxLat - lat) / (maxLat - minLat)) * (mapView.height - cellHeight) + cellHeight / 2

  // Get value at specific (y, x) cell
  function getCellValue(y: number, x: number): number | null {
    if (activeVar === 'uncertainty') {
      const idx = getGridIndex(grid, dateIndex, depthIndex, y, x)
      return grid.uncertainty[idx] ?? null
    }

    if (activeVar === 'surface') {
      const idx = getGridIndex(grid, dateIndex, 0, y, x)
      return grid.temperature[idx] ?? null
    }

    if (
      activeVar === 'd26' ||
      activeVar === 'd20' ||
      activeVar === 'tchp' ||
      activeVar === 'mld'
    ) {
      if (!derivedGrid2D) return null
      const raw = derivedGrid2D[y * grid.longitudes.length + x]
      return raw !== undefined && raw > -900 ? raw : null
    }

    // Default: reconstructed temperature at active depth level
    const idx = getGridIndex(grid, dateIndex, depthIndex, y, x)
    return grid.temperature[idx] ?? null
  }

  // Selected cell metrics
  const selectedCellIdx = getGridIndex(
    grid,
    dateIndex,
    depthIndex,
    selected.latitudeIndex,
    selected.longitudeIndex,
  )
  const selectedTemp = grid.temperature[selectedCellIdx] ?? null
  const selectedUncert = grid.uncertainty[selectedCellIdx] ?? null
  const isLandSelected = selectedTemp === null

  const selectedCellProducts = useMemo(() => {
    if (isLandSelected) return null
    return computeCellProducts(grid, dateIndex, selected.latitudeIndex, selected.longitudeIndex)
  }, [grid, dateIndex, selected.latitudeIndex, selected.longitudeIndex, isLandSelected])

  function selectGridCell(latitudeIndex: number, longitudeIndex: number) {
    onSelect({
      latitude: grid.latitudes[latitudeIndex],
      longitude: grid.longitudes[longitudeIndex],
      latitudeIndex,
      longitudeIndex,
    })
  }

  function togglePlayback() {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    setIsPlaying(true)
    let current = dateIndex
    const interval = setInterval(() => {
      current += 1
      if (current >= grid.dates.length) {
        setIsPlaying(false)
        clearInterval(interval)
      } else {
        setDateIndex(current)
      }
    }, 700)
  }

  const varConfig = VARIABLE_CONFIGS[activeVar] ?? VARIABLE_CONFIGS.reconstructed
  const latTicks = [5, 10, 15, 20, 22]
  const lonTicks = [80, 85, 90, 95, 100]

  return (
    <div className={`scientific-map-card ${compact ? 'scientific-map-card--compact' : ''}`}>
      {/* Top Scientific Metadata Header */}
      <div className="map-portal-header">
        <div className="map-portal-header__left">
          <div className="map-badge-group">
            <span className="scientific-domain-pill">
              BAY OF BENGAL · 5.0°N–22.0°N | 80.0°E–100.0°E
            </span>
            <span className="research-data-badge">
              GLORYS12 DOMAIN · RECONSTRUCTION ARCHIVE
            </span>
          </div>
          <h2 className="map-portal-title">
            {varConfig.label} ({varConfig.unit})
          </h2>
        </div>

        <div className="map-portal-header__right">
          <div className="status-readout-pill">
            <CalendarDays size={14} className="text-ocean" />
            <span>{grid.dates[dateIndex]}</span>
          </div>
          <div className="status-readout-pill">
            <Thermometer size={14} className="text-teal" />
            <span>Depth: {grid.depths[depthIndex].toFixed(1)} m</span>
          </div>
        </div>
      </div>

      {/* Primary Scientific Control Bar */}
      <div className="map-control-toolbar" role="toolbar" aria-label="Ocean Map Scientific Controls">
        {/* Variable Layer Selector */}
        <div className="map-control-group">
          <label htmlFor="map-variable-select" className="control-label-compact">
            <Layers size={13} /> VARIABLE LAYER
          </label>
          <select
            id="map-variable-select"
            className="scientific-select scientific-select--primary"
            value={activeVar}
            onChange={(e) => handleVariableChange(e.target.value as MapVariable)}
          >
            <option value="reconstructed">Reconstructed Temperature (Depth Level)</option>
            <option value="surface">Sea Surface Temperature (SST)</option>
            <option value="subsurface">Subsurface Temperature</option>
            <option value="d26">D26 (26°C Isotherm Depth, m)</option>
            <option value="d20">D20 (20°C Isotherm Depth, m)</option>
            <option value="tchp">TCHP (Cyclone Heat Potential, kJ/cm²)</option>
            <option value="mld">MLD (Mixed Layer Depth, m)</option>
            <option value="uncertainty">Learned 1σ Uncertainty (°C)</option>
          </select>
        </div>

        {/* Observation Date Selector */}
        <div className="map-control-group">
          <label htmlFor="map-date-dropdown" className="control-label-compact">
            <CalendarDays size={13} /> DATE (2023)
          </label>
          <div className="date-input-cluster">
            <button
              type="button"
              className="ctrl-nav-btn"
              onClick={() => setDateIndex(Math.max(0, dateIndex - 1))}
              disabled={dateIndex === 0}
              title="Previous Day"
              aria-label="Previous Day"
            >
              <SkipBack size={13} />
            </button>
            <select
              id="map-date-dropdown"
              className="scientific-select"
              value={dateIndex}
              onChange={(e) => setDateIndex(Number(e.target.value))}
            >
              {grid.dates.map((d, i) => (
                <option key={d} value={i}>
                  {d} {i === 0 ? '(Start)' : i === 61 ? '(Val Start)' : i >= 76 ? '(Held-out Test)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ctrl-nav-btn"
              onClick={() => setDateIndex(Math.min(grid.dates.length - 1, dateIndex + 1))}
              disabled={dateIndex === grid.dates.length - 1}
              title="Next Day"
              aria-label="Next Day"
            >
              <SkipForward size={13} />
            </button>
          </div>
        </div>

        {/* Depth Level Selector */}
        <div className="map-control-group">
          <label htmlFor="map-depth-dropdown" className="control-label-compact">
            <Thermometer size={13} /> DEPTH LEVEL
          </label>
          <select
            id="map-depth-dropdown"
            className="scientific-select"
            value={depthIndex}
            onChange={(e) => setDepthIndex(Number(e.target.value))}
          >
            {grid.depths.map((dp, i) => (
              <option key={i} value={i}>
                Level {i + 1}: {dp < 1 ? `Surface (${dp.toFixed(2)} m)` : `${dp.toFixed(1)} m`}
              </option>
            ))}
          </select>
        </div>

        {/* Time-Series Playback Button */}
        <div className="map-control-group map-control-group--action">
          <label className="control-label-compact">TIMELINE ANIMATION</label>
          <button
            type="button"
            className={`btn-scientific-playback ${isPlaying ? 'is-active' : ''}`}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY TIME SERIES'}</span>
          </button>
        </div>

        {/* Quick Reset */}
        <div className="map-control-group map-control-group--reset">
          <label className="control-label-compact">RESET</label>
          <button
            type="button"
            className="ctrl-nav-btn ctrl-nav-btn--reset"
            onClick={() => {
              setDateIndex(61)
              setDepthIndex(0)
            }}
            title="Reset to 1 Aug 2023 Surface"
            aria-label="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Depth Presets */}
      <div className="depth-presets-strip" role="group" aria-label="Quick Depth Presets">
        <span className="depth-presets-label">QUICK DEPTH:</span>
        {QUICK_DEPTH_PRESETS.map((p) => (
          <button
            key={p.index}
            type="button"
            className={`depth-preset-btn ${depthIndex === p.index ? 'is-selected' : ''}`}
            onClick={() => setDepthIndex(p.index)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Central Interactive Map Canvas */}
      <div className="map-svg-container" style={{ position: 'relative', width: '100%', minHeight: 420 }}>
        <svg
          className="ocean-vector-canvas"
          viewBox="0 0 710 450"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Geospatial map of Bay of Bengal displaying ${varConfig.label} on ${grid.dates[dateIndex]} at ${grid.depths[depthIndex].toFixed(1)} metres depth`}
        >
          <defs>
            {/* Clean Light-Themed Maritime Canvas Gradients */}
            <linearGradient id="ocean-water-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0F7FB" />
              <stop offset="100%" stopColor="#E6F2F8" />
            </linearGradient>

            <pattern id="graticule-pattern" width="29" height="29" patternUnits="userSpaceOnUse">
              <path d="M 29 0 L 0 0 0 29" fill="none" stroke="#94A3B8" strokeOpacity="0.15" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Deep Maritime Plot Background */}
          <rect x="0" y="0" width="710" height="450" rx="4" fill="#F8FAFC" />
          <rect
            x={mapView.x}
            y={mapView.y}
            width={mapView.width}
            height={mapView.height}
            fill="url(#ocean-water-bg)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          <rect
            x={mapView.x}
            y={mapView.y}
            width={mapView.width}
            height={mapView.height}
            fill="url(#graticule-pattern)"
          />

          {/* Longitudinal Graticule Lines (Meridians) */}
          {lonTicks.map((lon) => {
            const x = xForLon(lon)
            return (
              <g key={`lon-${lon}`}>
                <line
                  x1={x}
                  y1={mapView.y}
                  x2={x}
                  y2={mapView.y + mapView.height}
                  stroke="#94A3B8"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={x}
                  y={mapView.y + mapView.height + 18}
                  textAnchor="middle"
                  className="map-graticule-label"
                  fill="#475569"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                >
                  {lon}°E
                </text>
              </g>
            )
          })}

          {/* Latitudinal Graticule Lines (Parallels) */}
          {latTicks.map((lat) => {
            const y = yForLat(lat)
            return (
              <g key={`lat-${lat}`}>
                <line
                  x1={mapView.x}
                  y1={y}
                  x2={mapView.x + mapView.width}
                  y2={y}
                  stroke="#94A3B8"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={mapView.x - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="map-graticule-label"
                  fill="#475569"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                >
                  {lat}°N
                </text>
              </g>
            )
          })}

          {/* Scientific Grid Cells */}
          <g className="ocean-grid-layer">
            {grid.latitudes.map((latitude, y) =>
              grid.longitudes.map((longitude, x) => {
                const value = getCellValue(y, x)
                const isSelected =
                  y === selected.latitudeIndex && x === selected.longitudeIndex
                const cellX = xForLon(longitude) - cellWidth / 2
                const cellY = yForLat(latitude) - cellHeight / 2
                const isWater = value !== null

                return (
                  <rect
                    key={`cell-${y}-${x}`}
                    x={cellX}
                    y={cellY}
                    width={cellWidth + 0.5}
                    height={cellHeight + 0.5}
                    fill={isWater ? getColorForValue(value, activeVar) : '#E2E8F0'}
                    fillOpacity={isWater ? 0.94 : 0.7}
                    stroke={isSelected ? '#12304A' : isWater ? '#CBD5E1' : '#CBD5E1'}
                    strokeWidth={isSelected ? 2.5 : 0.4}
                    strokeOpacity={isSelected ? 1.0 : 0.3}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer', transition: 'stroke 0.15s' }}
                    onClick={() => selectGridCell(y, x)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        selectGridCell(y, x)
                      }
                    }}
                  >
                    <title>{`${latitude.toFixed(1)}°N, ${longitude.toFixed(1)}°E · ${isWater ? varConfig.formatValue(value) : 'Landmass / Topography'}`}</title>
                  </rect>
                )
              }),
            )}
          </g>

          {/* SVG Vector Geographic Coastline Overlay */}
          <g className="geographic-coastline-overlay" aria-hidden="true" pointerEvents="none">
            {/* India East Coast & Continental Boundary */}
            <path
              d={`
                M ${mapView.x},${yForLat(22)}
                L ${xForLon(88.3)},${yForLat(22)}
                C ${xForLon(87.5)},${yForLat(21.5)} ${xForLon(86.9)},${yForLat(20.8)} ${xForLon(86.0)},${yForLat(20.0)}
                C ${xForLon(85.0)},${yForLat(19.2)} ${xForLon(84.0)},${yForLat(18.2)} ${xForLon(83.3)},${yForLat(17.7)}
                C ${xForLon(82.2)},${yForLat(16.5)} ${xForLon(81.2)},${yForLat(15.5)} ${xForLon(80.3)},${yForLat(14.0)}
                C ${xForLon(80.2)},${yForLat(13.1)} ${xForLon(79.9)},${yForLat(11.5)} ${xForLon(79.8)},${yForLat(9.5)}
                L ${mapView.x},${yForLat(9.5)}
                Z
              `}
              fill="#E2E8F0"
              fillOpacity="0.82"
              stroke="#64748B"
              strokeWidth="1.4"
            />

            {/* Sri Lanka Island Outline */}
            <path
              d={`
                M ${xForLon(80.0)},${yForLat(9.8)}
                C ${xForLon(80.5)},${yForLat(9.5)} ${xForLon(81.2)},${yForLat(9.0)} ${xForLon(81.8)},${yForLat(8.5)}
                C ${xForLon(81.9)},${yForLat(7.5)} ${xForLon(81.6)},${yForLat(6.5)} ${xForLon(81.0)},${yForLat(5.9)}
                C ${xForLon(80.2)},${yForLat(6.2)} ${xForLon(79.8)},${yForLat(7.2)} ${xForLon(79.8)},${yForLat(8.5)}
                Z
              `}
              fill="#E2E8F0"
              fillOpacity="0.88"
              stroke="#64748B"
              strokeWidth="1.2"
            />

            {/* Bangladesh Delta Coastline */}
            <path
              d={`
                M ${xForLon(88.3)},${yForLat(22)}
                C ${xForLon(89.5)},${yForLat(21.8)} ${xForLon(90.5)},${yForLat(21.9)} ${xForLon(91.8)},${yForLat(22.2)}
                L ${xForLon(92.3)},${yForLat(21.2)}
                L ${xForLon(88.3)},${yForLat(21.2)}
                Z
              `}
              fill="#E2E8F0"
              fillOpacity="0.75"
              stroke="#64748B"
              strokeWidth="1.2"
            />

            {/* Myanmar & Thailand Coastline */}
            <path
              d={`
                M ${xForLon(92.3)},${yForLat(21.2)}
                C ${xForLon(93.2)},${yForLat(20.0)} ${xForLon(94.0)},${yForLat(18.5)} ${xForLon(94.5)},${yForLat(16.5)}
                C ${xForLon(95.5)},${yForLat(15.8)} ${xForLon(96.5)},${yForLat(16.5)} ${xForLon(97.5)},${yForLat(16.2)}
                C ${xForLon(98.2)},${yForLat(15.0)} ${xForLon(98.5)},${yForLat(12.0)} ${xForLon(98.6)},${yForLat(9.5)}
                C ${xForLon(98.8)},${yForLat(7.5)} ${xForLon(99.0)},${yForLat(6.0)} ${mapView.x + mapView.width},${yForLat(5.5)}
                L ${mapView.x + mapView.width},${mapView.y}
                L ${xForLon(92.3)},${mapView.y}
                Z
              `}
              fill="#E2E8F0"
              fillOpacity="0.82"
              stroke="#64748B"
              strokeWidth="1.4"
            />

            {/* Andaman & Nicobar Archipelago */}
            <g className="andaman-nicobar-ridge">
              {/* North & Middle Andaman */}
              <ellipse
                cx={xForLon(92.9)}
                cy={yForLat(13.2)}
                rx="3.5"
                ry="12"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="1"
              />
              {/* South Andaman */}
              <ellipse
                cx={xForLon(92.7)}
                cy={yForLat(11.7)}
                rx="3.2"
                ry="8"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="1"
              />
              {/* Little Andaman */}
              <ellipse
                cx={xForLon(92.5)}
                cy={yForLat(10.7)}
                rx="3"
                ry="4"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="1"
              />
              {/* Nicobar Islands */}
              <ellipse
                cx={xForLon(93.8)}
                cy={yForLat(7.2)}
                rx="4"
                ry="10"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="1"
              />
            </g>

            {/* Topographic Geographic Labels */}
            <text x={xForLon(82.5)} y={yForLat(19.2)} fill="#475569" fontSize="10" fontWeight="700" letterSpacing="0.1em">
              INDIA
            </text>
            <text x={xForLon(80.5)} y={yForLat(7.5)} fill="#475569" fontSize="9" fontWeight="700" letterSpacing="0.08em">
              SRI LANKA
            </text>
            <text x={xForLon(89.5)} y={yForLat(22.0) - 6} fill="#475569" fontSize="9" fontWeight="700" letterSpacing="0.08em">
              BANGLADESH
            </text>
            <text x={xForLon(96.0)} y={yForLat(19.0)} fill="#475569" fontSize="10" fontWeight="700" letterSpacing="0.1em">
              MYANMAR
            </text>
            <text x={xForLon(94.2)} y={yForLat(12.5)} fill="#475569" fontSize="8" fontWeight="600" letterSpacing="0.06em">
              ANDAMAN & NICOBAR
            </text>

            {/* Watermark Water Label */}
            <text
              x={xForLon(90.0)}
              y={yForLat(14.0)}
              textAnchor="middle"
              fill="#176B9A"
              fillOpacity="0.28"
              fontSize="16"
              fontWeight="800"
              letterSpacing="0.28em"
            >
              BAY OF BENGAL
            </text>
          </g>

          {/* Selected Coordinate Crosshair Marker */}
          <g className="selected-point-marker" aria-hidden="true" pointerEvents="none">
            {/* Outer Target Circle */}
            <circle
              cx={xForLon(selected.longitude)}
              cy={yForLat(selected.latitude)}
              r="12"
              fill="none"
              stroke="#12304A"
              strokeWidth="2.2"
            />
            {/* Crosshair Horizontal Line */}
            <line
              x1={xForLon(selected.longitude) - 16}
              x2={xForLon(selected.longitude) + 16}
              y1={yForLat(selected.latitude)}
              y2={yForLat(selected.latitude)}
              stroke="#12304A"
              strokeWidth="1.5"
            />
            {/* Crosshair Vertical Line */}
            <line
              x1={xForLon(selected.longitude)}
              x2={xForLon(selected.longitude)}
              y1={yForLat(selected.latitude) - 16}
              y2={yForLat(selected.latitude) + 16}
              stroke="#12304A"
              strokeWidth="1.5"
            />
            {/* Inner Focal Center */}
            <circle
              cx={xForLon(selected.longitude)}
              cy={yForLat(selected.latitude)}
              r="3.5"
              fill="#138A8A"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>

          {/* North Direction Indicator / Compass */}
          <g className="map-compass" transform={`translate(${mapView.x + mapView.width - 28}, ${mapView.y + 12})`} aria-hidden="true">
            <circle cx="0" cy="0" r="13" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M 0 -9 L 3.5 2 L 0 0 L -3.5 2 Z" fill="#DC2626" />
            <path d="M 0 9 L 3.5 0 L 0 2 L -3.5 0 Z" fill="#94A3B8" />
            <text x="0" y="-12" textAnchor="middle" fill="#12304A" fontSize="8" fontWeight="800">
              N
            </text>
          </g>
        </svg>
      </div>

      {/* Scientifically Labelled Colorbar Scale */}
      <div className="map-colorbar-bar">
        <div className="colorbar-meta">
          <span className="colorbar-label">
            <strong>{varConfig.label}</strong> ({varConfig.unit})
          </span>
          <span className="colorbar-range">
            Scale Range: {varConfig.min} to {varConfig.max} {varConfig.unit}
          </span>
        </div>

        <div className="colorbar-gradient-track" style={{ background: varConfig.gradientCss }} />

        <div className="colorbar-ticks">
          {varConfig.ticks.map((val) => (
            <span key={val} className="colorbar-tick-item">
              {val} {varConfig.unit}
            </span>
          ))}
        </div>
      </div>

      {/* Selected Cell Inspector & Ocean Intelligence Readout */}
      <div className="selected-cell-strip">
        <div className="selected-cell-strip__loc">
          <span className="strip-icon"><MapPin size={18} /></span>
          <div>
            <span className="strip-eyebrow">SELECTED COORDINATE</span>
            <strong className="strip-coords">
              {selected.latitude.toFixed(2)}°N, {selected.longitude.toFixed(2)}°E
            </strong>
          </div>
        </div>

        <div className="selected-cell-strip__values">
          <div className="cell-metric-box">
            <span className="metric-box-label">CURRENT DEPTH VALUE</span>
            <strong className="metric-box-val text-navy">
              {isLandSelected ? 'Land Cell' : `${selectedTemp?.toFixed(2)} °C`}
            </strong>
            {selectedUncert !== null && !isLandSelected && (
              <small className="metric-box-sub">± {selectedUncert.toFixed(2)} °C (1σ)</small>
            )}
          </div>

          <div className="cell-metric-box">
            <span className="metric-box-label">SURFACE SST</span>
            <strong className="metric-box-val text-ocean">
              {selectedCellProducts?.sst !== null && selectedCellProducts?.sst !== undefined
                ? `${selectedCellProducts.sst.toFixed(2)} °C`
                : '—'}
            </strong>
            <small className="metric-box-sub">Top Layer (0.49m)</small>
          </div>

          <div className="cell-metric-box">
            <span className="metric-box-label">D26 ISOTHERM</span>
            <strong className="metric-box-val text-teal">
              {selectedCellProducts?.d26 !== null && selectedCellProducts?.d26 !== undefined
                ? `${selectedCellProducts.d26.toFixed(1)} m`
                : '—'}
            </strong>
            <small className="metric-box-sub">26°C Boundary</small>
          </div>

          <div className="cell-metric-box">
            <span className="metric-box-label">CYCLONE HEAT (TCHP)</span>
            <strong className="metric-box-val text-amber">
              {selectedCellProducts?.tchp !== null && selectedCellProducts?.tchp !== undefined
                ? `${selectedCellProducts.tchp.toFixed(1)} kJ/cm²`
                : '—'}
            </strong>
            <small className="metric-box-sub">Available Energy</small>
          </div>

          <div className="cell-metric-box">
            <span className="metric-box-label">MIXED LAYER (MLD)</span>
            <strong className="metric-box-val text-slate">
              {selectedCellProducts?.mld !== null && selectedCellProducts?.mld !== undefined
                ? `${selectedCellProducts.mld.toFixed(1)} m`
                : '—'}
            </strong>
            <small className="metric-box-sub">ΔT = 0.5°C from 10m</small>
          </div>
        </div>
      </div>
    </div>
  )
}
