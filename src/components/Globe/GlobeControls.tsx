import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, GitBranch, Sun, Moon, Satellite, RefreshCw } from 'lucide-react'
import { useGlobeStore } from '@/store/useGlobeStore'

interface GlobeControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

type MapLayer = 'street' | 'dark' | 'satellite'

const MAP_LAYERS: { id: MapLayer; label: string; icon: typeof Sun }[] = [
  { id: 'street', label: 'Street', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
]

export function GlobeControls({ onZoomIn, onZoomOut, onReset }: GlobeControlsProps) {
  const showEvents = useGlobeStore((s) => s.showEvents)
  const showArcs = useGlobeStore((s) => s.showArcs)
  const autoRotate = useGlobeStore((s) => s.autoRotate)
  const mapLayer = useGlobeStore((s) => s.mapLayer)
  const sidebarOpen = useGlobeStore((s) => s.sidebarOpen)
  const setShowEvents = useGlobeStore((s) => s.setShowEvents)
  const setShowArcs = useGlobeStore((s) => s.setShowArcs)
  const setAutoRotate = useGlobeStore((s) => s.setAutoRotate)
  const setMapLayer = useGlobeStore((s) => s.setMapLayer)

  const btnClass =
    'w-9 h-9 flex items-center justify-center rounded bg-surface-300/80 backdrop-blur border border-navy-700 text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors'

  return (
    <div
      className="absolute bottom-4 z-30 flex flex-col gap-2 transition-[right] duration-300 ease-in-out"
      style={{ right: sidebarOpen ? 396 : 16 }}
    >
      <button onClick={onZoomIn} className={btnClass} title="Zoom In">
        <ZoomIn size={16} />
      </button>
      <button onClick={onZoomOut} className={btnClass} title="Zoom Out">
        <ZoomOut size={16} />
      </button>
      <button onClick={onReset} className={btnClass} title="Reset Camera">
        <RotateCcw size={16} />
      </button>

      <div className="w-9 h-px bg-navy-700 my-1" />

      <button
        onClick={() => setShowEvents(!showEvents)}
        className={`${btnClass} ${showEvents ? '!border-alert-red/50 !text-alert-red bg-alert-red/10' : ''}`}
        title="Toggle Events"
      >
        {showEvents ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button
        onClick={() => setShowArcs(!showArcs)}
        className={`${btnClass} ${showArcs ? '!border-cyan-400/50 !text-cyan-400 bg-cyan-400/10' : ''}`}
        title="Toggle Arcs"
      >
        <GitBranch size={16} />
      </button>
      <button
        onClick={() => setAutoRotate(!autoRotate)}
        className={`${btnClass} ${autoRotate ? '!border-cyan-400/50 !text-cyan-400 bg-cyan-400/10' : ''}`}
        title="Auto Rotate"
      >
        <RefreshCw size={16} className={autoRotate ? 'animate-spin' : ''} style={autoRotate ? { animationDuration: '3s' } : undefined} />
      </button>

      <div className="w-9 h-px bg-navy-700 my-1" />

      {/* Map layer picker */}
      <div className="flex flex-col gap-1 p-1 rounded-lg bg-surface-300/80 backdrop-blur border border-navy-700">
        {MAP_LAYERS.map((layer) => {
          const active = mapLayer === layer.id
          return (
            <button
              key={layer.id}
              onClick={() => setMapLayer(layer.id)}
              className={`w-[72px] h-7 flex items-center gap-1.5 px-1.5 rounded text-[10px] font-medium transition-colors ${
                active
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-surface-100 border border-transparent'
              }`}
              title={layer.label}
            >
              <layer.icon size={12} className="shrink-0" />
              {layer.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
