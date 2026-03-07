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

export type GlobePoint = GlobeBasePoint | GlobeEventPoint

export function useGlobeInteraction() {
  const {
    setSelectedBase,
    setSelectedEvent,
    setCameraPosition,
    setSidebarOpen,
    setSidebarTab,
  } = useGlobeStore()

  const handlePointClick = useCallback(
    (point: GlobePoint) => {
      if (point._kind === 'base') {
        setSelectedBase(point.data)
        setSelectedEvent(null)
        setSidebarTab('base')
      } else {
        setSelectedEvent(point.data)
        setSelectedBase(null)
        setSidebarTab('event')
      }
      setSidebarOpen(true)
      setCameraPosition({
        lat: point.lat,
        lng: point.lng,
        altitude: point._kind === 'event' ? 0.6 : 1.5,
      })
    },
    [setSelectedBase, setSelectedEvent, setCameraPosition, setSidebarOpen, setSidebarTab],
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
