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

export function useKitchenOrders(initialOrders: KitchenOrder[] = []) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [connected, setConnected] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(() => new Set())
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // useRef for connect so it never causes stale closure issues
  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/kitchen"

    try {
      // Clean up existing connection first
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current)
          reconnectTimer.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string)

          if (msg.type === "new_order") {
            const order: KitchenOrder = {
              id: msg.order_id as string,
              tableNumber: msg.table_number as number,
              items: (
                msg.items as { name: string; quantity: number }[]
              ).map((i) => ({
                name: i.name,
                qty: i.quantity,
              })),
              status: "pending",
              note: (msg.note as string) ?? "",
              createdAt: new Date(),
            }

            setOrders((prev) => [order, ...prev])
            setNewOrderIds((prev) => new Set([...prev, order.id]))

            // Clear highlight after 5 seconds
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
                    : o
                )
                .filter((o) => o.status !== "served")
            )
          }
        } catch {
          // malformed message — ignore
        }
      }

      ws.onclose = () => {
        setConnected(false)
        // Reconnect after 3 seconds using ref to avoid stale closure
        reconnectTimer.current = setTimeout(() => {
          connectRef.current()
        }, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(() => {
        connectRef.current()
      }, 3000)
    }
  }, [])

  // Keep connectRef in sync with latest connect
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

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
          .filter((o) => o.status !== "served")
      )

      // Call API
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/kitchen/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token ?? ""}`,
            },
            body: JSON.stringify({ order_id: orderId, status: next }),
          }
        )
      } catch {
        // Revert optimistic update on failure
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: currentStatus } : o
          )
        )
      }
    },
    []
  )

  return { orders, connected, newOrderIds, advanceOrder }
}