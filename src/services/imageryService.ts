import api from './api'

export interface ImagerySearchParams {
  lat: number
  lon: number
  radius_km?: number
  days_back?: number
  max_cloud_cover?: number
  limit?: number
}

export interface ImageryResult {
  id: string
  datetime: string
  cloud_cover: number
  gsd_m: number
  thumbnail_url: string | null
  preview_url: string | null
  visual_url: string | null
  explorer_url: string | null
  bbox: [number, number, number, number] | null
}

export async function searchImagery(params: ImagerySearchParams): Promise<{ count: number; scenes: ImageryResult[] }> {
  return api.get('/imagery/search', { params, timeout: 30_000 }) as any
}
