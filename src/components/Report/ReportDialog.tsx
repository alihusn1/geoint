import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Loader2 } from 'lucide-react'
import { generateReport, type ReportData } from '@/services/reportService'
import { ReportViewer } from './ReportViewer'

const ALL_SECTIONS = [
  { key: 'executive_summary', label: 'Executive Summary' },
  { key: 'highlights', label: 'Key Highlights' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'recommendations', label: 'Recommendations' },
] as const

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type State = 'idle' | 'configuring' | 'generating' | 'viewing'

export function ReportDialog() {
  const [state, setState] = useState<State>('idle')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Config form state
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const [fromDt, setFromDt] = useState(toLocalDatetime(yesterday))
  const [toDt, setToDt] = useState(toLocalDatetime(now))
  const [sections, setSections] = useState<Set<string>>(
    new Set(ALL_SECTIONS.map((s) => s.key)),
  )

  // Portal positioning
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 300) })
  }, [])

  useEffect(() => {
    if (state !== 'configuring') return
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [state, updatePos])

  // Click outside
  useEffect(() => {
    if (state !== 'configuring') return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        btnRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return
      setState('idle')
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [state])

  const toggleSection = (key: string) => {
    setSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleGenerate = async () => {
    if (sections.size === 0) return
    setError(null)
    setState('generating')
    try {
      const data = await generateReport({
        from_datetime: new Date(fromDt).toISOString(),
        to_datetime: new Date(toDt).toISOString(),
        sections: Array.from(sections),
      })
      if (data.event_count === 0) {
        setError('No events found in this date range.')
        setState('configuring')
        return
      }
      setReportData(data)
      setState('viewing')
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report')
      setState('configuring')
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={() =>
          setState((s) => (s === 'configuring' ? 'idle' : 'configuring'))
        }
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-300 border border-navy-700 rounded text-xs text-slate-300 hover:text-white hover:border-cyan-400/50 transition-colors"
      >
        <FileText size={12} />
        Report
      </button>

      {/* Config popup */}
      {(state === 'configuring' || state === 'generating') &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed w-[300px] bg-surface-400 border border-navy-600 rounded-lg shadow-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-navy-700">
              <span className="text-xs font-medium text-slate-300">
                Generate Intelligence Report
              </span>
            </div>

            <div className="p-3 flex flex-col gap-3">
              {/* Date range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  From
                </label>
                <input
                  type="datetime-local"
                  value={fromDt}
                  onChange={(e) => setFromDt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white outline-none focus:border-cyan-400/50 transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  To
                </label>
                <input
                  type="datetime-local"
                  value={toDt}
                  onChange={(e) => setToDt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white outline-none focus:border-cyan-400/50 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Section checkboxes */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Sections
                </span>
                {ALL_SECTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleSection(key)}
                    disabled={state === 'generating'}
                    className="flex items-center gap-2 px-1 py-1 hover:bg-navy-700/50 rounded transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        sections.has(key)
                          ? 'bg-cyan-500 border-transparent'
                          : 'border-slate-500'
                      }`}
                    >
                      {sections.has(key) && (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3 6L7 2"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-slate-300">{label}</span>
                  </button>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={state === 'generating' || sections.size === 0}
                className="flex items-center justify-center gap-2 w-full py-2 rounded bg-cyan-500/20 border border-cyan-400/50 text-xs font-medium text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                {state === 'generating' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating report...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* PDF Viewer modal */}
      {state === 'viewing' &&
        reportData &&
        createPortal(
          <ReportViewer
            data={reportData}
            onClose={() => setState('idle')}
          />,
          document.body,
        )}
    </>
  )
}
