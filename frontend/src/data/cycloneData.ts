import type { CycloneMetric, OceanStateProduct } from '../types/ocean'

export const cycloneMetrics: CycloneMetric[] = [
  {
    key: 'TCHP',
    label: 'Tropical cyclone heat potential',
    value: 13.346829343792173,
    unit: 'kJ/cm² RMSE',
    baseline: 21.483248406052855,
    description: 'Held-out GLORYS test · ensemble mean across 3 seeds',
  },
  {
    key: 'D26',
    label: '26°C isotherm depth',
    value: 8.356435863906929,
    unit: 'm RMSE',
    baseline: 14.945309761029375,
    description: 'Held-out GLORYS test · ensemble mean across 3 seeds',
  },
  {
    key: 'D20',
    label: '20°C isotherm depth',
    value: 9.142209625664167,
    unit: 'm RMSE',
    baseline: 17.14087248697346,
    description: 'Held-out GLORYS test · ensemble mean across 3 seeds',
  },
  {
    key: 'MLD',
    label: 'Mixed layer depth',
    value: 11.81929355671124,
    unit: 'm RMSE',
    baseline: 12.286312738185313,
    description: 'Small difference; not established as a meaningful improvement',
  },
]

export const caseStudyProducts: OceanStateProduct[] = [
  { key: 'sst', label: 'Satellite SST', unit: '°C', color: '#ffb566', referenceKey: null, estimateKey: 'SST_satellite', spreadKey: null },
  { key: 'tchp', label: 'TCHP', unit: 'kJ/cm²', color: '#64ddd0', referenceKey: 'TCHP_kJcm2_glorys', estimateKey: 'TCHP_kJcm2_model', spreadKey: 'TCHP_kJcm2_model_spread' },
  { key: 'd26', label: 'D26', unit: 'm', color: '#79a9ff', referenceKey: 'D26_m_glorys', estimateKey: 'D26_m_model', spreadKey: 'D26_m_model_spread' },
  { key: 'mld', label: 'MLD', unit: 'm', color: '#d39af4', referenceKey: 'MLD_m_glorys', estimateKey: 'MLD_m_model', spreadKey: 'MLD_m_model_spread' },
]
