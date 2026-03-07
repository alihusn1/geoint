import { useEffect, useState, useRef } from 'react'
import { Rss, ExternalLink } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { mapEvents } from '@/services/mappers'
import * as eventService from '@/services/eventService'
import type { OSINTEvent } from '@/types'
import { relativeTime } from '@/utils/formatters'

const SEVERITY_TAG: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: 'BREAKING', bg: 'bg-red-500/20', text: 'text-red-400' },
  high: { label: 'ALERT', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  medium: { label: 'TRENDING', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  low: { label: 'UPDATE', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  info: { label: 'INFO', bg: 'bg-slate-500/20', text: 'text-slate-400' },
}

export function NewsTicker() {
  const mode = useDataStore((s) => s.mode)
  const events = useDataStore((s) => s.events)
  const [rssItems, setRssItems] = useState<OSINTEvent[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch latest 10 RSS events
  useEffect(() => {
    if (mode !== 'online') {
      // Offline fallback: use first 10 events from store
      setRssItems(
        [...events]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10),
      )
      return
    }

    let cancelled = false
    eventService
      .getEvents({ source: 'rss', limit: 10 })
      .then((res: any) => {
        if (cancelled) return
        const mapped = mapEvents(res.events ?? res)
        setRssItems(mapped)
      })
      .catch(() => {
        if (!cancelled) {
          setRssItems(
            [...events]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10),
          )
        }
      })

    return () => { cancelled = true }
  }, [mode, events])

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current
    if (!el || rssItems.length === 0) return

    let animId: number
    let pos = 0
    const speed = 0.5 // px per frame

    const step = () => {
      pos += speed
      // Reset when first half scrolled out (we duplicate content)
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)

    // Pause on hover
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(step) }
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)

    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
    }
  }, [rssItems])

  if (rssItems.length === 0) return null

  // Duplicate items for seamless scroll
  const displayItems = [...rssItems, ...rssItems]

  return (
    <div className="h-8 flex items-center bg-surface-400 border-b border-navy-700 shrink-0 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 shrink-0 border-r border-navy-700 h-full">
        <Rss size={12} className="text-red-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">LIVE</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden whitespace-nowrap"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="inline-flex items-center gap-6 px-3">
          {displayItems.map((item, i) => {
            const tag = SEVERITY_TAG[item.severity] ?? SEVERITY_TAG.info
            return (
              <div key={`${item.id}-${i}`} className="inline-flex items-center gap-2 shrink-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${tag.bg} ${tag.text}`}
                >
                  {tag.label}
                </span>
                <span className="text-xs text-slate-300 max-w-[400px] truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-500">{relativeTime(item.timestamp)}</span>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-cyan-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
                <span className="text-navy-700">|</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
