"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChefHat, Clock, ArrowLeft, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useKitchenOrders, KitchenOrder } from "@/hooks/useKitchenOrders"
import { useBranch } from "@/hooks/useBranch"

const statusColumns: {
  key: string
  label: string
  accent: string
  strip: string
  badgeBg: string
  badgeText: string
  actionText: string
  actionHover: string
}[] = [
  {
    key: "pending",
    label: "Incoming",
    accent: "text-amber-600",
    strip: "bg-amber-400",
    badgeBg: "bg-amber-400",
    badgeText: "text-amber-900",
    actionText: "text-amber-700",
    actionHover: "hover:bg-amber-50",
  },
  {
    key: "accepted",
    label: "Accepted",
    accent: "text-sky-600",
    strip: "bg-sky-400",
    badgeBg: "bg-sky-500",
    badgeText: "text-white",
    actionText: "text-sky-700",
    actionHover: "hover:bg-sky-50",
  },
  {
    key: "preparing",
    label: "On the Pass",
    accent: "text-orange-600",
    strip: "bg-orange-400",
    badgeBg: "bg-orange-400",
    badgeText: "text-orange-900",
    actionText: "text-orange-700",
    actionHover: "hover:bg-orange-50",
  },
  {
    key: "ready",
    label: "Ready",
    accent: "text-emerald-600",
    strip: "bg-emerald-400",
    badgeBg: "bg-emerald-500",
    badgeText: "text-white",
    actionText: "text-emerald-700",
    actionHover: "hover:bg-emerald-50",
  },
]

const actionLabel: Record<string, string> = {
  pending: "Accept",
  accepted: "Start Prep",
  preparing: "Mark Ready",
  ready: "Served",
}

function useElapsed(date: Date) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const update = () => setMins(Math.floor((Date.now() - date.getTime()) / 60000))
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [date])
  return mins
}

function TicketCard({
  order,
  isNew,
  onAdvance,
}: {
  order: KitchenOrder
  isNew: boolean
  onAdvance: (id: string, status: string) => void
}) {
  const mins = useElapsed(order.createdAt)
  const isUrgent = mins >= 15 && order.status === "pending"
  const col = statusColumns.find((c) => c.key === order.status)

  return (
    <div
      className={cn(
        "relative bg-white border rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-md",
        isNew ? "border-amber-300 shadow-amber-100 shadow-md" : "border-zinc-200",
        isUrgent && "border-red-300"
      )}
    >
      {/* Left status strip */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", col?.strip ?? "bg-zinc-200")} />

      {/* Header */}
      <div className="pl-4 pr-3 pt-3 pb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400 leading-none">
            TBL
          </span>
          <span className="font-mono text-2xl font-black text-zinc-900 leading-none tabular-nums">
            {String(order.tableNumber).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          <span
            className={cn(
              "font-mono text-xs tabular-nums font-semibold",
              isUrgent ? "text-red-500" : "text-zinc-400"
            )}
          >
            {mins < 1 ? "now" : `${mins}m`}
          </span>
        </div>
      </div>

      {/* Perforation line */}
      <div className="ml-4 mr-3 border-t border-dashed border-zinc-200" />

      {/* Items */}
      <div className="pl-4 pr-3 py-2.5 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-zinc-900 tabular-nums w-5 shrink-0">
              {item.qty}×
            </span>
            <span className="text-sm text-zinc-700 leading-snug">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      {order.note && (
        <div className="ml-4 mr-3 mb-2.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-snug">
          {order.note}
        </div>
      )}

      {/* Action */}
      {order.status !== "served" && (
        <>
          <div className="ml-4 mr-3 border-t border-dashed border-zinc-200" />
          <button
            onClick={() => onAdvance(order.id, order.status)}
            className={cn(
              "w-full pl-4 pr-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-colors duration-150",
              col?.actionText,
              col?.actionHover
            )}
          >
            {actionLabel[order.status]} →
          </button>
        </>
      )}
    </div>
  )
}

function KitchenDisplay({ branchId }: { branchId: string }) {
  const { orders, connected, newOrderIds, advanceOrder } = useKitchenOrders(branchId)
  const pendingCount = orders.filter((o) => o.status === "pending").length

  const [timeStr, setTimeStr] = useState<string | null>(null)
  useEffect(() => {
    const update = () =>
      setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50" suppressHydrationWarning>
      {/* Header */}
      <header className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1.5 rounded hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </Link>

          <div className="flex items-center gap-2 border-r border-zinc-200 pr-3">
            <ChefHat className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-800 tracking-tight">Kitchen</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
              connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"
            )}
          >
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? "Live" : "Offline"}
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-400 text-amber-900 rounded text-xs font-bold font-mono">
              {pendingCount} incoming
            </div>
          )}
        </div>

        {timeStr && (
          <span className="font-mono text-xs text-zinc-400 tabular-nums">{timeStr}</span>
        )}
      </header>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-48px)]">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">No active orders</p>
            <p className="text-xs text-zinc-300">
              {connected ? "Waiting for orders…" : "Reconnecting…"}
            </p>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          return (
            <div key={col.key}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <span className={cn("text-xs font-bold uppercase tracking-widest", col.accent)}>
                  {col.label}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs font-bold tabular-nums w-5 h-5 rounded-full flex items-center justify-center",
                    colOrders.length > 0
                      ? cn(col.badgeBg, col.badgeText)
                      : "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {colOrders.length}
                </span>
              </div>

              {colOrders.length === 0 ? (
                <div className="border border-dashed border-zinc-200 rounded-lg py-6 text-center">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-300">
                    clear
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {colOrders.map((order) => (
                    <TicketCard
                      key={order.id}
                      order={order}
                      isNew={newOrderIds.has(order.id)}
                      onAdvance={advanceOrder}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function KitchenPage() {
  const { branchId } = useBranch()

  if (!branchId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          Connecting…
        </p>
      </div>
    )
  }

  return <KitchenDisplay branchId={branchId} />
}