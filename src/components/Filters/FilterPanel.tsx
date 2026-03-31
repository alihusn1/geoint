import { useState } from 'react'
import { Filter, RotateCcw, ChevronLeft, ChevronRight, Globe, Shield, GitBranch, Calendar, Layers, ToggleLeft, ToggleRight } from 'lucide-react'
import { useFilterStore, selectActiveFilterCount } from '@/store/useFilterStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { useStrategicLayerStore } from '@/store/useStrategicLayerStore'
import { CountryFilter } from './CountryFilter'
import { BaseTypeFilter } from './BaseTypeFilter'
import { BranchFilter } from './BranchFilter'
import { DateRangeFilter } from './DateRangeFilter'
import { StrategicLayerPanel } from './StrategicLayerPanel'

const FILTER_SECTIONS = [
  { icon: Globe, label: 'Ctry' },
  { icon: Shield, label: 'Type' },
  { icon: GitBranch, label: 'Brn' },
  { icon: Calendar, label: 'Date' },
]

const STRIP_WIDTH = 46

export function FilterPanel() {
  const leftPanel = useGlobeStore((s) => s.leftPanel)
  const setLeftPanel = useGlobeStore((s) => s.setLeftPanel)
  const resetFilters = useFilterStore((s) => s.resetFilters)
  const filterCount = useFilterStore(selectActiveFilterCount)
  const showEvents = useGlobeStore((s) => s.showEvents)
  const setShowEvents = useGlobeStore((s) => s.setShowEvents)
  const showBases = useGlobeStore((s) => s.showBases)
  const setShowBases = useGlobeStore((s) => s.setShowBases)
  const enabledStrategicCount = useStrategicLayerStore((s) => Object.values(s.enabledLayers).filter(Boolean).length)

  const [activeTab, setActiveTab] = useState<'osm' | 'strategic'>('osm')

  const collapsed = leftPanel !== 'filter'

  const handleToggle = () => {
    setLeftPanel(collapsed ? 'filter' : null)
  }

  const badgeCount = activeTab === 'osm' ? filterCount : enabledStrategicCount

  return (
    <>
      {/* Toggle button / collapsed labels strip */}
      <button
        onClick={handleToggle}
        className="absolute z-30 bg-surface-300/95 backdrop-blur-sm border border-navy-700 border-l-0 rounded-r-lg text-slate-400 hover:text-white transition-all duration-300 ease-in-out"
        style={{
          top: 210,
          width: collapsed ? STRIP_WIDTH : undefined,
          left: collapsed
            ? leftPanel === 'osint' ? 320 : 0
            : 320,
          transition: 'left 0.3s ease-in-out',
        }}
        title={collapsed ? 'Open Filters' : 'Close Filters'}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-3 gap-3">
            {/* Filter icon with badge */}
            <div className="relative">
              {activeTab === 'osm' ? (
                <Filter size={16} className="text-cyan-400" />
              ) : (
                <Layers size={16} className="text-cyan-400" />
              )}
              {badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-alert-red text-white text-[9px] flex items-center justify-center font-bold">
                  {badgeCount}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="w-5 h-px bg-navy-600" />

            {/* Category labels */}
            <div className="flex flex-col gap-2.5">
              {activeTab === 'osm' ? (
                FILTER_SECTIONS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <Icon size={12} className="text-slate-500" />
                    <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                      {label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Layers size={12} className="text-slate-500" />
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                    Lyrs
                  </span>
                </div>
              )}
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

      {/* Expanded filter panel */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-30 bg-surface-300/95 backdrop-blur-sm border-r border-navy-700 flex flex-col transition-transform duration-300 ease-in-out ${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700 shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === 'osm' ? (
              <Filter size={14} className="text-cyan-400" />
            ) : (
              <Layers size={14} className="text-cyan-400" />
            )}
            <h2 className="text-sm font-semibold text-white tracking-wide">
              {activeTab === 'osm' ? 'OSM Filters' : 'Strategic Layers'}
            </h2>
          </div>
          {activeTab === 'osm' && (
            <button
              onClick={resetFilters}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-surface-100 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw size={12} />
              Reset All
              {filterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-alert-red text-white text-[10px] flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-navy-700 shrink-0">
          <button
            onClick={() => setActiveTab('osm')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'osm'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={12} />
            OSM Data
          </button>
          <button
            onClick={() => setActiveTab('strategic')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'strategic'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={12} />
            Strategic Layers
            {enabledStrategicCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] flex items-center justify-center font-bold">
                {enabledStrategicCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-5">
          {activeTab === 'osm' ? (
            <>
              {/* Visibility toggles */}
              <section className="flex flex-col gap-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Visibility
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Show Events</span>
                  <button onClick={() => setShowEvents(!showEvents)}>
                    {showEvents ? (
                      <ToggleRight size={22} className="text-cyan-400" />
                    ) : (
                      <ToggleLeft size={22} className="text-slate-600" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Show Bases</span>
                  <button onClick={() => setShowBases(!showBases)}>
                    {showBases ? (
                      <ToggleRight size={22} className="text-cyan-400" />
                    ) : (
                      <ToggleLeft size={22} className="text-slate-600" />
                    )}
                  </button>
                </div>
              </section>

              {/* Country */}
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Country
                </h3>
                <CountryFilter />
              </section>

              {/* Base Type */}
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Base Type
                </h3>
                <BaseTypeFilter />
              </section>

              {/* Branch */}
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Branch
                </h3>
                <BranchFilter />
              </section>

              {/* Date Range */}
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Date Range
                </h3>
                <DateRangeFilter />
              </section>
            </>
          ) : (
            <StrategicLayerPanel />
          )}
        </div>
      </div>
    </>
  )
}
