import { useMemo, useState } from 'react'
import {
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import type { MilitaryBase, BaseType } from '@/types'
import { BASE_COLORS, SEVERITY_COLORS } from '@/utils/colors'
import { formatNumber, formatCoord } from '@/utils/formatters'
import { haversineDistance } from '@/utils/geo'
import { useDataStore } from '@/store/useDataStore'
import { countries } from '@/data/countries'

interface BaseDetailProps {
  base: MilitaryBase
}

const STATUS_COLORS: Record<string, string> = {
  active: '#2A9D8F',
  limited: '#F77F00',
  inactive: '#E63946',
  classified: '#9B5DE5',
}

const TYPE_LABELS: Record<BaseType, string> = {
  airfield: 'Airfield',
  naval: 'Naval',
  barracks: 'Barracks',
  military: 'Military',
  range: 'Range',
  nuclear: 'Nuclear',
  bunker: 'Bunker',
}

export function BaseDetail({ base }: BaseDetailProps) {
  const events = useDataStore((s) => s.events)
  const [copied, setCopied] = useState(false)

  const country = useMemo(
    () => countries.find((c) => c.code === base.countryCode),
    [base.countryCode],
  )

  const nearbyEvents = useMemo(() => {
    return events
      .map((event) => ({
        event,
        distance: haversineDistance(base.lat, base.lng, event.lat, event.lng),
      }))
      .filter(({ distance }) => distance <= 200)
      .sort((a, b) => a.distance - b.distance)
  }, [base.lat, base.lng, events])

  const coordString = formatCoord(base.lat, base.lng)

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText(coordString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access may fail in some contexts
    }
  }

  const googleMapsUrl = `https://www.google.com/maps/@${base.lat},${base.lng},12z`

  return (
    <div className="space-y-4">
      {/* Name heading */}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">{base.name}</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {country ? `${country.flag} ${country.name}` : base.country}
        </p>
      </div>

      {/* Type badge */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/60 text-slate-200 border border-navy-700">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: BASE_COLORS[base.type] }}
          />
          {TYPE_LABELS[base.type]}
        </span>

        {/* Status badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/60 text-slate-200 border border-navy-700">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_COLORS[base.status] }}
          />
          {base.status.charAt(0).toUpperCase() + base.status.slice(1)}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-2.5 text-sm">
        {/* Branch */}
        <div className="flex items-center gap-2 text-slate-300">
          <Shield size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Branch</span>
          <span className="text-slate-200">{base.branch}</span>
        </div>

        {/* Personnel */}
        <div className="flex items-center gap-2 text-slate-300">
          <Users size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Personnel</span>
          <span className="text-slate-200">{formatNumber(base.personnel)}</span>
        </div>

        {/* Established */}
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Est.</span>
          <span className="text-slate-200">{base.established}</span>
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin size={14} className="text-cyan-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Coords</span>
          <span className="text-slate-200 font-mono text-xs">{coordString}</span>
          <button
            onClick={handleCopyCoords}
            className="ml-auto text-slate-400 hover:text-cyan-400 transition-colors"
            title="Copy coordinates"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Google Maps link */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <ExternalLink size={12} />
        View on Google Maps
      </a>

      {/* Description */}
      <div className="border-t border-navy-700 pt-3">
        <p className="text-sm text-slate-300 leading-relaxed">{base.description}</p>
      </div>

      {/* Region badge */}
      <div>
        <span className="inline-block px-2.5 py-1 rounded text-xs font-medium bg-navy-900/60 text-slate-300 border border-navy-700">
          {base.region}
        </span>
      </div>

      {/* Nearby Events */}
      <div className="border-t border-navy-700 pt-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Nearby Events
          {nearbyEvents.length > 0 && (
            <span className="ml-1.5 text-cyan-400">({nearbyEvents.length})</span>
          )}
        </h3>

        {nearbyEvents.length === 0 ? (
          <p className="text-xs text-slate-500">No events within 200 km</p>
        ) : (
          <div className="space-y-1.5">
            {nearbyEvents.map(({ event, distance }) => (
              <div
                key={event.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded bg-navy-900/40 border border-navy-700/50"
              >
                <AlertTriangle
                  size={12}
                  style={{ color: SEVERITY_COLORS[event.severity] }}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-500">{Math.round(distance)} km away</p>
                </div>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    color: SEVERITY_COLORS[event.severity],
                    backgroundColor: `${SEVERITY_COLORS[event.severity]}15`,
                  }}
                >
                  {event.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
