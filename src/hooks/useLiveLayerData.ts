import { useMemo, useEffect, useRef } from 'react'
import { useLiveStore } from '@/store/useLiveStore'
import { useDataStore } from '@/store/useDataStore'
import { createAircraftElement } from '@/components/LiveLayers/AircraftMarker'
import { createVesselElement } from '@/components/LiveLayers/VesselMarker'
import { createSatelliteObject } from '@/components/LiveLayers/SatelliteObject'
import {
  getAircraftLive,
  getSatelliteCatalog,
  getJammingHeatmap,
  getMaritimeVessels,
  getAirspaceRestrictions,
} from '@/services/liveService'
import {
  generateMockAircraft,
  generateMockSatellites,
  generateMockJamming,
  generateMockVessels,
  generateMockAirspace,
  generateMockStrikes,
} from '@/data/mockLiveData'
import { LAYER_COLORS } from '@/utils/liveColors'
import type {
  AircraftState,
  SatellitePosition,
  VesselState,
  AirspaceRestriction,
  StrikeEvent,
  JammingPoint,
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
      satellites: generateMockSatellites(),
      gpsJamming: generateMockJamming(),
      maritime: generateMockVessels(),
      airspace: generateMockAirspace(),
      strikes: generateMockStrikes(),
    }
  }
  return cachedMock
}

// Global bbox for initial REST fetches (worldwide)
const GLOBAL_BBOX = '-90,-180,90,180'

// Map layer names to their REST fetch functions
const LAYER_FETCHERS: Partial<Record<LiveLayerName, () => Promise<unknown>>> = {
  aircraft: () => getAircraftLive(GLOBAL_BBOX),
  satellites: () => getSatelliteCatalog('all'),
  gpsJamming: () => getJammingHeatmap(GLOBAL_BBOX),
  maritime: () => getMaritimeVessels(GLOBAL_BBOX),
  airspace: () => getAirspaceRestrictions(GLOBAL_BBOX),
}

export function useLiveLayerData() {
  const layers = useLiveStore((s) => s.layers)
  const setLayerData = useLiveStore((s) => s.setLayerData)
  const setLayerLoading = useLiveStore((s) => s.setLayerLoading)
  const setLayerError = useLiveStore((s) => s.setLayerError)
  const satelliteCategories = useLiveStore((s) => s.satelliteCategories)
  const mode = useDataStore((s) => s.mode)
  const loadedRef = useRef<Set<string>>(new Set())

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

  // ── Aircraft Points (for click detection via pointsData) ──
  const aircraftPointsData = useMemo(() => {
    if (!layers.aircraft.enabled || layers.aircraft.data.length === 0) return []
    return (layers.aircraft.data as AircraftState[]).map((raw) => {
      const ac = normalizeAircraft(raw)
      return {
        _kind: 'aircraft' as const,
        data: ac,
        lat: ac.lat,
        lng: ac.lng,
      }
    })
  }, [layers.aircraft.enabled, layers.aircraft.data])

  // ── Aircraft HTML Markers (SVG icons with heading rotation) ──
  const aircraftHtmlData = useMemo(() => {
    if (!layers.aircraft.enabled || layers.aircraft.data.length === 0) return []
    const all = (layers.aircraft.data as AircraftState[]).map((raw) => {
      const ac = normalizeAircraft(raw)
      return {
        lat: ac.lat,
        lng: ac.lng,
        alt: 0,
        el: createAircraftElement(ac),
        _markerType: 'aircraft',
      }
    })
    // Cap HTML markers at 500 to keep DOM manageable
    return all.length > 500 ? all.slice(0, 500) : all
  }, [layers.aircraft.enabled, layers.aircraft.data])

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

  // ── Vessel Points (for pointsData merge — WebGL, handles any count) ──
  const vesselPointsData = useMemo(() => {
    if (!layers.maritime.enabled || layers.maritime.data.length === 0) return []
    return (layers.maritime.data as VesselState[]).map((v) => ({
      _kind: 'vessel' as const,
      data: v,
      lat: v.lat,
      lng: v.lng,
    }))
  }, [layers.maritime.enabled, layers.maritime.data])

  // ── HTML Markers (aircraft SVG icons + vessel SVG icons, capped for perf) ──
  const vesselHtmlData = useMemo(() => {
    if (!layers.maritime.enabled) return []
    const vessels = layers.maritime.data as VesselState[]
    const capped = vessels.length > 500 ? vessels.slice(0, 500) : vessels
    return capped.map((v) => ({
      lat: v.lat,
      lng: v.lng,
      alt: 0,
      el: createVesselElement(v),
      _markerType: 'vessel',
    }))
  }, [layers.maritime.enabled, layers.maritime.data])

  const htmlMarkersData = useMemo(
    () => [...aircraftHtmlData, ...vesselHtmlData],
    [aircraftHtmlData, vesselHtmlData],
  )

  // ── Paths (aircraft trails + satellite ground tracks + vessel wakes) ──
  const pathsAllData = useMemo(() => {
    const paths: { points: [number, number][]; color: string; stroke: number; dash: number; gap: number; animateTime: number; _pathType: string }[] = []

    if (layers.aircraft.enabled) {
      for (const raw of layers.aircraft.data as AircraftState[]) {
        const ac = normalizeAircraft(raw)
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
      for (const v of layers.maritime.data as VesselState[]) {
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

    return paths
  }, [layers.aircraft, filteredSatellites, layers.maritime])

  // ── Heatmap (GPS jamming) ──
  const heatmapData = useMemo(() => {
    if (!layers.gpsJamming.enabled || layers.gpsJamming.data.length === 0) return []
    return [{
      points: layers.gpsJamming.data as JammingPoint[],
    }]
  }, [layers.gpsJamming.enabled, layers.gpsJamming.data])

  // ── Polygons (no-fly zones) ──
  const polygonData = useMemo(() => {
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

  // ── Satellite 3D Objects ──
  // Use log scale for altitude: LEO (~400km) ≈ 0.15, GEO (~36000km) ≈ 0.8
  const satelliteObjectsData = useMemo(() => {
    return filteredSatellites.map((sat) => ({
      lat: sat.lat,
      lng: sat.lng,
      alt: Math.min(2.0, Math.log10(sat.altKm / 100 + 1) * 0.35),
      obj: createSatelliteObject({ color: sat.color, category: sat.category }),
      name: sat.name,
      _data: sat,
    }))
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

  // Collect enabled layer names for WS subscription
  const enabledLayers = useMemo(() => {
    return (Object.keys(layers) as LiveLayerName[]).filter((k) => layers[k].enabled)
  }, [layers])

  return {
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
  }
}
