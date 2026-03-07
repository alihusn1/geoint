import { Loader2 } from 'lucide-react'

export function GlobeLoader() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="text-cyan-400 animate-spin" />
        <span className="text-sm text-slate-400 font-mono">Loading data...</span>
      </div>
    </div>
  )
}
