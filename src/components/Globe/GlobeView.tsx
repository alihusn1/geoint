import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useLiveStore } from '@/store/useLiveStore'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import type { GlobePoint } from '@/hooks/useGlobeInteraction'
import { useLiveLayerData } from '@/hooks/useLiveLayerData'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getBaseColor, SEVERITY_COLORS } from '@/utils/colors'
import { getAircraftColor, getVesselColor, getSatelliteColor } from '@/utils/liveColors'
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
  const selectedSatellite = useGlobeStore((s) => s.selectedSatellite)
  const setSelectedSatellite = useGlobeStore((s) => s.setSelectedSatellite)
  const satellitesEnabled = useLiveStore((s) => s.layers.satellites.enabled)
  const showEvents = useGlobeStore((s) => s.showEvents)
  const showArcs = useGlobeStore((s) => s.showArcs)
  const autoRotate = useGlobeStore((s) => s.autoRotate)
  const mapLayer = useGlobeStore((s) => s.mapLayer)

  const { filteredBases, filteredEvents } = useFilteredData()
  const { handlePointClick } = useGlobeInteraction()

  // Live layer data
  const {
    aircraftPointsData,
    satellitePointsData,
    vesselPointsData,
    htmlMarkersData,
    pathsAllData,
    heatmapData,
    polygonData,
    satelliteObjectsData,
    strikeArcsData,
    strikeRingsData,
    strikePointsData,
    enabledLayers,
  } = useLiveLayerData()

  // WebSocket connection — subscribe to enabled layers
  const { updateSubscriptions } = useWebSocket()
  useEffect(() => {
    updateSubscriptions(enabledLayers)
  }, [enabledLayers, updateSubscriptions])

  // Clear satellite selection when layer is disabled
  useEffect(() => {
    if (!satellitesEnabled && selectedSatellite) {
      setSelectedSatellite(null)
    }
  }, [satellitesEnabled, selectedSatellite, setSelectedSatellite])

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

  // Points data — dots (bases + events + strikes + aircraft + vessels)
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
    return [...basePoints, ...eventPoints, ...strikePointsData, ...aircraftPointsData, ...satellitePointsData, ...vesselPointsData]
  }, [filteredBases, filteredEvents, showEvents, strikePointsData, aircraftPointsData, satellitePointsData, vesselPointsData])

  // Rings data — neon glow halos around event markers + strike blast radii
  const ringsData = useMemo(() => {
    const eventRings = showEvents
      ? filteredEvents.map((e) => {
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
      : []
    return [...eventRings, ...strikeRingsData]
  }, [filteredEvents, showEvents, zoomScale, strikeRingsData])

  // Line-of-sight paths from selected satellite to ground footprint
  const EARTH_R = 6371 // km
  const LOS_SPOKES = 8
  const losPathsData = useMemo(() => {
    if (!selectedSatellite) return []
    const sat = selectedSatellite
    const color = getSatelliteColor(sat.category)
    // Geometric horizon half-angle
    const theta = Math.acos(EARTH_R / (EARTH_R + sat.altKm))
    const footprintDeg = theta * (180 / Math.PI)
    // Globe altitude for the satellite (same log scale as satelliteObjectsData)
    const satAlt = Math.min(2.0, Math.log10(sat.altKm / 100 + 1) * 0.35)
    const latRad = sat.lat * (Math.PI / 180)

    const paths: { points: [number, number, number][]; color: string; stroke: number; dash: number; gap: number; animateTime: number; _pathType: string }[] = []
    for (let i = 0; i < LOS_SPOKES; i++) {
      const angle = (i / LOS_SPOKES) * 2 * Math.PI
      const groundLat = sat.lat + footprintDeg * Math.cos(angle)
      const groundLng = sat.lng + (footprintDeg * Math.sin(angle)) / Math.cos(latRad)
      paths.push({
        points: [
          [sat.lat, sat.lng, satAlt],
          [groundLat, groundLng, 0],
        ],
        color: `${color}60`,
        stroke: 0.3,
        dash: 1.5,
        gap: 1,
        animateTime: 3000,
        _pathType: 'satellite-los',
      })
    }
    // Add footprint ring as a closed path on the ground
    const ringPoints: [number, number, number][] = []
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI
      ringPoints.push([
        sat.lat + footprintDeg * Math.cos(angle),
        sat.lng + (footprintDeg * Math.sin(angle)) / Math.cos(latRad),
        0,
      ])
    }
    paths.push({
      points: ringPoints,
      color: `${color}40`,
      stroke: 0.4,
      dash: 2,
      gap: 1,
      animateTime: 0,
      _pathType: 'satellite-footprint',
    })
    return paths
  }, [selectedSatellite])

  // Merge live paths + satellite LOS
  const allPathsData = useMemo(
    () => [...pathsAllData, ...losPathsData],
    [pathsAllData, losPathsData],
  )

  // Semi-transparent FOV cone — injected directly into the globe's Three.js scene
  // using getCoords() for exact world-space vertex positions
  const fovMeshRef = useRef<THREE.Mesh | null>(null)
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globe as any
    const scene: THREE.Scene | undefined = g.scene?.()

    // Clean up previous FOV mesh
    if (fovMeshRef.current) {
      fovMeshRef.current.geometry.dispose()
      ;(fovMeshRef.current.material as THREE.Material).dispose()
      fovMeshRef.current.removeFromParent()
      fovMeshRef.current = null
    }

    if (!selectedSatellite || !scene || !g.getCoords) return

    const sat = selectedSatellite
    const color = getSatelliteColor(sat.category)
    const theta = Math.acos(EARTH_R / (EARTH_R + sat.altKm))
    const footprintDeg = theta * (180 / Math.PI)
    const satAlt = Math.min(2.0, Math.log10(sat.altKm / 100 + 1) * 0.35)
    const latRad = sat.lat * (Math.PI / 180)

    // Satellite tip in world coords
    const tipW = g.getCoords(sat.lat, sat.lng, satAlt) as { x: number; y: number; z: number }
    const tipVec = new THREE.Vector3(tipW.x, tipW.y, tipW.z)

    // Footprint ring in world coords
    const SEGMENTS = 64
    const ringVecs: THREE.Vector3[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      const gLat = sat.lat + footprintDeg * Math.cos(angle)
      const gLng = sat.lng + (footprintDeg * Math.sin(angle)) / Math.cos(latRad)
      const p = g.getCoords(gLat, gLng, 0) as { x: number; y: number; z: number }
      ringVecs.push(new THREE.Vector3(p.x, p.y, p.z))
    }

    // Build geometry: tip vertex + ring vertices
    const vertices = new Float32Array((1 + SEGMENTS) * 3)
    // vertex 0 = tip
    vertices[0] = tipVec.x; vertices[1] = tipVec.y; vertices[2] = tipVec.z
    for (let i = 0; i < SEGMENTS; i++) {
      vertices[(i + 1) * 3] = ringVecs[i].x
      vertices[(i + 1) * 3 + 1] = ringVecs[i].y
      vertices[(i + 1) * 3 + 2] = ringVecs[i].z
    }

    // Cone side triangles (tip → ring[i] → ring[i+1])
    const idx: number[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const next = (i + 1) % SEGMENTS
      idx.push(0, i + 1, next + 1)
    }
    // Base cap triangles (fill the footprint circle on the ground)
    // Use a fan from ring[0]
    for (let i = 1; i < SEGMENTS - 1; i++) {
      idx.push(1, i + 1, i + 2)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = 'satellite-fov'

    // Add to globe's internal object (first child of scene) so it rotates with the globe
    const globeObj = scene.children.find((c: THREE.Object3D) => c.type === 'Group' || c.children.length > 10) ?? scene
    globeObj.add(mesh)
    fovMeshRef.current = mesh

    return () => {
      if (fovMeshRef.current) {
        fovMeshRef.current.geometry.dispose()
        ;(fovMeshRef.current.material as THREE.Material).dispose()
        fovMeshRef.current.removeFromParent()
        fovMeshRef.current = null
      }
    }
  }, [selectedSatellite, dimensions])

  // Manual click detection — bypasses unreliable Three.js raycasting
  // Uses screen-space distance for satellites (at altitude) and
  // globe-surface lat/lng distance for everything else
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

      // Screen position relative to container
      const rect = container.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      let nearest: GlobePoint | null = null
      let bestScore = Infinity // lower = closer

      // ── Screen-space check for satellites (rendered at altitude) ──
      const SAT_CLICK_PX = 20 // pixel radius threshold for satellite hit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getScreen = (globe as any).getScreenCoords as ((lat: number, lng: number, alt?: number) => { x: number; y: number } | null) | undefined
      if (getScreen) {
        for (const pt of pointsData) {
          if (pt._kind !== 'satellite') continue
          const sat = pt.data as import('@/types/live').SatellitePosition
          const satAlt = Math.min(2.0, Math.log10(sat.altKm / 100 + 1) * 0.35)
          const sc = getScreen.call(globe, pt.lat, pt.lng, satAlt)
          if (!sc) continue
          const sdx = sc.x - clickX
          const sdy = sc.y - clickY
          const pxDistSq = sdx * sdx + sdy * sdy
          if (pxDistSq < SAT_CLICK_PX * SAT_CLICK_PX && pxDistSq < bestScore) {
            bestScore = pxDistSq
            nearest = pt
          }
        }
      }

      // If we already found a satellite in screen-space, use it
      if (nearest) {
        console.log(`[GlobeClick] screen-space satellite hit: ${(nearest.data as any).name}, dist=${Math.sqrt(bestScore).toFixed(1)}px`)
        handlePointClick(nearest)
        return
      }

      // ── Globe-surface check for everything else ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coords = (globe as any).toGlobeCoords(clickX, clickY)
      if (!coords) return // clicked outside the globe sphere

      const clickLat: number = coords.lat
      const clickLng: number = coords.lng

      let minDistSq = Infinity
      for (const pt of pointsData) {
        if (pt._kind === 'satellite') continue // already checked above
        const dLat = pt.lat - clickLat
        const dLng = pt.lng - clickLng
        const distSq = dLat * dLat + dLng * dLng
        if (distSq < minDistSq) {
          minDistSq = distSq
          nearest = pt
        }
      }

      // Click threshold in degrees — scales with zoom level
      const maxDeg = altitude * 0.8
      if (nearest && minDistSq < maxDeg * maxDeg) {
        console.log(`[GlobeClick] surface hit: kind=${nearest._kind}, dist=${Math.sqrt(minDistSq).toFixed(4)}°`)
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

  // Arcs: background arcs + selected event source→event arc + strike arcs
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

    // Strike arcs (origin → impact)
    arcs.push(...strikeArcsData)

    return arcs
  }, [filteredEvents, filteredBases, showArcs, selectedEvent, strikeArcsData])

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
            if (pt._kind === 'strike') return EVENT_RADIUS * 1.2 * zoomScale
            if (pt._kind === 'aircraft') return 0 // rendered as HTML SVG icons
            if (pt._kind === 'satellite') return 0 // rendered as 3D objects
            if (pt._kind === 'vessel') return 0.15 * zoomScale
            const base = pt._kind === 'event' ? EVENT_RADIUS : BASE_RADIUS
            return base * zoomScale
          }}
          pointColor={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'event') return getEventColor(pt.data)
            if (pt._kind === 'strike') return '#E63946'
            if (pt._kind === 'aircraft') return getAircraftColor(pt.data.category)
            if (pt._kind === 'satellite') return getSatelliteColor(pt.data.category)
            if (pt._kind === 'vessel') return getVesselColor(pt.data.vesselType)
            if (pt._kind === 'base') return getBaseColor(pt.data.type)
            return '#94A3B8'
          }}
          pointLabel={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'event') return eventTooltipHtml(pt.data)
            if (pt._kind === 'base') return baseTooltipHtml(pt.data)
            if (pt._kind === 'aircraft') {
              const ac = pt.data
              return `<div style="text-align:center;font-size:12px"><b>${ac.callsign || ac.icao24}</b><br/>${ac.originCountry}<br/>Alt: ${Math.round(ac.altitude)}m | ${Math.round(ac.velocity)}m/s</div>`
            }
            if (pt._kind === 'satellite') {
              const s = pt.data
              return `<div style="text-align:center;font-size:12px"><b>${s.name}</b><br/>${s.category}<br/>Alt: ${Math.round(s.altKm).toLocaleString()}km | ${s.velocity.toFixed(1)}km/s</div>`
            }
            if (pt._kind === 'vessel') {
              const v = pt.data
              return `<div style="text-align:center;font-size:12px"><b>${v.name}</b><br/>${v.vesselType}<br/>Speed: ${v.speed.toFixed(1)}kn</div>`
            }
            return ''
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
          // Rings layer — neon glow on events + strike blast
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={(d: object) => (d as { color: string[] }).color}
          // HTML Elements layer — aircraft + maritime markers
          htmlElementsData={htmlMarkersData}
          htmlLat={(d: object) => (d as { lat: number }).lat}
          htmlLng={(d: object) => (d as { lng: number }).lng}
          htmlAltitude={(d: object) => (d as { alt: number }).alt}
          htmlElement={(d: object) => (d as { el: HTMLDivElement }).el}
          // Paths layer — aircraft trails, satellite tracks, vessel wakes, LOS lines
          pathsData={allPathsData}
          pathPoints={(d: object) => (d as { points: unknown[] }).points}
          pathPointLat={(p: unknown) => (p as number[])[0]}
          pathPointLng={(p: unknown) => (p as number[])[1]}
          pathPointAlt={(p: unknown) => (p as number[])[2] ?? 0}
          pathColor={(d: object) => (d as { color: string }).color}
          pathStroke={(d: object) => (d as { stroke: number }).stroke}
          pathDashLength={(d: object) => (d as { dash: number }).dash}
          pathDashGap={(d: object) => (d as { gap: number }).gap}
          pathDashAnimateTime={(d: object) => (d as { animateTime: number }).animateTime}
          // Heatmaps layer — GPS jamming
          heatmapsData={heatmapData}
          heatmapPoints={(d: object) => (d as { points: { lat: number; lng: number; intensity: number }[] }).points}
          heatmapPointLat="lat"
          heatmapPointLng="lng"
          heatmapPointWeight="intensity"
          heatmapBandwidth={3}
          heatmapColorFn={(t: number) => `rgba(230, 57, 70, ${t})`}
          heatmapTopAltitude={0.05}
          // Polygons layer — no-fly zones
          polygonsData={polygonData}
          polygonGeoJsonGeometry={(d: object) => (d as { geometry: object }).geometry}
          polygonCapColor={(d: object) => (d as { capColor: string }).capColor}
          polygonSideColor={(d: object) => (d as { sideColor: string }).sideColor}
          polygonStrokeColor={(d: object) => (d as { strokeColor: string }).strokeColor}
          polygonAltitude={0.01}
          polygonLabel={(d: object) => (d as { label: string }).label}
          // 3D Objects layer — satellites
          objectsData={satelliteObjectsData}
          objectLat={(d: object) => (d as { lat: number }).lat}
          objectLng={(d: object) => (d as { lng: number }).lng}
          objectAltitude={(d: object) => (d as { alt: number }).alt}
          objectThreeObject={(d: object) => (d as { obj: object }).obj}
          objectLabel={(d: object) => (d as { name: string }).name}
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
