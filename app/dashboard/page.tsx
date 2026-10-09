"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Topbar } from "@/components/layout/topbar"
import { cn } from "@/lib/utils"
import { ArrowUpRight, RefreshCw, QrCode, ChefHat } from "lucide-react"
import { analyticsAPI } from "@/lib/api/analytics"
import { ordersAPI } from "@/lib/api/orders"
import { tablesAPI } from "@/lib/api/tables"
import { orderStatus } from "@/lib/order-status"
import { useBranch } from "@/hooks/useBranch"
import { formatDistanceToNow } from "date-fns"
import { BranchRequired } from "@/components/ui/branch-required"

const card = "rounded-2xl border border-cream-border bg-white"

function StatSkeleton() {
  return (
    <div className={cn(card, "p-5")} aria-hidden>
      <div className="h-3 w-24 animate-pulse rounded bg-charcoal/10" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-charcoal/10" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-charcoal/5" />
    </div>
  )
}

export default function DashboardPage() {
  const { branchId } = useBranch()
  const [analytics, setAnalytics] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [ordersToday, setOrdersToday] = useState(0)
  const [activeTables, setActiveTables] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    if (!branchId) return
    setRefreshing(true)
    try {
      const [analyticsData, ordersData, tablesData] = await Promise.allSettled([
        analyticsAPI.dashboard(branchId),
        ordersAPI.getRecent(branchId),
        tablesAPI.getWithSessions(branchId),
      ])

      if (analyticsData.status === "fulfilled") setAnalytics(analyticsData.value)
      if (ordersData.status === "fulfilled") {
        const all: any[] = ordersData.value
        // Count from the full list. This used to count the 5-row preview, so the
        // "Today's Orders" card could never show more than 5.
        const today = new Date().toDateString()
        setOrdersToday(all.filter((o) => new Date(o.created_at).toDateString() === today).length)
        setRecentOrders(all.slice(0, 5))
      }
      if (tablesData.status === "fulfilled") {
        setActiveTables(
          tablesData.value.filter((t: any) => t.status === "active" || t.status === "expiring").length
        )
      }
      setUpdatedAt(new Date())
    } catch { /* non-critical */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  if (!branchId) return <BranchRequired />

  // The backend serialises these rows with Go field names (Name, TotalSold). Reading only
  // lowercase keys is what produced "undefined sold" and a blank "Top dishes" row.
  const popular: { name: string; sold: number }[] = (analytics?.popular_items ?? []).map((d: any) => ({
    name: d.Name ?? d.name ?? "",
    sold: Number(d.TotalSold ?? d.total_sold ?? d.total_orders) || 0,
  }))
  const topSold = popular[0]?.sold ?? 0
  const revenue =
    analytics?.daily_sales != null ? `KES ${Number(analytics.daily_sales).toLocaleString()}` : "KES 0"

  return (
    <div className="flex flex-1 flex-col">
      <Topbar title="Overview" />
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-charcoal/60">
            <span className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden />
            Live
            {updatedAt && (
              <span className="text-charcoal/40">
                · updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
          <button
            onClick={fetchAll}
            disabled={refreshing}
            aria-label="Refresh overview"
            className="flex size-11 items-center justify-center rounded-xl border border-cream-border bg-white text-charcoal/60 transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </button>
        </div>

        {/* Stats: revenue leads, the rest support it */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <div className="rounded-2xl bg-charcoal p-5 text-cream">
                <p className="text-sm text-cream/60">Revenue today</p>
                <p className="mt-3 truncate text-3xl font-semibold tracking-tight tabular-nums">{revenue}</p>
                <p className="mt-2 text-xs text-cream/45">Recorded sales for this branch</p>
              </div>

              {[
                { title: "Orders today", value: ordersToday, note: "Placed since midnight" },
                { title: "Active tables", value: activeTables, note: "Sessions open right now" },
                {
                  title: "Best seller (30 days)",
                  value: popular[0]?.name ?? "—",
                  note: popular[0] ? `${popular[0].sold} sold in 30 days` : "No sales yet",
                },
              ].map((s) => (
                <div key={s.title} className={cn(card, "p-5")}>
                  <p className="text-sm text-charcoal/60">{s.title}</p>
                  <p className="mt-3 truncate text-3xl font-semibold tracking-tight text-charcoal tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-2 text-xs text-charcoal/45">{s.note}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {!loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Recent orders */}
            <section aria-labelledby="recent-orders" className={cn(card, "lg:col-span-3")}>
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 id="recent-orders" className="text-base font-semibold text-charcoal">Recent orders</h2>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline"
                >
                  View all <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal/50">
                    <QrCode className="size-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-sm font-medium text-charcoal">No orders yet today</p>
                  <p className="mt-1 max-w-xs text-sm text-charcoal/55">
                    Orders appear here the moment a guest scans a table QR code and orders.
                  </p>
                  <Link
                    href="/dashboard/tables"
                    className="mt-4 text-sm font-medium text-brand-ink hover:underline"
                  >
                    Open tables and QR codes
                  </Link>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-cream-border px-5 pb-3">
                  {recentOrders.map((order) => {
                    const st = orderStatus(order.status)
                    return (
                      <li key={order.id} className="flex items-center justify-between gap-3 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-charcoal text-sm font-semibold text-cream">
                            {order.table_number}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-charcoal">Table {order.table_number}</p>
                            <p className="truncate text-xs text-charcoal/50">
                              {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "items"} ·{" "}
                              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <p className="text-sm font-semibold tabular-nums text-charcoal">
                            KES {order.total?.toLocaleString() ?? 0}
                          </p>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.chip)}>
                            {st.label}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Top dishes */}
            <section aria-labelledby="top-dishes" className={cn(card, "lg:col-span-2")}>
              <div className="px-5 pt-5">
                <h2 id="top-dishes" className="text-base font-semibold text-charcoal">Top dishes</h2>
              </div>
              {popular.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal/50">
                    <ChefHat className="size-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-sm font-medium text-charcoal">Nothing to rank yet</p>
                  <p className="mt-1 max-w-xs text-sm text-charcoal/55">
                    Your best sellers show up after the first few orders.
                  </p>
                </div>
              ) : (
                <ol className="mt-4 space-y-4 px-5 pb-5">
                  {popular.slice(0, 5).map((dish, i) => {
                    const sold = dish.sold
                    const pct = topSold > 0 ? Math.max(4, (sold / topSold) * 100) : 0
                    return (
                      <li key={`${i}-${dish.name}`} className="flex items-center gap-3">
                        <span className="w-4 text-sm font-semibold tabular-nums text-charcoal/35">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-charcoal">{dish.name}</span>
                            <span className="shrink-0 text-xs tabular-nums text-charcoal/50">{sold}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
