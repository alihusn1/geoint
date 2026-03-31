import { create } from 'zustand'

export const STRATEGIC_LAYER_CATALOG: Record<string, { label: string; color: string; icon: string }> = {
  air_missile_defense_v2:     { label: 'Air & Missile Defense',   color: '#E63946', icon: 'ShieldAlert' },
  communications_cyber:       { label: 'Comms & Cyber',           color: '#FCBF49', icon: 'Radio' },
  defense_industry_v2:        { label: 'Defense Industry',        color: '#F77F00', icon: 'Factory' },
  energy_infrastructure:      { label: 'Energy Infrastructure',   color: '#FF6B35', icon: 'Zap' },
  foreign_military_bases:     { label: 'Foreign Military Bases',  color: '#00B4D8', icon: 'Flag' },
  geopolitical_hotspots:      { label: 'Geopolitical Hotspots',   color: '#F43F5E', icon: 'Flame' },
  intelligence_surveillance:  { label: 'Intel & Surveillance',    color: '#2A9D8F', icon: 'Eye' },
  naval_chokepoints_maritime: { label: 'Naval & Maritime',        color: '#4D78B3', icon: 'Anchor' },
  nuclear_sites_expanded_v2:  { label: 'Nuclear Sites',           color: '#FF6B6B', icon: 'Radiation' },
  pakistan_strategic_layers:   { label: 'Pakistan Strategic',      color: '#22D3EE', icon: 'Target' },
  space_satellite:            { label: 'Space & Satellite',       color: '#9B5DE5', icon: 'Orbit' },
}

interface StrategicLayerState {
  enabledLayers: Record<string, boolean>
  geojsonData: Record<string, GeoJSON.FeatureCollection>
  csvData: Record<string, { columns: string[]; rows: Record<string, unknown>[] }>
  activeCSVLayer: string | null
  loading: boolean
  error: string | null

  toggleLayer: (id: string) => void
  enableAll: () => void
  disableAll: () => void
  setActiveCSVLayer: (id: string | null) => void
  setGeojsonData: (data: Record<string, GeoJSON.FeatureCollection>) => void
  setCsvData: (id: string, data: { columns: string[]; rows: Record<string, unknown>[] }) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// All layers start disabled
const initialEnabled: Record<string, boolean> = {}
for (const key of Object.keys(STRATEGIC_LAYER_CATALOG)) {
  initialEnabled[key] = false
}

export const useStrategicLayerStore = create<StrategicLayerState>()((set) => ({
  enabledLayers: initialEnabled,
  geojsonData: {},
  csvData: {},
  activeCSVLayer: null,
  loading: false,
  error: null,

  toggleLayer: (id) =>
    set((s) => ({
      enabledLayers: { ...s.enabledLayers, [id]: !s.enabledLayers[id] },
    })),

  enableAll: () =>
    set(() => {
      const all: Record<string, boolean> = {}
      for (const key of Object.keys(STRATEGIC_LAYER_CATALOG)) all[key] = true
      return { enabledLayers: all }
    }),

  disableAll: () =>
    set(() => {
      const all: Record<string, boolean> = {}
      for (const key of Object.keys(STRATEGIC_LAYER_CATALOG)) all[key] = false
      return { enabledLayers: all }
    }),

  setActiveCSVLayer: (activeCSVLayer) => set({ activeCSVLayer }),
  setGeojsonData: (geojsonData) => set({ geojsonData }),
  setCsvData: (id, data) =>
    set((s) => ({ csvData: { ...s.csvData, [id]: data } })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
