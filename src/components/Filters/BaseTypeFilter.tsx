import { useFilterStore } from '@/store/useFilterStore'
import { BASE_COLORS } from '@/utils/colors'
import type { BaseType } from '@/types'

const ALL_BASE_TYPES: BaseType[] = [
  'airfield',
  'naval',
  'barracks',
  'military',
  'range',
  'nuclear',
  'bunker',
]

const LABELS: Record<BaseType, string> = {
  airfield: 'Airfield',
  naval: 'Naval',
  barracks: 'Barracks',
  military: 'Military',
  range: 'Range',
  nuclear: 'Nuclear',
  bunker: 'Bunker',
}

export function BaseTypeFilter() {
  const selected = useFilterStore((s) => s.baseTypes)
  const toggleBaseType = useFilterStore((s) => s.toggleBaseType)

  return (
    <div className="flex flex-col gap-1">
      {ALL_BASE_TYPES.map((type) => {
        const isSelected = selected.includes(type)
        const color = BASE_COLORS[type]

        return (
          <button
            key={type}
            onClick={() => toggleBaseType(type)}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-colors text-left ${
              isSelected
                ? 'bg-cyan-400/10 text-white'
                : 'text-slate-300 hover:bg-navy-900/60 hover:text-white'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-cyan-400 border-cyan-400'
                  : 'border-slate-500'
              }`}
            >
              {isSelected && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  className="text-navy-900"
                >
                  <path
                    d="M1.5 4L3.2 5.7L6.5 2.3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>{LABELS[type]}</span>
          </button>
        )
      })}
    </div>
  )
}
