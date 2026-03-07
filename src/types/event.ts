export type EventSource = 'satellite' | 'sigint' | 'social' | 'maritime' | 'cyber' | 'nuclear' | 'gdelt' | 'rss'

export type EventCategory =
  | 'military_movement'
  | 'naval_activity'
  | 'air_activity'
  | 'missile_test'
  | 'cyber_attack'
  | 'nuclear'
  | 'political'
  | 'humanitarian'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface OSINTEvent {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  category: EventCategory
  severity: Severity
  source: EventSource
  timestamp: string
  verified: boolean
  sourceUrl: string
  relatedBaseIds: string[]
  country: string
  countryCode: string
  // Source / target geo (from GDELT & RSS scrapers)
  sourceLat: number | null
  sourceLng: number | null
  sourceCountryCode: string | null
  targetLat: number | null
  targetLng: number | null
  targetCountryCode: string | null
}
