"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { getBranchSocketUrl, reconnectDelayMs } from "@/lib/api/ws"

export interface KitchenOrderItem {
  name: string
  qty: number
}

export interface KitchenOrder {
  id: string
  tableNumber: number
  items: KitchenOrderItem[]
  status: string
  note?: string
  createdAt: Date
}

export function useKitchenOrders(branchId: string, initialOrders: KitchenOrder[] = []) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [connected, setConnected] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(() => new Set())

  const ordersRef = useRef<KitchenOrder[]>(initialOrders)
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(false)
  const genRef = useRef(0)
  const attemptsRef = useRef(0)

  // ─── fetch active orders on mount ───────────────────────────────────────────
  // Guards against the race where the WS connects after an order was already
  // broadcast. HTTP fetch fills the gap; WS keeps state fresh from that point.
  useEffect(() => {
    if (!branchId) return

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/orders/recent?branch_id=${branchId}`,
      { headers: { Authorization: `Bearer ${token ?? ""}` } },
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<
          Array<{
            id: string
            table_number: number
            status: string
            created_at: string
            note?: string
            items: Array<{ name: string; quantity: number; price: number }>
          }>
        >
      })
      .then((data) => {
        const mapped: KitchenOrder[] = data
          .filter((o) => !["served", "paid", "closed"].includes(o.status))
          .map((o) => ({
            id: o.id,
            tableNumber: o.table_number,
            status: o.status,
            items: o.items.map((i) => ({ name: i.name, qty: i.quantity })),
            // Without this, a guest's note showed on the live ticket but vanished on refresh.
            note: o.note ?? "",
            createdAt: new Date(o.created_at),
          }))
        setOrders(mapped)
      })
      .catch((err) => {
        // Non-fatal — the WS will keep state fresh going forward.
        console.warn("⚠️ Failed to fetch initial orders:", err)
      })
  }, [branchId])

  // ─── teardown helper ────────────────────────────────────────────────────────
  const teardown = useCallback(() => {
    genRef.current++
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (wsRef.current) {
      // Null out handlers BEFORE closing so onclose doesn't schedule a
      // reconnect after the component has unmounted.
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

  // ─── connect ────────────────────────────────────────────────────────────────
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

        if (msg.type === "new_order") {

          const order: KitchenOrder = {
            id: msg.order_id as string,
            tableNumber: msg.table_number as number,
            items: (msg.items as { name: string; quantity: number }[]).map(
              (i) => ({ name: i.name, qty: i.quantity }),
            ),
            status: "pending",
            note: (msg.note as string) ?? "",
            createdAt: new Date(),
          }

          // Deduplicate — the HTTP fetch may have already loaded this order
          // if the WS reconnected after a brief drop.
          setOrders((prev) => {
            if (prev.some((o) => o.id === order.id)) return prev
            return [order, ...prev]
          })

          setNewOrderIds((prev) => new Set([...prev, order.id]))

          setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev)
              next.delete(order.id)
              return next
            })
          }, 5000)
        }

        if (msg.type === "order_updated") {

          setOrders((prev) =>
            prev
              .map((o) =>
                o.id === (msg.order_id as string)
                  ? { ...o, status: msg.status as string }
                  : o,
              )
              .filter((o) => o.status !== "served"),
          )
        }
      } catch (err) {
        console.error("❌ Failed to parse WS message", err)
      }
    }

    ws.onerror = (e) => {
      console.error("❌ WebSocket error", e)
    }

    ws.onclose = (event) => {

      if (!isMounted.current) return

      setConnected(false)
      wsRef.current = null

      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, reconnectDelayMs(attemptsRef.current++))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  // ─── lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      teardown()
    }
  }, [connect, teardown])

  // ─── advance order ──────────────────────────────────────────────────────────
  const advanceOrder = useCallback(
    async (orderId: string, currentStatus: string) => {
      const nextStatus: Record<string, string> = {
        pending: "accepted",
        accepted: "preparing",
        preparing: "ready",
        ready: "served",
      }
      const next = nextStatus[currentStatus]
      if (!next) return

      // Keep the order so a failed request can put it back. When the next status is
      // "served" the optimistic update removes the ticket from the board, and the old
      // revert only mapped over what was left, so a failed "served" made the order
      // vanish from the kitchen even though the server never recorded it.
      const snapshot = ordersRef.current.find((o) => o.id === orderId)

      // Optimistic update
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: next } : o))
          .filter((o) => o.status !== "served"),
      )

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/kitchen/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token ?? ""}`,
            },
            body: JSON.stringify({ order_id: orderId, status: next }),
          },
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch {
        // Revert optimistic update on failure
        setOrders((prev) => {
          if (prev.some((o) => o.id === orderId)) {
            return prev.map((o) => (o.id === orderId ? { ...o, status: currentStatus } : o))
          }
          return snapshot ? [{ ...snapshot, status: currentStatus }, ...prev] : prev
        })
      }
    },
    [],
  )

  return { orders, connected, newOrderIds, advanceOrder }
}