import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import * as baseService from '@/services/baseService'

export function ExportButton() {
  const mode = useDataStore((s) => s.mode)
  const [exporting, setExporting] = useState(false)

  if (mode !== 'online') return null

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await baseService.exportGeoJSON()
      const url = URL.createObjectURL(blob as unknown as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'geoint-bases.geojson'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-300 border border-navy-700 rounded text-xs text-slate-300 hover:text-white hover:border-cyan-400/50 transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      Export GeoJSON
    </button>
  )
}
