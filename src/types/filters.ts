import type { BaseType, Branch, OperationalStatus } from './base'

export interface FilterState {
  countries: string[]
  baseTypes: BaseType[]
  branches: Branch[]
  status: OperationalStatus[]
  dateRange: {
    from: string | null
    to: string | null
  }
  searchQuery: string
}
