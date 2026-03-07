import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import type { GlobePoint } from '@/hooks/useGlobeInteraction'
import { getBaseColor, SEVERITY_COLORS } from '@/utils/colors'
import { baseTooltipHtml, eventTooltipHtml } from './MarkerTooltip'
import { GlobeControls } from './GlobeControls'
import type { OSINTEvent } from '@/types'

const BG_COLOR = '#0C1B2A'
const ATMOSPHERE_COLOR = '#00B4D8'

// Event colors by source
const EVENT_SOURCE_COLORS: Record<string, string> = {
  gdelt: '#F77F00',   // orange
  rss: '#00B4D8',     // cyan
}
const EVENT_DEFAULT_COLOR = '#E63946' // red fallback

function getEventColor(event: OSINTEvent): string {
  return EVENT_SOURCE_COLORS[event.source] ?? EVENT_DEFAULT_COLOR
}

function streetTileUrl(x: number, y: number, level: number): string {
  return `https://tile.openstreetmap.org/${level}/${x}/${y}.png`
}

function darkTileUrl(x: number, y: number, level: number): string {
  const sub = 'abc'[Math.abs(x + y) % 3]
  return `https://${sub}.basemaps.cartocdn.com/dark_all/${level}/${x}/${y}@2x.png`
}

function satelliteTileUrl(x: number, y: number, level: number): string {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`
}

// Default altitude and base dot sizes
const DEFAULT_ALT = 1.8
const BASE_RADIUS = 0.18
const EVENT_RADIUS = 0.35

// Max mouse movement (px²) to still count as a click vs drag
const CLICK_THRESHOLD_SQ = 25

export function GlobeView() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [altitude, setAltitude] = useState(DEFAULT_ALT)
  const isFirstRender = useRef(true)
  const mouseDownPos = useRef({ x: 0, y: 0 })

  const cameraPosition = useGlobeStore((s) => s.cameraPosition)
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const showEvents = useGlobeStore((s) => s.showEvents)
  const showArcs = useGlobeStore((s) => s.showArcs)
  const autoRotate = useGlobeStore((s) => s.autoRotate)
  const mapLayer = useGlobeStore((s) => s.mapLayer)

  const { filteredBases, filteredEvents } = useFilteredData()
  const { handlePointClick } = useGlobeInteraction()

  // ResizeObserver for container sizing
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Clear tile cache and force re-render when layer changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const globe = globeRef.current
    if (!globe) return

    globe.globeTileEngineClearCache()

    const pov = globe.pointOfView()
    globe.pointOfView({ lat: pov.lat + 0.0001 }, 0)
    requestAnimationFrame(() => {
      globe.pointOfView({ lat: pov.lat }, 0)
    })
  }, [mapLayer])

  // Camera animation on selection
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: cameraPosition.lat, lng: cameraPosition.lng, altitude: cameraPosition.altitude },
        1000,
      )
    }
  }, [cameraPosition])

  // Sync auto-rotate to Three.js OrbitControls
  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (!controls) return
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.5
  }, [autoRotate, dimensions])

  // Track zoom altitude so dot sizes stay visually constant
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    const controls = globe.controls()
    if (!controls) return

    let rafId: number
    const onChange = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const alt = globe.pointOfView().altitude
        setAltitude((prev) => (Math.abs(prev - alt) > 0.02 ? alt : prev))
      })
    }
    controls.addEventListener('change', onChange)
    return () => {
      controls.removeEventListener('change', onChange)
      cancelAnimationFrame(rafId)
    }
  }, [dimensions]) // re-attach after globe mounts

  // Scaling factor: dots shrink when zooming in, grow when zooming out
  const zoomScale = Math.sqrt(altitude / DEFAULT_ALT)

  // Points data — dots
  const pointsData: GlobePoint[] = useMemo(() => {
    const basePoints: GlobePoint[] = filteredBases.map((b) => ({
      _kind: 'base' as const,
      data: b,
      lat: b.lat,
      lng: b.lng,
    }))
    const eventPoints: GlobePoint[] = showEvents
      ? filteredEvents.map((e) => ({
          _kind: 'event' as const,
          data: e,
          lat: e.lat,
          lng: e.lng,
        }))
      : []
    return [...basePoints, ...eventPoints]
  }, [filteredBases, filteredEvents, showEvents])

  // Rings data — neon glow halos around event markers
  const ringsData = useMemo(() => {
    if (!showEvents) return []
    return filteredEvents.map((e) => {
      const color = getEventColor(e)
      return {
        lat: e.lat,
        lng: e.lng,
        maxR: 1.2 * zoomScale,
        propagationSpeed: 0.8,
        repeatPeriod: 1800,
        color: [`${color}CC`, `${color}44`, `${color}00`],
      }
    })
  }, [filteredEvents, showEvents, zoomScale])

  // Manual click detection — bypasses unreliable Three.js raycasting
  // Converts screen click to globe lat/lng, finds nearest point
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMouseDown = (e: MouseEvent) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = (e: MouseEvent) => {
      // Ignore drags
      const dx = e.clientX - mouseDownPos.current.x
      const dy = e.clientY - mouseDownPos.current.y
      if (dx * dx + dy * dy > CLICK_THRESHOLD_SQ) return

      const globe = globeRef.current
      if (!globe) return

      // Convert screen position to globe coordinates
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coords = (globe as any).toGlobeCoords(x, y)
      if (!coords) return // clicked outside the globe sphere

      const clickLat: number = coords.lat
      const clickLng: number = coords.lng

      // Find nearest point
      let nearest: GlobePoint | null = null
      let minDistSq = Infinity

      for (const pt of pointsData) {
        const dLat = pt.lat - clickLat
        const dLng = pt.lng - clickLng
        const distSq = dLat * dLat + dLng * dLng
        if (distSq < minDistSq) {
          minDistSq = distSq
          nearest = pt
        }
      }

      // Click threshold in degrees — scales with zoom level
      // Zoomed out (alt 1.8): ~1.5° (~170km), Zoomed in (alt 0.3): ~0.6° (~65km)
      const maxDeg = altitude * 0.8
      if (nearest && minDistSq < maxDeg * maxDeg) {
        handlePointClick(nearest)
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mouseup', onMouseUp)
    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mouseup', onMouseUp)
    }
  }, [pointsData, altitude, handlePointClick])

  // Arcs: background arcs + selected event source→event arc
  const arcsData = useMemo(() => {
    interface ArcDatum {
      startLat: number
      startLng: number
      endLat: number
      endLng: number
      color: string[]
      stroke: number
    }

    const arcs: ArcDatum[] = []

    // Background arcs: top 10 recent events → related bases
    if (showArcs) {
      const sorted = [...filteredEvents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      for (const evt of sorted.slice(0, 10)) {
        if (evt.relatedBaseIds.length === 0) continue
        const relatedBase = filteredBases.find((b) => b.id === evt.relatedBaseIds[0])
        if (!relatedBase) continue
        arcs.push({
          startLat: evt.lat,
          startLng: evt.lng,
          endLat: relatedBase.lat,
          endLng: relatedBase.lng,
          color: ['#E6394600', '#E63946', '#E63946', '#E6394600'],
          stroke: 0.15,
        })
      }
    }

    // Selected event: draw arc from source country → event location
    if (selectedEvent && selectedEvent.sourceLat != null && selectedEvent.sourceLng != null) {
      const sevColor = SEVERITY_COLORS[selectedEvent.severity] ?? '#00B4D8'
      arcs.push({
        startLat: selectedEvent.sourceLat,
        startLng: selectedEvent.sourceLng,
        endLat: selectedEvent.lat,
        endLng: selectedEvent.lng,
        color: [`${sevColor}00`, sevColor, sevColor, `${sevColor}00`],
        stroke: 0.4,
      })
    }

    // Selected event: draw arc from event location → target if available
    if (selectedEvent && selectedEvent.targetLat != null && selectedEvent.targetLng != null) {
      const sevColor = SEVERITY_COLORS[selectedEvent.severity] ?? '#00B4D8'
      arcs.push({
        startLat: selectedEvent.lat,
        startLng: selectedEvent.lng,
        endLat: selectedEvent.targetLat,
        endLng: selectedEvent.targetLng,
        color: [`${sevColor}00`, sevColor, sevColor, `${sevColor}00`],
        stroke: 0.4,
      })
    }

    return arcs
  }, [filteredEvents, filteredBases, showArcs, selectedEvent])

  // Resolve tile engine
  const tileEngineUrl = useMemo(() => {
    if (mapLayer === 'street') return streetTileUrl
    if (mapLayer === 'dark') return darkTileUrl
    return satelliteTileUrl
  }, [mapLayer])

  const handleZoomIn = useCallback(() => {
    if (!globeRef.current) return
    const pov = globeRef.current.pointOfView()
    globeRef.current.pointOfView({ altitude: Math.max(0.3, pov.altitude * 0.7) }, 500)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!globeRef.current) return
    const pov = globeRef.current.pointOfView()
    globeRef.current.pointOfView({ altitude: Math.min(5, pov.altitude * 1.4) }, 500)
  }, [])

  const handleReset = useCallback(() => {
    globeRef.current?.pointOfView({ lat: 30, lng: 69, altitude: 1.8 }, 1000)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={BG_COLOR}
          globeTileEngineUrl={tileEngineUrl}
          atmosphereColor={ATMOSPHERE_COLOR}
          atmosphereAltitude={0.2}
          // Points layer
          pointsMerge={false}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0.001}
          pointRadius={(d: object) => {
            const pt = d as GlobePoint
            const base = pt._kind === 'event' ? EVENT_RADIUS : BASE_RADIUS
            return base * zoomScale
          }}
          pointColor={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'event') return getEventColor(pt.data)
            return getBaseColor(pt.data.type)
          }}
          pointLabel={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'event') return eventTooltipHtml(pt.data)
            return baseTooltipHtml(pt.data)
          }}
          pointResolution={6}
          // Arcs layer
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => (d as { color: string[] }).color}
          arcDashLength={0.6}
          arcDashGap={0.1}
          arcDashAnimateTime={2000}
          arcStroke={(d: object) => (d as { stroke: number }).stroke}
          // Rings layer — neon glow on events
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={(d: object) => (d as { color: string[] }).color}
          // Interaction
          animateIn={false}
          onGlobeReady={() => {
            globeRef.current?.pointOfView(
              { lat: 30, lng: 69, altitude: 1.8 },
              0,
            )
          }}
        />
      )}
      <GlobeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
    </div>
  )
}
