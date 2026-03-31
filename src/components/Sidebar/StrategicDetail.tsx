import type { StrategicFeatureData } from '@/types'
import { STRATEGIC_LAYER_CATALOG, useStrategicLayerStore } from '@/store/useStrategicLayerStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { Table2 } from 'lucide-react'

interface Props {
  feature: StrategicFeatureData
}

export function StrategicDetail({ feature }: Props) {
  const meta = STRATEGIC_LAYER_CATALOG[feature.layerId]
  const color = meta?.color ?? '#94A3B8'
  const setActiveCSVLayer = useStrategicLayerStore((s) => s.setActiveCSVLayer)
  const setSidebarTab = useGlobeStore((s) => s.setSidebarTab)

  const openTable = () => {
    setActiveCSVLayer(feature.layerId)
    setSidebarTab('strategic')
  }

  // Collect extra properties (exclude already-displayed ones)
  const shown = new Set(['name', 'country', 'category', 'subcategory', 'status', 'description', 'latitude', 'longitude'])
  const extraProps = Object.entries(feature.properties).filter(([k]) => !shown.has(k))

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <h2 className="text-lg font-bold text-white leading-tight">{feature.name}</h2>

      {/* Category badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
          style={{ background: `${color}25`, color }}
        >
          {meta?.label ?? feature.layerId}
        </span>
        {feature.status && (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
            style={{
              color:
                feature.status.toLowerCase() === 'active' ? '#2A9D8F'
                : feature.status.toLowerCase() === 'inactive' ? '#E63946'
                : '#F77F00',
            }}
          >
            {feature.status}
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-2 text-xs">
        {feature.country && (
          <div className="flex justify-between">
            <span className="text-slate-400">Country</span>
            <span className="text-slate-200">{feature.country}</span>
          </div>
        )}
        {feature.category && (
          <div className="flex justify-between">
            <span className="text-slate-400">Category</span>
            <span className="text-slate-200">{feature.category.replace(/_/g, ' ')}</span>
          </div>
        )}
        {feature.subcategory && (
          <div className="flex justify-between">
            <span className="text-slate-400">Subcategory</span>
            <span className="text-slate-200">{feature.subcategory}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {feature.description && (
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{feature.description}</p>
        </div>
      )}

      {/* Extra properties */}
      {extraProps.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Properties</h3>
          <div className="flex flex-col gap-1.5">
            {extraProps.map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs gap-2">
                <span className="text-slate-500 shrink-0">{key.replace(/_/g, ' ')}</span>
                <span className="text-slate-300 text-right truncate" title={String(value ?? '')}>
                  {String(value ?? '-')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View table button */}
      <button
        onClick={openTable}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-100 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-navy-700 hover:border-cyan-500/30"
      >
        <Table2 size={14} />
        View Layer Table
      </button>
    </div>
  )
}
