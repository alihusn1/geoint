import type { LiveLayerName, AircraftState, VesselState, SatellitePosition } from '@/types/live'

export const LAYER_COLORS: Record<LiveLayerName, string> = {
  aircraft: '#00B4D8',
  flightaware: '#2ECC71',
  satellites: '#9B5DE5',
  gpsJamming: '#E63946',
  maritime: '#4D78B3',
  marinetraffic: '#2ECC71',
  airspace: '#F77F00',
  strikes: '#E63946',
  frontlines: '#EF4444',
}

const AIRCRAFT_CATEGORY_COLORS: Record<AircraftState['category'], string> = {
  commercial: '#00B4D8',
  military: '#F77F00',
  emergency: '#E63946',
  government: '#9B5DE5',
  head_of_state: '#FFD166',
  unknown: '#94A3B8',
}

// FlightAware aircraft use green-tinted variants so they're visually distinct from ADS-B
const FLIGHTAWARE_CATEGORY_COLORS: Record<AircraftState['category'], string> = {
  commercial: '#2ECC71',
  military: '#27AE60',
  emergency: '#E74C3C',
  government: '#1ABC9C',
  head_of_state: '#A3E635',
  unknown: '#6EE7B7',
}

const VESSEL_TYPE_COLORS: Record<VesselState['vesselType'], string> = {
  tanker: '#E63946',
  cargo: '#F77F00',
  military: '#00B4D8',
  passenger: '#2A9D8F',
  fishing: '#94A3B8',
  unknown: '#6B7280',
}

// MarineTraffic vessels use distinct colors from AIS to visually separate the two layers
const MARINETRAFFIC_TYPE_COLORS: Record<VesselState['vesselType'], string> = {
  cargo: '#2ECC71',     // green (like MarineTraffic.com)
  tanker: '#E63946',    // red
  passenger: '#9B5DE5', // purple
  fishing: '#7FD17F',   // light green
  military: '#00B4D8',  // cyan
  unknown: '#94A3B8',   // gray
}

export function getMarineTrafficVesselColor(vesselType: VesselState['vesselType']): string {
  return MARINETRAFFIC_TYPE_COLORS[vesselType] ?? '#94A3B8'
}

export function getAircraftColor(category: AircraftState['category'], source?: 'adsb' | 'flightaware'): string {
  if (source === 'flightaware') return FLIGHTAWARE_CATEGORY_COLORS[category] ?? '#6EE7B7'
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
