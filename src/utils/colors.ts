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

export function getBaseColor(type: BaseType): string {
  return BASE_COLORS[type] ?? '#94A3B8'
}
