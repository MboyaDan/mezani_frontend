import { getCurrentUser } from "@/lib/auth"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react"

const stats = [
  {
    title: "Today's Orders",
    value: "0",
    change: "+0%",
    sub: "vs yesterday",
    icon: ShoppingBag,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Active Tables",
    value: "0",
    change: "Live",
    sub: "right now",
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Revenue Today",
    value: "KES 0",
    change: "+0%",
    sub: "vs yesterday",
    icon: TrendingUp,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Avg Order Time",
    value: "— min",
    change: "This week",
    sub: "average",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
]

const recentOrders = [
  { table: 4, items: 3, total: 1050, status: "new", time: "2m ago" },
  { table: 7, items: 2, total: 1050, status: "accepted", time: "8m ago" },
  { table: 12, items: 3, total: 1550, status: "preparing", time: "15m ago" },
  { table: 2, items: 3, total: 850, status: "ready", time: "22m ago" },
]

const statusStyles: Record<string, string> = {
  new: "bg-orange-100 text-orange-700 border-orange-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  served: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

export default async function DashboardPage() {
  const user = getCurrentUser() // server-side, no useEffect, no hydration mismatch

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Overview" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-500 font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
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

        {/* Charts + Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Chart placeholder */}
          <Card className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-zinc-900">Orders Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-400">Connect analytics API to see chart</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-zinc-900">Recent Orders</CardTitle>
                <a href="/dashboard/orders" className="text-xs text-orange-500 font-medium hover:underline flex items-center gap-1">
                  View all <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.table}
                  className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {order.table}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Table {order.table}</p>
                      <p className="text-xs text-zinc-400">{order.items} items · {order.time}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-zinc-900">KES {order.total.toLocaleString()}</p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                      statusStyles[order.status]
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}