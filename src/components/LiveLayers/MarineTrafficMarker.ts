import type { VesselState } from '@/types/live'
import { getMarineTrafficVesselColor } from '@/utils/liveColors'

// Directional arrow/chevron pointing up (0deg = north), ~12px
const ARROW_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
  <path d="M6 1 L10 10 L6 7.5 L2 10 Z" fill="currentColor"/>
</svg>`

// Outline variant for fishing/unknown vessels
const ARROW_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
  <path d="M6 1 L10 10 L6 7.5 L2 10 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
</svg>`

function getArrowSvg(vesselType: VesselState['vesselType']): string {
  if (vesselType === 'fishing' || vesselType === 'unknown') return ARROW_OUTLINE
  return ARROW_FILLED
}

export function createMarineTrafficElement(vessel: VesselState): HTMLDivElement {
  const el = document.createElement('div')
  const color = getMarineTrafficVesselColor(vessel.vesselType)

  el.style.cssText = `
    pointer-events: auto;
    cursor: pointer;
  `

  const inner = document.createElement('div')
  inner.style.cssText = `
    color: ${color};
    filter: drop-shadow(0 0 3px ${color}80);
    transform: rotate(${vessel.heading}deg);
    transition: transform 1s linear;
    line-height: 0;
  `
  inner.innerHTML = getArrowSvg(vessel.vesselType)

  el.appendChild(inner)

  const titleParts = [`${vessel.name} (${vessel.mmsi})`]
  if (vessel.flagCountry) titleParts.push(`Flag: ${vessel.flagCountry}`)
  titleParts.push(vessel.vesselType)
  titleParts.push(`Speed: ${vessel.speed.toFixed(1)}kn`)
  if (vessel.destination) titleParts.push(`Dest: ${vessel.destination}`)
  el.title = titleParts.join('\n')

  ;(el as any).__data = { _markerType: 'marinetraffic', ...vessel }

  return el
}

/** Update an existing MarineTraffic arrow marker in-place (avoids DOM teardown). */
export function updateMarineTrafficElement(el: HTMLDivElement, vessel: VesselState): void {
  const color = getMarineTrafficVesselColor(vessel.vesselType)
  const inner = el.firstElementChild as HTMLDivElement | null
  if (inner) {
    inner.style.color = color
    inner.style.filter = `drop-shadow(0 0 3px ${color}80)`
    inner.style.transform = `rotate(${vessel.heading}deg)`
    inner.innerHTML = getArrowSvg(vessel.vesselType)
  }

  const titleParts = [`${vessel.name} (${vessel.mmsi})`]
  if (vessel.flagCountry) titleParts.push(`Flag: ${vessel.flagCountry}`)
  titleParts.push(vessel.vesselType)
  titleParts.push(`Speed: ${vessel.speed.toFixed(1)}kn`)
  if (vessel.destination) titleParts.push(`Dest: ${vessel.destination}`)
  el.title = titleParts.join('\n')

  ;(el as any).__data = { _markerType: 'marinetraffic', ...vessel }
}
