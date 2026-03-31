import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['three', 'react-globe.gl'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Return a clean 502 instead of flooding the terminal with ECONNREFUSED
            if (!res.headersSent && 'writeHead' in res) {
              (res as import('http').ServerResponse).writeHead(502, { 'Content-Type': 'application/json' })
              ;(res as import('http').ServerResponse).end(JSON.stringify({ error: 'Backend unavailable' }))
            }
          })
        },
      },
      '/tiles': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            // Tile cache server unavailable — let frontend fall back to direct CDN
            if (!res.headersSent && 'writeHead' in res) {
              (res as import('http').ServerResponse).writeHead(502, { 'Content-Type': 'application/json' })
              ;(res as import('http').ServerResponse).end(JSON.stringify({ error: 'Tile cache unavailable' }))
            }
          })
        },
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
