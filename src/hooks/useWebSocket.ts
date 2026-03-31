import { useEffect, useRef, useState, useCallback } from 'react'
import { useLiveStore } from '@/store/useLiveStore'
import type { LiveLayerName } from '@/types/live'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/live`
const MAX_BACKOFF = 30_000
const BASE_BACKOFF = 1_000
const MAX_RETRIES = 20

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(BASE_BACKOFF)
  const retryCountRef = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const enabledLayersRef = useRef<LiveLayerName[]>([])

  // Use ref for setLayerData to avoid reconnection loops
  const setLayerDataRef = useRef(useLiveStore.getState().setLayerData)

  const sendSubscription = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN && enabledLayersRef.current.length > 0) {
      ws.send(JSON.stringify({ subscribe: enabledLayersRef.current }))
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return

    let ws: WebSocket
    try {
      ws = new WebSocket(WS_URL)
    } catch {
      // WS construction can fail if URL is invalid
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnecting(false)
      backoffRef.current = BASE_BACKOFF
      retryCountRef.current = 0
      sendSubscription()
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as { layer: LiveLayerName; timestamp: string; data: unknown[] }
        if (msg.layer && Array.isArray(msg.data)) {
          setLayerDataRef.current(msg.layer, msg.data)
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      setConnected(false)
      retryCountRef.current += 1
      if (retryCountRef.current > MAX_RETRIES) {
        console.warn(`[WebSocket] Stopped reconnecting after ${MAX_RETRIES} attempts`)
        setReconnecting(false)
        return
      }
      setReconnecting(true)
      const delay = Math.min(backoffRef.current, MAX_BACKOFF)
      backoffRef.current = delay * 2
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [sendSubscription])

  // Connect on mount
  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on intentional close
        wsRef.current.close()
      }
    }
  }, [connect])

  // Re-send subscriptions when enabled layers change
  const updateSubscriptions = useCallback((layers: LiveLayerName[]) => {
    enabledLayersRef.current = layers
    sendSubscription()
  }, [sendSubscription])

  // Manual retry — resets counter and reconnects
  const retry = useCallback(() => {
    retryCountRef.current = 0
    backoffRef.current = BASE_BACKOFF
    connect()
  }, [connect])

  return { connected, reconnecting, updateSubscriptions, retry }
}
