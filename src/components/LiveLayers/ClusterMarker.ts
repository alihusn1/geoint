// Scaled-up aircraft silhouette for clusters
const CLUSTER_PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>`

// Arrow/chevron for MarineTraffic vessel clusters
const CLUSTER_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor">
  <path d="M6 1 L10 10 L6 7.5 L2 10 Z"/>
</svg>`

// Scaled-up vessel silhouette for clusters
const CLUSTER_SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42a1 1 0 0 0-.66 1.28L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
</svg>`

export function createClusterElement(
  count: number,
  color: string,
  type: 'aircraft' | 'vessel' | 'marinetraffic',
): HTMLDivElement {
  const el = document.createElement('div')
  const iconSize = Math.max(32, Math.min(52, 26 + Math.log2(count) * 4))

  el.style.cssText = `
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
  `

  // Icon
  const icon = document.createElement('div')
  icon.style.cssText = `
    width: ${iconSize}px;
    height: ${iconSize}px;
    color: ${color};
    filter: drop-shadow(0 0 6px ${color}90);
    line-height: 0;
  `
  icon.innerHTML = type === 'aircraft' ? CLUSTER_PLANE_SVG : type === 'marinetraffic' ? CLUSTER_ARROW_SVG : CLUSTER_SHIP_SVG

  // Count badge
  const badge = document.createElement('div')
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`
  badge.textContent = label
  badge.style.cssText = `
    margin-top: 1px;
    padding: 1px 5px;
    border-radius: 8px;
    background: ${color}50;
    border: 1px solid ${color}AA;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    font-family: system-ui, sans-serif;
    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
    line-height: 14px;
    white-space: nowrap;
  `

  el.appendChild(icon)
  el.appendChild(badge)
  el.title = `${label} ${type}`

  return el
}

export function createEventClusterElement(count: number, color: string): HTMLDivElement {
  const el = document.createElement('div')
  const size = Math.max(18, Math.min(28, 16 + Math.log2(count) * 3))
  const fontSize = Math.max(8, Math.round(size * 0.42))

  el.style.cssText = `
    pointer-events: auto;
    cursor: pointer;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color}30;
    border: 1.5px solid ${color};
    box-shadow: 0 0 6px ${color}50;
    transform: translate(-50%, -50%);
    text-align: center;
    line-height: ${size}px;
    color: #fff;
    font-size: ${fontSize}px;
    font-weight: 700;
    font-family: system-ui, sans-serif;
    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
  `

  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`
  el.textContent = label
  el.title = `${count} events`

  return el
}
