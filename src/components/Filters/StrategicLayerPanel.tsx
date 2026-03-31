import {
  ShieldAlert, Radio, Factory, Zap, Flag, Flame, Eye, Anchor, Radiation, Target, Orbit,
  Table2, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react'
import { useStrategicLayerStore, STRATEGIC_LAYER_CATALOG } from '@/store/useStrategicLayerStore'
import { useGlobeStore } from '@/store/useGlobeStore'

const ICON_MAP: Record<string, typeof ShieldAlert> = {
  ShieldAlert, Radio, Factory, Zap, Flag, Flame, Eye, Anchor, Radiation, Target, Orbit,
}

const LAYER_IDS = Object.keys(STRATEGIC_LAYER_CATALOG)

export function StrategicLayerPanel() {
  const enabledLayers = useStrategicLayerStore((s) => s.enabledLayers)
  const geojsonData = useStrategicLayerStore((s) => s.geojsonData)
  const toggleLayer = useStrategicLayerStore((s) => s.toggleLayer)
  const enableAll = useStrategicLayerStore((s) => s.enableAll)
  const disableAll = useStrategicLayerStore((s) => s.disableAll)
  const setActiveCSVLayer = useStrategicLayerStore((s) => s.setActiveCSVLayer)
  const loading = useStrategicLayerStore((s) => s.loading)
  const setSidebarOpen = useGlobeStore((s) => s.setSidebarOpen)
  const setSidebarTab = useGlobeStore((s) => s.setSidebarTab)

  const enabledCount = Object.values(enabledLayers).filter(Boolean).length

  const openTable = (id: string) => {
    setActiveCSVLayer(id)
    setSidebarTab('strategic')
    setSidebarOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading layers...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk actions */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Layers ({enabledCount}/{LAYER_IDS.length})
        </span>
        <div className="flex gap-2">
          <button
            onClick={enableAll}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-slate-300 hover:text-white transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={disableAll}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-slate-300 hover:text-white transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Layer list */}
      {LAYER_IDS.map((id) => {
        const meta = STRATEGIC_LAYER_CATALOG[id]
        const Icon = ICON_MAP[meta.icon] ?? Target
        const enabled = enabledLayers[id] ?? false
        const fc = geojsonData[id]
        const count = fc?.features?.length ?? 0

        return (
          <div
            key={id}
            className="flex items-center gap-2.5 px-1 py-1.5 rounded hover:bg-surface-100/50 transition-colors"
          >
            {/* Color dot */}
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: meta.color }}
            />

            {/* Icon */}
            <Icon size={14} style={{ color: meta.color }} className="shrink-0" />

            {/* Label + count */}
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-200 truncate block">{meta.label}</span>
            </div>
            {count > 0 && (
              <span className="text-[9px] font-medium text-slate-500 shrink-0">{count}</span>
            )}

            {/* Table button */}
            <button
              onClick={() => openTable(id)}
              className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
              title="View table"
            >
              <Table2 size={12} />
            </button>

            {/* Toggle */}
            <button
              onClick={() => toggleLayer(id)}
              className="shrink-0"
              title={enabled ? 'Disable' : 'Enable'}
            >
              {enabled ? (
                <ToggleRight size={20} style={{ color: meta.color }} />
              ) : (
                <ToggleLeft size={20} className="text-slate-600" />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
