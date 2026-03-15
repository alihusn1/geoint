import api from './api'

export async function getAircraftLive(bbox: string) {
  // OpenSky / backend can be slow for large bboxes; allow 60s
  return api.get('/aircraft/live', { params: { bbox }, timeout: 60_000 }) as any
}

export async function getSatelliteCatalog(category?: string) {
  // Satellite catalog can be large (~3k items from CelesTrak); allow 60s
  return api.get('/satellites/catalog', {
    params: category ? { category } : {},
    timeout: 60_000,
  }) as any
}

export async function getSatelliteTrack(noradId: number, minutes = 90) {
  return api.get('/satellites/track', { params: { norad_id: noradId, minutes } }) as any
}

export async function getJammingHeatmap(bbox: string, resolution = 0.5) {
  return api.get('/gps-jamming/heatmap', { params: { bbox, resolution }, timeout: 60_000 }) as any
}

export async function getMaritimeVessels(bbox: string) {
  return api.get('/maritime/vessels', { params: { bbox }, timeout: 60_000 }) as any
}

export async function getAirspaceRestrictions(bbox: string) {
  return api.get('/airspace/restrictions', { params: { bbox }, timeout: 60_000 }) as any
}
