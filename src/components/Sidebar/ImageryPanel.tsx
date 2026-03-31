import { useState } from 'react'
import { Search, Image, Cloud, Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp, Globe, X } from 'lucide-react'
import { searchImagery } from '@/services/imageryService'
import type { ImageryResult } from '@/services/imageryService'
import { useGlobeStore } from '@/store/useGlobeStore'

interface ImageryPanelProps {
  initialLat?: number
  initialLon?: number
}

export function ImageryPanel({ initialLat, initialLon }: ImageryPanelProps) {
  const [lat, setLat] = useState(initialLat?.toString() ?? '')
  const [lon, setLon] = useState(initialLon?.toString() ?? '')
  const [radiusKm, setRadiusKm] = useState('50')
  const [daysBack, setDaysBack] = useState('30')
  const [maxCloud, setMaxCloud] = useState('30')
  const [results, setResults] = useState<ImageryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const imageryOverlay = useGlobeStore((s) => s.imageryOverlay)
  const setImageryOverlay = useGlobeStore((s) => s.setImageryOverlay)

  const handleSearch = async () => {
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (isNaN(latNum) || isNaN(lonNum)) {
      setError('Enter valid lat/lon coordinates')
      return
    }
    setLoading(true)
    setError(null)
    setExpandedId(null)
    try {
      const res = await searchImagery({
        lat: latNum,
        lon: lonNum,
        radius_km: parseFloat(radiusKm) || 50,
        days_back: parseInt(daysBack) || 30,
        max_cloud_cover: parseFloat(maxCloud) || 30,
        limit: 20,
      })
      setResults(res.scenes ?? [])
      setSearched(true)
    } catch (err: any) {
      setError(err.message ?? 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Image size={18} className="text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Imagery Search</h3>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Search Sentinel-2 satellite imagery (10m resolution) for any location.
        Click a base, event, or aircraft, then switch to this tab to auto-fill coordinates.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <FieldInput label="Latitude" value={lat} onChange={setLat} icon={<MapPin size={12} />} />
        <FieldInput label="Longitude" value={lon} onChange={setLon} icon={<MapPin size={12} />} />
        <FieldInput label="Radius (km)" value={radiusKm} onChange={setRadiusKm} />
        <FieldInput label="Days Back" value={daysBack} onChange={setDaysBack} icon={<Calendar size={12} />} />
        <FieldInput label="Max Cloud %" value={maxCloud} onChange={setMaxCloud} icon={<Cloud size={12} />} />
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        <Search size={14} />
        {loading ? 'Searching...' : 'Search Imagery'}
      </button>

      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <div className="text-sm text-slate-500 text-center py-4">No imagery found</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            {results.length} scene{results.length !== 1 ? 's' : ''} found
          </div>
          {results.map((r) => {
            const isExpanded = expandedId === r.id
            const previewSrc = r.preview_url || r.thumbnail_url
            return (
              <div
                key={r.id}
                className="bg-surface-300 rounded border border-navy-700 overflow-hidden"
              >
                {/* Header — always visible, clickable to expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-navy-900/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium truncate">{r.id}</div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(r.datetime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Cloud size={10} />
                        {r.cloud_cover?.toFixed(0) ?? '—'}%
                      </span>
                      <span className="px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        {r.gsd_m ?? 10}m
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp size={14} className="text-slate-500 shrink-0" />
                    : <ChevronDown size={14} className="text-slate-500 shrink-0" />
                  }
                </button>

                {/* Expanded: inline preview + full-res explorer link */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {/* Inline preview thumbnail */}
                    {previewSrc && (
                      <div className="rounded overflow-hidden border border-navy-700 bg-black">
                        <img
                          src={previewSrc}
                          alt={`Sentinel-2 — ${r.id}`}
                          className="w-full h-auto max-h-[300px] object-contain"
                          loading="lazy"
                        />
                        <div className="px-2 py-1 bg-navy-900/80 text-[9px] text-slate-500">
                          Scene overview — open Explorer below for full 10m zoom
                        </div>
                      </div>
                    )}

                    {/* Map on globe toggle */}
                    {r.bbox && (() => {
                      const isMapped = imageryOverlay?.itemId === r.id
                      return isMapped ? (
                        <button
                          onClick={() => setImageryOverlay(null)}
                          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded bg-red-600/20 border border-red-500/40 text-[11px] font-semibold text-red-300 hover:bg-red-600/30 transition-colors"
                        >
                          <X size={12} />
                          Remove from Globe
                        </button>
                      ) : (
                        <button
                          onClick={() => setImageryOverlay({ itemId: r.id, bbox: r.bbox! })}
                          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded bg-purple-600/30 border border-purple-500/40 text-[11px] font-semibold text-purple-200 hover:bg-purple-600/50 transition-colors"
                        >
                          <Globe size={12} />
                          Map on Globe (zoom in for {r.gsd_m ?? 10}m detail)
                        </button>
                      )
                    })()}

                    {/* Action links */}
                    <div className="flex flex-col gap-1.5">
                      {r.explorer_url && (
                        <a
                          href={r.explorer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-navy-900/40 border border-navy-700 text-[11px] font-medium text-slate-300 hover:bg-navy-900/60 transition-colors"
                        >
                          <ExternalLink size={11} />
                          Open in Planetary Computer Explorer
                        </a>
                      )}
                      {r.visual_url && (
                        <a
                          href={r.visual_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink size={10} /> Download GeoTIFF
                        </a>
                      )}
                    </div>

                    {/* Bbox info */}
                    {r.bbox && (
                      <div className="text-[9px] text-slate-600 font-mono">
                        BBOX: {r.bbox.map((v) => v.toFixed(3)).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] uppercase tracking-wider text-slate-400">{label}</label>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-navy-900/60 border border-navy-700 rounded">
        {icon && <span className="text-slate-500">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none"
        />
      </div>
    </div>
  )
}
