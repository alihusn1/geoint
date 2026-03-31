import { useMemo, useRef } from 'react'
import { useStrategicLayerStore, STRATEGIC_LAYER_CATALOG } from '@/store/useStrategicLayerStore'
import type { StrategicFeatureData } from '@/types'

// Inline SVG icons (24x24 viewBox) for each icon name used in the catalog
const ICON_SVGS: Record<string, string> = {
  ShieldAlert: '<path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/>',
  Radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  Factory: '<path d="M2 20V8l4-4v6l4-4v6l4-4v6l4-4v6h2v2H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="6" y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.5"/><rect x="11" y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>',
  Zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  Flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2"/>',
  Flame: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.3-.8-2.7-2-4.5C7.8 9 7 10.4 7 12a4 4 0 005.5 3.7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 22c4.4 0 8-3.4 8-7.5 0-4-3-7-5-9.5-2 2.5-5 5.5-5 9.5S7.6 22 12 22z" fill="none" stroke="currentColor" stroke-width="2"/>',
  Eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
  Anchor: '<circle cx="12" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="21" stroke="currentColor" stroke-width="2"/><path d="M5 19a7 7 0 0014 0" fill="none" stroke="currentColor" stroke-width="2"/>',
  Radiation: '<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2a10 10 0 00-8.7 5l5 2.9A3.4 3.4 0 0112 8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21.7 7a10 10 0 00-8.7-5v5.5a3.4 3.4 0 013.7 1.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21.7 17A10 10 0 0012 22v-5.5a3.4 3.4 0 003-1.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.3 17a10 10 0 009.7 5v-5.5a3.4 3.4 0 01-3-1.6" fill="none" stroke="currentColor" stroke-width="2"/>',
  Target: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="2"/>',
  Orbit: '<circle cx="12" cy="12" r="3" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(30 12 12)"/>',
}

function getIconSvg(iconName: string): string {
  return ICON_SVGS[iconName] ?? ICON_SVGS.Target
}

// Cache marker elements by key to avoid re-creating DOM nodes
const markerCache = new Map<string, HTMLDivElement>()

function createStrategicMarkerEl(layerId: string, featureKey: string, name: string): HTMLDivElement {
  const cacheKey = `${layerId}::${featureKey}`
  const cached = markerCache.get(cacheKey)
  if (cached) return cached

  const meta = STRATEGIC_LAYER_CATALOG[layerId]
  const color = meta?.color ?? '#94A3B8'
  const iconName = meta?.icon ?? 'Target'

  const el = document.createElement('div')
  el.style.cssText = 'pointer-events:auto;cursor:pointer;line-height:0;'

  const circle = document.createElement('div')
  circle.style.cssText = `
    width:24px;height:24px;border-radius:50%;
    background:${color}30;border:2px solid ${color};
    display:flex;align-items:center;justify-content:center;
    filter:drop-shadow(0 0 4px ${color}80);
  `

  circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="color:${color}">${getIconSvg(iconName)}</svg>`

  el.appendChild(circle)
  el.title = `${name}\n${meta?.label ?? layerId}`

  markerCache.set(cacheKey, el)
  return el
}

export interface StrategicGlobePoint {
  _kind: 'strategic'
  data: StrategicFeatureData
  lat: number
  lng: number
}

export interface StrategicHtmlMarker {
  lat: number
  lng: number
  alt: number
  el: HTMLDivElement
}

export function useStrategicLayerData() {
  const enabledLayers = useStrategicLayerStore((s) => s.enabledLayers)
  const geojsonData = useStrategicLayerStore((s) => s.geojsonData)
  const activeKeysRef = useRef(new Set<string>())

  const { strategicPointsData, strategicHtmlMarkers } = useMemo(() => {
    const points: StrategicGlobePoint[] = []
    const markers: StrategicHtmlMarker[] = []
    const newKeys = new Set<string>()

    for (const [layerId, enabled] of Object.entries(enabledLayers)) {
      if (!enabled) continue
      const fc = geojsonData[layerId]
      if (!fc?.features) continue

      for (let i = 0; i < fc.features.length; i++) {
        const feature = fc.features[i]
        const geom = feature.geometry
        if (!geom || geom.type !== 'Point') continue

        const coords = (geom as GeoJSON.Point).coordinates
        const lng = coords[0]
        const lat = coords[1]
        const props = feature.properties ?? {}

        const featureData: StrategicFeatureData = {
          layerId,
          name: props.name ?? 'Unknown',
          country: props.country ?? '',
          category: props.category ?? '',
          subcategory: props.subcategory ?? '',
          status: props.status ?? '',
          description: props.description ?? props.operator ?? '',
          properties: props,
        }

        points.push({ _kind: 'strategic', data: featureData, lat, lng })

        const featureKey = `${i}-${props.name ?? i}`
        newKeys.add(`${layerId}::${featureKey}`)
        const el = createStrategicMarkerEl(layerId, featureKey, featureData.name)
        markers.push({ lat, lng, alt: 0, el })
      }
    }

    // Prune stale entries from cache
    for (const key of activeKeysRef.current) {
      if (!newKeys.has(key)) markerCache.delete(key)
    }
    activeKeysRef.current = newKeys

    return { strategicPointsData: points, strategicHtmlMarkers: markers }
  }, [enabledLayers, geojsonData])

  return { strategicPointsData, strategicHtmlMarkers }
}
