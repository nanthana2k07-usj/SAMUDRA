import type { DepthBandMetric, ValidationDataProvider, ValidationMetric } from '../types/ocean'
import { argoDepthBands, validationMetrics } from '../data/validationData'

export const validationService: ValidationDataProvider = {
  async getValidationMetrics(): Promise<ValidationMetric[]> {
    return validationMetrics
  },
  async getDepthBandMetrics(): Promise<DepthBandMetric[]> {
    return argoDepthBands
  },
}
