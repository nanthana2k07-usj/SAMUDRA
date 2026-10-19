import type { DepthBandMetric, ValidationMetric } from '../types/ocean'

export const validationMetrics: ValidationMetric[] = [
  { model: 'Climatology', rmse: 0.974168598651886, color: '#65788b', note: 'Training-period mean baseline' },
  { model: 'U-Net', rmse: 0.6544634501139323, color: '#7394a9', note: 'CNN encoder-decoder, 3 seeds' },
  { model: 'SAMUDRA · No Physics', rmse: 0.6280738910039266, color: '#438d9b', note: 'ViT + FNO, 3 seeds' },
  { model: 'SAMUDRA · Constraints', rmse: 0.6333952943483988, color: '#39899a', note: 'ViT + FNO, constraint losses, 3 seeds' },
  { model: 'SAMUDRA · Cyclone', rmse: 0.6256081064542135, color: '#63dfd1', note: 'ViT + FNO, cyclone-aware, 3 seeds' },
]

export const argoDepthBands: DepthBandMetric[] = [
  { band: '0–10 m', rmse: 0.4909198592231554, spread: 0.05612308638789731, points: 137 },
  { band: '10–50 m', rmse: 1.295470024805802, spread: 0.07272155692826572, points: 125 },
  { band: '50–100 m', rmse: 1.84251401291992, spread: 0.4197440001060817, points: 154 },
  { band: '100–200 m', rmse: 1.382823628929971, spread: 0.2320531186709184, points: 321 },
  { band: '200–500 m', rmse: 0.3020661237232501, spread: 0.02860518202930406, points: 511 },
  { band: '500–950 m', rmse: 0.2366188616705459, spread: 0.006236349805379913, points: 521 },
]
