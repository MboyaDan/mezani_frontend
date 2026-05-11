"use client"
import { useEffect, useState, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ShoppingBag, Users, TrendingUp, Clock, ArrowUpRight, Loader2, RefreshCw } from "lucide-react"
import { analyticsAPI } from "@/lib/api/analytics"
import { ordersAPI } from "@/lib/api/orders"
import { tablesAPI } from "@/lib/api/tables"
import { useBranch } from "@/hooks/useBranch"
import { formatDistanceToNow } from "date-fns"

const statusStyles: Record<string, string> = {
  pending:   "bg-orange-100 text-orange-700 border-orange-200",
  accepted:  "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  served:    "bg-zinc-100 text-zinc-600 border-zinc-200",
}

export default function DashboardPage() {
  const { branchId } = useBranch()
  const [analytics, setAnalytics] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [activeTables, setActiveTables] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!branchId) return
    try {
      const [analyticsData, ordersData, tablesData] = await Promise.allSettled([
        analyticsAPI.dashboard(branchId),
        ordersAPI.getRecent(branchId),
        tablesAPI.getWithSessions(branchId),
      ])

      if (analyticsData.status === "fulfilled") setAnalytics(analyticsData.value)
      if (ordersData.status === "fulfilled") setRecentOrders(ordersData.value.slice(0, 5))
      if (tablesData.status === "fulfilled") {
        setActiveTables(tablesData.value.filter((t: any) =>
          t.status === "active" || t.status === "expiring"
        ).length)
      }
    } catch { /* non-critical */ } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  const stats = [
    {
      title: "Today's Orders",
      value: recentOrders.filter((o) => {
        const d = new Date(o.created_at)
        return d.toDateString() === new Date().toDateString()
      }).length,
      sub: "Live",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Tables",
      value: activeTables,
      sub: "Right now",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Today's Revenue",
      value: analytics?.daily_sales != null
        ? `KES ${Number(analytics.daily_sales).toLocaleString()}`
        : "KES 0",
      sub: "Updated live",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Best Seller",
      value: analytics?.popular_items?.[0]?.name?? "—",
      sub: analytics?.popular_items?.[0]
        ? `${analytics.popular_items[0].total_sold} orders`
        : "No data",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Overview" />
      <div className="p-6 space-y-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Live restaurant overview</p>
          <button
            onClick={fetchAll}
            className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        )}

        {!loading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card
                    key={stat.title}
                    className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-500 font-medium">{stat.title}</p>
                          <p className="text-2xl font-bold text-zinc-900 truncate max-w-[140px]">
                            {stat.value}
                          </p>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-zinc-400">{stat.sub}</span>
                          </div>
                        </div>
                        <div className={cn("p-3 rounded-xl shrink-0", stat.bg)}>
                          <Icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Recent Orders + Top Dishes */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Recent Orders */}
              <Card className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                    <a href="/dashboard/orders" className="text-xs text-orange-500 font-medium hover:underline flex items-center gap-1">
                      View all <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm text-zinc-400">No orders yet today</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      // order.id is a stable unique ID from the backend
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {order.table_number}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              Table {order.table_number}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {order.items?.length ?? 0} items · {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-bold text-zinc-900">
                            KES {order.total?.toLocaleString() ?? 0}
                          </p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                            statusStyles[order.status] ?? statusStyles.served
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Dishes */}
              <Card className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Dishes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(analytics?.popular_items ?? []).length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm text-zinc-400">No data yet</p>
                    </div>
                  ) : (
                    analytics.popular_items.slice(0, 5).map((dish: any, i: number) => (
                      // Use index + name to guarantee uniqueness even if names repeat
                      <div key={`${i}-${dish.name}`} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-400 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-900 truncate">{dish.name}</span>
                            <span className="text-xs text-zinc-400 shrink-0 ml-2">{dish.total_sold}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{
                                width: `${(Number(dish.total_orders) / Number(analytics.popular_items[0].total_orders)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}