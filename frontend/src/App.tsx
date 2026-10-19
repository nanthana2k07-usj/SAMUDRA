import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AlertCircle, Award, Compass, Database, Info, LoaderCircle, RotateCw, ShieldAlert } from 'lucide-react'
import { Navigation } from './components/Navigation'
import { SIHJuryModeBar } from './components/SIHJuryMode'
import { oceanService } from './services/oceanService'
import type { DisplayMode, OceanGrid, PageKey, SelectedOceanPoint } from './types/ocean'
import './App.css'

const OverviewPage = lazy(() => import('./pages/Overview').then(({ OverviewPage }) => ({ default: OverviewPage })))
const ExplorePage = lazy(() => import('./pages/Explore').then(({ ExplorePage }) => ({ default: ExplorePage })))
const TemperaturePage = lazy(() => import('./pages/Temperature').then(({ TemperaturePage }) => ({ default: TemperaturePage })))
const OceanIntelligencePage = lazy(() => import('./pages/OceanIntelligence').then(({ OceanIntelligencePage }) => ({ default: OceanIntelligencePage })))
const CycloneAnalysisPage = lazy(() => import('./pages/CycloneAnalysis').then(({ CycloneAnalysisPage }) => ({ default: CycloneAnalysisPage })))
const ValidationPage = lazy(() => import('./pages/Validation').then(({ ValidationPage }) => ({ default: ValidationPage })))
const UncertaintyPage = lazy(() => import('./pages/Uncertainty').then(({ UncertaintyPage }) => ({ default: UncertaintyPage })))
const TechnicalPage = lazy(() => import('./pages/Technical').then(({ TechnicalPage }) => ({ default: TechnicalPage })))

const VALID_PAGES: PageKey[] = [
  'overview',
  'explore',
  'temperature',
  'ocean-intelligence',
  'cyclone-analysis',
  'validation',
  'uncertainty',
  'technical',
]

function pageFromHash(): PageKey {
  const candidate = window.location.hash.slice(1)
  return VALID_PAGES.includes(candidate as PageKey) ? (candidate as PageKey) : 'overview'
}

function App() {
  const [page, setPage] = useState<PageKey>(pageFromHash)
  const [grid, setGrid] = useState<OceanGrid | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [dateIndex, setDateIndex] = useState(61) // Default to 1 Aug 2023 (validation start)
  const [depthIndex, setDepthIndex] = useState(0) // Default to surface (0.49 m)
  const [mode, setMode] = useState<DisplayMode>('temperature')
  const [juryModeActive, setJuryModeActive] = useState(false)
  const [selected, setSelected] = useState<SelectedOceanPoint>({
    latitude: 14.0,
    longitude: 90.0,
    latitudeIndex: 9,
    longitudeIndex: 10,
  })

  useEffect(() => {
    const controller = new AbortController()
    oceanService
      .getOceanGrid(controller.signal)
      .then((data) => {
        setGrid(data)
        setDateIndex(Math.min(61, data.dates.length - 1))
        // Default to center of Bay of Bengal water column (14°N, 90°E)
        const latIdx = Math.min(9, Math.floor(data.latitudes.length / 2))
        const lonIdx = Math.min(10, Math.floor(data.longitudes.length / 2))
        setSelected({
          latitude: data.latitudes[latIdx],
          longitude: data.longitudes[lonIdx],
          latitudeIndex: latIdx,
          longitudeIndex: lonIdx,
        })
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : 'The precomputed ocean data could not be loaded.')
      })
    return () => controller.abort()
  }, [retryKey])

  useEffect(() => {
    const handleHashChange = () => setPage(pageFromHash())
    const handlePopState = () => setPage(pageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const navigate = useCallback((nextPage: PageKey) => {
    setPage(nextPage)
    if (window.location.hash.slice(1) !== nextPage) {
      window.history.pushState(null, '', `#${nextPage}`)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const commonProps = grid
    ? {
        grid,
        dateIndex,
        setDateIndex,
        depthIndex,
        setDepthIndex,
        selected,
        setSelected,
        mode,
        setMode,
        onNavigate: navigate,
      }
    : null

  let content = null
  if (commonProps) {
    switch (page) {
      case 'overview':
        content = <OverviewPage {...commonProps} />
        break
      case 'explore':
        content = <ExplorePage {...commonProps} />
        break
      case 'temperature':
        content = <TemperaturePage {...commonProps} />
        break
      case 'ocean-intelligence':
        content = <OceanIntelligencePage {...commonProps} />
        break
      case 'cyclone-analysis':
        content = <CycloneAnalysisPage {...commonProps} />
        break
      case 'validation':
        content = <ValidationPage {...commonProps} />
        break
      case 'uncertainty':
        content = <UncertaintyPage {...commonProps} />
        break
      case 'technical':
        content = <TechnicalPage {...commonProps} />
        break
    }
  }

  return (
    <div className="gov-app-shell">
      <a className="gov-skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Main Government Portal Header */}
      <Navigation
        currentPage={page}
        onNavigate={navigate}
        onToggleJuryMode={() => setJuryModeActive((v) => !v)}
        juryModeActive={juryModeActive}
      />

      {/* Optional Guided Jury Evaluation Mode */}
      <SIHJuryModeBar
        active={juryModeActive}
        onToggle={() => setJuryModeActive(false)}
        onNavigate={navigate}
        currentPage={page}
      />

      {/* Main Scientific Content Area */}
      <main id="main-content" className="gov-main-content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="gov-loading-container" role="status">
              <LoaderCircle className="gov-spinner" size={32} />
              <span className="gov-loading-title">LOADING SCIENTIFIC VIEW</span>
              <p className="gov-loading-sub">Initializing geospatial data and temperature profiles...</p>
            </div>
          }
        >
          {content}
        </Suspense>

        {!grid && !error && (
          <div className="gov-loading-container" role="status">
            <LoaderCircle className="gov-spinner" size={36} />
            <span className="gov-loading-title">INITIALIZING BAY OF BENGAL OCEAN GRID</span>
            <p className="gov-loading-sub">
              Loading 3D subsurface temperature reconstructions (35 vertical levels · 92 daily steps).
            </p>
          </div>
        )}

        {error && (
          <div className="gov-error-container" role="alert">
            <span className="gov-error-icon">
              <AlertCircle size={32} />
            </span>
            <span className="gov-error-eyebrow">RESEARCH DATA ACCESS ERROR</span>
            <h2>Scientific ocean grid could not be initialized</h2>
            <p>{error}</p>
            <button
              type="button"
              className="gov-btn gov-btn--primary"
              onClick={() => {
                setGrid(null)
                setError(null)
                setRetryKey((k) => k + 1)
              }}
            >
              <RotateCw size={15} /> RETRY INITIALIZATION
            </button>
          </div>
        )}
      </main>

      {/* Government-Grade Institutional Portal Footer */}
      <footer className="gov-footer" role="contentinfo">
        <div className="gov-footer__inner">
          <div className="gov-footer__brand-col">
            <div className="gov-footer__title-group">
              <strong className="gov-footer__brand">SAMUDRA</strong>
              <span className="gov-footer__tag">Ocean Intelligence Platform</span>
            </div>
            <p className="gov-footer__desc">
              Satellite-Based Subsurface Ocean Temperature Reconstruction system. Resolves vertical ocean thermal structure down to 902 m depth from multi-satellite surface observations.
            </p>
          </div>

          <div className="gov-footer__specs-col">
            <span className="gov-footer__col-heading">DATASET & DOMAIN SPECIFICATIONS</span>
            <ul className="gov-footer__spec-list">
              <li>
                <Compass size={13} className="text-teal" />
                <span><strong>Target Basin:</strong> Bay of Bengal (5.0°N–22.0°N, 80.0°E–100.0°E)</span>
              </li>
              <li>
                <Database size={13} className="text-teal" />
                <span><strong>Spatial Grid:</strong> 69 × 81 (0.25° horizontal resolution)</span>
              </li>
              <li>
                <Info size={13} className="text-teal" />
                <span><strong>Vertical Coverage:</strong> 35 Depth Levels (0.49 m to 902.34 m)</span>
              </li>
              <li>
                <Award size={13} className="text-teal" />
                <span><strong>Temporal Span:</strong> 1 June – 31 August 2023 (92 Daily Reconstructions)</span>
              </li>
            </ul>
          </div>

          <div className="gov-footer__disclaimer-col">
            <span className="gov-footer__col-heading">RESEARCH-USE LIMITATIONS & CITATIONS</span>
            <div className="gov-disclaimer-box">
              <ShieldAlert size={16} className="text-amber" />
              <p>
                <strong>Scientific Research Model:</strong> Evaluated against held-out GLORYS12 reanalysis and independent in-situ ARGO profiling floats. This platform provides retrospective diagnostic reconstructions and is <strong>not</strong> an operational real-time forecasting product.
              </p>
            </div>
          </div>
        </div>

        <div className="gov-footer__subbar">
          <span>SAMUDRA Platform · Ocean Intelligence Research Platform · Retrospective Reconstructions</span>
          <span>Validated on CMEMS GLORYS12 & INCOIS / Coriolis ARGO In-Situ Profiles</span>
        </div>
      </footer>
    </div>
  )
}

export default App
