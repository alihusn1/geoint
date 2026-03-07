import api from './api'

// GET /stats — returns StatsResponse
export async function getStats() {
  const res: any = await api.get('/stats')
  return res
}

// GET /search?q=...&limit=...
export async function search(q: string, limit = 10) {
  const res: any = await api.get('/search', { params: { q, limit } })
  return res
}

// GET /health
export async function getHealth() {
  const res: any = await api.get('/health')
  return res
}
