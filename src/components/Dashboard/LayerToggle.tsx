import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface LayerToggleProps {
  icon: LucideIcon
  label: string
  color: string
  enabled: boolean
  count: number
  loading: boolean
  onClick: () => void
}

export function LayerToggle({
  icon: Icon,
  label,
  color,
  enabled,
  count,
  loading,
  onClick,
}: LayerToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded border transition-all whitespace-nowrap ${
        enabled
          ? 'opacity-100'
          : 'bg-surface-300 border-navy-700 opacity-50 hover:opacity-75'
      }`}
      style={
        enabled
          ? {
              backgroundColor: `${color}15`,
              borderColor: `${color}66`,
            }
          : undefined
      }
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" style={{ color }} />
      ) : (
        <Icon size={14} style={{ color: enabled ? color : undefined }} />
      )}
      <span className="text-[10px] uppercase tracking-wider text-slate-300">
        {label}
      </span>
      {enabled && count > 0 && (
        <span
          className="text-[10px] font-semibold px-1.5 rounded-full"
          style={{ backgroundColor: `${color}30`, color }}
        >
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  )
}
