"use client"
import { useEffect, useRef, useCallback, useState } from "react"
import { getBranchSocketUrl, reconnectDelayMs } from "@/lib/api/ws"

/**
 * Connects to the branch-scoped WebSocket and forwards every parsed message to
 * onMessage. Despite the /ws/kitchen path, the same socket carries all of a branch's
 * live events (orders, payments), not just kitchen ones.
 *
 * Each connection attempt first exchanges the user's access token for a short-lived,
 * single-use ticket (see lib/api/ws.ts); the server only issues one if the user's
 * role and tenant are allowed to see that branch. Reconnects automatically on drop,
 * with backoff, fetching a fresh ticket every time.
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
  const genRef = useRef(0)
  const attemptsRef = useRef(0)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const teardown = useCallback(() => {
    genRef.current++
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

  const connect = useCallback(async () => {
    if (!branchId) return

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    // Each attempt gets a generation number. teardown() and newer attempts bump it,
    // so a slow ticket request can never open a socket for a stale branch or after
    // unmount (also covers React Strict Mode's double effect).
    const gen = ++genRef.current

    let wsUrl: string
    try {
      wsUrl = await getBranchSocketUrl(branchId)
    } catch {
      // Not signed in, forbidden for this branch, or the server is unreachable.
      if (gen === genRef.current && isMounted.current) {
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect()
        }, reconnectDelayMs(attemptsRef.current++))
      }
      return
    }

    if (gen !== genRef.current || !isMounted.current) return

    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, reconnectDelayMs(attemptsRef.current++))
      return
    }

    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setConnected(true)
      attemptsRef.current = 0
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
      }, reconnectDelayMs(attemptsRef.current++))
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