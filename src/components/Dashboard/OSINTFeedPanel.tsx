import { useEffect, useMemo, useState } from 'react'
import { Radio, ExternalLink, ChevronLeft, ChevronRight, Globe, Twitter, Search, Crosshair, Clock, Zap } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import type { OSINTEvent } from '@/types'
import { relativeTime } from '@/utils/formatters'
import { SEVERITY_COLORS } from '@/utils/colors'

const SOURCE_ICONS: Record<string, { color: string; label: string }> = {
  twitter: { color: '#1DA1F2', label: 'X/Twitter' },
  grok_search: { color: '#00E5A0', label: 'Grok' },
  gdelt_enhanced: { color: '#F77F00', label: 'GDELT' },
  trends: { color: '#A855F7', label: 'Trends' },
  deep_analysis: { color: '#F43F5E', label: 'Analysis' },
  firms: { color: '#FF6B35', label: 'FIRMS' },
  usgs: { color: '#8B5CF6', label: 'USGS' },
  ioda: { color: '#EF4444', label: 'IODA' },
  strike_watch: { color: '#E63946', label: 'Strikes' },
  satellite: { color: '#9B5DE5', label: 'SAT' },
  sigint: { color: '#2A9D8F', label: 'SIGINT' },
  social: { color: '#E63946', label: 'SOCIAL' },
  maritime: { color: '#4D78B3', label: 'MARIT' },
  cyber: { color: '#FCBF49', label: 'CYBER' },
  nuclear: { color: '#FF6B6B', label: 'NUKE' },
}

const OSINT_SECTIONS = [
  { icon: Globe, label: 'GDELT', color: '#F77F00' },
  { icon: Twitter, label: 'X', color: '#1DA1F2' },
  { icon: Search, label: 'Grok', color: '#00E5A0' },
  { icon: Crosshair, label: 'Strikes', color: '#E63946' },
]

const STRIP_WIDTH = 46

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
}

/** Derive a 0-100 impact score from available metadata + severity. */
function getImpactScore(event: OSINTEvent): number {
  const m = event.metadata
  if (!m) return SEVERITY_WEIGHT[event.severity] ?? 0

  // Pick the highest available score from metadata
  const candidates: number[] = []
  if (typeof m.pakistan_impact_score === 'number') candidates.push(m.pakistan_impact_score * 10) // 0-10 → 0-100
  if (typeof m.ai_pakistan_impact_score === 'number') candidates.push(m.ai_pakistan_impact_score * 10)
  if (typeof m.ai_relevance_score === 'number') candidates.push(m.ai_relevance_score * 10)
  if (typeof m.trending_score === 'number') candidates.push(Math.min(100, m.trending_score))
  if (typeof m.goldstein_scale === 'number') candidates.push(Math.abs(m.goldstein_scale) * 5) // -20..+20 → 0-100

  if (candidates.length > 0) return Math.min(100, Math.max(...candidates))
  return SEVERITY_WEIGHT[event.severity] ?? 0
}

type SortMode = 'time' | 'impact'

export function OSINTFeedPanel() {
  const mode = useDataStore((s) => s.mode)
  const events = useDataStore((s) => s.events)
  const loading = useDataStore((s) => s.loading)
  const leftPanel = useGlobeStore((s) => s.leftPanel)
  const setLeftPanel = useGlobeStore((s) => s.setLeftPanel)
  const scrollToEventId = useGlobeStore((s) => s.scrollToEventId)
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const { handleEventClick } = useGlobeInteraction()
  const sourceFilter = useGlobeStore((s) => s.eventSourceFilter)
  const setSourceFilter = useGlobeStore((s) => s.setEventSourceFilter)
  const [sortMode, setSortMode] = useState<SortMode>('time')

  const collapsed = leftPanel !== 'osint'

  // Use store events directly (store now fetches from all sources)
  const feedItems = useMemo(
    () => {
      const sorted = [...events]
      if (sortMode === 'impact') {
        sorted.sort((a, b) => getImpactScore(b) - getImpactScore(a))
      } else {
        sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
      return sorted.slice(0, 500)
    },
    [events, sortMode],
  )

  // Auto-expand panel and scroll to event when triggered
  useEffect(() => {
    if (!scrollToEventId) return
    // Expand the OSINT panel if collapsed
    if (leftPanel !== 'osint') {
      useGlobeStore.getState().setLeftPanel('osint')
    }
    // Delay to let panel expand + DOM render
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${scrollToEventId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      useGlobeStore.getState().setScrollToEventId(null)
    }, 350)
    return () => clearTimeout(timer)
  }, [scrollToEventId, leftPanel])

  const handleToggle = () => {
    setLeftPanel(collapsed ? 'osint' : null)
  }

  const getSourceInfo = (source: string) =>
    SOURCE_ICONS[source] ?? { color: '#94A3B8', label: source.toUpperCase().slice(0, 6) }

  return (
    <>
      {/* Toggle button / collapsed labels strip */}
      <button
        onClick={handleToggle}
        className="absolute z-30 bg-surface-300/95 backdrop-blur-sm border border-navy-700 border-l-0 rounded-r-lg text-slate-400 hover:text-white transition-all duration-300 ease-in-out"
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
        className={`absolute left-0 top-0 bottom-0 z-30 bg-surface-300/95 backdrop-blur-sm border-r border-navy-700 flex flex-col transition-transform duration-300 ease-in-out ${
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
            {sourceFilter ? feedItems.filter((e) => e.source === sourceFilter).length : feedItems.length} events
          </span>
          <button
            onClick={() => setSortMode(sortMode === 'time' ? 'impact' : 'time')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors"
            style={{
              backgroundColor: sortMode === 'impact' ? '#F59E0B25' : '#94A3B815',
              color: sortMode === 'impact' ? '#F59E0B' : '#94A3B8',
              borderColor: sortMode === 'impact' ? '#F59E0B60' : '#94A3B830',
            }}
            title={sortMode === 'time' ? 'Sort by impact score' : 'Sort by time'}
          >
            {sortMode === 'impact' ? <Zap size={10} /> : <Clock size={10} />}
            {sortMode === 'impact' ? 'Impact' : 'Latest'}
          </button>
        </div>

        {/* Source filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-navy-700 shrink-0 flex-wrap">
          <button
            onClick={() => setSourceFilter(null)}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors"
            style={{
              backgroundColor: sourceFilter === null ? '#00B4D830' : '#00B4D810',
              color: '#00B4D8',
              borderColor: sourceFilter === null ? '#00B4D8' : '#00B4D830',
            }}
          >
            All {feedItems.length}
          </button>
          {(['gdelt_enhanced', 'twitter', 'grok_search', 'trends', 'deep_analysis', 'firms', 'usgs', 'ioda', 'strike_watch'] as const).map((src) => {
            const info = SOURCE_ICONS[src]
            const count = feedItems.filter((e) => e.source === src).length
            if (count === 0) return null
            const isActive = sourceFilter === src
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(isActive ? null : src)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors"
                style={{
                  backgroundColor: isActive ? `${info.color}30` : `${info.color}15`,
                  color: info.color,
                  borderColor: isActive ? info.color : `${info.color}30`,
                }}
              >
                {info.label} {count}
              </button>
            )
          })}
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
            (sourceFilter ? feedItems.filter((e) => e.source === sourceFilter) : feedItems).map((event) => {
              const srcInfo = getSourceInfo(event.source)
              const isSelected = selectedEvent?.id === event.id
              return (
                <button
                  key={event.id}
                  data-event-id={event.id}
                  onClick={() => handleEventClick(event, 'osint')}
                  className={`w-full text-left px-3 py-3 border-b border-navy-700/40 hover:bg-surface-100/50 transition-colors group ${
                    isSelected ? 'bg-cyan-400/10 border-l-2 border-l-cyan-400' : ''
                  }`}
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
                    {sortMode === 'impact' && (
                      <span
                        className="font-bold font-mono"
                        style={{ color: getImpactScore(event) >= 70 ? '#F59E0B' : getImpactScore(event) >= 40 ? '#94A3B8' : '#64748B' }}
                      >
                        {Math.round(getImpactScore(event))}
                      </span>
                    )}
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
