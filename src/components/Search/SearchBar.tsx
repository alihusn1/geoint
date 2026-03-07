import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, X, Shield, AlertTriangle, Loader2 } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { useGlobeInteraction } from '@/hooks/useGlobeInteraction'
import { mapBase, mapEvent } from '@/services/mappers'
import * as statsService from '@/services/statsService'
import type { MilitaryBase, OSINTEvent } from '@/types'

type SearchResult =
  | { type: 'base'; item: MilitaryBase }
  | { type: 'event'; item: OSINTEvent }

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searching, setSearching] = useState(false)
  const [apiResults, setApiResults] = useState<SearchResult[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const bases = useDataStore((s) => s.bases)
  const events = useDataStore((s) => s.events)
  const mode = useDataStore((s) => s.mode)
  const { handleBaseClick, handleEventClick } = useGlobeInteraction()

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // API search when online
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setApiResults(null)
      return
    }
    if (mode !== 'online') {
      setApiResults(null)
      return
    }

    let cancelled = false
    setSearching(true)
    statsService
      .search(debouncedQuery, 10)
      .then((res) => {
        if (cancelled) return
        const mapped: SearchResult[] = [
          ...(res.bases ?? []).map((b: any) => ({
            type: 'base' as const,
            item: mapBase(b),
          })),
          ...(res.events ?? []).map((e: any) => ({
            type: 'event' as const,
            item: mapEvent(e),
          })),
        ]
        setApiResults(mapped)
      })
      .catch(() => {
        if (!cancelled) setApiResults(null)
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery, mode])

  // Local search fallback (offline or as-is)
  const localResults: SearchResult[] = useMemo(() => {
    if (mode === 'online') return []
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    const baseResults: SearchResult[] = bases
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.country.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((item) => ({ type: 'base', item }))
    const eventResults: SearchResult[] = events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.country.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((item) => ({ type: 'event', item }))
    return [...baseResults, ...eventResults]
  }, [debouncedQuery, bases, events, mode])

  const results = apiResults ?? localResults

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectResult = useCallback(
    (result: SearchResult) => {
      if (result.type === 'base') handleBaseClick(result.item)
      else handleEventClick(result.item)
      setQuery('')
      setOpen(false)
    },
    [handleBaseClick, handleEventClick],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      selectResult(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && (results.length > 0 || searching)

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-surface-100 border border-navy-700 rounded px-2.5 py-1.5 gap-2 w-64 focus-within:border-cyan-400/50 transition-colors">
        {searching ? (
          <Loader2 size={14} className="text-cyan-400 shrink-0 animate-spin" />
        ) : (
          <Search size={14} className="text-slate-500 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search bases, events..."
          className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            className="text-slate-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-surface-300 border border-navy-700 rounded-lg shadow-xl overflow-hidden z-50">
          {searching && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-400 text-center">
              Searching...
            </div>
          )}
          {!searching && debouncedQuery && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-500 text-center">
              No results
            </div>
          )}
          {results.some((r) => r.type === 'base') && (
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 bg-surface-400">
              Bases
            </div>
          )}
          {results
            .filter((r) => r.type === 'base')
            .map((r) => {
              const globalIdx = results.indexOf(r)
              return (
                <button
                  key={r.item.id}
                  onClick={() => selectResult(r)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-surface-100 transition-colors ${
                    globalIdx === activeIndex ? 'bg-surface-100' : ''
                  }`}
                >
                  <Shield size={14} className="text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">
                      {(r.item as MilitaryBase).name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(r.item as MilitaryBase).country}
                    </div>
                  </div>
                </button>
              )
            })}
          {results.some((r) => r.type === 'event') && (
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 bg-surface-400 border-t border-navy-700">
              Events
            </div>
          )}
          {results
            .filter((r) => r.type === 'event')
            .map((r) => {
              const globalIdx = results.indexOf(r)
              return (
                <button
                  key={r.item.id}
                  onClick={() => selectResult(r)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-surface-100 transition-colors ${
                    globalIdx === activeIndex ? 'bg-surface-100' : ''
                  }`}
                >
                  <AlertTriangle size={14} className="text-alert-red shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">
                      {(r.item as OSINTEvent).title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(r.item as OSINTEvent).country}
                    </div>
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
