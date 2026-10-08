"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChefHat, ArrowLeft, Wifi, WifiOff, AlertTriangle, MessageSquareWarning } from "lucide-react"
import Link from "next/link"
import { useKitchenOrders, KitchenOrder } from "@/hooks/useKitchenOrders"
import { useBranch } from "@/hooks/useBranch"
import { Logo } from "@/components/brand/logo"

// Built to be read from a metre or two away on a mounted tablet: large type, loud notes,
// big tap targets. Status colours stay semantic (amber / sky / brand / green).
const statusColumns: {
  key: string
  label: string
  accent: string
  strip: string
  badge: string
  action: string
}[] = [
  { key: "pending",   label: "Incoming",    accent: "text-amber-800",   strip: "bg-amber-400",   badge: "bg-amber-400 text-charcoal",   action: "Accept" },
  { key: "accepted",  label: "Accepted",    accent: "text-sky-800",     strip: "bg-sky-400",     badge: "bg-sky-500 text-white",        action: "Start prep" },
  { key: "preparing", label: "On the pass", accent: "text-brand-ink",   strip: "bg-brand-light", badge: "bg-brand-light text-charcoal", action: "Mark ready" },
  { key: "ready",     label: "Ready",       accent: "text-emerald-800", strip: "bg-emerald-500", badge: "bg-emerald-600 text-white",    action: "Served" },
]

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
    <article
      aria-label={`Table ${order.tableNumber}, ${col?.label ?? order.status}`}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white transition-shadow",
        isNew ? "border-brand shadow-lg shadow-brand/20 ring-2 ring-brand/30" : "border-cream-border",
        isUrgent && "border-red-400 ring-2 ring-red-200"
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1.5", col?.strip ?? "bg-charcoal/20")} aria-hidden />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 py-3 pr-4 pl-5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/45">Table</span>
          <span className="font-mono text-3xl font-black leading-none tabular-nums text-charcoal">
            {String(order.tableNumber).padStart(2, "0")}
          </span>
          {isNew && (
            <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isUrgent && <AlertTriangle className="size-4 text-red-600" aria-label="Waiting too long" />}
          <span className={cn("font-mono text-base font-bold tabular-nums", isUrgent ? "text-red-600" : "text-charcoal/50")}>
            {mins < 1 ? "now" : `${mins}m`}
          </span>
        </div>
      </div>

      <div className="mr-4 ml-5 border-t border-dashed border-cream-border" />

      {/* Items */}
      <ul className="space-y-2 py-3 pr-4 pl-5">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-baseline gap-3">
            <span className="w-8 shrink-0 font-mono text-lg font-bold tabular-nums text-charcoal">{item.qty}×</span>
            <span className="text-lg font-medium leading-snug text-charcoal">{item.name}</span>
          </li>
        ))}
      </ul>

      {/* Guest note: loud on purpose. This is where allergies and "no onions" land. */}
      {order.note && (
        <div
          role="note"
          className="mr-4 mb-3 ml-5 rounded-lg border-2 border-amber-500 bg-amber-50 px-3 py-2.5"
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
            <MessageSquareWarning className="size-4" aria-hidden />
            Guest note
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-charcoal">{order.note}</p>
        </div>
      )}

      {/* Action */}
      {order.status !== "served" && col && (
        <button
          onClick={() => onAdvance(order.id, order.status)}
          className={cn(
            "h-12 w-full border-t border-cream-border pl-5 text-left text-sm font-bold uppercase tracking-wider transition-colors",
            "hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
            col.accent
          )}
        >
          {col.action} →
        </button>
      )}
    </article>
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
    <div className="min-h-screen bg-cream" suppressHydrationWarning>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-cream-border bg-white px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="-ml-2 flex size-11 items-center justify-center rounded-lg text-charcoal/60 transition-colors hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Logo variant="mark" className="h-6" title="Mezzani" />
          <h1 className="text-base font-semibold tracking-tight text-charcoal">Kitchen</h1>

          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold",
              connected ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            )}
          >
            {connected ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
            {connected ? "Live" : "Offline"}
          </span>

          {pendingCount > 0 && (
            <span className="rounded-md bg-amber-400 px-2 py-1 font-mono text-xs font-bold text-charcoal" aria-live="polite">
              {pendingCount} incoming
            </span>
          )}
        </div>

        {timeStr && <span className="font-mono text-sm tabular-nums text-charcoal/50">{timeStr}</span>}
      </header>

      {/* A kitchen that silently stops receiving orders is the worst failure mode here. */}
      {!connected && (
        <div role="alert" className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">
          <WifiOff className="size-4" aria-hidden />
          Offline. New orders may not appear until the connection returns. Reconnecting…
        </div>
      )}

      {orders.length === 0 && (
        <div className="flex h-[calc(100vh-56px)] flex-col items-center justify-center">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-charcoal/5">
              <ChefHat className="size-7 text-charcoal/30" aria-hidden />
            </div>
            <p className="text-base font-medium text-charcoal/60">No active orders</p>
            <p className="text-sm text-charcoal/40">{connected ? "Waiting for orders…" : "Reconnecting…"}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          return (
            <section key={col.key} aria-label={col.label}>
              <div className="mb-3 flex items-center justify-between px-0.5">
                <h2 className={cn("text-sm font-bold uppercase tracking-widest", col.accent)}>{col.label}</h2>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums",
                    colOrders.length > 0 ? col.badge : "bg-charcoal/8 text-charcoal/40"
                  )}
                >
                  {colOrders.length}
                </span>
              </div>

              {colOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-cream-border py-6 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-charcoal/30">clear</p>
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
            </section>
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
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-mono text-xs uppercase tracking-widest text-charcoal/40">Connecting…</p>
      </div>
    )
  }

  return <KitchenDisplay branchId={branchId} />
}
