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
  category: 'commercial' | 'military' | 'emergency' | 'unknown'
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

export type LiveLayerName =
  | 'aircraft'
  | 'satellites'
  | 'gpsJamming'
  | 'maritime'
  | 'airspace'
  | 'strikes'

export interface LayerState<T> {
  enabled: boolean
  data: T[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}
