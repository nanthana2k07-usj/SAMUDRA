import type { DisplayMode, MapVariable, OceanGrid, PageKey, SelectedOceanPoint } from '../types/ocean'

export interface PageProps {
  grid: OceanGrid
  dateIndex: number
  setDateIndex: (index: number) => void
  depthIndex: number
  setDepthIndex: (index: number) => void
  selected: SelectedOceanPoint
  setSelected: (point: SelectedOceanPoint) => void
  mode: DisplayMode
  setMode: (mode: DisplayMode) => void
  onNavigate: (page: PageKey) => void
}

export type { DisplayMode, MapVariable, PageKey }

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', options)
}
