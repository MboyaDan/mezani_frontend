"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Clock } from "lucide-react"

const statusStyles: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  served: "bg-zinc-100 text-zinc-600 border-zinc-200",
  closed: "bg-zinc-100 text-zinc-400 border-zinc-200",
}

const statusOrder = ["pending", "accepted", "preparing", "ready", "served", "closed"]

const mockOrders = [
  { id: "1", table: 4, items: [{ name: "Chapati + Beans", qty: 2 }, { name: "Ugali + Beef Stew", qty: 1 }, { name: "Coca-Cola", qty: 2 }], total: 1050, status: "pending", note: "Extra chili on the stew", time: "11m ago", phone: "+254712345678" },
  { id: "2", table: 7, items: [{ name: "Nyama Choma + Ugali", qty: 1 }, { name: "Fresh Mango Juice", qty: 1 }], total: 1050, status: "accepted", note: "", time: "17m ago", phone: "+254798765432" },
  { id: "3", table: 12, items: [{ name: "Beef Burger", qty: 2 }, { name: "Chips (Fries)", qty: 1 }, { name: "Milkshake", qty: 2 }], total: 1550, status: "preparing", note: "", time: "24m ago", phone: "+254723456789" },
  { id: "4", table: 2, items: [{ name: "Chicken Pilau", qty: 1 }, { name: "Kachumbari", qty: 1 }, { name: "Masala Chai", qty: 2 }], total: 850, status: "ready", note: "", time: "30m ago", phone: "" },
  { id: "5", table: 6, items: [{ name: "Tilapia + Ugali", qty: 1 }, { name: "Fanta Orange", qty: 1 }], total: 750, status: "served", note: "", time: "45m ago", phone: "" },
]

const nextStatus: Record<string, string> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "served",
  served: "closed",
}

const actionLabel: Record<string, string> = {
  pending: "Accept Order",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Served",
  served: "Close Bill",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const newCount = orders.filter((o) => o.status === "pending").length

  const filtered = orders
    .filter((o) => {
      const matchSearch = String(o.table).includes(search)
      const matchStatus = filterStatus === "all" || o.status === filterStatus
      return matchSearch && matchStatus
    })
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

  const advance = (id: string) => {
    setOrders((prev) => prev.map((o) =>
      o.id === id ? { ...o, status: nextStatus[o.status] ?? o.status } : o
    ))
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Orders" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by table number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-200 rounded-xl"
            />
          </div>
          {newCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl animate-pulse">
              🔔 {newCount} new {newCount === 1 ? "order" : "orders"}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", ...statusOrder.slice(0, 5)].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize",
                filterStatus === s
                  ? "bg-[#0f172a] text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {s === "all" ? "All Orders" : s}
              {s !== "all" && (
                <span className="ml-1.5 text-xs opacity-60">
                  {orders.filter((o) => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card
              key={order.id}
              className={cn(
                "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all",
                order.status === "pending" ? "border-orange-200 ring-1 ring-orange-100" : "border-zinc-200"
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white text-base font-bold flex items-center justify-center shrink-0">
                      {order.table}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-zinc-900">Table {order.table}</p>
                        {order.phone && (
                          <span className="text-xs text-zinc-400">{order.phone}</span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Clock className="w-3 h-3" />
                          {order.time}
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 w-4">{item.qty}×</span>
                            <span className="text-sm text-zinc-700">{item.name}</span>
                          </div>
                        ))}
                      </div>
                      {order.note && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                          📝 {order.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <p className="text-lg font-bold text-zinc-900">
                      KES {order.total.toLocaleString()}
                    </p>
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full border font-medium capitalize",
                      statusStyles[order.status]
                    )}>
                      {order.status}
                    </span>
                    {order.status !== "closed" && (
                      <button
                        onClick={() => advance(order.id)}
                        className={cn(
                          "text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap",
                          order.status === "pending"
                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-100"
                            : order.status === "served"
                            ? "bg-[#0f172a] hover:bg-zinc-800 text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        )}
                      >
                        {actionLabel[order.status]}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}