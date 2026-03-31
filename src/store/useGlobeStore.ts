import { create } from 'zustand'
import type { CameraPosition, SidebarTab, MilitaryBase, OSINTEvent, AircraftState, SatellitePosition, VesselState, StrategicFeatureData } from '@/types'

type LeftPanel = 'osint' | 'filter' | null

export interface ImageryOverlay {
  itemId: string
  bbox: [number, number, number, number] // [west, south, east, north]
}

interface GlobeState {
  cameraPosition: CameraPosition
  selectedBase: MilitaryBase | null
  selectedEvent: OSINTEvent | null
  selectedAircraft: AircraftState | null
  selectedSatellite: SatellitePosition | null
  selectedVessel: VesselState | null
  selectedStrategicFeature: StrategicFeatureData | null
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  showEvents: boolean
  showBases: boolean
  showArcs: boolean
  autoRotate: boolean
  mapLayer: 'street' | 'dark' | 'satellite'
  leftPanel: LeftPanel
  imageryOverlay: ImageryOverlay | null
  zoomAltitude: number
  viewCenter: { lat: number; lng: number }
  connectorOrigin: 'sidebar' | 'osint' | null
  scrollToEventId: string | null
  expandedCluster: { lat: number; lng: number; events: OSINTEvent[] } | null
  eventSourceFilter: string | null
  connectorTarget: { lat: number; lng: number; color: string; rowId: string } | null
  terrain3d: boolean

  setCameraPosition: (pos: CameraPosition) => void
  setZoomView: (altitude: number, lat: number, lng: number) => void
  setSelectedBase: (base: MilitaryBase | null) => void
  setSelectedEvent: (event: OSINTEvent | null) => void
  setSelectedAircraft: (aircraft: AircraftState | null) => void
  setSelectedSatellite: (satellite: SatellitePosition | null) => void
  setSelectedVessel: (vessel: VesselState | null) => void
  setSelectedStrategicFeature: (feature: StrategicFeatureData | null) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: SidebarTab) => void
  setShowEvents: (show: boolean) => void
  setShowBases: (show: boolean) => void
  setShowArcs: (show: boolean) => void
  setAutoRotate: (auto: boolean) => void
  setMapLayer: (layer: 'street' | 'dark' | 'satellite') => void
  setLeftPanel: (panel: LeftPanel) => void
  setImageryOverlay: (overlay: ImageryOverlay | null) => void
  setConnectorOrigin: (origin: 'sidebar' | 'osint' | null) => void
  setScrollToEventId: (id: string | null) => void
  setExpandedCluster: (cluster: { lat: number; lng: number; events: OSINTEvent[] } | null) => void
  setEventSourceFilter: (source: string | null) => void
  setConnectorTarget: (target: { lat: number; lng: number; color: string; rowId: string } | null) => void
  setTerrain3d: (on: boolean) => void
  closeSidebar: () => void
}

export const useGlobeStore = create<GlobeState>()((set) => ({
  cameraPosition: { lat: 30, lng: 69, altitude: 1.8 },
  selectedBase: null,
  selectedEvent: null,
  selectedAircraft: null,
  selectedSatellite: null,
  selectedVessel: null,
  selectedStrategicFeature: null,
  sidebarOpen: false,
  sidebarTab: 'event',
  showEvents: true,
  showBases: false,
  showArcs: true,
  autoRotate: false,
  mapLayer: 'dark',
  leftPanel: 'osint',
  imageryOverlay: null,
  zoomAltitude: 1.8,
  viewCenter: { lat: 30, lng: 69 },
  connectorOrigin: null,
  scrollToEventId: null,
  expandedCluster: null,
  eventSourceFilter: null,
  connectorTarget: null,
  terrain3d: false,

  setCameraPosition: (cameraPosition) => set({ cameraPosition }),
  setZoomView: (altitude, lat, lng) => set({ zoomAltitude: altitude, viewCenter: { lat, lng } }),
  setSelectedBase: (selectedBase) => set({ selectedBase }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setSelectedAircraft: (selectedAircraft) => set({ selectedAircraft }),
  setSelectedSatellite: (selectedSatellite) => set({ selectedSatellite }),
  setSelectedVessel: (selectedVessel) => set({ selectedVessel }),
  setSelectedStrategicFeature: (selectedStrategicFeature) => set({ selectedStrategicFeature }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setShowEvents: (showEvents) => set({ showEvents }),
  setShowBases: (showBases) => set({ showBases }),
  setShowArcs: (showArcs) => set({ showArcs }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setMapLayer: (mapLayer) => set({ mapLayer }),
  setLeftPanel: (leftPanel) => set({ leftPanel }),
  setImageryOverlay: (imageryOverlay) => set({ imageryOverlay }),
  setConnectorOrigin: (connectorOrigin) => set({ connectorOrigin }),
  setScrollToEventId: (scrollToEventId) => set({ scrollToEventId }),
  setExpandedCluster: (expandedCluster) => set({ expandedCluster }),
  setEventSourceFilter: (eventSourceFilter) => set({ eventSourceFilter }),
  setConnectorTarget: (connectorTarget) => set({ connectorTarget }),
  setTerrain3d: (terrain3d) => set({ terrain3d }),
  closeSidebar: () =>
    set({ sidebarOpen: false, selectedBase: null, selectedEvent: null, selectedAircraft: null, selectedSatellite: null, selectedVessel: null, selectedStrategicFeature: null, connectorOrigin: null, connectorTarget: null, scrollToEventId: null, expandedCluster: null }),
}))
