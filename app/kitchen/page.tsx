"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChefHat, Clock, ArrowLeft, Bell, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useKitchenOrders, KitchenOrder } from "@/hooks/useKitchenOrders"

const statusColumns = [
  { key: "pending", label: "New Order", color: "bg-orange-500", textColor: "text-orange-500", border: "border-orange-200", bg: "bg-orange-50", icon: "🔔" },
  { key: "accepted", label: "Accepted", color: "bg-blue-500", textColor: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50", icon: "✅" },
  { key: "preparing", label: "Preparing", color: "bg-yellow-500", textColor: "text-yellow-600", border: "border-yellow-200", bg: "bg-yellow-50", icon: "🔥" },
  { key: "ready", label: "Ready", color: "bg-emerald-500", textColor: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50", icon: "✓" },
]

const actionLabel: Record<string, string> = {
  pending: "Accept",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Served",
}

function useElapsed(date: Date) {
  const [elapsed, setElapsed] = useState("")
  useEffect(() => {
    const update = () => {
      const mins = Math.floor((Date.now() - date.getTime()) / 60000)
      setElapsed(mins < 1 ? "just now" : `${mins}m ago`)
    }
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [date])
  return elapsed
}

function OrderCard({
  order,
  isNew,
  onAdvance,
}: {
  order: KitchenOrder
  isNew: boolean
  onAdvance: (id: string, status: string) => void
}) {
  const elapsed = useElapsed(order.createdAt)
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const check = () => {
      const mins = Math.floor((Date.now() - order.createdAt.getTime()) / 60000)
      setIsUrgent(mins >= 15 && order.status === "pending")
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [order.createdAt, order.status])

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm p-4 space-y-3 transition-all duration-300",
      isNew && "ring-2 ring-orange-400 ring-offset-1 animate-pulse",
      isUrgent ? "border-red-300 ring-1 ring-red-200" : "border-zinc-200",
      "hover:shadow-md"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center shrink-0">
            {order.tableNumber}
          </div>
          <div>
            <p className="font-semibold text-zinc-900 text-sm">Table {order.tableNumber}</p>
            <p className="text-xs text-zinc-400">{order.items.length} items</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          isUrgent ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"
        )}>
          <Clock className="w-3 h-3" />
          {elapsed}
        </div>
      </div>

      <div className="space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-600 text-xs font-bold flex items-center justify-center shrink-0">
              {item.qty}
            </span>
            <span className="text-sm text-zinc-700">{item.name}</span>
          </div>
        ))}
      </div>

      {order.note && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-sm">📝</span>
          <p className="text-xs text-amber-800">{order.note}</p>
        </div>
      )}

      {order.status !== "served" && (
        <button
          onClick={() => onAdvance(order.id, order.status)}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
            order.status === "pending"
              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
              : order.status === "accepted"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200"
              : order.status === "preparing"
              ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm shadow-yellow-200"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200"
          )}
        >
          {actionLabel[order.status]}
        </button>
      )}
    </div>
  )
}

export default function KitchenPage() {
  const { orders, connected, newOrderIds, advanceOrder } = useKitchenOrders()
  const newOrderCount = orders.filter((o) => o.status === "pending").length

  const [timeStr, setTimeStr] = useState("")
  useEffect(() => {
    const update = () =>
      setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-500" />
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-zinc-900">Kitchen Display</span>
          </div>
          {/* WebSocket connection indicator */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
            connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          )}>
            {connected
              ? <Wifi className="w-3 h-3" />
              : <WifiOff className="w-3 h-3" />
            }
            {connected ? "Live" : "Reconnecting..."}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {newOrderCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
              <Bell className="w-3 h-3" />
              {newOrderCount} new {newOrderCount === 1 ? "order" : "orders"}
            </div>
          )}
          {timeStr && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {timeStr}
            </div>
          )}
        </div>
      </header>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <ChefHat className="w-7 h-7 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No active orders</p>
            <p className="text-xs text-zinc-400">
              {connected ? "Waiting for new orders..." : "Connecting to kitchen..."}
            </p>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          if (colOrders.length === 0 && orders.length > 0) {
            return (
              <div key={col.key} className="space-y-3">
                <div className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-xl border",
                  col.bg, col.border
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{col.icon}</span>
                    <span className={cn("text-sm font-semibold", col.textColor)}>{col.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white",
                    col.color
                  )}>0</span>
                </div>
                <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-6 text-center">
                  <p className="text-xs text-zinc-300 font-medium">No orders</p>
                </div>
              </div>
            )
          }
          return (
            <div key={col.key} className="space-y-3">
              <div className={cn(
                "flex items-center justify-between px-4 py-2.5 rounded-xl border",
                col.bg, col.border
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <span className={cn("text-sm font-semibold", col.textColor)}>{col.label}</span>
                </div>
                <span className={cn(
                  "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white",
                  col.color
                )}>
                  {colOrders.length}
                </span>
              </div>
              {colOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isNew={newOrderIds.has(order.id)}
                  onAdvance={advanceOrder}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}