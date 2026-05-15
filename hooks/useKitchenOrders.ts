"use client"
import { useState, useEffect, useRef, useCallback } from "react"

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

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(false)

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
            items: Array<{ name: string; quantity: number; price: number }>
          }>
        >
      })
      .then((data) => {
        const mapped: KitchenOrder[] = data
          .filter((o) => o.status !== "served" && o.status !== "paid")
          .map((o) => ({
            id: o.id,
            tableNumber: o.table_number,
            status: o.status,
            items: o.items.map((i) => ({ name: i.name, qty: i.quantity })),
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
  const connect = useCallback(() => {
    console.log("🔌 connect() called", { branchId, isMounted: isMounted.current })

    if (!branchId) return

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const base =
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/kitchen"
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
      console.log("✅ Kitchen WebSocket connected", {
        branchId,
        url: wsUrl,
        readyState: ws.readyState,
      })

      if (!isMounted.current) return

      setConnected(true)

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    ws.onmessage = (event) => {
      console.log("📩 RAW WS MESSAGE:", event.data)

      if (!isMounted.current) return

      try {
        const msg = JSON.parse(event.data as string)

        console.log("📦 Parsed WS Message:", msg)

        if (msg.type === "new_order") {
          console.log("🆕 New kitchen order received")

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
          console.log("🔄 Order status updated")

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
      console.log("🔌 WebSocket closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      })

      if (!isMounted.current) return

      setConnected(false)
      wsRef.current = null

      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, 3000)
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
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: currentStatus } : o,
          ),
        )
      }
    },
    [],
  )

  return { orders, connected, newOrderIds, advanceOrder }
}