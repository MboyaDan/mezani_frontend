"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  TrendingUp, ShoppingBag, Users, Star,
  ArrowUpRight, Loader2, RefreshCw, AlertCircle,
} from "lucide-react"
import { analyticsAPI } from "@/lib/api/analytics"

interface PopularItem {
  name: string
  total_orders: number
}

interface PeakHour {
  hour: number
  total_orders: number
}

interface DashboardData {
  daily_sales: number | null
  popular_items: PopularItem[]
  peak_hours: PeakHour[]
  returning_customers: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null)
      const res = await analyticsAPI.dashboard()
      // Normalize backend field names once here so the rest of the
      // component can use clean, consistent keys (hour / total_orders)
      const normalized: DashboardData = {
        ...res,
        peak_hours: (res.peak_hours ?? []).map((p: any) => ({
          hour: p.Hour ?? p.hour,
          total_orders: p.OrderCount ?? p.total_orders,
        })),
        popular_items: (res.popular_items ?? []).map((item: any) => ({
  name: item.Name ?? item.name,
  total_orders: item.TotalSold ?? item.total_orders,
}))
      }
      setData(normalized)
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Now uses clean normalized keys — no any casting needed
  const peakHoursData = (data?.peak_hours ?? []).map((p) => ({
    hour: `${p.hour}:00`,
    orders: Number(p.total_orders) || 0,
  }))

  const popularItems = data?.popular_items ?? []
  const maxOrders = popularItems[0]?.total_orders ?? 1

  const stats = [
    {
      title: "Today's Sales",
      value: data?.daily_sales != null
        ? `KES ${Number(data.daily_sales).toLocaleString()}`
        : "—",
      change: "Today",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Popular Items",
      value: popularItems.length > 0 ? String(popularItems.length) : "—",
      change: "Tracked",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Returning Customers",
      value: data?.returning_customers != null
        ? String(data.returning_customers)
        : "—",
      change: "All time",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Best Seller",
      value: popularItems[0]?.name ?? "—",
      change: popularItems[0]
        ? `${popularItems[0].total_orders} orders`
        : "No data",
      icon: Star,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Analytics" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Live data from your restaurant</p>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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
                        <div>
                          <p className="text-sm text-zinc-500">{stat.title}</p>
                          <p className="text-xl font-bold text-zinc-900 mt-1 truncate max-w-[140px]">
                            {stat.value}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-zinc-400">{stat.change}</span>
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Peak Hours */}
              <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Orders by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  {peakHoursData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center">
                      <p className="text-sm text-zinc-400">No data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 11, fill: "#a1a1aa" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #f4f4f5", fontSize: 12 }}
                          formatter={(value): [string, string] => [String(value), "orders"]}
                        />
                        <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Customer Insights */}
              <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-zinc-700">Returning Customers</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Customers with 2+ visits</p>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">
                        {data?.returning_customers ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-zinc-700">Menu Items Tracked</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Items with order history</p>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">
                        {popularItems.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Dishes */}
            {popularItems.length > 0 && (
              <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Dishes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {popularItems.map((dish, i) => (
                    <div key={`${dish.name}-${i}`} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-zinc-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-zinc-900">{dish.name}</span>
                          <span className="text-xs text-zinc-500">{dish.total_orders} orders</span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${(Number(dish.total_orders) / Number(maxOrders)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {popularItems.length === 0 && peakHoursData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No analytics data yet</p>
                <p className="text-xs text-zinc-300 mt-1">
                  Data will appear here as customers place orders
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}