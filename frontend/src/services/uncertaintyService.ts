import type { UncertaintyDataProvider, UncertaintyMetric } from '../types/ocean'
import { uncertaintyMetrics } from '../data/uncertaintyData'

export const uncertaintyService: UncertaintyDataProvider = {
  async getUncertaintyMetrics(): Promise<UncertaintyMetric[]> {
    return uncertaintyMetrics
  },
}
