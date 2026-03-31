import express from 'express'
import Redis from 'ioredis'

// ── Config ──
const PORT = Number(process.env.TILE_PORT ?? 3002)
const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
const TILE_TTL = Number(process.env.TILE_TTL ?? 86400 * 7) // 7 days default

// ── Upstream tile providers ──
const UPSTREAM: Record<string, (x: number, y: number, z: number) => string> = {
  dark: (x, y, z) => {
    const sub = 'abc'[Math.abs(x + y) % 3]
    return `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`
  },
  street: (x, y, z) =>
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  satellite: (x, y, z) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
}

// ── Redis ──
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
  lazyConnect: true,
})

let redisReady = false

redis.on('connect', () => {
  redisReady = true
  console.log('[TileCache] Redis connected')
})
redis.on('error', (err) => {
  if (redisReady) console.error('[TileCache] Redis error:', err.message)
  redisReady = false
})

redis.connect().catch(() => {
  console.warn('[TileCache] Redis unavailable — running in pass-through mode')
})

// ── App ──
const app = express()

// Health check
app.get('/tiles/health', (_req, res) => {
  res.json({ ok: true, redis: redisReady, upstreams: Object.keys(UPSTREAM) })
})

// Stats
app.get('/tiles/stats', async (_req, res) => {
  if (!redisReady) return res.json({ cached: 0, redis: false })
  try {
    // Count tile keys (sampled for speed)
    const count = await redis.dbsize()
    res.json({ cached: count, redis: true })
  } catch {
    res.json({ cached: 0, redis: false })
  }
})

// Tile endpoint: GET /tiles/:layer/:z/:x/:y
app.get('/tiles/:layer/:z/:x/:y', async (req, res) => {
  const { layer, z, x, y } = req.params
  const urlBuilder = UPSTREAM[layer]
  if (!urlBuilder) {
    return res.status(400).json({ error: `Unknown layer: ${layer}` })
  }

  const zn = parseInt(z), xn = parseInt(x), yn = parseInt(y)
  if (isNaN(zn) || isNaN(xn) || isNaN(yn)) {
    return res.status(400).json({ error: 'Invalid tile coordinates' })
  }

  const cacheKey = `tile:${layer}:${zn}:${xn}:${yn}`

  // 1. Try Redis cache
  if (redisReady) {
    try {
      const cached = await redis.getBuffer(cacheKey)
      if (cached) {
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'X-Tile-Cache': 'HIT',
        })
        return res.send(cached)
      }
    } catch {
      // Redis read failed — fall through to upstream
    }
  }

  // 2. Fetch from upstream
  const upstreamUrl = urlBuilder(xn, yn, zn)
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'GeoINT-TileCache/1.0',
        Accept: 'image/png,image/*,*/*',
      },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Upstream returned ${upstream.status}`,
      })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    const contentType = upstream.headers.get('content-type') ?? 'image/png'

    // 3. Store in Redis (non-blocking)
    if (redisReady) {
      redis.setex(cacheKey, TILE_TTL, buffer).catch(() => {})
    }

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'X-Tile-Cache': 'MISS',
    })
    return res.send(buffer)
  } catch (err: any) {
    console.error(`[TileCache] Upstream fetch failed: ${upstreamUrl}`, err.message)
    return res.status(502).json({ error: 'Upstream fetch failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[TileCache] Tile cache server running on http://localhost:${PORT}`)
  console.log(`[TileCache] Redis: ${REDIS_URL} | TTL: ${TILE_TTL}s`)
  console.log(`[TileCache] Layers: ${Object.keys(UPSTREAM).join(', ')}`)
})
