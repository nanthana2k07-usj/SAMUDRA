import type { CycloneDataProvider, CycloneMetric } from '../types/ocean'
import { cycloneMetrics } from '../data/cycloneData'

export const cycloneService: CycloneDataProvider = {
  async getCycloneMetrics(): Promise<CycloneMetric[]> {
    return cycloneMetrics
  },
}
