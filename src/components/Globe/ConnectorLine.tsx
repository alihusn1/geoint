import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useGlobeStore } from '@/store/useGlobeStore'
import { globeRefHolder } from '@/store/globeRefSingleton'
import { getEventColor } from '@/utils/colors'

const OSINT_PANEL_WIDTH = 320
const SIDEBAR_WIDTH = 380
const SIDEBAR_TOP = 140
const BEND_RADIUS = 12
const PANEL_INSET = 30

/** Build an SVG path with a rounded 90° L-bend (or Z-bend if marker is behind the panel). */
function buildPath(
  ax: number, ay: number,
  cx: number, cy: number,
  origin: 'sidebar' | 'osint',
): string {
  const markerBehindPanel =
    (origin === 'sidebar' && cx > ax - 20) ||
    (origin === 'osint' && cx < ax + 20)

  if (markerBehindPanel) {
    const offsetX = origin === 'sidebar' ? ax - PANEL_INSET : ax + PANEL_INSET
    const midY = (ay + cy) / 2
    return `M ${ax} ${ay} L ${offsetX} ${ay} L ${offsetX} ${midY} L ${cx} ${midY} L ${cx} ${cy}`
  }

  const bx = cx
  const by = ay
  const dy = cy - by
  const dx = bx - ax
  const sx = dx > 0 ? 1 : -1
  const sy = dy > 0 ? 1 : -1
  const r = Math.min(BEND_RADIUS, Math.abs(dx) / 2, Math.abs(dy) / 2)

  if (r < 2) {
    return `M ${ax} ${ay} L ${bx} ${by} L ${cx} ${cy}`
  }

  const sweep = (sx > 0 && sy > 0) || (sx < 0 && sy < 0) ? 1 : 0

  return [
    `M ${ax} ${ay}`,
    `L ${bx - sx * r} ${by}`,
    `A ${r} ${r} 0 0 ${sweep} ${bx} ${by + sy * r}`,
    `L ${cx} ${cy}`,
  ].join(' ')
}

/** Find the DOM element for the event in whichever panel it was clicked from. */
function findEventElement(eventId: string): HTMLElement | null {
  return document.querySelector(`[data-event-id="${eventId}"]`)
}

/** Find the DOM element for a strategic table row. */
function findRowElement(rowId: string): HTMLElement | null {
  return document.querySelector(`[data-row-id="${rowId}"]`)
}

/** Shared logic to get globe screen coords and canvas rect. */
function getGlobeScreen(lat: number, lng: number) {
  const globe = globeRefHolder.current
  if (!globe) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getScreen = (globe as any).getScreenCoords as
    | ((lat: number, lng: number, alt?: number) => { x: number; y: number } | null)
    | undefined
  if (!getScreen) return null

  const sc = getScreen.call(globe, lat, lng, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderer = (globe as any).renderer?.() as any
  const canvas = renderer?.domElement as HTMLCanvasElement | undefined
  if (!canvas) return null
  const canvasRect = canvas.getBoundingClientRect()

  return { sc, canvasRect }
}

export function ConnectorLine() {
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const connectorOrigin = useGlobeStore((s) => s.connectorOrigin)
  const connectorTarget = useGlobeStore((s) => s.connectorTarget)

  // Event connector refs
  const glowRef = useRef<SVGPathElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)

  // Strategic row connector refs
  const rowGlowRef = useRef<SVGPathElement>(null)
  const rowPathRef = useRef<SVGPathElement>(null)
  const rowDotRef = useRef<SVGCircleElement>(null)

  const loopRef = useRef(0)

  const eventActive = !!selectedEvent && !!connectorOrigin
  const rowActive = !!connectorTarget
  const active = eventActive || rowActive

  const eventColor = selectedEvent ? getEventColor(selectedEvent) : '#fff'
  const rowColor = connectorTarget?.color ?? '#22D3EE'

  const update = useCallback(() => {
    // ── Event connector ──
    if (selectedEvent && connectorOrigin) {
      const result = getGlobeScreen(selectedEvent.lat, selectedEvent.lng)
      if (result) {
        const { sc, canvasRect } = result
        const markerVisible =
          !!sc &&
          sc.x + canvasRect.left > 0 &&
          sc.x + canvasRect.left < window.innerWidth &&
          sc.y + canvasRect.top > 0 &&
          sc.y + canvasRect.top < window.innerHeight

        const el = findEventElement(selectedEvent.id)
        const opacity = markerVisible ? '1' : '0'

        if (markerVisible && sc) {
          const cx = sc.x + canvasRect.left
          const cy = sc.y + canvasRect.top

          let ay: number
          if (el) {
            const elRect = el.getBoundingClientRect()
            const elCenterY = elRect.top + elRect.height / 2
            const scrollParent = el.closest('.overflow-y-auto')
            let panelTop: number
            let panelBottom: number
            if (scrollParent) {
              const spRect = scrollParent.getBoundingClientRect()
              panelTop = spRect.top
              panelBottom = spRect.bottom
            } else {
              panelTop = SIDEBAR_TOP + 42
              panelBottom = window.innerHeight
            }
            ay = Math.max(panelTop, Math.min(panelBottom, elCenterY))
          } else {
            ay = SIDEBAR_TOP + (window.innerHeight - SIDEBAR_TOP) / 2
          }

          const ax = OSINT_PANEL_WIDTH
          const d = buildPath(ax, ay, cx, cy, 'osint')
          glowRef.current?.setAttribute('d', d)
          pathRef.current?.setAttribute('d', d)
          dotRef.current?.setAttribute('cx', String(cx))
          dotRef.current?.setAttribute('cy', String(cy))
        }

        glowRef.current?.style.setProperty('opacity', opacity)
        pathRef.current?.style.setProperty('opacity', opacity)
        dotRef.current?.style.setProperty('opacity', opacity)
      }
    } else {
      glowRef.current?.style.setProperty('opacity', '0')
      pathRef.current?.style.setProperty('opacity', '0')
      dotRef.current?.style.setProperty('opacity', '0')
    }

    // ── Strategic row connector ──
    if (connectorTarget) {
      const result = getGlobeScreen(connectorTarget.lat, connectorTarget.lng)
      if (result) {
        const { sc, canvasRect } = result
        const markerVisible =
          !!sc &&
          sc.x + canvasRect.left > 0 &&
          sc.x + canvasRect.left < window.innerWidth &&
          sc.y + canvasRect.top > 0 &&
          sc.y + canvasRect.top < window.innerHeight

        const el = findRowElement(connectorTarget.rowId)
        const opacity = markerVisible ? '1' : '0'

        if (markerVisible && sc) {
          const cx = sc.x + canvasRect.left
          const cy = sc.y + canvasRect.top

          // Anchor from right sidebar
          const ax = window.innerWidth - SIDEBAR_WIDTH

          let ay: number
          if (el) {
            const elRect = el.getBoundingClientRect()
            const elCenterY = elRect.top + elRect.height / 2
            const scrollParent = el.closest('.overflow-auto')
            let panelTop: number
            let panelBottom: number
            if (scrollParent) {
              const spRect = scrollParent.getBoundingClientRect()
              panelTop = spRect.top
              panelBottom = spRect.bottom
            } else {
              panelTop = SIDEBAR_TOP + 42
              panelBottom = window.innerHeight
            }
            ay = Math.max(panelTop, Math.min(panelBottom, elCenterY))
          } else {
            ay = SIDEBAR_TOP + (window.innerHeight - SIDEBAR_TOP) / 2
          }

          const d = buildPath(ax, ay, cx, cy, 'sidebar')
          rowGlowRef.current?.setAttribute('d', d)
          rowPathRef.current?.setAttribute('d', d)
          rowDotRef.current?.setAttribute('cx', String(cx))
          rowDotRef.current?.setAttribute('cy', String(cy))
        }

        rowGlowRef.current?.style.setProperty('opacity', opacity)
        rowPathRef.current?.style.setProperty('opacity', opacity)
        rowDotRef.current?.style.setProperty('opacity', opacity)
      }
    } else {
      rowGlowRef.current?.style.setProperty('opacity', '0')
      rowPathRef.current?.style.setProperty('opacity', '0')
      rowDotRef.current?.style.setProperty('opacity', '0')
    }
  }, [selectedEvent, connectorOrigin, connectorTarget])

  // Continuous rAF loop + scroll listener for smooth tracking
  useEffect(() => {
    if (!active) return

    let running = true

    const loop = () => {
      if (!running) return
      update()
      loopRef.current = requestAnimationFrame(loop)
    }
    loopRef.current = requestAnimationFrame(loop)

    // Also track sidebar scroll
    const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]')
    const onScroll = () => update()
    scrollContainers.forEach((el) => el.addEventListener('scroll', onScroll, { passive: true }))
    window.addEventListener('resize', onScroll)

    return () => {
      running = false
      cancelAnimationFrame(loopRef.current)
      scrollContainers.forEach((el) => el.removeEventListener('scroll', onScroll))
      window.removeEventListener('resize', onScroll)
    }
  }, [active, update])

  if (!active) return null

  return createPortal(
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <defs>
        <filter id="connector-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Event connector */}
      <path ref={glowRef} stroke={eventColor} strokeWidth={5} fill="none" opacity={0} filter="url(#connector-glow)" strokeDasharray="6 4" style={{ transition: 'opacity 0.3s ease' }} />
      <path ref={pathRef} stroke={eventColor} strokeWidth={2} fill="none" opacity={0} strokeDasharray="6 4" style={{ transition: 'opacity 0.3s ease' }} />
      <circle ref={dotRef} r={6} fill={eventColor} opacity={0} style={{ transition: 'opacity 0.3s ease' }} />

      {/* Strategic row connector */}
      <path ref={rowGlowRef} stroke={rowColor} strokeWidth={5} fill="none" opacity={0} filter="url(#connector-glow)" strokeDasharray="6 4" style={{ transition: 'opacity 0.3s ease' }} />
      <path ref={rowPathRef} stroke={rowColor} strokeWidth={2} fill="none" opacity={0} strokeDasharray="6 4" style={{ transition: 'opacity 0.3s ease' }} />
      <circle ref={rowDotRef} r={6} fill={rowColor} opacity={0} style={{ transition: 'opacity 0.3s ease' }} />
    </svg>,
    document.body,
  )
}
