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
import { getBaseColor, getStrategicColor, getEventColor } from '@/utils/colors'
import { globeRefHolder } from '@/store/globeRefSingleton'
import { getAircraftColor, getVesselColor, getMarineTrafficVesselColor, getSatelliteColor, LAYER_COLORS } from '@/utils/liveColors'
import { baseTooltipHtml, eventTooltipHtml, strategicTooltipHtml } from './MarkerTooltip'
import { useStrategicLayerData } from '@/hooks/useStrategicLayerData'
import { GlobeControls } from './GlobeControls'
import { createEventClusterElement } from '@/components/LiveLayers/ClusterMarker'
import { PAKISTAN_POLYGON } from '@/data/pakistanBoundary'


const BG_COLOR = '#0C1B2A'
const ATMOSPHERE_COLOR = '#00B4D8'


// ── Tile URLs: routed through Redis cache proxy (/tiles/:layer/:z/:x/:y) ──
// Falls back to direct CDN URLs if the tile cache server is unavailable.
let tileCacheAvailable = true
// Probe the tile cache server once on load
fetch('/tiles/health').then((r) => { tileCacheAvailable = r.ok }).catch(() => { tileCacheAvailable = false })

function streetTileUrl(x: number, y: number, level: number): string {
  if (tileCacheAvailable) return `/tiles/street/${level}/${x}/${y}`
  return `https://tile.openstreetmap.org/${level}/${x}/${y}.png`
}

function darkTileUrl(x: number, y: number, level: number): string {
  if (tileCacheAvailable) return `/tiles/dark/${level}/${x}/${y}`
  const sub = 'abc'[Math.abs(x + y) % 3]
  return `https://${sub}.basemaps.cartocdn.com/dark_all/${level}/${x}/${y}@2x.png`
}

function satelliteTileUrl(x: number, y: number, level: number): string {
  if (tileCacheAvailable) return `/tiles/satellite/${level}/${x}/${y}`
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`
}

// Sentinel-2 tiles via PC mosaic API only have data at z >= 9.
// Below that, the API returns 204 (no content) which shows as black.
const S2_MIN_ZOOM = 9

// Check if a Web Mercator tile intersects a lat/lon bbox [west, south, east, north]
function tileIntersectsBbox(x: number, y: number, z: number, bbox: [number, number, number, number]): boolean {
  if (z < S2_MIN_ZOOM) return false
  const n = Math.pow(2, z)
  const tileLonMin = (x / n) * 360 - 180
  const tileLonMax = ((x + 1) / n) * 360 - 180
  const tileLatMax = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  const tileLatMin = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI
  const [west, south, east, north] = bbox
  return tileLonMax > west && tileLonMin < east && tileLatMax > south && tileLatMin < north
}

function sentinel2TileUrl(x: number, y: number, level: number, itemId: string): string {
  return `/api/imagery/tiles/${encodeURIComponent(itemId)}/${level}/${x}/${y}.png`
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
  const setZoomView = useGlobeStore((s) => s.setZoomView)
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const selectedSatellite = useGlobeStore((s) => s.selectedSatellite)
  const setSelectedSatellite = useGlobeStore((s) => s.setSelectedSatellite)
  const satellitesEnabled = useLiveStore((s) => s.layers.satellites.enabled)
  const showEvents = useGlobeStore((s) => s.showEvents)
  const showBases = useGlobeStore((s) => s.showBases)
  const showArcs = useGlobeStore((s) => s.showArcs)
  const autoRotate = useGlobeStore((s) => s.autoRotate)
  const mapLayer = useGlobeStore((s) => s.mapLayer)
  const imageryOverlay = useGlobeStore((s) => s.imageryOverlay)
  const terrain3d = useGlobeStore((s) => s.terrain3d)
  const setImageryOverlay = useGlobeStore((s) => s.setImageryOverlay)
  const expandedCluster = useGlobeStore((s) => s.expandedCluster)

  const { filteredBases, filteredEvents } = useFilteredData()
  const { handlePointClick } = useGlobeInteraction()
  const { strategicPointsData, strategicHtmlMarkers } = useStrategicLayerData()

  // Live layer data
  const {
    aircraftPointsData,
    flightawarePointsData,
    satellitePointsData,
    vesselPointsData,
    marinetrafficPointsData,
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

  // Dispose Three.js scene on unmount to prevent GPU/memory leaks
  useEffect(() => {
    return () => {
      const globe = globeRef.current
      if (!globe) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globe as any
      const scene: THREE.Scene | undefined = g.scene?.()
      const renderer: THREE.WebGLRenderer | undefined = g.renderer?.()
      if (scene) {
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            const mat = obj.material
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
            else if (mat) mat.dispose()
          }
        })
      }
      renderer?.dispose()
      globeRefHolder.current = null
    }
  }, [])

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

  // Clear tile cache and fly to scene when imagery overlay changes
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    globe.globeTileEngineClearCache()

    if (imageryOverlay) {
      // Fly to scene center — instant position, no long animation that
      // fights with user zoom/pan.
      const [west, south, east, north] = imageryOverlay.bbox
      const centerLat = (south + north) / 2
      const centerLng = (west + east) / 2
      // Start wide enough to see where the scene is, user zooms in for detail.
      // The scene bbox outline (rendered via polygonData) shows the boundary.
      globe.pointOfView({ lat: centerLat, lng: centerLng, altitude: 0.15 }, 800)
    } else {
      // Removing overlay — nudge to force base map tiles to reload
      const pov = globe.pointOfView()
      globe.pointOfView({ lat: pov.lat + 0.0001 }, 0)
      requestAnimationFrame(() => {
        globe.pointOfView({ lat: pov.lat }, 0)
      })
    }
  }, [imageryOverlay])

  // Camera animation on selection — faster for cluster zoom-ins
  useEffect(() => {
    if (globeRef.current) {
      const duration = cameraPosition.altitude <= 0.15 ? 400 : 1000
      globeRef.current.pointOfView(
        { lat: cameraPosition.lat, lng: cameraPosition.lng, altitude: cameraPosition.altitude },
        duration,
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
    let lastSyncedAlt = DEFAULT_ALT
    let lastSyncedLat = 30
    let lastSyncedLng = 69
    const onChange = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const pov = globe.pointOfView()
        setAltitude((prev) => (Math.abs(prev - pov.altitude) > 0.02 ? pov.altitude : prev))
        // Sync to store for clustering (quantized to avoid excessive updates)
        const qAlt = Math.round(pov.altitude * 10) / 10
        const qLat = Math.round(pov.lat)
        const qLng = Math.round(pov.lng)
        if (qAlt !== lastSyncedAlt || Math.abs(qLat - lastSyncedLat) > 1 || Math.abs(qLng - lastSyncedLng) > 1) {
          lastSyncedAlt = qAlt
          lastSyncedLat = qLat
          lastSyncedLng = qLng
          setZoomView(pov.altitude, pov.lat, pov.lng)
        }
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

  // Points data — dots (bases + events + strikes + aircraft + vessels + arc endpoints)
  const pointsData: GlobePoint[] = useMemo(() => {
    const basePoints: GlobePoint[] = showBases
      ? filteredBases.map((b) => ({
          _kind: 'base' as const,
          data: b,
          lat: b.lat,
          lng: b.lng,
        }))
      : []
    // Cluster co-located events (round to ~1km grid)
    const eventPoints: GlobePoint[] = []
    if (showEvents) {
      const PRECISION = 100 // 2 decimals ≈ 1.1km
      const groups = new Map<string, import('@/types').OSINTEvent[]>()
      for (const e of filteredEvents) {
        const key = `${Math.round(e.lat * PRECISION)}:${Math.round(e.lng * PRECISION)}`
        let g = groups.get(key)
        if (!g) { g = []; groups.set(key, g) }
        g.push(e)
      }
      for (const events of groups.values()) {
        if (events.length === 1) {
          eventPoints.push({ _kind: 'event' as const, data: events[0], lat: events[0].lat, lng: events[0].lng })
        } else {
          const cLat = events.reduce((s, e) => s + e.lat, 0) / events.length
          const cLng = events.reduce((s, e) => s + e.lng, 0) / events.length
          // Check if this cluster is currently expanded
          const isExpanded = expandedCluster &&
            Math.abs(expandedCluster.lat - cLat) < 0.02 &&
            Math.abs(expandedCluster.lng - cLng) < 0.02
          if (isExpanded) {
            // Fan out into a circle
            const step = (2 * Math.PI) / events.length
            const radius = Math.max(0.4, 0.8 * zoomScale)
            for (let i = 0; i < events.length; i++) {
              eventPoints.push({
                _kind: 'event' as const,
                data: events[i],
                lat: cLat + radius * Math.sin(i * step),
                lng: cLng + radius * Math.cos(i * step),
              })
            }
          } else {
            eventPoints.push({
              _kind: 'event-cluster' as const,
              data: { count: events.length, events },
              lat: cLat,
              lng: cLng,
            })
          }
        }
      }
    }

    // Arc endpoint indicators for selected event's source / target locations
    const endpointPoints: GlobePoint[] = []
    if (selectedEvent) {
      const srcColor = getEventColor(selectedEvent)
      if (selectedEvent.sourceLat != null && selectedEvent.sourceLng != null) {
        endpointPoints.push({
          _kind: 'arc-endpoint' as const,
          data: { label: selectedEvent.sourceLocation ?? selectedEvent.sourceCountryCode ?? 'Source', color: srcColor },
          lat: selectedEvent.sourceLat,
          lng: selectedEvent.sourceLng,
        })
      }
      if (selectedEvent.targetLat != null && selectedEvent.targetLng != null) {
        endpointPoints.push({
          _kind: 'arc-endpoint' as const,
          data: { label: selectedEvent.targetLocation ?? selectedEvent.targetCountryCode ?? 'Target', color: srcColor },
          lat: selectedEvent.targetLat,
          lng: selectedEvent.targetLng,
        })
      }
    }

    return [...basePoints, ...eventPoints, ...endpointPoints, ...strikePointsData, ...aircraftPointsData, ...flightawarePointsData, ...satellitePointsData, ...vesselPointsData, ...marinetrafficPointsData, ...strategicPointsData]
  }, [filteredBases, filteredEvents, showEvents, showBases, selectedEvent, strikePointsData, aircraftPointsData, flightawarePointsData, satellitePointsData, vesselPointsData, marinetrafficPointsData, strategicPointsData, expandedCluster, zoomScale])

  // HTML markers for event clusters (count badges)
  const eventClusterHtmlMarkers = useMemo(() => {
    if (!showEvents) return []
    return pointsData
      .filter((pt): pt is import('@/hooks/useGlobeInteraction').GlobeEventClusterPoint => pt._kind === 'event-cluster')
      .map((pt) => {
        const color = getEventColor(pt.data.events[0])
        return {
          lat: pt.lat,
          lng: pt.lng,
          alt: 0,
          el: createEventClusterElement(pt.data.count, color),
        }
      })
  }, [pointsData, showEvents])

  // Spoke arcs from expanded cluster center to each fanned-out event
  const expandedSpokeArcs = useMemo(() => {
    if (!expandedCluster || !showEvents) return []
    const step = (2 * Math.PI) / expandedCluster.events.length
    const radius = Math.max(0.4, 0.8 * zoomScale)
    return expandedCluster.events.map((e, i) => ({
      startLat: expandedCluster.lat,
      startLng: expandedCluster.lng,
      endLat: expandedCluster.lat + radius * Math.sin(i * step),
      endLng: expandedCluster.lng + radius * Math.cos(i * step),
      color: [`${getEventColor(e)}60`, `${getEventColor(e)}60`],
      stroke: 0.08,
      dashLen: 0.5,
      dashGap: 0.3,
      animateTime: 0,
    }))
  }, [expandedCluster, showEvents, zoomScale])

  // Imagery bbox outline — shows scene boundary so user knows where to zoom
  const imageryBboxPolygon = useMemo(() => {
    if (!imageryOverlay) return []
    const [west, south, east, north] = imageryOverlay.bbox
    return [{
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ]],
      },
      label: `Sentinel-2 scene — zoom in for 10m imagery`,
      capColor: '#9B5DE510',
      sideColor: '#9B5DE520',
      strokeColor: '#9B5DE5',
      _type: 'imagery-bbox',
      _id: `imagery-${imageryOverlay.itemId}`,
    }]
  }, [imageryOverlay])

  // Pakistan boundary including Kashmir (single merged polygon, no internal border)
  const pakistanPolygonData = useMemo(() => [{
    geometry: PAKISTAN_POLYGON,
    label: 'Pakistan',
    capColor: 'rgba(0,200,83,0.05)',
    sideColor: 'rgba(0,200,83,0.02)',
    strokeColor: '#00C853',
    _type: 'pakistan-boundary',
    _id: 'pakistan',
  }], [])

  // Merge live polygons + imagery bbox + Pakistan boundary
  const allPolygonData = useMemo(
    () => [...pakistanPolygonData, ...polygonData, ...imageryBboxPolygon],
    [pakistanPolygonData, polygonData, imageryBboxPolygon],
  )

  // Rings data — neon glow halos around event/cluster markers + strike blast radii
  const ringsData = useMemo(() => {
    const eventRings = showEvents
      ? pointsData
          .filter((pt) => pt._kind === 'event' || pt._kind === 'event-cluster')
          .map((pt) => {
            const color = pt._kind === 'event' ? getEventColor(pt.data) : '#E63946'
            return {
              lat: pt.lat,
              lng: pt.lng,
              maxR: (pt._kind === 'event-cluster' ? 1.6 : 1.2) * zoomScale,
              propagationSpeed: 0.8,
              repeatPeriod: pt._kind === 'event-cluster' ? 1200 : 1800,
              color: [`${color}CC`, `${color}44`, `${color}00`],
            }
          })
      : []
    return [...eventRings, ...strikeRingsData]
  }, [pointsData, showEvents, zoomScale, strikeRingsData])

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
      dashLen: number
      dashGap: number
      animateTime: number
    }

    const arcs: ArcDatum[] = []

    // Selected event: solid arcs from source → event → target
    // Skip arcs to Null Island (0,0) or arcs that point to the same location as the event
    if (selectedEvent && selectedEvent.sourceLat != null && selectedEvent.sourceLng != null
      && !(selectedEvent.sourceLat === 0 && selectedEvent.sourceLng === 0)
      && !(selectedEvent.sourceLat === selectedEvent.lat && selectedEvent.sourceLng === selectedEvent.lng)) {
      const srcColor = getEventColor(selectedEvent)
      arcs.push({
        startLat: selectedEvent.sourceLat,
        startLng: selectedEvent.sourceLng,
        endLat: selectedEvent.lat,
        endLng: selectedEvent.lng,
        color: [srcColor, srcColor, srcColor, srcColor],
        stroke: 0.15,
        dashLen: 1,
        dashGap: 0,
        animateTime: 0,
      })
    }

    if (selectedEvent && selectedEvent.targetLat != null && selectedEvent.targetLng != null
      && !(selectedEvent.targetLat === 0 && selectedEvent.targetLng === 0)
      && !(selectedEvent.targetLat === selectedEvent.lat && selectedEvent.targetLng === selectedEvent.lng)) {
      const srcColor = getEventColor(selectedEvent)
      arcs.push({
        startLat: selectedEvent.lat,
        startLng: selectedEvent.lng,
        endLat: selectedEvent.targetLat,
        endLng: selectedEvent.targetLng,
        color: [srcColor, srcColor, srcColor, srcColor],
        stroke: 0.15,
        dashLen: 1,
        dashGap: 0,
        animateTime: 0,
      })
    }

    // Strike arcs (origin → impact) — dashed + animated
    for (const s of strikeArcsData) {
      arcs.push({ ...s, dashLen: 0.6, dashGap: 0.1, animateTime: 2000 })
    }

    // Spoke arcs for expanded event cluster
    arcs.push(...expandedSpokeArcs)

    return arcs
  }, [selectedEvent, strikeArcsData, expandedSpokeArcs])

  // Resolve tile engine — overlay Sentinel-2 tiles within bbox when active
  const tileEngineUrl = useMemo(() => {
    const baseTile = mapLayer === 'street' ? streetTileUrl : mapLayer === 'dark' ? darkTileUrl : satelliteTileUrl

    if (!imageryOverlay) return baseTile

    const { itemId, bbox } = imageryOverlay
    return (x: number, y: number, level: number) => {
      if (tileIntersectsBbox(x, y, level, bbox)) {
        return sentinel2TileUrl(x, y, level, itemId)
      }
      return baseTile(x, y, level)
    }
  }, [mapLayer, imageryOverlay])

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

  // Adjust bump scale when 3D terrain is toggled
  useEffect(() => {
    if (!globeRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globe = globeRef.current as any
    const material = globe.globeMaterial?.() ?? globe.scene?.().children?.find?.((c: any) => c.type === 'Mesh')?.material
    if (material) {
      material.bumpScale = terrain3d ? 8 : 0
      material.needsUpdate = true
    }
  }, [terrain3d])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden z-0">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={BG_COLOR}
          globeTileEngineUrl={tileEngineUrl}
          bumpImageUrl={terrain3d ? '//unpkg.com/three-globe/example/img/earth-topology.png' : null}
          atmosphereColor={ATMOSPHERE_COLOR}
          atmosphereAltitude={0.2}
          // Points layer — flat 2D dots on the surface
          pointsMerge={false}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0}
          pointRadius={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'strategic') return 0 // rendered as HTML markers
            if (pt._kind === 'strike') return EVENT_RADIUS * 1.2 * zoomScale
            if (pt._kind === 'aircraft' || pt._kind === 'aircraft-cluster' || pt._kind === 'flightaware') return 0 // rendered as HTML
            if (pt._kind === 'satellite') return 0 // rendered as 3D objects
            if (pt._kind === 'vessel' || pt._kind === 'vessel-cluster' || pt._kind === 'marinetraffic') return 0 // rendered as HTML
            if (pt._kind === 'event-cluster') return 0 // rendered as HTML
            if (pt._kind === 'arc-endpoint') return BASE_RADIUS * 0.8 * zoomScale
            if (pt._kind === 'event') {
              if (pt.data.source === 'gdelt_enhanced' && pt.data.metadata?.ai_relevance_score == null) {
                return EVENT_RADIUS * 0.5 * zoomScale
              }
              return EVENT_RADIUS * zoomScale
            }
            return BASE_RADIUS * zoomScale
          }}
          pointColor={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'strategic') return getStrategicColor(pt.data.layerId)
            if (pt._kind === 'event') return getEventColor(pt.data)
            if (pt._kind === 'event-cluster') return '#E63946'
            if (pt._kind === 'strike') return '#E63946'
            if (pt._kind === 'aircraft') return getAircraftColor(pt.data.category)
            if (pt._kind === 'flightaware') return getAircraftColor(pt.data.category, 'flightaware')
            if (pt._kind === 'aircraft-cluster') return LAYER_COLORS.aircraft
            if (pt._kind === 'satellite') return getSatelliteColor(pt.data.category)
            if (pt._kind === 'vessel') return getVesselColor(pt.data.vesselType)
            if (pt._kind === 'marinetraffic') return getMarineTrafficVesselColor(pt.data.vesselType)
            if (pt._kind === 'vessel-cluster') return LAYER_COLORS.maritime
            if (pt._kind === 'base') return getBaseColor(pt.data.type)
            if (pt._kind === 'arc-endpoint') return pt.data.color
            return '#94A3B8'
          }}
          pointLabel={(d: object) => {
            const pt = d as GlobePoint
            if (pt._kind === 'strategic') return strategicTooltipHtml(pt.data)
            if (pt._kind === 'event') return eventTooltipHtml(pt.data)
            if (pt._kind === 'event-cluster') return `<div style="background:#0F172A;border:1px solid #E6394640;border-radius:8px;padding:8px 12px;font-family:system-ui,sans-serif;"><span style="color:#fff;font-size:13px;font-weight:600;">${pt.data.count} events</span><br/><span style="color:#94A3B8;font-size:11px;">Click to expand</span></div>`
            if (pt._kind === 'base') return baseTooltipHtml(pt.data)
            if (pt._kind === 'aircraft' || pt._kind === 'flightaware') {
              const ac = pt.data
              const operatorLine = ac.operator ? `<br/>${ac.operator}` : ''
              const regLine = ac.registration ? ` [${ac.registration}]` : ''
              const srcLabel = pt._kind === 'flightaware' ? ' (FA)' : ''
              return `<div style="text-align:center;font-size:12px"><b>${ac.callsign || ac.icao24}</b>${regLine}${srcLabel}${operatorLine}<br/>${ac.originCountry}<br/>Alt: ${Math.round(ac.altitude)}m | ${Math.round(ac.velocity)}m/s</div>`
            }
            if (pt._kind === 'satellite') {
              const s = pt.data
              return `<div style="text-align:center;font-size:12px"><b>${s.name}</b><br/>${s.category}<br/>Alt: ${Math.round(s.altKm).toLocaleString()}km | ${s.velocity.toFixed(1)}km/s</div>`
            }
            if (pt._kind === 'vessel' || pt._kind === 'marinetraffic') {
              const v = pt.data
              const ownerLine = v.owner ? `<br/>Owner: ${v.owner}` : ''
              const flagLine = v.flagCountry ? `<br/>Flag: ${v.flagCountry}` : ''
              const srcLabel = pt._kind === 'marinetraffic' ? ' (MT)' : ''
              return `<div style="text-align:center;font-size:12px"><b>${v.name}</b>${srcLabel}${ownerLine}${flagLine}<br/>${v.vesselType}<br/>Speed: ${v.speed.toFixed(1)}kn</div>`
            }
            if (pt._kind === 'arc-endpoint') {
              return `<div style="text-align:center;font-size:12px;color:${pt.data.color}"><b>${pt.data.label}</b></div>`
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
          arcDashLength={(d: object) => (d as { dashLen: number }).dashLen}
          arcDashGap={(d: object) => (d as { dashGap: number }).dashGap}
          arcDashAnimateTime={(d: object) => (d as { animateTime: number }).animateTime}
          arcStroke={(d: object) => (d as { stroke: number }).stroke}
          // Rings layer — neon glow on events + strike blast
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={(d: object) => (d as { color: string[] }).color}
          // HTML Elements layer — aircraft + maritime + strategic markers
          htmlElementsData={[...htmlMarkersData, ...strategicHtmlMarkers, ...eventClusterHtmlMarkers]}
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
          polygonsData={allPolygonData}
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
            globeRefHolder.current = globeRef.current ?? null
          }}
        />
      )}
      <GlobeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      {/* Sentinel-2 imagery overlay indicator */}
      {imageryOverlay && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/90 backdrop-blur-sm border border-purple-500/40 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs text-purple-200 font-medium">
            Sentinel-2 overlay active — zoom in for 10m detail
          </span>
          <button
            onClick={() => setImageryOverlay(null)}
            className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-600/40 text-purple-200 hover:bg-purple-600/70 border border-purple-500/30 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
