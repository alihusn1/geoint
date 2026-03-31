import { create } from 'zustand'
import type {
  LiveLayerName,
  AircraftState,
  SatellitePosition,
  JammingPoint,
  VesselState,
  AirspaceRestriction,
  StrikeEvent,
  FrontlineData,
  LayerState,
} from '@/types/live'

export const ALL_SAT_CATEGORIES: SatellitePosition['category'][] = [
  'military', 'recon', 'stations', 'station', 'gps-ops', 'navigation', 'weather', 'comms', 'science', 'other',
]

interface LiveLayers {
  aircraft: LayerState<AircraftState>
  flightaware: LayerState<AircraftState>
  satellites: LayerState<SatellitePosition>
  gpsJamming: LayerState<JammingPoint>
  maritime: LayerState<VesselState>
  marinetraffic: LayerState<VesselState>
  airspace: LayerState<AirspaceRestriction>
  strikes: LayerState<StrikeEvent>
  frontlines: LayerState<FrontlineData>
}

function defaultLayer<T>(): LayerState<T> {
  return { enabled: false, data: [], loading: false, error: null, lastUpdated: null }
}

interface LiveState {
  layers: LiveLayers
  satelliteCategories: Set<SatellitePosition['category']>

  toggleLayer: (name: LiveLayerName) => void
  setLayerEnabled: (name: LiveLayerName, enabled: boolean) => void
  setLayerData: (name: LiveLayerName, data: unknown[]) => void
  setLayerLoading: (name: LiveLayerName, loading: boolean) => void
  setLayerError: (name: LiveLayerName, error: string | null) => void
  toggleSatelliteCategory: (cat: SatellitePosition['category']) => void
  setSatelliteCategoriesAll: (enabled: boolean) => void
}

export const useLiveStore = create<LiveState>()((set) => ({
  layers: {
    aircraft: defaultLayer<AircraftState>(),
    flightaware: defaultLayer<AircraftState>(),
    satellites: defaultLayer<SatellitePosition>(),
    gpsJamming: defaultLayer<JammingPoint>(),
    maritime: defaultLayer<VesselState>(),
    marinetraffic: defaultLayer<VesselState>(),
    airspace: defaultLayer<AirspaceRestriction>(),
    strikes: defaultLayer<StrikeEvent>(),
    frontlines: defaultLayer<FrontlineData>(),
  },
  satelliteCategories: new Set<SatellitePosition['category']>(ALL_SAT_CATEGORIES),

  toggleLayer: (name) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [name]: { ...state.layers[name], enabled: !state.layers[name].enabled },
      },
    })),

  setLayerEnabled: (name, enabled) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [name]: { ...state.layers[name], enabled },
      },
    })),

  setLayerData: (name, data) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [name]: {
          ...state.layers[name],
          data,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        },
      },
    })),

  setLayerLoading: (name, loading) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [name]: { ...state.layers[name], loading },
      },
    })),

  setLayerError: (name, error) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [name]: { ...state.layers[name], error, loading: false },
      },
    })),

  toggleSatelliteCategory: (cat) =>
    set((state) => {
      const next = new Set(state.satelliteCategories)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return { satelliteCategories: next }
    }),

  setSatelliteCategoriesAll: (enabled) =>
    set(() => ({
      satelliteCategories: enabled
        ? new Set<SatellitePosition['category']>(ALL_SAT_CATEGORIES)
        : new Set<SatellitePosition['category']>(),
    })),
}))
