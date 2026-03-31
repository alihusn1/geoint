// ── Live OSINT Tracking Layer Types ──

export interface AircraftState {
  icao24: string
  callsign: string
  originCountry: string
  lat: number
  lng: number
  altitude: number
  velocity: number
  heading: number
  verticalRate: number
  onGround: boolean
  lastContact: number
  squawk: string | null
  category: 'commercial' | 'military' | 'emergency' | 'government' | 'head_of_state' | 'unknown'
  // Plane-Alert enrichment fields
  registration?: string
  operator?: string
  operatorCategory?: string
  aircraftType?: string
  trail?: [number, number][] // [lat, lng][]
}

export interface SatellitePosition {
  noradId: number
  name: string
  lat: number
  lng: number
  altKm: number
  velocity: number
  category: 'military' | 'recon' | 'stations' | 'station' | 'gps-ops' | 'navigation' | 'weather' | 'comms' | 'science' | 'other'
  color: string
  orbitPath?: [number, number][] // [lat, lng][]
  footprintRadius?: number
}

export interface JammingPoint {
  lat: number
  lng: number
  intensity: number // 0-1
}

export interface VesselState {
  mmsi: string
  name: string
  lat: number
  lng: number
  heading: number
  speed: number
  vesselType: 'tanker' | 'cargo' | 'military' | 'passenger' | 'fishing' | 'unknown'
  destination: string | null
  // Extra MarineTraffic fields
  status?: string
  length?: number
  width?: number
  typeName?: string
  // Yacht-Alert enrichment fields
  owner?: string
  ownerCategory?: string
  flagCountry?: string
  imo?: string
  trail?: [number, number][] // [lat, lng][]
}

export interface AirspaceRestriction {
  id: string
  type: 'TFR' | 'NOTAM' | 'MOA' | 'PROHIBITED' | 'RESTRICTED' | 'CONFLICT_ZONE'
  label: string
  geometry: number[][][] // GeoJSON polygon coordinates
  fillColor: string
  strokeColor: string
  effective: string | null
}

export interface StrikeEvent {
  id: string
  lat: number
  lng: number
  timestamp: string
  eventType: string
  confidence: number
  source: string
  description: string
  blastRadiusKm: number
  origin: { lat: number; lng: number; label: string } | null
  sources: string[]
}

export interface FrontlineData {
  id: number
  source: string
  date: string
  geojson: object
  fetchedAt: string | null
}

export type LiveLayerName =
  | 'aircraft'
  | 'flightaware'
  | 'satellites'
  | 'gpsJamming'
  | 'maritime'
  | 'marinetraffic'
  | 'airspace'
  | 'strikes'
  | 'frontlines'

export interface LayerState<T> {
  enabled: boolean
  data: T[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}
