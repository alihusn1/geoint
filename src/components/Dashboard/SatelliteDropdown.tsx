import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Satellite, ChevronDown, Loader2 } from 'lucide-react'
import { useLiveStore, ALL_SAT_CATEGORIES } from '@/store/useLiveStore'
import { LAYER_COLORS, getSatelliteColor } from '@/utils/liveColors'
import type { SatellitePosition } from '@/types/live'

const CATEGORY_LABELS: Record<SatellitePosition['category'], string> = {
  military: 'Military',
  recon: 'Reconnaissance',
  stations: 'Space Stations',
  station: 'Space Station',
  'gps-ops': 'GPS Ops',
  navigation: 'Navigation',
  weather: 'Weather',
  comms: 'Communications',
  science: 'Science',
  other: 'Other',
}

// Deduplicate stations/station into one display row
const DISPLAY_CATEGORIES: SatellitePosition['category'][] = [
  'military', 'recon', 'stations', 'gps-ops', 'navigation', 'weather', 'comms', 'science', 'other',
]

export function SatelliteDropdown() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const layer = useLiveStore((s) => s.layers.satellites)
  const toggleLayer = useLiveStore((s) => s.toggleLayer)
  const satelliteCategories = useLiveStore((s) => s.satelliteCategories)
  const toggleSatelliteCategory = useLiveStore((s) => s.toggleSatelliteCategory)
  const setSatelliteCategoriesAll = useLiveStore((s) => s.setSatelliteCategoriesAll)

  const color = LAYER_COLORS.satellites

  // Count satellites per category
  const categoryCounts: Record<string, number> = {}
  for (const sat of layer.data as SatellitePosition[]) {
    const cat = sat.category || 'other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }
  if (categoryCounts['station']) {
    categoryCounts['stations'] = (categoryCounts['stations'] || 0) + categoryCounts['station']
  }

  const visibleCount = (layer.data as SatellitePosition[]).filter(
    (s) => satelliteCategories.has(s.category || 'other'),
  ).length

  const allSelected = ALL_SAT_CATEGORIES.every((c) => satelliteCategories.has(c))

  // Position the portal panel below the button
  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, updatePos])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        btnRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-all whitespace-nowrap ${
          layer.enabled
            ? 'opacity-100'
            : 'bg-surface-300 border-navy-700 opacity-50 hover:opacity-75'
        }`}
        style={
          layer.enabled
            ? { backgroundColor: `${color}15`, borderColor: `${color}66` }
            : undefined
        }
      >
        {layer.loading ? (
          <Loader2 size={14} className="animate-spin" style={{ color }} />
        ) : (
          <Satellite size={14} style={{ color: layer.enabled ? color : undefined }} />
        )}
        <span className="text-[10px] uppercase tracking-wider text-slate-300">TLE</span>
        {layer.enabled && visibleCount > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 rounded-full"
            style={{ backgroundColor: `${color}30`, color }}
          >
            {visibleCount > 999 ? `${(visibleCount / 1000).toFixed(1)}k` : visibleCount}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed w-56 bg-surface-400 border border-navy-600 rounded-lg shadow-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
          >
            {/* On/Off switch */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-navy-700">
              <span className="text-xs font-medium text-slate-300">Satellites</span>
              <button
                onClick={() => toggleLayer('satellites')}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  layer.enabled ? 'bg-purple-500' : 'bg-navy-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    layer.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Select All / None */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-navy-700">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                Filter by type
              </span>
              <button
                onClick={() => setSatelliteCategoriesAll(!allSelected)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                {allSelected ? 'None' : 'All'}
              </button>
            </div>

            {/* Category checkboxes */}
            <div className="max-h-64 overflow-y-auto py-1">
              {DISPLAY_CATEGORIES.map((cat) => {
                const checked =
                  cat === 'stations'
                    ? satelliteCategories.has('stations') || satelliteCategories.has('station')
                    : satelliteCategories.has(cat)
                const catColor = getSatelliteColor(cat)
                const count = categoryCounts[cat] || 0

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      toggleSatelliteCategory(cat)
                      if (cat === 'stations') toggleSatelliteCategory('station')
                    }}
                    className="flex items-center w-full px-3 py-1.5 hover:bg-navy-700/50 transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center mr-2.5 shrink-0 ${
                        checked ? 'border-transparent' : 'border-slate-500'
                      }`}
                      style={checked ? { backgroundColor: catColor } : undefined}
                    >
                      {checked && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="w-2 h-2 rounded-full mr-2 shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                    <span className="text-xs text-slate-300 flex-1 text-left">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] text-slate-500 ml-1">
                        {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
