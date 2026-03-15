import type { VesselState } from '@/types/live'
import { getVesselColor } from '@/utils/liveColors'

const SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
  <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42a1 1 0 0 0-.66 1.28L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
</svg>`

export function createVesselElement(vessel: VesselState): HTMLDivElement {
  const el = document.createElement('div')
  const color = getVesselColor(vessel.vesselType)

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
    transform: rotate(${vessel.heading}deg);
    transition: transform 1s linear;
    line-height: 0;
  `
  inner.innerHTML = SHIP_SVG

  el.appendChild(inner)
  el.title = `${vessel.name} (${vessel.mmsi})\n${vessel.vesselType}\nSpeed: ${vessel.speed.toFixed(1)}kn → ${vessel.destination ?? 'Unknown'}`

  ;(el as any).__data = { _markerType: 'vessel', ...vessel }

  return el
}
