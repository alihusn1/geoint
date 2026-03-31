import api from './api'

export interface ReportParams {
  from_datetime: string
  to_datetime: string
  sections: string[]
}

export interface ReportHighlight {
  title: string
  severity: string
  source: string
  summary: string
  pakistan_relevance: string
}

export interface ReportData {
  generated_at: string
  from_datetime: string
  to_datetime: string
  event_count: number
  executive_summary: string | null
  highlights: ReportHighlight[] | null
  analysis: string | null
  recommendations: string | null
  sources_breakdown: Record<string, number>
}

export async function generateReport(params: ReportParams): Promise<ReportData> {
  const res: any = await api.post('/reports/generate', params, { timeout: 180_000 })
  return res
}
