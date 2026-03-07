import { useDataStore } from '@/store/useDataStore'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function StatusIndicator() {
  const mode = useDataStore((s) => s.mode)
  const error = useDataStore((s) => s.error)

  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-300 border border-navy-700 text-xs font-mono">
        <AlertCircle size={12} className="text-alert-red" />
        <span className="text-alert-red truncate max-w-[120px]">{error}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-300 border border-navy-700 text-xs font-mono">
      {mode === 'offline' ? (
        <>
          <WifiOff size={12} className="text-alert-orange" />
          <span className="text-alert-orange">OFFLINE MODE</span>
        </>
      ) : (
        <>
          <Wifi size={12} className="text-alert-green" />
          <span className="text-alert-green">LIVE</span>
        </>
      )}
    </div>
  )
}
