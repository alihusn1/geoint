import { useMemo, useEffect, useRef } from 'react'
import { useLiveStore } from '@/store/useLiveStore'
import { useDataStore } from '@/store/useDataStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { createAircraftElement, updateAircraftElement } from '@/components/LiveLayers/AircraftMarker'
import { createVesselElement, updateVesselElement } from '@/components/LiveLayers/VesselMarker'
import { createMarineTrafficElement, updateMarineTrafficElement } from '@/components/LiveLayers/MarineTrafficMarker'
import { createClusterElement } from '@/components/LiveLayers/ClusterMarker'
import { createSatelliteObject } from '@/components/LiveLayers/SatelliteObject'
import { clusterPoints, getClusterCellSize, filterViewport } from '@/utils/clustering'
import * as THREE from 'three'
import {
  getAircraftLive,
  getFlightAwareLive,
  getSatelliteCatalog,
  getJammingHeatmap,
  getMaritimeVessels,
  getAirspaceRestrictions,
  getMarineTrafficLive,
} from '@/services/liveService'
import { getFrontlineLatest } from '@/services/frontlineService'
import {
  generateMockAircraft,
  generateMockFlightaware,
  generateMockSatellites,
  generateMockJamming,
  generateMockVessels,
  generateMockMarineTraffic,
  generateMockAirspace,
  generateMockStrikes,
  generateMockFrontlines,
} from '@/data/mockLiveData'
import { LAYER_COLORS } from '@/utils/liveColors'
import type {
  AircraftState,
  SatellitePosition,
  VesselState,
  AirspaceRestriction,
  StrikeEvent,
  JammingPoint,
  FrontlineData,
  LiveLayerName,
} from '@/types/live'

// ── Normalize aircraft data from backend (latitude→lat, longitude→lng) ──
function normalizeAircraft(raw: any): AircraftState {
  return {
    ...raw,
    lat: raw.lat ?? raw.latitude,
    lng: raw.lng ?? raw.longitude,
    originCountry: raw.originCountry ?? raw.origin_country ?? 'Unknown',
    verticalRate: raw.verticalRate ?? raw.vertical_rate ?? 0,
    onGround: raw.onGround ?? raw.on_ground ?? false,
    lastContact: raw.lastContact ?? raw.last_contact ?? 0,
    operatorCategory: raw.operatorCategory ?? raw.operator_category ?? undefined,
    aircraftType: raw.aircraftType ?? raw.aircraft_type ?? undefined,
  }
}

// ── Normalize vessel data from backend (latitude→lat, longitude→lng, snake_case→camelCase) ──
function normalizeVessel(raw: any): VesselState {
  return {
    ...raw,
    lat: raw.lat ?? raw.latitude,
    lng: raw.lng ?? raw.longitude,
    mmsi: raw.mmsi ?? raw.MMSI ?? '',
    name: raw.name ?? raw.shipname ?? raw.vessel_name ?? 'Unknown',
    heading: raw.heading ?? raw.course ?? 0,
    speed: raw.speed ?? raw.sog ?? 0,
    vesselType: raw.vesselType ?? raw.vessel_type ?? raw.ship_type ?? 'unknown',
    destination: raw.destination ?? null,
    owner: raw.owner ?? undefined,
    flagCountry: raw.flagCountry ?? raw.flag_country ?? raw.flag ?? undefined,
    imo: raw.imo ?? raw.IMO ?? undefined,
  }
}

// ── Normalize satellite data from backend (norad_id→noradId, alt_km→altKm) ──
function normalizeSatellite(raw: any): SatellitePosition {
  return {
    ...raw,
    noradId: raw.noradId ?? raw.norad_id ?? 0,
    altKm: raw.altKm ?? raw.alt_km ?? 0,
    color: raw.color ?? '#9B5DE5',
  }
}

// Cache mock data so it's stable across renders
let cachedMock: Record<string, unknown[]> | null = null
function getMockData() {
  if (!cachedMock) {
    cachedMock = {
      aircraft: generateMockAircraft(),
      flightaware: generateMockFlightaware(),
      satellites: generateMockSatellites(),
      gpsJamming: generateMockJamming(),
      maritime: generateMockVessels(),
      marinetraffic: generateMockMarineTraffic(),
      airspace: generateMockAirspace(),
      strikes: generateMockStrikes(),
      frontlines: generateMockFrontlines(),
    }
  }
  return cachedMock
}

// Global bbox for initial REST fetches (worldwide)
const GLOBAL_BBOX = '-90,-180,90,180'

// Map layer names to their REST fetch functions
const LAYER_FETCHERS: Partial<Record<LiveLayerName, () => Promise<unknown>>> = {
  aircraft: () => getAircraftLive(GLOBAL_BBOX),
  flightaware: () => getFlightAwareLive(),
  satellites: () => getSatelliteCatalog('all'),
  gpsJamming: () => getJammingHeatmap(GLOBAL_BBOX),
  maritime: () => getMaritimeVessels(GLOBAL_BBOX),
  marinetraffic: () => getMarineTrafficLive(),
  airspace: () => getAirspaceRestrictions(GLOBAL_BBOX),
  frontlines: () => getFrontlineLatest().then((res: any) => {
    // API returns a single object; wrap into array for the layer system
    if (res && res.id && res.geojson && Object.keys(res.geojson).length > 0) return [res]
    return []
  }),
}

export function useLiveLayerData() {
  const layers = useLiveStore((s) => s.layers)
  const setLayerData = useLiveStore((s) => s.setLayerData)
  const setLayerLoading = useLiveStore((s) => s.setLayerLoading)
  const setLayerError = useLiveStore((s) => s.setLayerError)
  const satelliteCategories = useLiveStore((s) => s.satelliteCategories)
  const mode = useDataStore((s) => s.mode)
  const loadedRef = useRef<Set<string>>(new Set())

  // ── Zoom state for clustering (quantized to reduce recalc) ──
  const zoomAlt = useGlobeStore((s) => Math.round(s.zoomAltitude * 10) / 10)
  const viewLat = useGlobeStore((s) => Math.round(s.viewCenter.lat))
  const viewLng = useGlobeStore((s) => Math.round(s.viewCenter.lng))

  const clusterCellSize = useMemo(() => getClusterCellSize(zoomAlt), [zoomAlt])
  const viewRadius = useMemo(() => Math.min(180, zoomAlt * 60 + 10), [zoomAlt])

  // ── Stable-identity caches (keyed by entity ID) ──
  const aircraftCacheRef = useRef<Map<string, { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }>>(new Map())
  const flightawareCacheRef = useRef<Map<string, { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }>>(new Map())
  const vesselCacheRef = useRef<Map<string, { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }>>(new Map())
  const marinetrafficCacheRef = useRef<Map<string, { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }>>(new Map())
  const satCacheRef = useRef<Map<number, { lat: number; lng: number; alt: number; obj: THREE.Group; name: string; _data: SatellitePosition }>>(new Map())

  // ── Normalized + viewport-filtered data (shared between points + html) ──
  const normalizedAircraft = useMemo(() => {
    if (!layers.aircraft.enabled || layers.aircraft.data.length === 0) return []
    return (layers.aircraft.data as AircraftState[]).map(normalizeAircraft)
  }, [layers.aircraft.enabled, layers.aircraft.data])

  const visibleAircraft = useMemo(
    () => filterViewport(normalizedAircraft, viewLat, viewLng, viewRadius),
    [normalizedAircraft, viewLat, viewLng, viewRadius],
  )

  // ── Normalized + viewport-filtered FlightAware data ──
  const normalizedFlightaware = useMemo(() => {
    if (!layers.flightaware.enabled || layers.flightaware.data.length === 0) return []
    return (layers.flightaware.data as AircraftState[]).map(normalizeAircraft)
  }, [layers.flightaware.enabled, layers.flightaware.data])

  const visibleFlightaware = useMemo(
    () => filterViewport(normalizedFlightaware, viewLat, viewLng, viewRadius),
    [normalizedFlightaware, viewLat, viewLng, viewRadius],
  )

  const normalizedVessels = useMemo(() => {
    if (!layers.maritime.enabled || layers.maritime.data.length === 0) return []
    return (layers.maritime.data as VesselState[]).map(normalizeVessel)
  }, [layers.maritime.enabled, layers.maritime.data])

  const visibleVessels = useMemo(
    () => filterViewport(normalizedVessels, viewLat, viewLng, viewRadius),
    [normalizedVessels, viewLat, viewLng, viewRadius],
  )

  // ── Normalized + viewport-filtered MarineTraffic data ──
  const normalizedMarineTraffic = useMemo(() => {
    if (!layers.marinetraffic.enabled || layers.marinetraffic.data.length === 0) return []
    return (layers.marinetraffic.data as VesselState[]).map(normalizeVessel)
  }, [layers.marinetraffic.enabled, layers.marinetraffic.data])

  const visibleMarineTraffic = useMemo(
    () => filterViewport(normalizedMarineTraffic, viewLat, viewLng, viewRadius),
    [normalizedMarineTraffic, viewLat, viewLng, viewRadius],
  )

  // ── Aircraft clustered data ──
  const aircraftClusters = useMemo(
    () => clusterPoints(visibleAircraft, clusterCellSize),
    [visibleAircraft, clusterCellSize],
  )

  // ── FlightAware clustered data ──
  const flightawareClusters = useMemo(
    () => clusterPoints(visibleFlightaware, clusterCellSize),
    [visibleFlightaware, clusterCellSize],
  )

  // ── Vessel clustered data ──
  const vesselClusters = useMemo(
    () => clusterPoints(visibleVessels, clusterCellSize),
    [visibleVessels, clusterCellSize],
  )

  // ── MarineTraffic clustered data ──
  const marinetrafficClusters = useMemo(
    () => clusterPoints(visibleMarineTraffic, clusterCellSize),
    [visibleMarineTraffic, clusterCellSize],
  )

  // Fetch live data via REST when layer is enabled (online mode)
  // Falls back to mock data on failure or in offline mode
  useEffect(() => {
    const mock = getMockData()
    for (const name of Object.keys(layers) as LiveLayerName[]) {
      const layer = layers[name]
      if (!layer.enabled) {
        loadedRef.current.delete(name)
        continue
      }
      if (layer.data.length > 0 || layer.loading || loadedRef.current.has(name)) continue
      loadedRef.current.add(name)

      const fetcher = LAYER_FETCHERS[name]
      if (mode === 'online' && fetcher) {
        setLayerLoading(name, true)
        console.log(`[LiveLayer] Fetching "${name}" via REST…`)
        const t0 = performance.now()
        fetcher()
          .then((res: any) => {
            const elapsed = ((performance.now() - t0) / 1000).toFixed(2)
            console.log(`[LiveLayer] "${name}" response in ${elapsed}s — type=${typeof res}, isArray=${Array.isArray(res)}`)
            if (res && typeof res === 'object' && !Array.isArray(res)) {
              console.log(`[LiveLayer] "${name}" response keys:`, Object.keys(res))
              if (res.count != null) console.log(`[LiveLayer] "${name}" res.count=${res.count}`)
              if (res.satellites) console.log(`[LiveLayer] "${name}" res.satellites.length=${res.satellites.length}`)
              if (res.data) console.log(`[LiveLayer] "${name}" res.data.length=${res.data?.length}`)
              if (res.results) console.log(`[LiveLayer] "${name}" res.results.length=${res.results?.length}`)
            }
            const data = Array.isArray(res) ? res : res?.data ?? res?.results ?? res?.satellites ?? res?.states ?? res?.aircraft ?? res?.vessels ?? res?.restrictions ?? []
            console.log(`[LiveLayer] "${name}" extracted ${data.length} items`)
            if (data.length > 0) {
              if (name === 'satellites' && data.length > 0) {
                console.log(`[LiveLayer] First satellite sample:`, JSON.stringify(data[0]).slice(0, 300))
              }
              setLayerData(name, data)
            } else {
              console.warn(`[LiveLayer] "${name}" API returned empty — falling back to ${(mock[name] as unknown[])?.length ?? 0} mocks`)
              setLayerData(name, mock[name] as unknown[])
            }
          })
          .catch((err: any) => {
            const elapsed = ((performance.now() - t0) / 1000).toFixed(2)
            console.error(`[LiveLayer] "${name}" FAILED after ${elapsed}s:`, err?.message ?? err)
            setLayerError(name, 'API unavailable — using mock data')
            setLayerData(name, mock[name] as unknown[])
          })
      } else {
        // Offline mode — use mock data directly
        setLayerData(name, mock[name] as unknown[])
      }
    }
  }, [layers, mode, setLayerData, setLayerLoading, setLayerError])

  // ── Aircraft Points (clustered — for click detection via pointsData) ──
  const aircraftPointsData = useMemo(() => {
    return aircraftClusters.map((c) => {
      if (c.items.length === 1) {
        return {
          _kind: 'aircraft' as const,
          data: c.items[0],
          lat: c.lat,
          lng: c.lng,
        }
      }
      return {
        _kind: 'aircraft-cluster' as const,
        data: { count: c.items.length },
        lat: c.lat,
        lng: c.lng,
      }
    })
  }, [aircraftClusters])

  // ── FlightAware Points (clustered — for click detection via pointsData) ──
  const flightawarePointsData = useMemo(() => {
    return flightawareClusters.map((c) => {
      if (c.items.length === 1) {
        return {
          _kind: 'flightaware' as const,
          data: c.items[0],
          lat: c.lat,
          lng: c.lng,
        }
      }
      return {
        _kind: 'aircraft-cluster' as const,
        data: { count: c.items.length },
        lat: c.lat,
        lng: c.lng,
      }
    })
  }, [flightawareClusters])

  // ── Aircraft HTML Markers (clustered — SVG icons for singles, circles for clusters) ──
  const aircraftHtmlData = useMemo(() => {
    const cache = aircraftCacheRef.current
    if (aircraftClusters.length === 0) {
      cache.clear()
      return []
    }

    const activeIds = new Set<string>()
    const result: { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }[] = []

    for (const c of aircraftClusters) {
      if (c.items.length === 1) {
        const ac = c.items[0]
        const key = ac.icao24
        activeIds.add(key)
        const existing = cache.get(key)
        if (existing) {
          existing.lat = ac.lat
          existing.lng = ac.lng
          updateAircraftElement(existing.el, ac)
          result.push(existing)
        } else {
          const entry = { lat: ac.lat, lng: ac.lng, alt: 0, el: createAircraftElement(ac), _markerType: 'aircraft' as const }
          cache.set(key, entry)
          result.push(entry)
        }
      } else {
        result.push({
          lat: c.lat,
          lng: c.lng,
          alt: 0,
          el: createClusterElement(c.items.length, LAYER_COLORS.aircraft, 'aircraft'),
          _markerType: 'cluster',
        })
      }
    }

    for (const key of cache.keys()) {
      if (!activeIds.has(key)) cache.delete(key)
    }
    return result
  }, [aircraftClusters])

  // ── FlightAware HTML Markers (clustered — SVG icons for singles, circles for clusters) ──
  const flightawareHtmlData = useMemo(() => {
    const cache = flightawareCacheRef.current
    if (flightawareClusters.length === 0) {
      cache.clear()
      return []
    }

    const activeIds = new Set<string>()
    const result: { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }[] = []

    for (const c of flightawareClusters) {
      if (c.items.length === 1) {
        const ac = c.items[0]
        const key = ac.icao24
        activeIds.add(key)
        const existing = cache.get(key)
        if (existing) {
          existing.lat = ac.lat
          existing.lng = ac.lng
          updateAircraftElement(existing.el, ac, 'flightaware')
          result.push(existing)
        } else {
          const entry = { lat: ac.lat, lng: ac.lng, alt: 0, el: createAircraftElement(ac, 'flightaware'), _markerType: 'flightaware' as const }
          cache.set(key, entry)
          result.push(entry)
        }
      } else {
        result.push({
          lat: c.lat,
          lng: c.lng,
          alt: 0,
          el: createClusterElement(c.items.length, LAYER_COLORS.flightaware, 'aircraft'),
          _markerType: 'cluster',
        })
      }
    }

    for (const key of cache.keys()) {
      if (!activeIds.has(key)) cache.delete(key)
    }
    return result
  }, [flightawareClusters])

  // ── Filtered + normalized satellite list (shared by points + objects + paths) ──
  const filteredSatellites = useMemo(() => {
    if (!layers.satellites.enabled || layers.satellites.data.length === 0) return []
    return (layers.satellites.data as SatellitePosition[])
      .map(normalizeSatellite)
      .filter((sat) => satelliteCategories.has(sat.category))
  }, [layers.satellites.enabled, layers.satellites.data, satelliteCategories])

  // ── Satellite Points (for click detection via pointsData) ──
  const satellitePointsData = useMemo(() => {
    return filteredSatellites.map((sat) => ({
      _kind: 'satellite' as const,
      data: sat,
      lat: sat.lat,
      lng: sat.lng,
    }))
  }, [filteredSatellites])

  // ── Vessel Points (clustered — for click detection via pointsData) ──
  const vesselPointsData = useMemo(() => {
    return vesselClusters.map((c) => {
      if (c.items.length === 1) {
        return {
          _kind: 'vessel' as const,
          data: c.items[0],
          lat: c.lat,
          lng: c.lng,
        }
      }
      return {
        _kind: 'vessel-cluster' as const,
        data: { count: c.items.length },
        lat: c.lat,
        lng: c.lng,
      }
    })
  }, [vesselClusters])

  // ── Vessel HTML Markers (clustered — SVG icons for singles, circles for clusters) ──
  const vesselHtmlData = useMemo(() => {
    const cache = vesselCacheRef.current
    if (vesselClusters.length === 0) {
      cache.clear()
      return []
    }

    const activeIds = new Set<string>()
    const result: { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }[] = []

    for (const c of vesselClusters) {
      if (c.items.length === 1) {
        const v = c.items[0]
        const key = v.mmsi
        activeIds.add(key)
        const existing = cache.get(key)
        if (existing) {
          existing.lat = v.lat
          existing.lng = v.lng
          updateVesselElement(existing.el, v)
          result.push(existing)
        } else {
          const entry = { lat: v.lat, lng: v.lng, alt: 0, el: createVesselElement(v), _markerType: 'vessel' as const }
          cache.set(key, entry)
          result.push(entry)
        }
      } else {
        result.push({
          lat: c.lat,
          lng: c.lng,
          alt: 0,
          el: createClusterElement(c.items.length, LAYER_COLORS.maritime, 'vessel'),
          _markerType: 'cluster',
        })
      }
    }

    for (const key of cache.keys()) {
      if (!activeIds.has(key)) cache.delete(key)
    }
    return result
  }, [vesselClusters])

  // ── MarineTraffic Points (clustered — for click detection via pointsData) ──
  const marinetrafficPointsData = useMemo(() => {
    return marinetrafficClusters.map((c) => {
      if (c.items.length === 1) {
        return {
          _kind: 'marinetraffic' as const,
          data: c.items[0],
          lat: c.lat,
          lng: c.lng,
        }
      }
      return {
        _kind: 'vessel-cluster' as const,
        data: { count: c.items.length },
        lat: c.lat,
        lng: c.lng,
      }
    })
  }, [marinetrafficClusters])

  // ── MarineTraffic HTML Markers (clustered — arrow icons for singles, circles for clusters) ──
  const marinetrafficHtmlData = useMemo(() => {
    const cache = marinetrafficCacheRef.current
    if (marinetrafficClusters.length === 0) {
      cache.clear()
      return []
    }

    const activeIds = new Set<string>()
    const result: { lat: number; lng: number; alt: number; el: HTMLDivElement; _markerType: string }[] = []

    for (const c of marinetrafficClusters) {
      if (c.items.length === 1) {
        const v = c.items[0]
        const key = v.mmsi
        activeIds.add(key)
        const existing = cache.get(key)
        if (existing) {
          existing.lat = v.lat
          existing.lng = v.lng
          updateMarineTrafficElement(existing.el, v)
          result.push(existing)
        } else {
          const entry = { lat: v.lat, lng: v.lng, alt: 0, el: createMarineTrafficElement(v), _markerType: 'marinetraffic' as const }
          cache.set(key, entry)
          result.push(entry)
        }
      } else {
        result.push({
          lat: c.lat,
          lng: c.lng,
          alt: 0,
          el: createClusterElement(c.items.length, LAYER_COLORS.marinetraffic, 'marinetraffic'),
          _markerType: 'cluster',
        })
      }
    }

    for (const key of cache.keys()) {
      if (!activeIds.has(key)) cache.delete(key)
    }
    return result
  }, [marinetrafficClusters])

  const htmlMarkersData = useMemo(
    () => [...aircraftHtmlData, ...flightawareHtmlData, ...vesselHtmlData, ...marinetrafficHtmlData],
    [aircraftHtmlData, flightawareHtmlData, vesselHtmlData, marinetrafficHtmlData],
  )

  // ── Paths (aircraft trails + satellite ground tracks + vessel wakes) ──
  const pathsAllData = useMemo(() => {
    const paths: { points: [number, number][]; color: string; stroke: number; dash: number; gap: number; animateTime: number; _pathType: string }[] = []

    if (layers.aircraft.enabled) {
      for (const ac of normalizedAircraft) {
        if (ac.trail && ac.trail.length > 1) {
          paths.push({
            points: ac.trail,
            color: LAYER_COLORS.aircraft + '80',
            stroke: 0.5,
            dash: 3,
            gap: 1,
            animateTime: 3000,
            _pathType: 'aircraft-trail',
          })
        }
      }
    }

    if (layers.flightaware.enabled) {
      for (const ac of normalizedFlightaware) {
        if (ac.trail && ac.trail.length > 1) {
          paths.push({
            points: ac.trail,
            color: LAYER_COLORS.flightaware + '80',
            stroke: 0.5,
            dash: 3,
            gap: 1,
            animateTime: 3000,
            _pathType: 'flightaware-trail',
          })
        }
      }
    }

    for (const sat of filteredSatellites) {
      if (sat.orbitPath && sat.orbitPath.length > 1) {
        paths.push({
          points: sat.orbitPath,
          color: LAYER_COLORS.satellites + '60',
          stroke: 0.3,
          dash: 2,
          gap: 2,
          animateTime: 5000,
          _pathType: 'satellite-track',
        })
      }
    }

    if (layers.maritime.enabled) {
      for (const v of normalizedVessels) {
        if (v.trail && v.trail.length > 1) {
          paths.push({
            points: v.trail,
            color: LAYER_COLORS.maritime + '60',
            stroke: 0.4,
            dash: 2,
            gap: 1,
            animateTime: 4000,
            _pathType: 'vessel-wake',
          })
        }
      }
    }

    if (layers.marinetraffic.enabled) {
      for (const v of normalizedMarineTraffic) {
        if (v.trail && v.trail.length > 1) {
          paths.push({
            points: v.trail,
            color: LAYER_COLORS.marinetraffic + '60',
            stroke: 0.4,
            dash: 2,
            gap: 1,
            animateTime: 4000,
            _pathType: 'marinetraffic-wake',
          })
        }
      }
    }

    return paths
  }, [layers.aircraft.enabled, normalizedAircraft, layers.flightaware.enabled, normalizedFlightaware, filteredSatellites, layers.maritime.enabled, normalizedVessels, layers.marinetraffic.enabled, normalizedMarineTraffic])

  // ── Heatmap (GPS jamming) ──
  const heatmapData = useMemo(() => {
    if (!layers.gpsJamming.enabled || layers.gpsJamming.data.length === 0) return []
    return [{
      points: layers.gpsJamming.data as JammingPoint[],
    }]
  }, [layers.gpsJamming.enabled, layers.gpsJamming.data])

  // ── Polygons (no-fly zones) ──
  const airspacePolygonData = useMemo(() => {
    if (!layers.airspace.enabled) return []
    return (layers.airspace.data as AirspaceRestriction[]).map((r) => ({
      geometry: { type: 'Polygon' as const, coordinates: r.geometry },
      label: r.label,
      capColor: r.fillColor,
      sideColor: r.fillColor,
      strokeColor: r.strokeColor,
      _type: r.type,
      _id: r.id,
    }))
  }, [layers.airspace.enabled, layers.airspace.data])

  // ── Frontline Polygons ──
  const frontlinePolygonData = useMemo(() => {
    if (!layers.frontlines.enabled || layers.frontlines.data.length === 0) return []
    const items = layers.frontlines.data as FrontlineData[]
    const polygons: { geometry: object; label: string; capColor: string; sideColor: string; strokeColor: string; _type: string; _id: string }[] = []
    for (const item of items) {
      const geojson = item.geojson as any
      if (!geojson) continue
      const features = geojson.type === 'FeatureCollection'
        ? geojson.features
        : geojson.type === 'Feature'
          ? [geojson]
          : [{ type: 'Feature', geometry: geojson, properties: {} }]
      for (const feature of features ?? []) {
        if (!feature.geometry) continue
        polygons.push({
          geometry: feature.geometry,
          label: feature.properties?.name ?? `Frontline ${item.source}`,
          capColor: '#EF444430',
          sideColor: '#EF444420',
          strokeColor: '#EF4444',
          _type: 'frontline',
          _id: `frontline-${item.id}-${polygons.length}`,
        })
      }
    }
    return polygons
  }, [layers.frontlines.enabled, layers.frontlines.data])

  // Merge all polygon data
  const polygonData = useMemo(
    () => [...airspacePolygonData, ...frontlinePolygonData],
    [airspacePolygonData, frontlinePolygonData],
  )

  // ── Satellite 3D Objects ──
  const satelliteObjectsData = useMemo(() => {
    const cache = satCacheRef.current
    const activeIds = new Set<number>()
    const result: (typeof cache extends Map<number, infer V> ? V : never)[] = []

    for (const sat of filteredSatellites) {
      const key = sat.noradId
      activeIds.add(key)
      const alt = Math.min(2.0, Math.log10(sat.altKm / 100 + 1) * 0.35)
      const existing = cache.get(key)
      if (existing) {
        existing.lat = sat.lat
        existing.lng = sat.lng
        existing.alt = alt
        existing._data = sat
        result.push(existing)
      } else {
        const entry = {
          lat: sat.lat,
          lng: sat.lng,
          alt,
          obj: createSatelliteObject({ color: sat.color, category: sat.category }),
          name: sat.name,
          _data: sat,
        }
        cache.set(key, entry)
        result.push(entry)
      }
    }
    for (const [key, entry] of cache) {
      if (!activeIds.has(key)) {
        entry.obj.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            const mat = child.material
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
            else mat?.dispose()
          }
        })
        cache.delete(key)
      }
    }
    return result
  }, [filteredSatellites])

  // ── Strike Arcs (origin → impact for missiles/drones) ──
  const strikeArcsData = useMemo(() => {
    if (!layers.strikes.enabled) return []
    return (layers.strikes.data as StrikeEvent[])
      .filter((s) => s.origin)
      .map((s) => ({
        startLat: s.origin!.lat,
        startLng: s.origin!.lng,
        endLat: s.lat,
        endLng: s.lng,
        color: ['#E6394600', '#E63946', '#E63946', '#E6394600'],
        stroke: 0.3,
        _strikeId: s.id,
      }))
  }, [layers.strikes.enabled, layers.strikes.data])

  // ── Strike Rings (blast radius) ──
  const strikeRingsData = useMemo(() => {
    if (!layers.strikes.enabled) return []
    return (layers.strikes.data as StrikeEvent[]).map((s) => ({
      lat: s.lat,
      lng: s.lng,
      maxR: s.blastRadiusKm / 100,
      propagationSpeed: 1.5,
      repeatPeriod: 2500,
      color: ['#E63946CC', '#E6394644', '#E6394600'],
      _strikeId: s.id,
    }))
  }, [layers.strikes.enabled, layers.strikes.data])

  // ── Strike Points (for pointsData merge) ──
  const strikePointsData = useMemo(() => {
    if (!layers.strikes.enabled) return []
    return (layers.strikes.data as StrikeEvent[]).map((s) => ({
      _kind: 'strike' as const,
      data: s,
      lat: s.lat,
      lng: s.lng,
    }))
  }, [layers.strikes.enabled, layers.strikes.data])

  // Cleanup caches on unmount
  useEffect(() => {
    return () => {
      aircraftCacheRef.current.clear()
      flightawareCacheRef.current.clear()
      vesselCacheRef.current.clear()
      marinetrafficCacheRef.current.clear()
      for (const entry of satCacheRef.current.values()) {
        entry.obj.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            const mat = child.material
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
            else mat?.dispose()
          }
        })
      }
      satCacheRef.current.clear()
    }
  }, [])

  // Collect enabled layer names for WS subscription
  const enabledLayers = useMemo(() => {
    return (Object.keys(layers) as LiveLayerName[]).filter((k) => layers[k].enabled)
  }, [layers])

  return {
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
  }
}
