import { useEffect, useRef, useState, useCallback } from 'react'
import { Header } from '@/components/Layout/Header'
import { NewsTicker } from '@/components/Dashboard/NewsTicker'
import { StatsBar } from '@/components/Dashboard/StatsBar'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { GlobeView } from '@/components/Globe/GlobeView'
import { FilterPanel } from '@/components/Filters/FilterPanel'
import { SearchBar } from '@/components/Search/SearchBar'
import { BaseDetail } from '@/components/Sidebar/BaseDetail'
import { EventDetail } from '@/components/Sidebar/EventDetail'
import { CountryProfile } from '@/components/Sidebar/CountryProfile'
import { EventTimeline } from '@/components/Dashboard/EventTimeline'
import { EventFeed } from '@/components/Dashboard/EventFeed'
import { OSINTFeedPanel } from '@/components/Dashboard/OSINTFeedPanel'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GlobeLoader } from '@/components/ui/GlobeLoader'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import { useGlobeStore } from '@/store/useGlobeStore'

// Build filter params from filter store state for API calls
function buildBaseFilters(f: ReturnType<typeof useFilterStore.getState>) {
  const params: Record<string, string | number> = {}
  if (f.countries.length) params.country = f.countries.join(',')
  if (f.baseTypes.length) params.type = f.baseTypes.join(',')
  if (f.branches.length) params.branch = f.branches.join(',')
  if (f.status.length) params.status = f.status.join(',')
  if (f.searchQuery) params.search = f.searchQuery
  return params
}

function buildEventFilters(f: ReturnType<typeof useFilterStore.getState>) {
  const params: Record<string, string | number> = {}
  if (f.countries.length) params.country = f.countries.join(',')
  if (f.dateRange.from) params.from_date = f.dateRange.from
  if (f.dateRange.to) params.to_date = f.dateRange.to
  if (f.searchQuery) params.search = f.searchQuery
  return params
}

function App() {
  const { checkHealth, fetchBases, fetchEvents, fetchStats, fetchCountries, mode } =
    useDataStore()
  const [initializing, setInitializing] = useState(true)
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedBase = useGlobeStore((s) => s.selectedBase)
  const selectedEvent = useGlobeStore((s) => s.selectedEvent)
  const sidebarTab = useGlobeStore((s) => s.sidebarTab)

  // Init: health check → fetch data
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await checkHealth()
      if (cancelled) return
      await Promise.all([fetchBases(), fetchEvents(), fetchStats(), fetchCountries()])
      if (!cancelled) setInitializing(false)
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to filter changes with 300ms debounce → re-fetch when online
  const refetchWithFilters = useCallback(() => {
    const currentMode = useDataStore.getState().mode
    if (currentMode !== 'online') return
    const f = useFilterStore.getState()
    fetchBases(buildBaseFilters(f))
    fetchEvents(buildEventFilters(f))
  }, [fetchBases, fetchEvents])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsub = useFilterStore.subscribe(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(refetchWithFilters, 300)
    })
    return () => {
      unsub()
      if (timer) clearTimeout(timer)
    }
  }, [refetchWithFilters])

  // Auto-refresh events + stats every 5 minutes when online
  useEffect(() => {
    if (mode === 'online') {
      refreshRef.current = setInterval(() => {
        fetchEvents(buildEventFilters(useFilterStore.getState()))
        fetchStats()
      }, 5 * 60_000)
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
    }
  }, [mode, fetchEvents, fetchStats])

  const sidebarContent = () => {
    if (sidebarTab === 'base' && selectedBase) {
      return <BaseDetail base={selectedBase} />
    }
    if (sidebarTab === 'event' && selectedEvent) {
      return <EventDetail event={selectedEvent} />
    }
    if (sidebarTab === 'country') {
      const code = selectedBase?.countryCode ?? selectedEvent?.countryCode
      if (code) return <CountryProfile countryCode={code} />
    }
    return (
      <div className="space-y-3">
        <EventTimeline />
        <EventFeed />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-navy-900 overflow-hidden">
      <Header searchBar={<SearchBar />} />
      <NewsTicker />
      <StatsBar />
      <div className="flex-1 relative overflow-hidden">
        <ErrorBoundary>
          <GlobeView />
        </ErrorBoundary>
        {initializing && <GlobeLoader />}
        <OSINTFeedPanel />
        <FilterPanel />
        <ErrorBoundary>
          <Sidebar>{sidebarContent()}</Sidebar>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App
