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
  Users,
  TrendingUp,
  FileText,
  Target,
  ArrowRight,
} from 'lucide-react'
import type { OSINTEvent } from '@/types'
import { SEVERITY_COLORS, getCategoryColor } from '@/utils/colors'
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

const SOURCE_LABELS: Record<string, string> = {
  twitter: 'X/Twitter',
  grok_search: 'Grok Search',
  gdelt_enhanced: 'GDELT',
  trends: 'Trends',
  deep_analysis: 'Deep Analysis',
  firms: 'FIRMS',
  usgs: 'USGS',
  ioda: 'IODA',
  strike_watch: 'Strike Watch',
}

function formatSourceType(source: string): string {
  return SOURCE_LABELS[source] ?? source.charAt(0).toUpperCase() + source.slice(1)
}

export function EventDetail({ event }: EventDetailProps) {
  const bases = useDataStore((s) => s.bases)
  const meta = event.metadata

  const relatedBases = useMemo(() => {
    return bases.filter((b) => event.relatedBaseIds.includes(b.id))
  }, [bases, event.relatedBaseIds])

  const absoluteTime = new Date(event.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // Extract actor names
  const actorNames = useMemo(() => {
    if (meta?.actors && meta.actors.length > 0) {
      return meta.actors.map((a) => (typeof a === 'string' ? a : a.name))
    }
    const parts = [meta?.actor1_name, meta?.actor2_name].filter(Boolean) as string[]
    return parts.length > 0 ? parts : null
  }, [meta])

  const summary = meta?.ai_summary
  const analysis = meta?.pakistan_impact_analysis
  const rationale = meta?.ai_rationale

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">{event.title}</h2>
      </div>

      {/* Severity badge + verified */}
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

        {meta?.confidence && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/60 text-slate-400 border border-navy-700">
            {meta.confidence}
          </span>
        )}
      </div>

      {/* Info rows */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Tag size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Category</span>
          <span
            className="text-sm font-medium px-1.5 py-0.5 rounded"
            style={{
              color: getCategoryColor(event.category),
              backgroundColor: `${getCategoryColor(event.category)}15`,
            }}
          >
            {formatCategory(event.category)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Radio size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Source</span>
          <span className="text-slate-200">{formatSourceType(event.source)}</span>
          {meta?.source_reliability && (
            <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 px-1 rounded">
              {meta.source_reliability}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Time</span>
          <div className="flex flex-col">
            <span className="text-slate-200">{relativeTime(event.timestamp)}</span>
            <span className="text-[11px] text-slate-500">{absoluteTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Globe size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Country</span>
          <span className="text-slate-200">{event.country}</span>
        </div>

        {meta?.domain && (
          <div className="flex items-center gap-2 text-slate-300">
            <Target size={14} className="text-cyan-400 shrink-0" />
            <span className="text-slate-400 w-20 shrink-0">Domain</span>
            <span className="text-slate-200 uppercase text-xs">{meta.domain}</span>
          </div>
        )}

        {event.source === 'strike_watch' && meta?.event_type && (
          <div className="flex items-center gap-2 text-slate-300">
            <Target size={14} className="text-red-400 shrink-0" />
            <span className="text-slate-400 w-20 shrink-0">Strike Type</span>
            <span className="text-slate-200 capitalize text-xs">{meta.event_type.replace(/_/g, ' ')}</span>
          </div>
        )}

        {event.source === 'strike_watch' && meta?.weapon_type && meta.weapon_type !== 'unknown' && (
          <div className="flex items-center gap-2 text-slate-300">
            <Shield size={14} className="text-red-400 shrink-0" />
            <span className="text-slate-400 w-20 shrink-0">Weapon</span>
            <span className="text-slate-200 capitalize text-xs">{meta.weapon_type.replace(/_/g, ' ')}</span>
          </div>
        )}

        {event.source === 'strike_watch' && meta?.casualties && (
          <div className="flex items-center gap-2 text-slate-300">
            <Users size={14} className="text-red-400 shrink-0" />
            <span className="text-slate-400 w-20 shrink-0">Casualties</span>
            <span className="text-slate-200 text-xs">{meta.casualties}</span>
          </div>
        )}
      </div>

      {/* Source → Event → Target flow */}
      {(event.sourceLocation || event.sourceCountryCode || event.targetLocation || event.targetCountryCode) && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Flow</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {(event.sourceLocation || event.sourceCountryCode) && (
              <>
                <span className="px-2 py-1 rounded bg-navy-900/60 border border-navy-700 text-slate-300">
                  {event.sourceLocation ?? event.sourceCountryCode}
                </span>
                <ArrowRight size={12} className="text-slate-500" />
              </>
            )}
            <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium">
              {event.country}
            </span>
            {(event.targetLocation || event.targetCountryCode) && (
              <>
                <ArrowRight size={12} className="text-slate-500" />
                <span className="px-2 py-1 rounded bg-navy-900/60 border border-navy-700 text-slate-300">
                  {event.targetLocation ?? event.targetCountryCode}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText size={12} />
            Summary
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Description (show if no summary, or as fallback) */}
      {(!summary && event.description) && (
        <div className="border-t border-navy-700 pt-3">
          <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
        </div>
      )}

      {/* AI Rationale */}
      {rationale && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rationale</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{rationale}</p>
        </div>
      )}

      {/* Impact Analysis */}
      {analysis && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Impact Analysis</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{analysis}</p>
        </div>
      )}

      {/* Pakistan Impact Rationale */}
      {meta?.pakistan_impact_rationale && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pakistan Impact Rationale</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{meta.pakistan_impact_rationale}</p>
        </div>
      )}

      {/* Actors */}
      {actorNames && actorNames.length > 0 && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users size={12} />
            Actors
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {actorNames.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded text-xs bg-navy-900/60 border border-navy-700/50 text-slate-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metrics: Goldstein / Tone / Trending / Relevance */}
      {(meta?.goldstein_scale != null || meta?.avg_tone != null || meta?.trending_score != null || meta?.ai_relevance_score != null || meta?.pakistan_impact_score != null) && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Metrics
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {meta?.goldstein_scale != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">Goldstein</div>
                <div className={`text-sm font-semibold ${meta.goldstein_scale > 0 ? 'text-emerald-400' : meta.goldstein_scale < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {meta.goldstein_scale.toFixed(1)}
                </div>
              </div>
            )}
            {meta?.avg_tone != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">Avg Tone</div>
                <div className={`text-sm font-semibold ${meta.avg_tone > 0 ? 'text-emerald-400' : meta.avg_tone < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {meta.avg_tone.toFixed(1)}
                </div>
              </div>
            )}
            {meta?.num_mentions != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">Mentions</div>
                <div className="text-sm font-semibold text-slate-200">{meta.num_mentions}</div>
              </div>
            )}
            {meta?.trending_score != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">Trending</div>
                <div className="text-sm font-semibold text-purple-400">{meta.trending_score}/10</div>
              </div>
            )}
            {meta?.ai_relevance_score != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">Relevance</div>
                <div className="text-sm font-semibold text-cyan-400">{meta.ai_relevance_score}/100</div>
              </div>
            )}
            {meta?.pakistan_impact_score != null && (
              <div className="px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700/50">
                <div className="text-[10px] text-slate-500">PAK Impact</div>
                <div className="text-sm font-semibold text-amber-400">{meta.pakistan_impact_score}/10</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {meta?.tags && meta.tags.length > 0 && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weapons Systems (Grok) */}
      {meta?.weapons_systems && meta.weapons_systems.length > 0 && (
        <div className="border-t border-navy-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Weapons Systems</h3>
          <div className="space-y-1">
            {meta.weapons_systems.map((w, i) => (
              <div key={i} className="text-xs text-slate-300 px-2 py-1 rounded bg-navy-900/40 border border-navy-700/50">
                <span className="font-medium text-slate-200">{w.name}</span>
                {w.type && <span className="text-slate-500 ml-1">({w.type})</span>}
                {w.origin_country && <span className="text-slate-500 ml-1">- {w.origin_country}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Additional source URLs from metadata */}
      {meta?.source_urls && meta.source_urls.length > 1 && (
        <div className="space-y-1">
          {meta.source_urls.slice(1, 4).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink size={10} />
              Source {i + 2}
            </a>
          ))}
        </div>
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
