import { create } from 'zustand'
import type { MilitaryBase, OSINTEvent } from '@/types'
import { mapBases, mapEvents } from '@/services/mappers'
import * as baseService from '@/services/baseService'
import * as eventService from '@/services/eventService'
import * as statsService from '@/services/statsService'

type Mode = 'offline' | 'online'

export interface ApiStats {
  total_bases: number
  total_events: number
  total_countries: number
  bases_by_type: Record<string, number>
  bases_by_branch: Record<string, number>
  events_by_source: Record<string, number>
  events_by_severity: Record<string, number>
}

export interface CountryInfo {
  code: string | null
  name: string
  count: number
}

interface DataState {
  bases: MilitaryBase[]
  events: OSINTEvent[]
  loading: boolean
  mode: Mode
  lastUpdated: string | null
  error: string | null
  stats: ApiStats | null
  countriesList: CountryInfo[]

  checkHealth: () => Promise<void>
  fetchBases: (filters?: baseService.BaseFilterParams) => Promise<void>
  fetchEvents: (filters?: eventService.EventFilterParams) => Promise<void>
  fetchStats: () => Promise<void>
  fetchCountries: () => Promise<void>
}

export const useDataStore = create<DataState>()((set, get) => ({
  bases: [],
  events: [],
  loading: false,
  mode: 'offline',
  lastUpdated: null,
  error: null,
  stats: null,
  countriesList: [],

  checkHealth: async () => {
    try {
      await statsService.getHealth()
      set({ mode: 'online', error: null })
    } catch {
      set({ mode: 'offline', error: null })
    }
  },

  fetchBases: async (filters) => {
    set({ loading: true, error: null })
    try {
      if (get().mode !== 'online') throw new Error('offline')
      const res = await baseService.getBases({ limit: 5000, ...filters })
      const bases = mapBases(res.bases ?? res)
      set({
        bases,
        loading: false,
        lastUpdated: new Date().toISOString(),
      })
    } catch {
      set({
        loading: false,
        error: get().mode === 'offline' ? 'Backend unavailable' : 'Failed to fetch bases',
      })
    }
  },

  fetchEvents: async (filters) => {
    set({ loading: true, error: null })
    try {
      if (get().mode !== 'online') throw new Error('offline')
      const res = await eventService.getEvents({ limit: 500, ...filters })
      const events = mapEvents(res.events ?? res)
      set({
        events,
        loading: false,
        lastUpdated: new Date().toISOString(),
      })
    } catch {
      set({
        loading: false,
        error: get().mode === 'offline' ? 'Backend unavailable' : 'Failed to fetch events',
      })
    }
  },

  fetchStats: async () => {
    try {
      if (get().mode === 'online') {
        const res = await statsService.getStats()
        set({ stats: res })
      }
    } catch {
      // Stats not critical
    }
  },

  fetchCountries: async () => {
    try {
      if (get().mode === 'online') {
        const res = await baseService.getCountries()
        set({ countriesList: res })
      }
    } catch {
      // Not critical
    }
  },
}))
