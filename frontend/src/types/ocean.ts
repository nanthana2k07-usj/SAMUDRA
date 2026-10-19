export type DisplayMode = 'temperature' | 'uncertainty' | 'sst' | 'd26' | 'd20' | 'tchp' | 'mld'

export type PageKey =
  | 'overview'
  | 'explore'
  | 'temperature'
  | 'ocean-intelligence'
  | 'cyclone-analysis'
  | 'validation'
  | 'uncertainty'
  | 'technical'

export type MapVariable =
  | 'reconstructed'
  | 'surface'
  | 'subsurface'
  | 'd26'
  | 'd20'
  | 'tchp'
  | 'mld'
  | 'uncertainty'

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface OceanGrid {
  dates: string[]
  depths: number[]
  latitudes: number[]
  longitudes: number[]
  gridShape: [number, number, number, number]
  temperature: Array<number | null>
  uncertainty: Array<number | null>
  reference: Array<number | null>
  caseStudy: CaseStudyPoint[]
  source: string
  displayNote: string
  isFallback?: boolean
}

export interface TemperatureProfilePoint {
  depth: number
  estimate: number | null
  uncertainty: number | null
  reference: number | null
  lower: number | null
  upper: number | null
}

export interface ValidationMetric {
  model: string
  rmse: number
  color: string
  note: string
}

export interface DepthBandMetric {
  band: string
  rmse: number
  spread: number
  points: number
}

export interface UncertaintyMetric {
  nominal: number
  glorys: number
  argoSigma: number
  argoRepresentativeness: number
}

export interface CycloneMetric {
  key: 'TCHP' | 'D26' | 'D20' | 'MLD'
  label: string
  value: number
  unit: string
  baseline: number
  description: string
}

export interface CaseStudyPoint {
  date: string
  SST_satellite: number
  MLD_m_glorys: number
  MLD_m_model: number
  MLD_m_model_spread: number
  D26_m_glorys: number
  D26_m_model: number
  D26_m_model_spread: number
  TCHP_kJcm2_glorys: number
  TCHP_kJcm2_model: number
  TCHP_kJcm2_model_spread: number
}

export interface OceanStateProduct {
  key: 'sst' | 'mld' | 'd26' | 'd20' | 'tchp'
  label: string
  unit: string
  color: string
  referenceKey: keyof CaseStudyPoint | null
  estimateKey: keyof CaseStudyPoint | null
  spreadKey: keyof CaseStudyPoint | null
}

export interface SelectedOceanPoint extends GeoPoint {
  latitudeIndex: number
  longitudeIndex: number
}

export interface ArgoPoint {
  id: string
  lat: number
  lon: number
  depth: number
  observed: number
  reconstructed: number
  date: string
}

export interface OceanDataProvider {
  getOceanGrid(signal?: AbortSignal): Promise<OceanGrid>
}

export interface ValidationDataProvider {
  getValidationMetrics(): Promise<ValidationMetric[]>
  getDepthBandMetrics(): Promise<DepthBandMetric[]>
}

export interface UncertaintyDataProvider {
  getUncertaintyMetrics(): Promise<UncertaintyMetric[]>
}

export interface CycloneDataProvider {
  getCycloneMetrics(): Promise<CycloneMetric[]>
}

export interface DashboardDataProvider
  extends OceanDataProvider,
    ValidationDataProvider,
    UncertaintyDataProvider,
    CycloneDataProvider {}
