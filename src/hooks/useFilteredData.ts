import { useMemo } from 'react'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import type { MilitaryBase, OSINTEvent } from '@/types'

export function useFilteredData() {
  const bases = useDataStore((s) => s.bases)
  const events = useDataStore((s) => s.events)
  const mode = useDataStore((s) => s.mode)
  const {
    countries,
    baseTypes,
    branches,
    status,
    dateRange,
    searchQuery,
  } = useFilterStore()

  const filteredBases = useMemo(() => {
    // When online, data arrives pre-filtered from API
    if (mode === 'online') return bases

    // Offline: client-side filtering on mock data
    let result: MilitaryBase[] = bases

    if (countries.length > 0) {
      result = result.filter((b) => countries.includes(b.countryCode))
    }
    if (baseTypes.length > 0) {
      result = result.filter((b) => baseTypes.includes(b.type))
    }
    if (branches.length > 0) {
      result = result.filter((b) => branches.includes(b.branch))
    }
    if (status.length > 0) {
      result = result.filter((b) => status.includes(b.status))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.country.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q),
      )
    }

    return result
  }, [bases, mode, countries, baseTypes, branches, status, searchQuery])

  const filteredEvents = useMemo(() => {
    // When online, data arrives pre-filtered from API
    if (mode === 'online') return events

    // Offline: client-side filtering
    let result: OSINTEvent[] = events

    if (countries.length > 0) {
      result = result.filter((e) => countries.includes(e.countryCode))
    }
    if (dateRange.from) {
      const from = new Date(dateRange.from).getTime()
      result = result.filter((e) => new Date(e.timestamp).getTime() >= from)
    }
    if (dateRange.to) {
      const to = new Date(dateRange.to).getTime() + 86_400_000 // end of day
      result = result.filter((e) => new Date(e.timestamp).getTime() <= to)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.country.toLowerCase().includes(q),
      )
    }

    return result
  }, [events, mode, countries, dateRange, searchQuery])

  const uniqueCountries = useMemo(() => {
    const codes = new Set(bases.map((b) => b.countryCode))
    return codes.size
  }, [bases])

  return { filteredBases, filteredEvents, uniqueCountries }
}
