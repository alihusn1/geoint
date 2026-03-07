import type { MilitaryBase, OSINTEvent } from '@/types'

// Maps backend BaseResponse → frontend MilitaryBase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBase(raw: any): MilitaryBase {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country ?? '',
    countryCode: raw.country_code ?? '',
    lat: raw.latitude,
    lng: raw.longitude,
    type: raw.base_type ?? 'military',
    branch: raw.branch ?? 'Joint',
    status: raw.status ?? 'active',
    personnel: raw.personnel ?? 0,
    description: raw.description ?? '',
    established: raw.created_at ? raw.created_at.slice(0, 10) : '',
    region: raw.region ?? deriveRegion(raw.country_code ?? ''),
  }
}

// Maps backend EventResponse → frontend OSINTEvent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEvent(raw: any): OSINTEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    lat: raw.latitude ?? 0,
    lng: raw.longitude ?? 0,
    category: raw.category ?? 'military_movement',
    severity: raw.severity ?? 'low',
    source: raw.source ?? 'social',
    timestamp: raw.event_timestamp ?? raw.scraped_at ?? new Date().toISOString(),
    verified: raw.verified ?? false,
    sourceUrl: raw.source_url ?? '',
    relatedBaseIds: raw.related_base_ids ?? [],
    country: raw.country ?? '',
    countryCode: raw.country_code ?? '',
    // Source / target geo
    sourceLat: raw.source_lat ?? null,
    sourceLng: raw.source_lon ?? null,
    sourceCountryCode: raw.source_country_code ?? null,
    targetLat: raw.target_lat ?? null,
    targetLng: raw.target_lon ?? null,
    targetCountryCode: raw.target_country_code ?? null,
  }
}

// Map arrays
export function mapBases(raw: unknown[]): MilitaryBase[] {
  return raw.map(mapBase)
}

export function mapEvents(raw: unknown[]): OSINTEvent[] {
  return raw.map(mapEvent)
}

// Derive region from country code when backend doesn't provide it
const REGION_MAP: Record<string, string> = {
  // Middle East
  QA: 'Middle East', BH: 'Middle East', KW: 'Middle East', AE: 'Middle East',
  OM: 'Middle East', SA: 'Middle East', IQ: 'Middle East', JO: 'Middle East',
  IL: 'Middle East', TR: 'Middle East', DJ: 'Middle East',
  // East Asia
  JP: 'East Asia', KR: 'East Asia', CN: 'East Asia', TW: 'East Asia',
  MN: 'East Asia',
  // Europe
  DE: 'Europe', GB: 'Europe', IT: 'Europe', ES: 'Europe', GR: 'Europe',
  PL: 'Europe', RO: 'Europe', BG: 'Europe', NO: 'Europe', NL: 'Europe',
  BE: 'Europe', PT: 'Europe', IS: 'Europe', CZ: 'Europe', HU: 'Europe',
  XK: 'Europe', BA: 'Europe', HR: 'Europe', EE: 'Europe', LV: 'Europe',
  LT: 'Europe', SK: 'Europe',
  // Americas
  US: 'Americas', PR: 'Americas', GU: 'Americas', CU: 'Americas',
  HN: 'Americas', CO: 'Americas', BR: 'Americas', CA: 'Americas',
  // Africa
  KE: 'Africa', NE: 'Africa', SO: 'Africa', CM: 'Africa', GA: 'Africa',
  GH: 'Africa', SN: 'Africa', UG: 'Africa', TZ: 'Africa', MG: 'Africa',
  // Indo-Pacific
  AU: 'Indo-Pacific', SG: 'Indo-Pacific', PH: 'Indo-Pacific',
  TH: 'Indo-Pacific', IN: 'Indo-Pacific', DG: 'Indo-Pacific',
  MH: 'Indo-Pacific', PW: 'Indo-Pacific', FM: 'Indo-Pacific',
}

function deriveRegion(countryCode: string): string {
  return REGION_MAP[countryCode.toUpperCase()] ?? 'Other'
}
