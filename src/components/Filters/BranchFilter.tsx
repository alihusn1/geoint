import { useFilterStore } from '@/store/useFilterStore'
import type { Branch } from '@/types'

const ALL_BRANCHES: Branch[] = [
  'US Air Force',
  'US Army',
  'US Navy',
  'US Marine Corps',
  'US Space Force',
  'Joint',
  'NATO',
  'Allied',
]

export function BranchFilter() {
  const selected = useFilterStore((s) => s.branches)
  const toggleBranch = useFilterStore((s) => s.toggleBranch)

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_BRANCHES.map((branch) => {
        const isSelected = selected.includes(branch)
        return (
          <button
            key={branch}
            onClick={() => toggleBranch(branch)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
              isSelected
                ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/40'
                : 'bg-navy-900/50 text-slate-400 border-navy-700 hover:text-white hover:border-slate-500'
            }`}
          >
            {branch}
          </button>
        )
      })}
    </div>
  )
}
