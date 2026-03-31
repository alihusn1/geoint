import { X, Download } from 'lucide-react'
import { PDFViewer, BlobProvider } from '@react-pdf/renderer'
import { ReportPDF } from './ReportPDF'
import type { ReportData } from '@/services/reportService'

interface ReportViewerProps {
  data: ReportData
  onClose: () => void
}

export function ReportViewer({ data, onClose }: ReportViewerProps) {
  const dateStr = new Date(data.generated_at).toISOString().slice(0, 10)
  const fileName = `OSINT_Report_${dateStr}.pdf`

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-400 border-b border-navy-700 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white">OSINT Report</h2>
          <span className="text-xs text-slate-400">
            {new Date(data.from_datetime).toLocaleDateString()} —{' '}
            {new Date(data.to_datetime).toLocaleDateString()}
          </span>
          <span className="text-xs text-slate-500">
            {data.event_count} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <BlobProvider document={<ReportPDF data={data} />}>
            {({ blob, loading }) => (
              <button
                disabled={loading || !blob}
                onClick={() => {
                  if (!blob) return
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = fileName
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/50 rounded text-xs text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                <Download size={12} />
                {loading ? 'Preparing...' : 'Download PDF'}
              </button>
            )}
          </BlobProvider>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-navy-700 transition-colors text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 min-h-0">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ReportPDF data={data} />
        </PDFViewer>
      </div>
    </div>
  )
}
