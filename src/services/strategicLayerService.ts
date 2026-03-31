import api from './api'

export async function getAllGeoJSON(): Promise<Record<string, GeoJSON.FeatureCollection>> {
  const res: any = await api.get('/strategic-layers/all/geojson')
  return res
}

export async function getLayerCSV(layerId: string): Promise<{ id: string; columns: string[]; rows: Record<string, unknown>[] }> {
  const res: any = await api.get(`/strategic-layers/${layerId}/csv`)
  return res
}
