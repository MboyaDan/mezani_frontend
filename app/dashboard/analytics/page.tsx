"use client"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { TrendingUp, ShoppingBag, Users, Star, ArrowUpRight } from "lucide-react"

const weeklyRevenue = [
  { day: "Mon", revenue: 32000 },
  { day: "Tue", revenue: 28000 },
  { day: "Wed", revenue: 41000 },
  { day: "Thu", revenue: 38000 },
  { day: "Fri", revenue: 52000 },
  { day: "Sat", revenue: 61000 },
  { day: "Sun", revenue: 45000 },
]

const hourlyOrders = [
  { hour: "8AM", orders: 3 }, { hour: "9AM", orders: 5 },
  { hour: "10AM", orders: 4 }, { hour: "11AM", orders: 7 },
  { hour: "12PM", orders: 15 }, { hour: "1PM", orders: 14 },
  { hour: "2PM", orders: 8 }, { hour: "3PM", orders: 6 },
  { hour: "4PM", orders: 5 }, { hour: "5PM", orders: 9 },
  { hour: "6PM", orders: 12 }, { hour: "7PM", orders: 16 },
  { hour: "8PM", orders: 14 }, { hour: "9PM", orders: 8 },
]

const topDishes = [
  { name: "Nyama Choma", orders: 45, revenue: 36000 },
  { name: "Chicken Pilau", orders: 38, revenue: 20900 },
  { name: "Beef Burger", orders: 32, revenue: 16000 },
  { name: "Ugali + Beef Stew", orders: 28, revenue: 12600 },
  { name: "Chips Masala", orders: 25, revenue: 5000 },
]

const stats = [
  { title: "Weekly Revenue", value: "KES 281,000", change: "+18%", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  { title: "Total Orders", value: "412", change: "+24", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Repeat Customers", value: "34", change: "+5", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Best Seller", value: "Nyama Choma", change: "45 orders", icon: Star, color: "text-orange-600", bg: "bg-orange-50" },
]

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Analytics" />
      <div className="p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">{stat.title}</p>
                      <p className="text-xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <div className={cn("p-3 rounded-xl", stat.bg)}>
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
          <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weeklyRevenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #f4f4f5", fontSize: 12 }}
                    formatter={(v: number) => [`KES ${v.toLocaleString()}`, "revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Orders by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #f4f4f5", fontSize: 12 }}
                    formatter={(v: number) => [v, "orders"]}
                  />
                  <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Dishes */}
        <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Dishes This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topDishes.map((dish, i) => (
              <div key={dish.name} className="flex items-center gap-4">
                <span className="text-sm font-bold text-zinc-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-zinc-900">{dish.name}</span>
                    <span className="text-xs text-zinc-500">{dish.orders} orders</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${(dish.orders / topDishes[0].orders) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-zinc-900 w-24 text-right">
                  KES {dish.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}