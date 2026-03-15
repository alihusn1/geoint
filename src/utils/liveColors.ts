import type { LiveLayerName, AircraftState, VesselState, SatellitePosition } from '@/types/live'

export const LAYER_COLORS: Record<LiveLayerName, string> = {
  aircraft: '#00B4D8',
  satellites: '#9B5DE5',
  gpsJamming: '#E63946',
  maritime: '#4D78B3',
  airspace: '#F77F00',
  strikes: '#E63946',
}

const AIRCRAFT_CATEGORY_COLORS: Record<AircraftState['category'], string> = {
  commercial: '#00B4D8',
  military: '#F77F00',
  emergency: '#E63946',
  unknown: '#94A3B8',
}

const VESSEL_TYPE_COLORS: Record<VesselState['vesselType'], string> = {
  tanker: '#E63946',
  cargo: '#F77F00',
  military: '#00B4D8',
  passenger: '#2A9D8F',
  fishing: '#94A3B8',
  unknown: '#6B7280',
}

export function getAircraftColor(category: AircraftState['category']): string {
  return AIRCRAFT_CATEGORY_COLORS[category] ?? '#94A3B8'
}

export function getVesselColor(vesselType: VesselState['vesselType']): string {
  return VESSEL_TYPE_COLORS[vesselType] ?? '#6B7280'
}

const SATELLITE_CATEGORY_COLORS: Record<SatellitePosition['category'], string> = {
  military: '#E63946',
  recon: '#D62828',
  stations: '#FFD166',
  station: '#FFD166',
  'gps-ops': '#F77F00',
  navigation: '#F77F00',
  weather: '#2A9D8F',
  comms: '#00B4D8',
  science: '#9B5DE5',
  other: '#94A3B8',
}

export function getSatelliteColor(category: SatellitePosition['category']): string {
  return SATELLITE_CATEGORY_COLORS[category] ?? '#94A3B8'
}
