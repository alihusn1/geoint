import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Return response.data directly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ?? error.message ?? 'Unknown error'
    const status = error.response?.status ?? 0
    console.error(`[API] ${status} — ${message}`)
    return Promise.reject({ message, status })
  },
)

export default api
