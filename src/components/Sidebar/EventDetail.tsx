import { useMemo } from 'react'
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Radio,
  Shield,
  Globe,
} from 'lucide-react'
import type { OSINTEvent } from '@/types'
import { SEVERITY_COLORS } from '@/utils/colors'
import { relativeTime } from '@/utils/formatters'
import { useDataStore } from '@/store/useDataStore'

interface EventDetailProps {
  event: OSINTEvent
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatSourceType(source: string): string {
  return source.charAt(0).toUpperCase() + source.slice(1)
}

export function EventDetail({ event }: EventDetailProps) {
  const bases = useDataStore((s) => s.bases)

  const relatedBases = useMemo(() => {
    return bases.filter((b) => event.relatedBaseIds.includes(b.id))
  }, [bases, event.relatedBaseIds])

  const absoluteTime = new Date(event.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">{event.title}</h2>
      </div>

      {/* Severity badge */}
      <div className="flex flex-wrap gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{
            color: SEVERITY_COLORS[event.severity],
            borderColor: `${SEVERITY_COLORS[event.severity]}40`,
            backgroundColor: `${SEVERITY_COLORS[event.severity]}15`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
          />
          {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
        </span>

        {/* Verified badge */}
        {event.verified ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle size={12} />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/60 text-slate-400 border border-navy-700">
            <XCircle size={12} />
            Unverified
          </span>
        )}
      </div>

      {/* Info rows */}
      <div className="space-y-2.5 text-sm">
        {/* Category */}
        <div className="flex items-center gap-2 text-slate-300">
          <Tag size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Category</span>
          <span className="text-slate-200">{formatCategory(event.category)}</span>
        </div>

        {/* Source type */}
        <div className="flex items-center gap-2 text-slate-300">
          <Radio size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Source</span>
          <span className="text-slate-200">{formatSourceType(event.source)}</span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Time</span>
          <div className="flex flex-col">
            <span className="text-slate-200">{relativeTime(event.timestamp)}</span>
            <span className="text-[11px] text-slate-500">{absoluteTime}</span>
          </div>
        </div>

        {/* Country */}
        <div className="flex items-center gap-2 text-slate-300">
          <Globe size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Country</span>
          <span className="text-slate-200">{event.country}</span>
        </div>
      </div>

      {/* Description */}
      <div className="border-t border-navy-700 pt-3">
        <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
      </div>

      {/* Source URL */}
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ExternalLink size={12} />
          View Source
        </a>
      )}

      {/* Related Bases */}
      <div className="border-t border-navy-700 pt-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Related Bases
          {relatedBases.length > 0 && (
            <span className="ml-1.5 text-cyan-400">({relatedBases.length})</span>
          )}
        </h3>

        {relatedBases.length === 0 ? (
          <p className="text-xs text-slate-500">No related bases linked</p>
        ) : (
          <div className="space-y-1.5">
            {relatedBases.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded bg-navy-900/40 border border-navy-700/50"
              >
                <Shield size={12} className="text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 truncate">{b.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {b.branch} &middot; {b.country}
                  </p>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-navy-900/60 text-slate-400 border border-navy-700/50 shrink-0">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
