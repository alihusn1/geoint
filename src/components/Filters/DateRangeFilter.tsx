import { Calendar } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'

export function DateRangeFilter() {
  const dateRange = useFilterStore((s) => s.dateRange)
  const setDateRange = useFilterStore((s) => s.setDateRange)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          <Calendar size={11} />
          From
        </label>
        <input
          type="date"
          value={dateRange.from ?? ''}
          onChange={(e) =>
            setDateRange({ ...dateRange, from: e.target.value || null })
          }
          className="w-full px-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white outline-none focus:border-cyan-400/50 transition-colors [color-scheme:dark]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          <Calendar size={11} />
          To
        </label>
        <input
          type="date"
          value={dateRange.to ?? ''}
          onChange={(e) =>
            setDateRange({ ...dateRange, to: e.target.value || null })
          }
          className="w-full px-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white outline-none focus:border-cyan-400/50 transition-colors [color-scheme:dark]"
        />
      </div>
    </div>
  )
}
