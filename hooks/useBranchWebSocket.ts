"use client"
import { useEffect, useRef, useCallback, useState } from "react"

/**
 * Connects to the branch-scoped WebSocket (same endpoint the kitchen
 * display uses — /ws/kitchen?branch_id=X carries all branch events, not
 * just kitchen ones, despite the path name) and forwards every parsed
 * message to onMessage. Reconnects automatically on drop.
 *
 * onMessage is stored in a ref so passing an inline arrow function from
 * the caller doesn't retrigger a reconnect on every render.
 */
export function useBranchWebSocket(
  branchId: string | null | undefined,
  onMessage: (msg: Record<string, unknown>) => void
) {
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const teardown = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onerror = null
      wsRef.current.onclose = null
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!branchId) return

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/kitchen"
    const wsUrl = `${base}?branch_id=${branchId}`

    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, 3000)
      return
    }

    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setConnected(true)
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    ws.onmessage = (event) => {
      if (!isMounted.current) return
      try {
        const msg = JSON.parse(event.data as string)
        onMessageRef.current(msg)
      } catch (err) {
        console.error("Failed to parse WS message", err)
      }
    }

    ws.onerror = () => {
      // onclose fires right after and handles reconnect scheduling
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      setConnected(false)
      wsRef.current = null
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      teardown()
    }
  }, [connect, teardown])

  return { connected }
}