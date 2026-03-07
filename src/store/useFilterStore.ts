import { create } from 'zustand'
import type { BaseType, Branch, OperationalStatus } from '@/types'

interface FilterState {
  countries: string[]
  baseTypes: BaseType[]
  branches: Branch[]
  status: OperationalStatus[]
  dateRange: { from: string | null; to: string | null }
  searchQuery: string

  setCountries: (countries: string[]) => void
  toggleCountry: (country: string) => void
  setBaseTypes: (types: BaseType[]) => void
  toggleBaseType: (type: BaseType) => void
  setBranches: (branches: Branch[]) => void
  toggleBranch: (branch: Branch) => void
  setStatus: (status: OperationalStatus[]) => void
  toggleStatus: (status: OperationalStatus) => void
  setDateRange: (range: { from: string | null; to: string | null }) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

const initialState = {
  countries: [] as string[],
  baseTypes: [] as BaseType[],
  branches: [] as Branch[],
  status: [] as OperationalStatus[],
  dateRange: { from: null as string | null, to: null as string | null },
  searchQuery: '',
}

export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,

  setCountries: (countries) => set({ countries }),
  toggleCountry: (country) =>
    set((s) => ({
      countries: s.countries.includes(country)
        ? s.countries.filter((c) => c !== country)
        : [...s.countries, country],
    })),

  setBaseTypes: (baseTypes) => set({ baseTypes }),
  toggleBaseType: (type) =>
    set((s) => ({
      baseTypes: s.baseTypes.includes(type)
        ? s.baseTypes.filter((t) => t !== type)
        : [...s.baseTypes, type],
    })),

  setBranches: (branches) => set({ branches }),
  toggleBranch: (branch) =>
    set((s) => ({
      branches: s.branches.includes(branch)
        ? s.branches.filter((b) => b !== branch)
        : [...s.branches, branch],
    })),

  setStatus: (status) => set({ status }),
  toggleStatus: (status) =>
    set((s) => ({
      status: s.status.includes(status)
        ? s.status.filter((st) => st !== status)
        : [...s.status, status],
    })),

  setDateRange: (dateRange) => set({ dateRange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () => set(initialState),
}))

export function selectActiveFilterCount(state: FilterState): number {
  let count = 0
  if (state.countries.length > 0) count++
  if (state.baseTypes.length > 0) count++
  if (state.branches.length > 0) count++
  if (state.status.length > 0) count++
  if (state.dateRange.from || state.dateRange.to) count++
  if (state.searchQuery) count++
  return count
}
