import { Shield, AlertTriangle, MapPin, Clock, Plane, Radar, Ship, Ban, Crosshair } from 'lucide-react'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useDataStore } from '@/store/useDataStore'
import { useLiveStore } from '@/store/useLiveStore'
import { relativeTime } from '@/utils/formatters'
import { LAYER_COLORS } from '@/utils/liveColors'
import { LayerToggle } from './LayerToggle'
import { SatelliteDropdown } from './SatelliteDropdown'
import type { LiveLayerName } from '@/types/live'

const LAYER_TOGGLES: { name: LiveLayerName; label: string; icon: typeof Plane }[] = [
  { name: 'aircraft',   label: 'ADS-B',  icon: Plane },
  { name: 'gpsJamming', label: 'JAM',    icon: Radar },
  { name: 'maritime',   label: 'AIS',    icon: Ship },
  { name: 'airspace',   label: 'NOTAM',  icon: Ban },
  { name: 'strikes',    label: 'STRIKE', icon: Crosshair },
]

export function StatsBar() {
  const { filteredBases, filteredEvents, uniqueCountries } = useFilteredData()
  const lastUpdated = useDataStore((s) => s.lastUpdated)
  const apiStats = useDataStore((s) => s.stats)
  const mode = useDataStore((s) => s.mode)
  const loading = useDataStore((s) => s.loading)
  const layers = useLiveStore((s) => s.layers)
  const toggleLayer = useLiveStore((s) => s.toggleLayer)

  // Use API stats when online; fall back to filtered data counts
  const totalBases = mode === 'online' && apiStats ? apiStats.total_bases : filteredBases.length
  const totalEvents = mode === 'online' && apiStats ? apiStats.total_events : filteredEvents.length
  const totalCountries = mode === 'online' && apiStats ? apiStats.total_countries : uniqueCountries

  const stats = [
    {
      icon: Shield,
      label: 'Total Bases',
      value: totalBases,
      color: 'text-cyan-400',
    },
    {
      icon: AlertTriangle,
      label: 'Active Events',
      value: totalEvents,
      color: 'text-alert-red',
    },
    {
      icon: MapPin,
      label: 'Countries',
      value: totalCountries,
      color: 'text-alert-green',
    },
    {
      icon: Clock,
      label: 'Last Updated',
      value: lastUpdated ? relativeTime(lastUpdated) : '—',
      color: 'text-alert-yellow',
    },
  ]

  return (
    <div
      className="flex items-center gap-4 px-4 bg-surface-400 border-b border-navy-700 shrink-0 overflow-x-auto"
      style={{ height: 60 }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2.5 px-3 py-2 bg-surface-300 rounded border border-navy-700 min-w-[140px]"
        >
          <stat.icon size={16} className={stat.color} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {stat.label}
            </div>
            <div className="text-sm font-semibold text-white">
              {loading && typeof stat.value === 'number' ? (
                <span className="inline-block w-8 h-4 bg-navy-700 rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Divider */}
      <div className="w-px h-8 bg-navy-700 shrink-0" />

      {/* Live layer toggles */}
      {LAYER_TOGGLES.slice(0, 1).map((lt) => (
        <LayerToggle
          key={lt.name}
          icon={lt.icon}
          label={lt.label}
          color={LAYER_COLORS[lt.name]}
          enabled={layers[lt.name].enabled}
          count={layers[lt.name].data.length}
          loading={layers[lt.name].loading}
          onClick={() => toggleLayer(lt.name)}
        />
      ))}
      <SatelliteDropdown />
      {LAYER_TOGGLES.slice(1).map((lt) => (
        <LayerToggle
          key={lt.name}
          icon={lt.icon}
          label={lt.label}
          color={LAYER_COLORS[lt.name]}
          enabled={layers[lt.name].enabled}
          count={layers[lt.name].data.length}
          loading={layers[lt.name].loading}
          onClick={() => toggleLayer(lt.name)}
        />
      ))}
    </div>
  )
}
