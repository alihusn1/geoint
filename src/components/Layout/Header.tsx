import { Globe } from 'lucide-react'
import { StatusIndicator } from './StatusIndicator'
import { ReportDialog } from '../Report/ReportDialog'

interface HeaderProps {
  searchBar?: React.ReactNode
}

export function Header({ searchBar }: HeaderProps) {
  return (
    <header
      className="h-12 flex items-center justify-between px-4 bg-surface-300 border-b border-navy-700 shrink-0 z-50"
      style={{ minHeight: 48 }}
    >
      <div className="flex items-center gap-3">
        <Globe size={22} className="text-cyan-400" />
        <h1 className="text-base font-bold tracking-wide text-cyan-400">
          Global Watch
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ReportDialog />
        {searchBar}
        <StatusIndicator />
      </div>
    </header>
  )
}
