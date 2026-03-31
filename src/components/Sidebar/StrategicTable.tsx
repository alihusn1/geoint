import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useStrategicLayerStore, STRATEGIC_LAYER_CATALOG } from '@/store/useStrategicLayerStore'
import { useGlobeStore } from '@/store/useGlobeStore'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 100

/** Try to extract lat/lng from a row using common column names. */
function extractCoords(row: Record<string, unknown>): { lat: number; lng: number } | null {
  const latKeys = ['latitude', 'lat', 'Latitude', 'LAT']
  const lngKeys = ['longitude', 'lng', 'lon', 'long', 'Longitude', 'LON', 'LONG']
  let lat: number | null = null
  let lng: number | null = null
  for (const k of latKeys) {
    const v = Number(row[k])
    if (!isNaN(v) && v !== 0) { lat = v; break }
  }
  for (const k of lngKeys) {
    const v = Number(row[k])
    if (!isNaN(v) && v !== 0) { lng = v; break }
  }
  if (lat != null && lng != null) return { lat, lng }
  return null
}

export function StrategicTable() {
  const activeCSVLayer = useStrategicLayerStore((s) => s.activeCSVLayer)
  const enabledLayers = useStrategicLayerStore((s) => s.enabledLayers)
  const geojsonData = useStrategicLayerStore((s) => s.geojsonData)
  const setActiveCSVLayer = useStrategicLayerStore((s) => s.setActiveCSVLayer)
  const setCameraPosition = useGlobeStore((s) => s.setCameraPosition)
  const setConnectorTarget = useGlobeStore((s) => s.setConnectorTarget)
  const connectorTarget = useGlobeStore((s) => s.connectorTarget)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const layerId = activeCSVLayer
  const meta = layerId ? STRATEGIC_LAYER_CATALOG[layerId] : null

  // Derive table data directly from already-loaded GeoJSON (no API call needed)
  const tableData = useMemo(() => {
    if (!layerId) return null
    const fc = geojsonData[layerId]
    if (!fc?.features?.length) return null

    // Collect all unique property keys as columns
    const colSet = new Set<string>()
    for (const f of fc.features) {
      if (f.properties) {
        for (const k of Object.keys(f.properties)) colSet.add(k)
      }
    }
    // Add lat/lng columns
    colSet.add('latitude')
    colSet.add('longitude')
    const columns = Array.from(colSet)

    // Build rows from feature properties + geometry coords
    const rows: Record<string, unknown>[] = fc.features.map((f) => {
      const row: Record<string, unknown> = { ...(f.properties ?? {}) }
      if (f.geometry?.type === 'Point') {
        const coords = (f.geometry as GeoJSON.Point).coordinates
        row.latitude = coords[1]
        row.longitude = coords[0]
      }
      return row
    })

    return { columns, rows }
  }, [layerId, geojsonData])

  // Enabled layers list for the switcher
  const enabledLayerIds = useMemo(
    () => Object.keys(enabledLayers).filter((id) => enabledLayers[id] && STRATEGIC_LAYER_CATALOG[id]),
    [enabledLayers],
  )

  // Auto-select first enabled layer if none active or active layer was disabled
  useEffect(() => {
    if (!layerId || !enabledLayers[layerId]) {
      if (enabledLayerIds.length > 0) {
        setActiveCSVLayer(enabledLayerIds[0])
      }
    }
  }, [layerId, enabledLayers, enabledLayerIds, setActiveCSVLayer])

  // Reset search, page & connector when switching layers
  useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setPage(0)
    setConnectorTarget(null)
  }, [layerId, setConnectorTarget])

  // Debounce search input (300ms)
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // Pre-compute lowercase search index
  const searchIndex = useMemo(() => {
    if (!tableData) return null
    return tableData.rows.map((row) =>
      tableData.columns.map((col) => String(row[col] ?? '').toLowerCase()).join('\0'),
    )
  }, [tableData])

  // Memoized filtered rows
  const filteredRows = useMemo(() => {
    if (!tableData) return []
    if (!debouncedSearch) return tableData.rows
    const lower = debouncedSearch.toLowerCase()
    if (!searchIndex) return tableData.rows
    return tableData.rows.filter((_, i) => searchIndex[i].includes(lower))
  }, [tableData, debouncedSearch, searchIndex])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = useMemo(
    () => filteredRows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredRows, safePage],
  )

  if (!layerId || !meta) {
    return <div className="text-slate-400 text-sm p-4">No layer selected.</div>
  }

  if (!tableData) {
    return <div className="text-slate-400 text-sm p-4">No data available for this layer.</div>
  }

  const { columns } = tableData

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Layer switcher tabs (shown when multiple layers enabled) */}
      {enabledLayerIds.length > 1 && (
        <div className="flex gap-1 px-3 py-2 border-b border-navy-700 shrink-0 flex-wrap">
          {enabledLayerIds.map((id) => {
            const m = STRATEGIC_LAYER_CATALOG[id]
            const isActive = id === layerId
            return (
              <button
                key={id}
                onClick={() => setActiveCSVLayer(id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold border transition-colors"
                style={{
                  backgroundColor: isActive ? `${m.color}25` : `${m.color}10`,
                  color: isActive ? m.color : '#94A3B8',
                  borderColor: isActive ? m.color : `${m.color}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: m.color }}
                />
                {m.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: meta.color }}
          />
          <span className="text-sm font-semibold text-white">{meta.label}</span>
          <span className="text-[10px] text-slate-500">{filteredRows.length} rows</span>
        </div>
        <button
          onClick={() => { setConnectorTarget(null); setActiveCSVLayer(null) }}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Close table"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-navy-700 shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Filter rows..."
            className="w-full pl-7 pr-2 py-1.5 rounded bg-surface-100 border border-navy-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-300">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap border-b border-navy-700"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const globalIdx = safePage * PAGE_SIZE + i
              const rowId = `strat-row-${layerId}-${globalIdx}`
              const coords = extractCoords(row)
              const isSelected = connectorTarget?.rowId === rowId

              const handleRowClick = () => {
                if (!coords) return
                if (isSelected) {
                  setConnectorTarget(null)
                  return
                }
                setConnectorTarget({ lat: coords.lat, lng: coords.lng, color: meta!.color, rowId })
                const currentAlt = useGlobeStore.getState().zoomAltitude
                setCameraPosition({ lat: coords.lat, lng: coords.lng, altitude: Math.min(currentAlt, 0.6) })
              }

              return (
                <tr
                  key={globalIdx}
                  data-row-id={rowId}
                  onClick={handleRowClick}
                  className={`${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                      : i % 2 === 0 ? 'bg-surface-300/50' : 'bg-surface-100/30'
                  } ${coords ? 'cursor-pointer' : ''} hover:bg-cyan-500/5 transition-colors`}
                >
                  {columns.map((col) => {
                    const val = String(row[col] ?? '')
                    return (
                      <td
                        key={col}
                        className="px-2 py-1.5 text-slate-300 whitespace-nowrap max-w-[180px] truncate"
                        title={val}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-navy-700 shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-slate-400 font-mono px-1">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
