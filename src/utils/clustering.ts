export interface Clusterable {
  lat: number
  lng: number
}

export interface Cluster<T extends Clusterable> {
  lat: number
  lng: number
  items: T[]
}

/**
 * Grid-based spatial clustering. O(n) time.
 * Groups nearby points into grid cells of `cellSizeDeg` degrees.
 */
export function clusterPoints<T extends Clusterable>(
  points: T[],
  cellSizeDeg: number,
): Cluster<T>[] {
  if (points.length === 0) return []

  // No clustering — return every point as its own cluster
  if (cellSizeDeg <= 0) {
    return points
      .filter((p) => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
      .map((p) => ({ lat: p.lat, lng: p.lng, items: [p] }))
  }

  const grid = new Map<string, { sLat: number; sLng: number; items: T[] }>()

  for (const p of points) {
    if (p.lat == null || p.lng == null || isNaN(p.lat) || isNaN(p.lng)) continue
    const key = `${Math.floor(p.lng / cellSizeDeg)}:${Math.floor(p.lat / cellSizeDeg)}`
    let cell = grid.get(key)
    if (!cell) {
      cell = { sLat: 0, sLng: 0, items: [] }
      grid.set(key, cell)
    }
    cell.items.push(p)
    cell.sLat += p.lat
    cell.sLng += p.lng
  }

  const result: Cluster<T>[] = []
  for (const cell of grid.values()) {
    const n = cell.items.length
    result.push({
      lat: cell.sLat / n,
      lng: cell.sLng / n,
      items: cell.items,
    })
  }
  return result
}

/** Altitude below which clustering is disabled — all items show individually. */
export const UNCLUSTER_ALTITUDE = 0.15

/**
 * Compute cluster grid cell size from zoom altitude.
 * ~100 km base radius, grows when zoomed out.
 * Returns 0 below UNCLUSTER_ALTITUDE (no clustering).
 */
export function getClusterCellSize(altitude: number): number {
  if (altitude <= UNCLUSTER_ALTITUDE) return 0
  // ~200 km radius — larger cells = fewer clusters, cleaner map
  return 5.0 * altitude
}

/** Viewport filter — keep only points within `radius` degrees of center. */
export function filterViewport<T extends Clusterable>(
  points: T[],
  centerLat: number,
  centerLng: number,
  radiusDeg: number,
): T[] {
  const r2 = radiusDeg * radiusDeg
  return points.filter((p) => {
    const dLat = p.lat - centerLat
    let dLng = p.lng - centerLng
    if (dLng > 180) dLng -= 360
    if (dLng < -180) dLng += 360
    return dLat * dLat + dLng * dLng < r2
  })
}
