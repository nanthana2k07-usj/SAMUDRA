/**
 * Physical oceanography derivations for SAMUDRA.
 * Implements standard oceanographic products derived from 35-level vertical temperature profiles:
 * - D26: Depth of the 26°C isotherm (m)
 * - D20: Depth of the 20°C isotherm (m)
 * - TCHP: Tropical Cyclone Heat Potential (kJ/cm²)
 * - MLD: Mixed Layer Depth (m) using 0.5°C threshold from 10m reference
 */

import type { OceanGrid } from '../types/ocean'
import { getGridIndex } from '../data/oceanData'

export const RHO0 = 1025.0 // Reference seawater density (kg/m^3)
export const CP = 3990.0   // Specific heat capacity of seawater (J / (kg * K))

/**
 * Computes layer thickness (dz in metres) for given depth levels.
 * Uses cell boundary midpoint integration consistent with GLORYS12 coordinate grids.
 */
export function calculateLayerThickness(depths: number[]): number[] {
  const n = depths.length
  if (n === 0) return []
  if (n === 1) return [depths[0] * 2 || 1.0]

  const edges: number[] = [0.0]
  for (let i = 0; i < n - 1; i += 1) {
    edges.push(0.5 * (depths[i] + depths[i + 1]))
  }
  edges.push(depths[n - 1] + 0.5 * (depths[n - 1] - depths[n - 2]))

  const dz: number[] = []
  for (let i = 0; i < n; i += 1) {
    dz.push(edges[i + 1] - edges[i])
  }
  return dz
}

/**
 * Calculates isotherm depth for a given target temperature (°C) via downward linear interpolation.
 * Returns null if column is land/invalid, 0 if surface is already colder than target,
 * or null if column never drops below the isotherm.
 */
export function calculateIsothermDepth(
  temperatures: Array<number | null>,
  depths: number[],
  isothermTemp: number,
): number | null {
  if (!temperatures || temperatures.length === 0 || temperatures[0] === null) {
    return null
  }

  // Surface colder than target isotherm
  if (temperatures[0] < isothermTemp) {
    return 0.0
  }

  for (let k = 1; k < temperatures.length; k += 1) {
    const t0 = temperatures[k - 1]
    const t1 = temperatures[k]

    if (t0 === null || t1 === null) continue

    if (t0 >= isothermTemp && t1 <= isothermTemp) {
      if (t0 === t1) return depths[k - 1]
      const fraction = (t0 - isothermTemp) / (t0 - t1)
      const d = depths[k - 1] + fraction * (depths[k] - depths[k - 1])
      return Number(d.toFixed(2))
    }
  }

  // Column never drops below isotherm (censored warm column)
  return null
}

/**
 * Calculates Tropical Cyclone Heat Potential (TCHP in kJ/cm²).
 * Formula: Q = rho0 * cp * integral(max(T - 26, 0) * dz) / 1e7
 */
export function calculateTCHP(
  temperatures: Array<number | null>,
  depths: number[],
  dz?: number[],
): number | null {
  if (!temperatures || temperatures.length === 0 || temperatures[0] === null) {
    return null
  }

  const layerDz = dz ?? calculateLayerThickness(depths)
  let sumJoulesPerM2 = 0.0
  let validPoints = 0

  for (let k = 0; k < temperatures.length; k += 1) {
    const temp = temperatures[k]
    if (temp === null || Number.isNaN(temp)) continue

    validPoints += 1
    if (temp > 26.0) {
      const deltaT = temp - 26.0
      const layerThickness = layerDz[k] ?? 1.0
      sumJoulesPerM2 += RHO0 * CP * deltaT * layerThickness
    }
  }

  if (validPoints === 0) return null

  // Convert J/m^2 to kJ/cm^2: 1 kJ/cm^2 = 1e7 J/m^2
  const tchpKJcm2 = sumJoulesPerM2 / 1e7
  return Number(tchpKJcm2.toFixed(2))
}

/**
 * Calculates Mixed Layer Depth (MLD in metres).
 * Defined by standard oceanographic criterion: depth where temperature drops by 0.5°C
 * relative to the reference temperature at 10 m depth.
 */
export function calculateMLD(
  temperatures: Array<number | null>,
  depths: number[],
  threshold = 0.5,
): number | null {
  if (!temperatures || temperatures.length === 0 || temperatures[0] === null) {
    return null
  }

  // Find index closest to 10m depth
  let k10 = 0
  let minDiff = Infinity
  for (let i = 0; i < depths.length; i += 1) {
    const diff = Math.abs(depths[i] - 10.0)
    if (diff < minDiff) {
      minDiff = diff
      k10 = i
    }
  }

  const refTemp = temperatures[k10]
  if (refTemp === null || Number.isNaN(refTemp)) {
    return null
  }

  const targetTemp = refTemp - threshold

  for (let k = k10 + 1; k < temperatures.length; k += 1) {
    const t0 = temperatures[k - 1]
    const t1 = temperatures[k]

    if (t0 === null || t1 === null) continue

    if (t0 >= targetTemp && t1 <= targetTemp) {
      if (t0 === t1) return depths[k - 1]
      const fraction = (t0 - targetTemp) / (t0 - t1)
      const d = depths[k - 1] + fraction * (depths[k] - depths[k - 1])
      return Number(d.toFixed(2))
    }
  }

  return null
}

export interface CellOceanProducts {
  sst: number | null
  d26: number | null
  d20: number | null
  tchp: number | null
  mld: number | null
}

/**
 * Computes all four physical products for a single grid point on a given date.
 */
export function computeCellProducts(
  grid: OceanGrid,
  dateIndex: number,
  latitudeIndex: number,
  longitudeIndex: number,
): CellOceanProducts {
  const columnTemps: Array<number | null> = []
  for (let d = 0; d < grid.depths.length; d += 1) {
    const idx = getGridIndex(grid, dateIndex, d, latitudeIndex, longitudeIndex)
    columnTemps.push(grid.temperature[idx] ?? null)
  }

  const sst = columnTemps[0] !== undefined && columnTemps[0] !== null ? Number(columnTemps[0].toFixed(2)) : null
  const d26 = calculateIsothermDepth(columnTemps, grid.depths, 26.0)
  const d20 = calculateIsothermDepth(columnTemps, grid.depths, 20.0)
  const tchp = calculateTCHP(columnTemps, grid.depths)
  const mld = calculateMLD(columnTemps, grid.depths)

  return { sst, d26, d20, tchp, mld }
}
