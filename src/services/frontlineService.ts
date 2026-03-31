import api from './api'

export async function getFrontlineLatest(source = 'deepstatemap') {
  return api.get('/frontlines/latest', { params: { source }, timeout: 30_000 }) as any
}
