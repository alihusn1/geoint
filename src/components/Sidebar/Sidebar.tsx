import { X, Shield, AlertTriangle, MapPin } from 'lucide-react'
import { useGlobeStore } from '@/store/useGlobeStore'
import type { SidebarTab } from '@/types'

interface SidebarProps {
  children?: React.ReactNode
}

const tabs: { id: SidebarTab; label: string; icon: typeof Shield }[] = [
  { id: 'base', label: 'Base', icon: Shield },
  { id: 'event', label: 'Event', icon: AlertTriangle },
  { id: 'country', label: 'Country', icon: MapPin },
]

export function Sidebar({ children }: SidebarProps) {
  const sidebarOpen = useGlobeStore((s) => s.sidebarOpen)
  const sidebarTab = useGlobeStore((s) => s.sidebarTab)
  const setSidebarTab = useGlobeStore((s) => s.setSidebarTab)
  const closeSidebar = useGlobeStore((s) => s.closeSidebar)

  return (
    <div
      className={`fixed right-0 z-40 bg-surface-300 border-l border-navy-700 flex flex-col transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: 380, top: 140, height: 'calc(100vh - 140px)' }}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-navy-700 shrink-0">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
                sidebarTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={closeSidebar}
          className="m-1.5 p-1.5 rounded bg-navy-900/60 border border-navy-700 text-slate-300 hover:text-white hover:bg-alert-red/20 hover:border-alert-red/40 transition-colors"
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  )
}
