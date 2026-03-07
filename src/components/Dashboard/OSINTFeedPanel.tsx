import { useEffect, useState } from 'react'
import { Radio, ExternalLink, ChevronLeft, ChevronRight, Rss, Globe } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import { mapEvents } from '@/services/mappers'
import * as eventService from '@/services/eventService'
import type { OSINTEvent } from '@/types'
import { relativeTime } from '@/utils/formatters'
import { SEVERITY_COLORS } from '@/utils/colors'

const SOURCE_ICONS: Record<string, { color: string; label: string }> = {
  gdelt: { color: '#F77F00', label: 'GDELT' },
  rss: { color: '#00B4D8', label: 'RSS' },
  satellite: { color: '#9B5DE5', label: 'SAT' },
  sigint: { color: '#2A9D8F', label: 'SIGINT' },
  social: { color: '#E63946', label: 'SOCIAL' },
  maritime: { color: '#4D78B3', label: 'MARIT' },
  cyber: { color: '#FCBF49', label: 'CYBER' },
  nuclear: { color: '#FF6B6B', label: 'NUKE' },
}

const OSINT_SECTIONS = [
  { icon: Globe, label: 'GDELT', color: '#F77F00' },
  { icon: Rss, label: 'RSS', color: '#00B4D8' },
]

const STRIP_WIDTH = 46

export function OSINTFeedPanel() {
  const mode = useDataStore((s) => s.mode)
  const events = useDataStore((s) => s.events)
  const leftPanel = useGlobeStore((s) => s.leftPanel)
  const setLeftPanel = useGlobeStore((s) => s.setLeftPanel)
  const { handleEventClick } = useGlobeInteraction()
  const [feedItems, setFeedItems] = useState<OSINTEvent[]>([])
  const [loading, setLoading] = useState(true)

  const collapsed = leftPanel !== 'osint'

  const handleToggle = () => {
    setLeftPanel(collapsed ? 'osint' : null)
  }

  // Fetch 50 GDELT + 50 RSS events
  useEffect(() => {
    if (mode !== 'online') {
      // Offline: use events from store sorted by time
      setFeedItems(
        [...events]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100),
      )
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      eventService.getEvents({ source: 'gdelt', limit: 50 }),
      eventService.getEvents({ source: 'rss', limit: 50 }),
    ])
      .then(([gdeltRes, rssRes]: any[]) => {
        if (cancelled) return
        const gdeltEvents = mapEvents(gdeltRes.events ?? gdeltRes)
        const rssEvents = mapEvents(rssRes.events ?? rssRes)
        const combined = [...gdeltEvents, ...rssEvents].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setFeedItems(combined)
      })
      .catch(() => {
        if (!cancelled) {
          setFeedItems(
            [...events]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 100),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Refresh every 2 minutes
    const interval = setInterval(() => {
      Promise.all([
        eventService.getEvents({ source: 'gdelt', limit: 50 }),
        eventService.getEvents({ source: 'rss', limit: 50 }),
      ])
        .then(([gdeltRes, rssRes]: any[]) => {
          if (cancelled) return
          const gdeltEvents = mapEvents(gdeltRes.events ?? gdeltRes)
          const rssEvents = mapEvents(rssRes.events ?? rssRes)
          const combined = [...gdeltEvents, ...rssEvents].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          setFeedItems(combined)
        })
        .catch(() => {})
    }, 120_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [mode, events])

  const getSourceInfo = (source: string) =>
    SOURCE_ICONS[source] ?? { color: '#94A3B8', label: source.toUpperCase().slice(0, 6) }

  return (
    <>
      {/* Toggle button / collapsed labels strip */}
      <button
        onClick={handleToggle}
        className="absolute z-20 bg-surface-300/95 backdrop-blur-sm border border-navy-700 border-l-0 rounded-r-lg text-slate-400 hover:text-white transition-all duration-300 ease-in-out"
        style={{
          top: 8,
          width: collapsed ? STRIP_WIDTH : undefined,
          left: collapsed
            ? leftPanel === 'filter' ? 320 : 0
            : 320,
          transition: 'left 0.3s ease-in-out',
        }}
        title={collapsed ? 'Show OSINT Feed' : 'Hide OSINT Feed'}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-3 gap-3">
            {/* OSINT icon with event count */}
            <div className="relative">
              <Radio size={16} className="text-cyan-400" />
              {feedItems.length > 0 && (
                <span className="absolute -top-1.5 -right-3 min-w-4 h-4 px-0.5 rounded-full bg-cyan-500 text-white text-[8px] flex items-center justify-center font-bold">
                  {feedItems.length > 99 ? '99+' : feedItems.length}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="w-5 h-px bg-navy-600" />

            {/* Source labels */}
            <div className="flex flex-col gap-2.5">
              {OSINT_SECTIONS.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <Icon size={12} style={{ color }} />
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Expand chevron */}
            <div className="w-5 h-px bg-navy-600 mt-1" />
            <ChevronRight size={12} className="text-slate-500" />
          </div>
        ) : (
          <div className="px-1 py-3">
            <ChevronLeft size={14} />
          </div>
        )}
      </button>

      {/* Panel */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-10 bg-surface-300/95 backdrop-blur-sm border-r border-navy-700 flex flex-col transition-transform duration-300 ease-in-out ${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: 320 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-navy-700 shrink-0">
          <Radio size={14} className="text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            OSINT Feed
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">
            {feedItems.length} events
          </span>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-navy-700 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            GDELT {feedItems.filter((e) => e.source === 'gdelt').length}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            RSS {feedItems.filter((e) => e.source === 'rss').length}
          </span>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              Loading feed...
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              No events available
            </div>
          ) : (
            feedItems.map((event) => {
              const srcInfo = getSourceInfo(event.source)
              return (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left px-3 py-3 border-b border-navy-700/40 hover:bg-surface-100/50 transition-colors group"
                >
                  {/* Source row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                      style={{
                        backgroundColor: `${srcInfo.color}20`,
                        color: srcInfo.color,
                        border: `1px solid ${srcInfo.color}40`,
                      }}
                    >
                      {srcInfo.label.charAt(0)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {srcInfo.label}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-auto">
                      {relativeTime(event.timestamp)}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
                    />
                  </div>

                  {/* Title */}
                  <p className="text-[12px] text-slate-200 leading-relaxed line-clamp-2 mb-1">
                    {event.title}
                  </p>

                  {/* Description */}
                  {event.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-1.5">
                      {event.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {event.country && <span>{event.country}</span>}
                    {event.category && (
                      <>
                        <span>·</span>
                        <span className="capitalize">
                          {event.category.replace(/_/g, ' ')}
                        </span>
                      </>
                    )}
                    {event.sourceUrl && (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-slate-500 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
