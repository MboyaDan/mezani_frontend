"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Topbar } from "@/components/layout/topbar"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, Banknote, Smartphone, BarChart3 } from "lucide-react"
import { analyticsAPI, AnalyticsRange } from "@/lib/api/analytics"
import { useBranch } from "@/hooks/useBranch"
import { BranchRequired } from "@/components/ui/branch-required"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopularItem { name: string; sold: number; revenue: number }
interface HourBucket { hour: number; orders: number }
interface PaymentMethod { method: string; total: number; count: number }

interface DashboardData {
  sales: { total: number; orders: number; avgOrderValue: number; previousTotal: number; previousOrders: number }
  popularItems: PopularItem[]
  hours: HourBucket[]
  payments: PaymentMethod[]
}

const RANGES: { key: AnalyticsRange; label: string; vs: string }[] = [
  { key: "today", label: "Today",   vs: "yesterday" },
  { key: "7d",    label: "7 days",  vs: "the previous 7 days" },
  { key: "30d",   label: "30 days", vs: "the previous 30 days" },
]

const kes = (n: number) => `KES ${Math.round(n).toLocaleString()}`
const card = "rounded-2xl border border-cream-border bg-white"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(res: any): DashboardData {
  const s = res.sales ?? {}
  return {
    sales: {
      total: Number(s.total) || 0,
      orders: Number(s.orders) || 0,
      avgOrderValue: Number(s.avg_order_value) || 0,
      previousTotal: Number(s.previous_total) || 0,
      previousOrders: Number(s.previous_orders) || 0,
    },
    popularItems: (res.popular_items ?? []).map((i: any) => ({
      name: i.Name ?? i.name,
      sold: Number(i.TotalSold ?? i.total_sold) || 0,
      revenue: Number(i.Revenue ?? i.revenue) || 0,
    })),
    hours: (res.peak_hours ?? []).map((p: any) => ({
      hour: Number(p.Hour ?? p.hour),
      orders: Number(p.OrderCount ?? p.order_count) || 0,
    })),
    payments: (res.payments_by_method ?? []).map((p: any) => ({
      method: p.Method ?? p.method,
      total: Number(p.Total ?? p.total) || 0,
      count: Number(p.PaymentCount ?? p.payment_count) || 0,
    })),
  }
}

/**
 * Zero-fills the hours so the chart shows the shape of the whole trading day, not just
 * the hours that happened to have an order. Always covers 06:00-22:00; widens only if
 * orders fall outside that.
 */
function fillHours(buckets: HourBucket[]): HourBucket[] {
  const byHour = new Map(buckets.map((b) => [b.hour, b.orders]))
  const hoursWithData = buckets.filter((b) => b.orders > 0).map((b) => b.hour)
  const start = Math.min(6, ...hoursWithData)
  const end = Math.max(22, ...hoursWithData)
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    hour: start + i,
    orders: byHour.get(start + i) ?? 0,
  }))
}

function Change({ current, previous, vs }: { current: number; previous: number; vs: string }) {
  if (previous <= 0) {
    return <p className="mt-2 text-xs text-charcoal/45">{current > 0 ? `No sales ${vs === "yesterday" ? "yesterday" : "in " + vs}` : "No sales yet"}</p>
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", up ? "text-emerald-700" : "text-red-600")}>
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}{pct}% <span className="font-normal text-charcoal/45">vs {vs}</span>
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { branchId } = useBranch()
  const [range, setRange] = useState<AnalyticsRange>("7d")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!branchId) return
    setRefreshing(true)
    try {
      setError(null)
      setData(normalize(await analyticsAPI.dashboard(branchId, range)))
      setUpdatedAt(new Date())
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load analytics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [branchId, range])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const hours = useMemo(() => fillHours(data?.hours ?? []), [data])
  const peak = useMemo(
    () => hours.reduce((best, h) => (h.orders > best.orders ? h : best), { hour: 0, orders: 0 }),
    [hours]
  )

  if (!branchId) return <BranchRequired />

  const rangeInfo = RANGES.find((r) => r.key === range)!
  const topItems = data?.popularItems ?? []
  const topSold = topItems[0]?.sold ?? 0
  const payments = data?.payments ?? []
  const paymentsTotal = payments.reduce((s, p) => s + p.total, 0)
  const noOrders = !!data && data.sales.orders === 0 && data.hours.length === 0

  return (
    <div className="flex flex-1 flex-col">
      <Topbar title="Analytics" />
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">

        {/* Toolbar: range + refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Time range" className="inline-flex rounded-xl border border-cream-border bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                aria-pressed={range === r.key}
                className={cn(
                  "h-9 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                  range === r.key ? "bg-charcoal text-cream" : "text-charcoal/60 hover:text-charcoal"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-charcoal/45">
                Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              aria-label="Refresh analytics"
              className="flex size-11 items-center justify-center rounded-xl border border-cream-border bg-white text-charcoal/60 transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="size-4 shrink-0 text-red-600" aria-hidden />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(card, "p-5")}>
                <div className="h-3 w-24 animate-pulse rounded bg-charcoal/10" />
                <div className="mt-4 h-8 w-32 animate-pulse rounded bg-charcoal/10" />
              </div>
            ))}
          </div>
        ) : data && (
          <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")}>

            {/* Headline numbers */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-charcoal p-5 text-cream">
                <p className="text-sm text-cream/60">Sales <span className="text-cream/40">· paid orders</span></p>
                <p className="mt-3 truncate text-3xl font-semibold tracking-tight tabular-nums">{kes(data.sales.total)}</p>
                {data.sales.previousTotal > 0 ? (
                  (() => {
                    const pct = Math.round(((data.sales.total - data.sales.previousTotal) / data.sales.previousTotal) * 100)
                    const up = pct >= 0
                    return (
                      <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", up ? "text-emerald-300" : "text-red-300")}>
                        {up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                        {up ? "+" : ""}{pct}% <span className="font-normal text-cream/45">vs {rangeInfo.vs}</span>
                      </p>
                    )
                  })()
                ) : (
                  <p className="mt-2 text-xs text-cream/45">{data.sales.total > 0 ? `No sales ${range === "today" ? "yesterday" : "in " + rangeInfo.vs}` : "No sales yet"}</p>
                )}
              </div>

              <div className={cn(card, "p-5")}>
                <p className="text-sm text-charcoal/60">Orders</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-charcoal">{data.sales.orders}</p>
                <Change current={data.sales.orders} previous={data.sales.previousOrders} vs={rangeInfo.vs} />
              </div>

              <div className={cn(card, "p-5")}>
                <p className="text-sm text-charcoal/60">Average order</p>
                <p className="mt-3 truncate text-3xl font-semibold tracking-tight tabular-nums text-charcoal">
                  {data.sales.orders > 0 ? kes(data.sales.avgOrderValue) : "—"}
                </p>
                <p className="mt-2 text-xs text-charcoal/45">Sales ÷ paid orders</p>
              </div>

              <div className={cn(card, "p-5")}>
                <p className="text-sm text-charcoal/60">Best seller</p>
                <p className="mt-3 truncate text-3xl font-semibold tracking-tight text-charcoal">{topItems[0]?.name ?? "—"}</p>
                <p className="mt-2 text-xs text-charcoal/45">
                  {topItems[0] ? `${topItems[0].sold} sold · ${kes(topItems[0].revenue)}` : "No sales yet"}
                </p>
              </div>
            </div>

            {noOrders && (
              <div className={cn(card, "flex flex-col items-center px-6 py-14 text-center")}>
                <span className="flex size-11 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal/50">
                  <BarChart3 className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-medium text-charcoal">No completed orders in this period</p>
                <p className="mt-1 max-w-sm text-sm text-charcoal/55">
                  Charts fill in as orders are served and paid. Try a longer range.
                </p>
              </div>
            )}

            {!noOrders && (
              <div className="grid gap-4 lg:grid-cols-5">
                {/* Orders by hour */}
                <section aria-labelledby="by-hour" className={cn(card, "p-5 lg:col-span-3")}>
                  <h2 id="by-hour" className="text-base font-semibold text-charcoal">Orders by hour</h2>
                  <p className="mt-1 text-sm text-charcoal/55">
                    {peak.orders > 0
                      ? `Busiest at ${String(peak.hour).padStart(2, "0")}:00 with ${peak.orders} ${peak.orders === 1 ? "order" : "orders"}. `
                      : ""}
                    Nairobi time.
                  </p>
                  <div className="mt-4" role="img" aria-label={peak.orders > 0 ? `Orders by hour. Busiest hour ${peak.hour}:00 with ${peak.orders} orders.` : "Orders by hour"}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={hours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DACA" />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={(h) => String(h).padStart(2, "0")}
                          tick={{ fontSize: 11, fill: "#1E252999" }}
                          axisLine={false}
                          tickLine={false}
                          interval={1}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#1E252999" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#1E252908" }}
                          formatter={(v) => [`${v} ${Number(v) === 1 ? "order" : "orders"}`, ""]}
                          labelFormatter={(h) => `${String(h).padStart(2, "0")}:00 to ${String((Number(h) + 1) % 24).padStart(2, "0")}:00`}
                          contentStyle={{ borderRadius: 12, border: "1px solid #E2DACA", fontSize: 12 }}
                        />
                        <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={28}>
                          {hours.map((h) => (
                            <Cell key={h.hour} fill={h.orders > 0 && h.hour === peak.hour ? "#B14A0C" : "#D9611B"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Payments by method */}
                <section aria-labelledby="by-method" className={cn(card, "p-5 lg:col-span-2")}>
                  <h2 id="by-method" className="text-base font-semibold text-charcoal">Payments by method</h2>
                  <p className="mt-1 text-sm text-charcoal/55">Confirmed payments only.</p>
                  {payments.length === 0 ? (
                    <p className="py-10 text-center text-sm text-charcoal/45">No confirmed payments in this period.</p>
                  ) : (
                    <ul className="mt-5 space-y-5">
                      {payments.map((p) => {
                        const share = paymentsTotal > 0 ? (p.total / paymentsTotal) * 100 : 0
                        const Icon = p.method === "mpesa" ? Smartphone : Banknote
                        return (
                          <li key={p.method}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-sm font-medium text-charcoal">
                                <Icon className="size-4 text-charcoal/50" aria-hidden />
                                {p.method === "mpesa" ? "M-Pesa" : p.method === "cash" ? "Cash" : p.method}
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-charcoal">{kes(p.total)}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                              <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
                            </div>
                            <p className="mt-1.5 text-xs text-charcoal/45">
                              {p.count} {p.count === 1 ? "payment" : "payments"} · {Math.round(share)}%
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {/* Top dishes */}
            {topItems.length > 0 && (
              <section aria-labelledby="top-dishes" className={cn(card, "p-5")}>
                <h2 id="top-dishes" className="text-base font-semibold text-charcoal">Top dishes</h2>
                <ol className="mt-5 space-y-5">
                  {topItems.map((dish, i) => (
                    <li key={`${i}-${dish.name}`} className="flex items-center gap-4">
                      <span className="w-4 text-sm font-semibold tabular-nums text-charcoal/35">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-medium text-charcoal">{dish.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-charcoal/55">
                            {dish.sold} sold · <span className="font-semibold text-charcoal">{kes(dish.revenue)}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${topSold > 0 ? Math.max(4, (dish.sold / topSold) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <p className="text-xs leading-relaxed text-charcoal/45">
              Sales count paid orders. Orders by hour and top dishes count served and paid orders. Dish revenue uses
              each dish&apos;s current menu price.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
