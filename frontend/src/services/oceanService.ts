import type { OceanGrid, OceanDataProvider } from '../types/ocean'

const DEMO_ARTIFACT_URL = '/data/ocean-demo.data'

function isOceanGrid(payload: unknown): payload is OceanGrid {
  if (!payload || typeof payload !== 'object') return false
  const grid = payload as Partial<OceanGrid>
  const shape = grid.gridShape
  if (
    !Array.isArray(shape) || shape.length !== 4 ||
    !Array.isArray(grid.dates) || !Array.isArray(grid.depths) ||
    !Array.isArray(grid.latitudes) || !Array.isArray(grid.longitudes) ||
    !Array.isArray(grid.temperature) || !Array.isArray(grid.uncertainty) ||
    !Array.isArray(grid.reference) || !Array.isArray(grid.caseStudy)
  ) return false
  const expectedLength = shape.reduce((size, dimension) => size * dimension, 1)
  return shape[0] === grid.dates.length &&
    shape[1] === grid.depths.length &&
    shape[2] === grid.latitudes.length &&
    shape[3] === grid.longitudes.length &&
    grid.temperature.length === expectedLength &&
    grid.uncertainty.length === expectedLength &&
    grid.reference.length === expectedLength &&
    grid.dates.length > 0 && grid.depths.length > 0 &&
    grid.latitudes.length > 0 && grid.longitudes.length > 0
}

/**
 * High-quality synthetic ocean grid generator for robust frontend fallback.
 * Generates a realistic 3D Bay of Bengal spatial temperature field (5°N–22°N, 80°E–100°E).
 */
/**
 * High-quality deterministic synthetic ocean grid generator for offline / fallback presentation.
 * Generates a realistic 3D Bay of Bengal spatial temperature field (5°N–22°N, 80°E–100°E).
 * Grid dimensions match the 18×21 (1.0° resolution) core format with realistic land mask.
 */
export function createSyntheticDemoGrid(): OceanGrid {
  const dates: string[] = []
  const startDate = new Date(2023, 5, 1) // June 1, 2023
  for (let i = 0; i < 92; i += 1) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  const depths = [
    0.494, 1.541, 2.646, 3.819, 5.078, 6.443, 7.929, 9.557, 11.353, 13.346,
    15.572, 18.077, 20.916, 24.161, 27.896, 32.227, 37.288, 43.253, 50.334, 58.795,
    68.966, 81.259, 96.184, 114.372, 136.568, 163.633, 196.533, 236.319, 284.116, 341.018,
    408.067, 486.208, 576.275, 718.528, 902.339,
  ]

  const latitudes: number[] = []
  for (let lat = 5.0; lat <= 22.01; lat += 1.0) {
    latitudes.push(Number(lat.toFixed(1)))
  }

  const longitudes: number[] = []
  for (let lon = 80.0; lon <= 100.01; lon += 1.0) {
    longitudes.push(Number(lon.toFixed(1)))
  }

  const shape: [number, number, number, number] = [
    dates.length,
    depths.length,
    latitudes.length,
    longitudes.length,
  ]

  // Approximate Bay of Bengal land mask for 18 lats (5-22N) x 21 lons (80-100E)
  // 1 = water, 0 = land
  const waterMask: number[][] = [
    // 5N: 80-95 water, 96-98 land (Sumatra tip), 99-100 water
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1],
    // 6N
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // 7N: Sri Lanka at 80-81
    [0,0,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0,0],
    // 8N: Sri Lanka at 80-81
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    // 9N: Sri Lanka at 80
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    // 10N
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    // 11N
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    // 12N
    [0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,0,0,0],
    // 13N
    [0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0],
    // 14N: India east coast at 80
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    // 15N
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    // 16N: India east coast at 80-81
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0],
    // 17N: India at 80-82
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
    // 18N: India at 80-83
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    // 19N: India at 80-85
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
    // 20N: Odisha at 80-86
    [0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
    // 21N: West Bengal / Bangladesh delta
    [0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
    // 22N: Continental landmass
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ]

  const totalSize = shape[0] * shape[1] * shape[2] * shape[3]
  const temperature: Array<number | null> = new Array(totalSize)
  const uncertainty: Array<number | null> = new Array(totalSize)
  const reference: Array<number | null> = new Array(totalSize)

  let idx = 0
  for (let t = 0; t < dates.length; t += 1) {
    const timeFactor = Math.sin((t / 92) * Math.PI * 2) * 0.4
    for (let d = 0; d < depths.length; d += 1) {
      const depth = depths[d]
      for (let y = 0; y < latitudes.length; y += 1) {
        const lat = latitudes[y]
        const isWaterRow = waterMask[y] ?? []
        for (let x = 0; x < longitudes.length; x += 1) {
          const lon = longitudes[x]
          const isWater = isWaterRow[x] === 1

          if (!isWater) {
            temperature[idx] = null
            uncertainty[idx] = null
            reference[idx] = null
          } else {
            // Realistic physical temperature distribution across Bay of Bengal
            const sst = 29.2 - 0.05 * (lat - 5) + 0.02 * (lon - 80) + timeFactor
            const temp = 6.2 + (sst - 6.2) * Math.exp(-depth / 165.0)
            const uncert = 0.15 + 0.45 * Math.exp(-Math.pow(depth - 85, 2) / 12000.0)
            const ref = temp + 0.08 * Math.sin(depth / 35.0)

            temperature[idx] = Number(temp.toFixed(2))
            uncertainty[idx] = Number(uncert.toFixed(2))
            reference[idx] = Number(ref.toFixed(2))
          }
          idx += 1
        }
      }
    }
  }

  return {
    gridShape: shape,
    dates,
    depths,
    latitudes,
    longitudes,
    temperature,
    uncertainty,
    reference,
    caseStudy: [],
    source: 'SAMUDRA Synthetic Demo Generator',
    displayNote: 'Procedural 3D thermal grid fallback for standalone browser presentation',
    isFallback: true,
  }
}

async function parseDemoArtifact(response: Response): Promise<OceanGrid> {
  if (!response.ok) {
    throw new Error(`Could not load precomputed artifact (${response.status}).`)
  }
  if (!('DecompressionStream' in globalThis)) {
    throw new Error('DecompressionStream unsupported.')
  }
  const decompressed = response.body?.pipeThrough(new DecompressionStream('gzip'))
  if (!decompressed) throw new Error('Artifact response empty.')
  const payload: unknown = await new Response(decompressed).json()
  if (!isOceanGrid(payload)) {
    throw new Error('Unsupported artifact structure.')
  }
  return payload
}

export class DemoDataProvider implements OceanDataProvider {
  async getOceanGrid(signal?: AbortSignal): Promise<OceanGrid> {
    try {
      const response = await fetch(DEMO_ARTIFACT_URL, { signal })
      return await parseDemoArtifact(response)
    } catch (err) {
      console.warn('SAMUDRA: Loading synthetic demo grid fallback.', err)
      return createSyntheticDemoGrid()
    }
  }
}

export class ArtifactDataProvider implements OceanDataProvider {
  private readonly artifactUrl: string

  constructor(artifactUrl: string) {
    this.artifactUrl = artifactUrl
  }

  async getOceanGrid(signal?: AbortSignal): Promise<OceanGrid> {
    try {
      const response = await fetch(this.artifactUrl, { signal })
      return await parseDemoArtifact(response)
    } catch (err) {
      console.warn('SAMUDRA: Loading synthetic artifact grid fallback.', err)
      return createSyntheticDemoGrid()
    }
  }
}

export class ApiDataProvider implements OceanDataProvider {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  async getOceanGrid(signal?: AbortSignal): Promise<OceanGrid> {
    try {
      const response = await fetch(this.apiUrl, {
        signal,
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }
      const payload: unknown = await response.json()
      if (!isOceanGrid(payload)) {
        throw new Error('Invalid grid from API')
      }
      return payload
    } catch (err) {
      console.warn('SAMUDRA: API unavailable, using synthetic demo grid fallback.', err)
      return createSyntheticDemoGrid()
    }
  }
}

const apiUrl = import.meta.env.VITE_OCEAN_GRID_API_URL?.trim()
export const oceanService: OceanDataProvider = apiUrl
  ? new ApiDataProvider(apiUrl)
  : new DemoDataProvider()
