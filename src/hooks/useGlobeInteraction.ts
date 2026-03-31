import { useCallback } from 'react'
import { useGlobeStore } from '@/store/useGlobeStore'
import type { MilitaryBase, OSINTEvent, StrategicFeatureData } from '@/types'

export interface GlobeBasePoint {
  _kind: 'base'
  data: MilitaryBase
  lat: number
  lng: number
}

export interface GlobeEventPoint {
  _kind: 'event'
  data: OSINTEvent
  lat: number
  lng: number
}

export interface GlobeAircraftPoint {
  _kind: 'aircraft'
  data: import('@/types').AircraftState
  lat: number
  lng: number
}

export interface GlobeFlightawarePoint {
  _kind: 'flightaware'
  data: import('@/types').AircraftState
  lat: number
  lng: number
}

export interface GlobeSatellitePoint {
  _kind: 'satellite'
  data: import('@/types').SatellitePosition
  lat: number
  lng: number
}

export interface GlobeVesselPoint {
  _kind: 'vessel'
  data: import('@/types').VesselState
  lat: number
  lng: number
}

export interface GlobeMarineTrafficPoint {
  _kind: 'marinetraffic'
  data: import('@/types').VesselState
  lat: number
  lng: number
}

export interface GlobeStrikePoint {
  _kind: 'strike'
  data: unknown
  lat: number
  lng: number
}

export interface GlobeAircraftClusterPoint {
  _kind: 'aircraft-cluster'
  data: { count: number }
  lat: number
  lng: number
}

export interface GlobeVesselClusterPoint {
  _kind: 'vessel-cluster'
  data: { count: number }
  lat: number
  lng: number
}

export interface GlobeEventClusterPoint {
  _kind: 'event-cluster'
  data: { count: number; events: OSINTEvent[] }
  lat: number
  lng: number
}

export interface GlobeArcEndpointPoint {
  _kind: 'arc-endpoint'
  data: { label: string; color: string }
  lat: number
  lng: number
}

export interface GlobeStrategicPoint {
  _kind: 'strategic'
  data: StrategicFeatureData
  lat: number
  lng: number
}

export type GlobePoint =
  | GlobeBasePoint
  | GlobeEventPoint
  | GlobeAircraftPoint
  | GlobeFlightawarePoint
  | GlobeSatellitePoint
  | GlobeVesselPoint
  | GlobeMarineTrafficPoint
  | GlobeStrikePoint
  | GlobeAircraftClusterPoint
  | GlobeVesselClusterPoint
  | GlobeEventClusterPoint
  | GlobeArcEndpointPoint
  | GlobeStrategicPoint

export function useGlobeInteraction() {
  const {
    setSelectedBase,
    setSelectedEvent,
    setSelectedAircraft,
    setSelectedSatellite,
    setSelectedVessel,
    setSelectedStrategicFeature,
    setCameraPosition,
    setSidebarOpen,
    setSidebarTab,
  } = useGlobeStore()

  const handlePointClick = useCallback(
    (point: GlobePoint) => {
      // Cluster click — immediately update store so data unclusters,
      // then animate camera to the target
      if (point._kind === 'aircraft-cluster' || point._kind === 'vessel-cluster') {
        useGlobeStore.getState().setZoomView(0.12, point.lat, point.lng)
        setCameraPosition({
          lat: point.lat,
          lng: point.lng,
          altitude: 0.12,
        })
        return
      }

      // Event cluster click — toggle spiderfy expansion + zoom in
      if (point._kind === 'event-cluster') {
        const state = useGlobeStore.getState()
        if (state.expandedCluster?.lat === point.lat && state.expandedCluster?.lng === point.lng) {
          state.setExpandedCluster(null)
        } else {
          state.setExpandedCluster({ lat: point.lat, lng: point.lng, events: point.data.events })
          // Zoom in so the fanned-out events are visible
          const currentAlt = state.zoomAltitude
          const targetAlt = Math.min(currentAlt, 0.3)
          setCameraPosition({ lat: point.lat, lng: point.lng, altitude: targetAlt })
        }
        return
      }

      console.log(`[GlobeInteraction] handlePointClick kind=${point._kind}`, point._kind === 'satellite' ? { name: (point.data as any).name, noradId: (point.data as any).noradId, altKm: (point.data as any).altKm } : '')
      // Clear all selections + connector state + collapse expanded cluster
      setSelectedBase(null)
      setSelectedEvent(null)
      setSelectedAircraft(null)
      setSelectedSatellite(null)
      setSelectedVessel(null)
      setSelectedStrategicFeature(null)
      useGlobeStore.getState().setConnectorOrigin(null)
      useGlobeStore.getState().setScrollToEventId(null)
      useGlobeStore.getState().setExpandedCluster(null)

      if (point._kind === 'strategic') {
        setSelectedStrategicFeature(point.data)
        setSidebarTab('strategic')
      } else if (point._kind === 'base') {
        setSelectedBase(point.data)
        setSidebarTab('event')
      } else if (point._kind === 'event') {
        setSelectedEvent(point.data)
        useGlobeStore.getState().setConnectorOrigin('osint')
        useGlobeStore.getState().setScrollToEventId(point.data.id)
        setSidebarTab('event')
      } else if (point._kind === 'aircraft' || point._kind === 'flightaware') {
        setSelectedAircraft(point.data)
        setSidebarTab('aircraft')
      } else if (point._kind === 'satellite') {
        setSelectedSatellite(point.data)
        setSidebarTab('satellite')
      } else if (point._kind === 'vessel' || point._kind === 'marinetraffic') {
        setSelectedVessel(point.data)
        setSidebarTab('vessel')
      } else {
        // strike or other
        setSidebarTab('event')
      }
      setSidebarOpen(true)
      // For aircraft/vessel: stay at current zoom (they're already visible),
      // only zoom in if currently far out
      const currentAlt = useGlobeStore.getState().zoomAltitude
      let targetAlt: number
      if (point._kind === 'aircraft' || point._kind === 'flightaware' || point._kind === 'vessel' || point._kind === 'marinetraffic') {
        targetAlt = Math.min(currentAlt, 0.03)
      } else if (point._kind === 'strategic') {
        targetAlt = Math.min(currentAlt, 0.6)
      } else if (point._kind === 'event') {
        targetAlt = 0.6
      } else if (point._kind === 'satellite') {
        targetAlt = 1.0
      } else {
        targetAlt = 1.5
      }
      setCameraPosition({
        lat: point.lat,
        lng: point.lng,
        altitude: targetAlt,
      })
    },
    [setSelectedBase, setSelectedEvent, setSelectedAircraft, setSelectedSatellite, setSelectedVessel, setSelectedStrategicFeature, setCameraPosition, setSidebarOpen, setSidebarTab],
  )

  const handleBaseClick = useCallback(
    (base: MilitaryBase) => {
      handlePointClick({ _kind: 'base', data: base, lat: base.lat, lng: base.lng })
    },
    [handlePointClick],
  )

  const handleEventClick = useCallback(
    (event: OSINTEvent, origin?: 'sidebar' | 'osint') => {
      const state = useGlobeStore.getState()
      // Toggle: second click on same event clears selection
      if (state.selectedEvent?.id === event.id && state.connectorOrigin) {
        state.setSelectedEvent(null)
        state.setConnectorOrigin(null)
        state.setSidebarTab('event')
        return
      }
      handlePointClick({ _kind: 'event', data: event, lat: event.lat, lng: event.lng })
    },
    [handlePointClick],
  )

  return { handlePointClick, handleBaseClick, handleEventClick }
}
