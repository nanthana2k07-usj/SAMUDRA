import type { ArgoPoint } from '../types/ocean'

export interface ArgoStats {
  rmse: number
  bestSeedRmse: number
  mae: number
  bias: number
  rSquared: number
  correlation: number
  testProfiles: number
  testPoints: number
  allProfiles: number
  allPoints: number
}

export const argoStats: ArgoStats = {
  rmse: 0.910,
  bestSeedRmse: 0.753,
  mae: 0.479,
  bias: 0.082,
  rSquared: 0.989,
  correlation: 0.995,
  testProfiles: 17,
  testPoints: 1769,
  allProfiles: 106,
  allPoints: 13364,
}

// Generate realistic ARGO matched scatter points spanning 5°C to 29°C temperature range
export const argoScatterPoints: ArgoPoint[] = Array.from({ length: 85 }).map((_, i) => {
  // Generate realistic temperatures across water column
  const t = i / 85
  // Temperature decreases with depth from ~29°C to ~6°C
  const observed = 29.5 - Math.pow(t, 0.7) * 23.5 + (Math.sin(i * 3.7) * 0.4)
  // Reconstructed value with slight noise centered around +0.082°C bias
  const noise = (Math.cos(i * 2.1 + 0.5) * 0.42) + (Math.sin(i * 5.3) * 0.25)
  const reconstructed = observed + 0.082 + noise
  const depth = Math.round(5 + t * 880)

  return {
    id: `argo-${i + 1}`,
    lat: Number((6 + (i * 0.18) % 15).toFixed(2)),
    lon: Number((81 + (i * 0.22) % 17).toFixed(2)),
    depth,
    observed: Number(observed.toFixed(2)),
    reconstructed: Number(reconstructed.toFixed(2)),
    date: `2023-08-${16 + (i % 16)}`,
  }
})
