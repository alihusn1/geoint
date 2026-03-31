import type { BaseType, Severity } from '@/types'

export const BASE_COLORS: Record<BaseType, string> = {
  airfield: '#00B4D8',
  naval: '#4D78B3',
  barracks: '#2A9D8F',
  military: '#F77F00',
  range: '#FCBF49',
  nuclear: '#E63946',
  bunker: '#9B5DE5',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#E63946',
  high: '#F77F00',
  medium: '#FCBF49',
  low: '#2A9D8F',
  info: '#94A3B8',
}

export const CATEGORY_COLORS: Record<string, string> = {
  military_movement: '#F77F00',
  naval_activity: '#4D78B3',
  air_activity: '#00B4D8',
  missile_test: '#E63946',
  cyber_attack: '#FCBF49',
  nuclear: '#FF6B6B',
  political: '#9B5DE5',
  humanitarian: '#2A9D8F',
  thermal_anomaly: '#FF6B35',
  seismic: '#8B5CF6',
  infrastructure: '#EF4444',
  disaster: '#F97316',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#94A3B8'
}

export function getBaseColor(type: BaseType): string {
  return BASE_COLORS[type] ?? '#94A3B8'
}

export const STRATEGIC_LAYER_COLORS: Record<string, string> = {
  air_missile_defense_v2: '#E63946',
  communications_cyber: '#FCBF49',
  defense_industry_v2: '#F77F00',
  energy_infrastructure: '#FF6B35',
  foreign_military_bases: '#00B4D8',
  geopolitical_hotspots: '#F43F5E',
  intelligence_surveillance: '#2A9D8F',
  naval_chokepoints_maritime: '#4D78B3',
  nuclear_sites_expanded_v2: '#FF6B6B',
  pakistan_strategic_layers: '#22D3EE',
  space_satellite: '#9B5DE5',
}

export function getStrategicColor(layerId: string): string {
  return STRATEGIC_LAYER_COLORS[layerId] ?? '#94A3B8'
}

export const EVENT_SOURCE_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  grok_search: '#00E5A0',
  gdelt_enhanced: '#F77F00',
  trends: '#A855F7',
  deep_analysis: '#F43F5E',
  firms: '#FF6B35',
  usgs: '#8B5CF6',
  ioda: '#EF4444',
  satellite: '#9B5DE5',
  sigint: '#2A9D8F',
  social: '#E63946',
  maritime: '#4D78B3',
  cyber: '#FCBF49',
  nuclear: '#FF6B6B',
}
export const EVENT_DEFAULT_COLOR = '#E63946'

export function getEventColor(event: { source: string }): string {
  return EVENT_SOURCE_COLORS[event.source] ?? EVENT_DEFAULT_COLOR
}
