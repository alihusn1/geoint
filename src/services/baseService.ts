import api from './api'

export interface BaseFilterParams {
  country?: string
  type?: string
  branch?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}

// GET /bases — returns { total, bases, filters }
export async function getBases(params?: BaseFilterParams) {
  const res: any = await api.get('/bases', { params })
  return res
}

// GET /bases/:id — returns BaseDetailResponse
export async function getBase(id: string) {
  const res: any = await api.get(`/bases/${id}`)
  return res
}

// GET /bases/:id/nearby-events
export async function getNearbyEvents(id: string, radiusKm = 200) {
  const res: any = await api.get(`/bases/${id}/nearby-events`, {
    params: { radius_km: radiusKm },
  })
  return res
}

// GET /bases/countries — returns CountryInfo[]
export async function getCountries() {
  const res: any = await api.get('/bases/countries')
  return res
}

// GET /bases/export — returns blob
export async function exportGeoJSON(params?: BaseFilterParams) {
  const res = await api.get('/bases/export', {
    params: { ...params, format: 'geojson' },
    responseType: 'blob',
  } as any)
  return res
}
