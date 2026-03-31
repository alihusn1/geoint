import type { AircraftState } from '@/types/live'
import { getAircraftColor } from '@/utils/liveColors'

// Commercial airliner — wide straight wings
const PLANE_COMMERCIAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>`

// Military fighter — swept delta wings, angular silhouette
const PLANE_MILITARY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
  <path d="M12 1.5 L11 5 L11 9 L3 14.5 L4.2 16 L11 12.5 L11 18 L8.5 20 L8.5 22 L12 20.5 L15.5 22 L15.5 20 L13 18 L13 12.5 L19.8 16 L21 14.5 L13 9 L13 5 Z"/>
</svg>`

// Emergency — standard plane with pulsing red ring
const PLANE_EMERGENCY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32" fill="currentColor" width="24" height="24">
  <circle cx="12" cy="12" r="14" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
    <animate attributeName="r" values="12;16;12" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>`

// Government — commercial shape with badge glow
const PLANE_GOVERNMENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" fill="currentColor" width="22" height="22">
  <circle cx="12" cy="12" r="13" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>`

// Head of state — commercial shape with strong gold glow
const PLANE_HEAD_OF_STATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32" fill="currentColor" width="24" height="24">
  <circle cx="12" cy="12" r="14" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
    <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.2"/>
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>`

// Unknown — simple diamond marker
const PLANE_UNKNOWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
  <path d="M12 3 L17 12 L12 21 L7 12 Z"/>
</svg>`

function getAircraftSvg(category: AircraftState['category']): string {
  switch (category) {
    case 'commercial': return PLANE_COMMERCIAL
    case 'military': return PLANE_MILITARY
    case 'emergency': return PLANE_EMERGENCY
    case 'government': return PLANE_GOVERNMENT
    case 'head_of_state': return PLANE_HEAD_OF_STATE
    case 'unknown': return PLANE_UNKNOWN
  }
}

export function createAircraftElement(aircraft: AircraftState, source?: 'adsb' | 'flightaware'): HTMLDivElement {
  const el = document.createElement('div')
  const color = getAircraftColor(aircraft.category, source)

  // Outer div is controlled by globe.gl's CSS2DRenderer which overwrites
  // style.transform for positioning — so rotation must go on an inner wrapper.
  el.style.cssText = `
    pointer-events: auto;
    cursor: pointer;
  `

  const inner = document.createElement('div')
  inner.style.cssText = `
    color: ${color};
    filter: drop-shadow(0 0 4px ${color}80);
    transform: rotate(${aircraft.heading}deg);
    transition: transform 1s linear;
    line-height: 0;
  `
  inner.innerHTML = getAircraftSvg(aircraft.category)

  el.appendChild(inner)
  const titleParts = [`${aircraft.callsign} (${aircraft.icao24})`]
  if (aircraft.operator) titleParts.push(aircraft.operator)
  if (aircraft.registration) titleParts.push(`Reg: ${aircraft.registration}`)
  titleParts.push(aircraft.originCountry)
  titleParts.push(`Alt: ${Math.round(aircraft.altitude)}m | ${Math.round(aircraft.velocity)}m/s`)
  el.title = titleParts.join('\n')

  // Attach data for click handling
  ;(el as any).__data = { _markerType: 'aircraft', ...aircraft }

  return el
}

/** Update an existing aircraft marker element in-place (avoids DOM teardown). */
export function updateAircraftElement(el: HTMLDivElement, aircraft: AircraftState, source?: 'adsb' | 'flightaware'): void {
  const color = getAircraftColor(aircraft.category, source)
  const inner = el.firstElementChild as HTMLDivElement | null
  if (inner) {
    inner.style.color = color
    inner.style.filter = `drop-shadow(0 0 4px ${color}80)`
    inner.style.transform = `rotate(${aircraft.heading}deg)`
    inner.innerHTML = getAircraftSvg(aircraft.category)
  }
  const titleParts = [`${aircraft.callsign} (${aircraft.icao24})`]
  if (aircraft.operator) titleParts.push(aircraft.operator)
  if (aircraft.registration) titleParts.push(`Reg: ${aircraft.registration}`)
  titleParts.push(aircraft.originCountry)
  titleParts.push(`Alt: ${Math.round(aircraft.altitude)}m | ${Math.round(aircraft.velocity)}m/s`)
  el.title = titleParts.join('\n')
  ;(el as any).__data = { _markerType: 'aircraft', ...aircraft }
}
