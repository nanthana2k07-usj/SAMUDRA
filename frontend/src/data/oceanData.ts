import type { DashboardDataProvider, OceanGrid } from '../types/ocean'
import { oceanService } from '../services/oceanService'
import { cycloneMetrics } from './cycloneData'
import { uncertaintyMetrics } from './uncertaintyData'
import { argoDepthBands, validationMetrics } from './validationData'

export const demoDataProvider: DashboardDataProvider = {
  getOceanGrid: (signal?: AbortSignal) => oceanService.getOceanGrid(signal),
  getValidationMetrics: async () => validationMetrics,
  getDepthBandMetrics: async () => argoDepthBands,
  getUncertaintyMetrics: async () => uncertaintyMetrics,
  getCycloneMetrics: async () => cycloneMetrics,
}

export function getGridIndex(
  grid: OceanGrid,
  timeIndex: number,
  depthIndex: number,
  latitudeIndex: number,
  longitudeIndex: number,
): number {
  const [, depthCount, latitudeCount, longitudeCount] = grid.gridShape
  return ((timeIndex * depthCount + depthIndex) * latitudeCount + latitudeIndex) * longitudeCount + longitudeIndex
}

export function nearestCoordinateIndex(values: number[], requested: number): number {
  return values.reduce(
    (bestIndex, value, index) =>
      Math.abs(value - requested) < Math.abs(values[bestIndex] - requested) ? index : bestIndex,
    0,
  )
}
