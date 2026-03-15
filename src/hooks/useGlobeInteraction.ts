import { useCallback } from 'react'
import { useGlobeStore } from '@/store/useGlobeStore'
import type { MilitaryBase, OSINTEvent } from '@/types'

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

export interface GlobeStrikePoint {
  _kind: 'strike'
  data: unknown
  lat: number
  lng: number
}

export type GlobePoint =
  | GlobeBasePoint
  | GlobeEventPoint
  | GlobeAircraftPoint
  | GlobeSatellitePoint
  | GlobeVesselPoint
  | GlobeStrikePoint

export function useGlobeInteraction() {
  const {
    setSelectedBase,
    setSelectedEvent,
    setSelectedAircraft,
    setSelectedSatellite,
    setSelectedVessel,
    setCameraPosition,
    setSidebarOpen,
    setSidebarTab,
  } = useGlobeStore()

  const handlePointClick = useCallback(
    (point: GlobePoint) => {
      console.log(`[GlobeInteraction] handlePointClick kind=${point._kind}`, point._kind === 'satellite' ? { name: (point.data as any).name, noradId: (point.data as any).noradId, altKm: (point.data as any).altKm } : '')
      // Clear all selections
      setSelectedBase(null)
      setSelectedEvent(null)
      setSelectedAircraft(null)
      setSelectedSatellite(null)
      setSelectedVessel(null)

      if (point._kind === 'base') {
        setSelectedBase(point.data)
        setSidebarTab('base')
      } else if (point._kind === 'event') {
        setSelectedEvent(point.data)
        setSidebarTab('event')
      } else if (point._kind === 'aircraft') {
        setSelectedAircraft(point.data)
        setSidebarTab('aircraft')
      } else if (point._kind === 'satellite') {
        setSelectedSatellite(point.data)
        setSidebarTab('satellite')
      } else if (point._kind === 'vessel') {
        setSelectedVessel(point.data)
        setSidebarTab('vessel')
      } else {
        // strike or other
        setSidebarTab('event')
      }
      setSidebarOpen(true)
      setCameraPosition({
        lat: point.lat,
        lng: point.lng,
        altitude: point._kind === 'event' ? 0.6 : point._kind === 'satellite' ? 1.0 : 1.5,
      })
    },
    [setSelectedBase, setSelectedEvent, setSelectedAircraft, setSelectedSatellite, setSelectedVessel, setCameraPosition, setSidebarOpen, setSidebarTab],
  )

  const handleBaseClick = useCallback(
    (base: MilitaryBase) => {
      handlePointClick({ _kind: 'base', data: base, lat: base.lat, lng: base.lng })
    },
    [handlePointClick],
  )

  const handleEventClick = useCallback(
    (event: OSINTEvent) => {
      handlePointClick({ _kind: 'event', data: event, lat: event.lat, lng: event.lng })
    },
    [handlePointClick],
  )

  return { handlePointClick, handleBaseClick, handleEventClick }
}
