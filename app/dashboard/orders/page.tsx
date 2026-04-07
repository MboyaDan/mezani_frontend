"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Clock, Loader2, RefreshCw } from "lucide-react"
import { ordersAPI } from "@/lib/api/orders"
import { useBranch } from "@/hooks/useBranch"
import { formatDistanceToNow } from "date-fns"

const statusStyles: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  served: "bg-zinc-100 text-zinc-600 border-zinc-200",
  closed: "bg-zinc-100 text-zinc-400 border-zinc-200",
}

const statusOrder = ["pending", "accepted", "preparing", "ready", "served", "closed"]

const actionLabel: Record<string, string> = {
  pending: "Accept Order",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Served",
  served: "Close Bill",
}

const nextStatus: Record<string, string> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "served",
  served: "closed",
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  table_number: number
  status: string
  created_at: string
  items: OrderItem[]
  total: number
}

// Define a type for API error response
interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
  message?: string
}

// Type guard to check if error is ApiError
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "message" in error)
  )
}

export default function OrdersPage() {
  const { branchId } = useBranch()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [advancing, setAdvancing] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!branchId) return
    try {
      setError(null)
      const data = await ordersAPI.getRecent(branchId)
      setOrders(data)
    } catch (err: unknown) {
      // Properly type the error
      if (isApiError(err)) {
        setError(err.response?.data?.error ?? err.message ?? "Failed to load orders")
      } else {
        setError("Failed to load orders")
      }
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchOrders()
    // Poll every 15 seconds for new orders
    const t = setInterval(fetchOrders, 15000)
    return () => clearInterval(t)
  }, [fetchOrders])

  const advance = async (id: string, currentStatus: string) => {
    const next = nextStatus[currentStatus]
    if (!next) return
    setAdvancing(id)

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    )

    try {
      await ordersAPI.updateStatus(id, next)
    } catch (err: unknown) {
      // Revert on failure
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: currentStatus } : o))
      )
      // Optionally log or handle the error
      console.error("Failed to update order status:", err)
    } finally {
      setAdvancing(null)
    }
  }

  const newCount = orders.filter((o) => o.status === "pending").length

  const filtered = orders
    .filter((o) => {
      const matchSearch = String(o.table_number).includes(search)
      const matchStatus = filterStatus === "all" || o.status === filterStatus
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const si = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      if (si !== 0) return si
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

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
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-zinc-500">No orders found</p>
            <p className="text-xs text-zinc-400 mt-1">
              {filterStatus !== "all" ? "Try a different filter" : "Orders will appear here"}
            </p>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.map((order) => (
              <Card
                key={order.id}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all",
                  order.status === "pending"
                    ? "border-orange-200 ring-1 ring-orange-100"
                    : "border-zinc-200"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white text-base font-bold flex items-center justify-center shrink-0">
                        {order.table_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900">
                            Table {order.table_number}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-4">{item.quantity}×</span>
                              <span className="text-sm text-zinc-700">{item.name}</span>
                              <span className="text-xs text-zinc-400 ml-auto">
                                KES {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

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
                      {order.status !== "closed" && order.status !== "served" && (
                        <button
                          onClick={() => advance(order.id, order.status)}
                          disabled={advancing === order.id}
                          className={cn(
                            "text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap disabled:opacity-50",
                            order.status === "pending"
                              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-100"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          )}
                        >
                          {advancing === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            actionLabel[order.status]
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}