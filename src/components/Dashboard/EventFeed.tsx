import { useEffect, useState, useRef } from 'react'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useDataStore } from '@/store/useDataStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import { relativeTime } from '@/utils/formatters'
import { SEVERITY_COLORS } from '@/utils/colors'
import { mapEvents } from '@/services/mappers'
import * as eventService from '@/services/eventService'
import type { OSINTEvent } from '@/types'

export function EventFeed() {
  const { filteredEvents } = useFilteredData()
  const mode = useDataStore((s) => s.mode)
  const scrollToEventId = useGlobeStore((s) => s.scrollToEventId)
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const { handleEventClick } = useGlobeInteraction()
  const [apiEvents, setApiEvents] = useState<OSINTEvent[] | null>(null)
  const [newCount, setNewCount] = useState(0)
  const prevIdsRef = useRef<Set<string>>(new Set())

  // Auto-scroll to event when triggered from globe click
  useEffect(() => {
    if (!scrollToEventId) return
    // Small delay so the DOM has rendered the list
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${scrollToEventId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      useGlobeStore.getState().setScrollToEventId(null)
    }, 100)
    return () => clearTimeout(timer)
  }, [scrollToEventId])

  // Fetch latest events from API when online
  useEffect(() => {
    if (mode !== 'online') {
      setApiEvents(null)
      return
    }

    let cancelled = false
    const fetchLatest = () => {
      eventService
        .getLatest(30)
        .then((res: any[]) => {
          if (cancelled) return
          const mapped = mapEvents(res)
          // Count new events since last fetch
          const newIds = mapped.map((e) => e.id)
          if (prevIdsRef.current.size > 0) {
            const added = newIds.filter((id) => !prevIdsRef.current.has(id))
            if (added.length > 0) setNewCount((c) => c + added.length)
          }
          prevIdsRef.current = new Set(newIds)
          setApiEvents(mapped)
        })
        .catch(() => {
          if (!cancelled) setApiEvents(null)
        })
    }

    fetchLatest()
    const interval = setInterval(fetchLatest, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [mode])

  const displayEvents = apiEvents ?? filteredEvents
  const sorted = [...displayEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="bg-surface-300 rounded border border-navy-700">
      <div className="px-3 py-2 text-xs uppercase tracking-wider text-slate-400 border-b border-navy-700 flex items-center justify-between">
        <span>Event Feed</span>
        {newCount > 0 && (
          <button
            onClick={() => setNewCount(0)}
            className="px-1.5 py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-[10px] font-semibold animate-pulse"
          >
            +{newCount} new
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">No events</div>
        ) : (
          sorted.map((event) => {
            const isRecent =
              Date.now() - new Date(event.timestamp).getTime() < 86_400_000
            const isSelected = selectedEvent?.id === event.id
            return (
              <button
                key={event.id}
                data-event-id={event.id}
                onClick={() => handleEventClick(event, 'sidebar')}
                className={`w-full text-left px-3 py-2.5 border-b border-navy-700/50 hover:bg-surface-100 transition-colors flex gap-2.5 ${
                  isSelected ? 'bg-cyan-400/10 border-l-2 border-l-cyan-400' : ''
                }`}
              >
                <div className="mt-1.5 shrink-0 relative">
                  <span
                    className="block w-2 h-2 rounded-full"
                    style={{ background: SEVERITY_COLORS[event.severity] }}
                  />
                  {isRecent && (
                    <span
                      className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                      style={{
                        background: SEVERITY_COLORS[event.severity],
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{event.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {event.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span>{event.country}</span>
                    <span>·</span>
                    <span>{relativeTime(event.timestamp)}</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
