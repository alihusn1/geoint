import api from './api'

export interface EventFilterParams {
  country?: string
  source?: string
  category?: string
  severity?: string
  from_date?: string
  to_date?: string
  search?: string
  limit?: number
  offset?: number
}

// GET /events — returns { total, events }
export async function getEvents(params?: EventFilterParams) {
  const res: any = await api.get('/events', { params })
  return res
}

// GET /events/timeline
export async function getTimeline(days = 30, groupBy: 'day' | 'hour' = 'day') {
  const res: any = await api.get('/events/timeline', {
    params: { days, group_by: groupBy },
  })
  return res
}

// GET /events/latest
export async function getLatest(limit = 20) {
  const res: any = await api.get('/events/latest', { params: { limit } })
  return res
}
