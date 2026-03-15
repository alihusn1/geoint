import { create } from 'zustand'
import type { CameraPosition, SidebarTab, MilitaryBase, OSINTEvent, AircraftState, SatellitePosition, VesselState } from '@/types'

type LeftPanel = 'osint' | 'filter' | null

interface GlobeState {
  cameraPosition: CameraPosition
  selectedBase: MilitaryBase | null
  selectedEvent: OSINTEvent | null
  selectedAircraft: AircraftState | null
  selectedSatellite: SatellitePosition | null
  selectedVessel: VesselState | null
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  showEvents: boolean
  showArcs: boolean
  autoRotate: boolean
  mapLayer: 'street' | 'dark' | 'satellite'
  leftPanel: LeftPanel

  setCameraPosition: (pos: CameraPosition) => void
  setSelectedBase: (base: MilitaryBase | null) => void
  setSelectedEvent: (event: OSINTEvent | null) => void
  setSelectedAircraft: (aircraft: AircraftState | null) => void
  setSelectedSatellite: (satellite: SatellitePosition | null) => void
  setSelectedVessel: (vessel: VesselState | null) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: SidebarTab) => void
  setShowEvents: (show: boolean) => void
  setShowArcs: (show: boolean) => void
  setAutoRotate: (auto: boolean) => void
  setMapLayer: (layer: 'street' | 'dark' | 'satellite') => void
  setLeftPanel: (panel: LeftPanel) => void
  closeSidebar: () => void
}

export const useGlobeStore = create<GlobeState>()((set) => ({
  cameraPosition: { lat: 30, lng: 69, altitude: 1.8 },
  selectedBase: null,
  selectedEvent: null,
  selectedAircraft: null,
  selectedSatellite: null,
  selectedVessel: null,
  sidebarOpen: false,
  sidebarTab: 'base',
  showEvents: true,
  showArcs: true,
  autoRotate: false,
  mapLayer: 'dark',
  leftPanel: 'osint',

  setCameraPosition: (cameraPosition) => set({ cameraPosition }),
  setSelectedBase: (selectedBase) => set({ selectedBase }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setSelectedAircraft: (selectedAircraft) => set({ selectedAircraft }),
  setSelectedSatellite: (selectedSatellite) => set({ selectedSatellite }),
  setSelectedVessel: (selectedVessel) => set({ selectedVessel }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setShowEvents: (showEvents) => set({ showEvents }),
  setShowArcs: (showArcs) => set({ showArcs }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setMapLayer: (mapLayer) => set({ mapLayer }),
  setLeftPanel: (leftPanel) => set({ leftPanel }),
  closeSidebar: () =>
    set({ sidebarOpen: false, selectedBase: null, selectedEvent: null, selectedAircraft: null, selectedSatellite: null, selectedVessel: null }),
}))
