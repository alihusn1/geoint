export type EventSource = 'satellite' | 'sigint' | 'social' | 'maritime' | 'cyber' | 'nuclear' | 'twitter' | 'grok_search' | 'gdelt_enhanced' | 'trends' | 'deep_analysis' | 'firms' | 'usgs' | 'ioda' | 'strike_watch'

export type EventCategory =
  | 'military_movement'
  | 'naval_activity'
  | 'air_activity'
  | 'missile_test'
  | 'cyber_attack'
  | 'nuclear'
  | 'political'
  | 'humanitarian'
  | 'thermal_anomaly'
  | 'seismic'
  | 'infrastructure'
  | 'disaster'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface EventMetadata {
  // GDELT fields
  goldstein_scale?: number
  avg_tone?: number
  num_mentions?: number
  actor1_name?: string
  actor2_name?: string
  cameo_code?: string
  quad_class?: number
  // Deep analysis fields
  ai_summary?: string
  ai_relevance_score?: number
  ai_event_type?: string
  ai_rationale?: string
  pakistan_impact_analysis?: string
  ai_pakistan_impact_score?: number
  // Grok / Trends shared fields
  actors?: Array<{ name: string; type?: string; role?: string; country_affiliation?: string } | string>
  tags?: string[]
  confidence?: string
  domain?: string
  theater?: string
  pakistan_impact_score?: number
  pakistan_impact_rationale?: string
  source_urls?: string[]
  // Grok-specific
  weapons_systems?: Array<{ name: string; type?: string; nato_designation?: string; origin_country?: string }>
  impacts?: Array<{ location?: string; type?: string; severity?: string; description?: string }>
  raw_source_snippet?: string
  source_reliability?: string
  // Trends-specific
  trending_score?: number
  // Strike Watch fields
  event_type?: string
  weapon_type?: string
  casualties?: string
  source_country?: { country?: string; country_code?: string; latitude?: number; longitude?: number }
  // catch-all
  [key: string]: unknown
}

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
  // Source / target geo (from agent scrapers)
  sourceLocation: string | null
  sourceLat: number | null
  sourceLng: number | null
  sourceCountryCode: string | null
  targetLocation: string | null
  targetLat: number | null
  targetLng: number | null
  targetCountryCode: string | null
  // Enriched metadata from backend
  metadata: EventMetadata | null
}
