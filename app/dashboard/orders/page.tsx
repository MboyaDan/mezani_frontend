"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Clock, Loader2, RefreshCw, Banknote, CheckCircle2 } from "lucide-react"
import { ordersAPI } from "@/lib/api/orders"
import { paymentsAPI, Payment } from "@/lib/api/payments"
import { useBranch } from "@/hooks/useBranch"
import { useBranchWebSocket } from "@/hooks/useBranchWebSocket"
import { useUser } from "@/hooks/useUser"
import { ORDER_STATUS } from "@/lib/order-status"
import { formatDistanceToNow } from "date-fns"
import { BranchRequired } from "@/components/ui/branch-required"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const statusStyles: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.chip])
)

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
  note?: string
  id: string
  table_session_id: string
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
  const { user } = useUser()

  const [orders, setOrders] = useState<Order[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [advancing, setAdvancing] = useState<string | null>(null)

  // Payment dialog state
  const [payingSession, setPayingSession] = useState<{
    tableSessionId: string
    tableNumber: number
    total: number
  } | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const canConfirmPayment = user?.role === "owner" || user?.role === "manager" || user?.role === "cashier"

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

const fetchPendingPayments = useCallback(async () => {
    if (!branchId) return
    try {
      const data = await paymentsAPI.getPending(branchId)
      setPendingPayments(data ?? [])
    } catch {
      // Non-critical — the "collect cash" flow still works without this list
    }
  }, [branchId])

useEffect(() => {
    fetchOrders()
    fetchPendingPayments()
    // Slower fallback poll now that the WebSocket below handles the fast
    // path — kept deliberately, since WS connections can silently drop
    // and this is the safety net that keeps the page eventually correct.
    const t = setInterval(() => {
      fetchOrders()
      fetchPendingPayments()
    }, 30000)
    return () => clearInterval(t)
  }, [fetchOrders, fetchPendingPayments])
  
  useBranchWebSocket(branchId, (msg) => {
    if (msg.type === "payment_initiated" || msg.type === "payment_confirmed") {
      fetchOrders()
      fetchPendingPayments()
    }
  })

   if (!branchId) {
    return <BranchRequired />
  }

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

  // Group served-but-unpaid orders by table_session_id — a "bill" spans the
  // whole session, not a single order, so payment is collected per session.
  const billsBySession = orders
    .filter((o) => o.status === "served")
    .reduce<Record<string, { tableSessionId: string; tableNumber: number; total: number }>>(
      (acc, o) => {
        const existing = acc[o.table_session_id]
        if (existing) {
          existing.total += o.total
        } else {
          acc[o.table_session_id] = {
            tableSessionId: o.table_session_id,
            tableNumber: o.table_number,
            total: o.total,
          }
        }
        return acc
      },
      {}
    )
  const bills = Object.values(billsBySession)

  const pendingBySession = new Map(pendingPayments.map((p) => [p.TableSessionID, p]))

  const openPaymentDialog = (bill: { tableSessionId: string; tableNumber: number; total: number }) => {
    setPayingSession(bill)
    setPayAmount(String(bill.total))
    setPayError(null)
  }

  const submitCashPayment = async () => {
    if (!payingSession) return
    const amount = Number(payAmount)
    if (!amount || amount <= 0) {
      setPayError("Enter a valid amount")
      return
    }
    setPayLoading(true)
    setPayError(null)
    try {
      await paymentsAPI.initiateCash(payingSession.tableSessionId, amount)
      setPayingSession(null)
      await fetchPendingPayments()
    } catch (err: unknown) {
      setPayError(
        isApiError(err) ? err.response?.data?.error ?? err.message ?? "Failed to record cash payment" : "Failed to record cash payment"
      )
    } finally {
      setPayLoading(false)
    }
  }

  const confirmCashReceived = async (paymentId: string) => {
    setConfirmingId(paymentId)
    try {
      await paymentsAPI.confirm(paymentId)
      await Promise.all([fetchOrders(), fetchPendingPayments()])
    } catch (err) {
      console.error("Failed to confirm payment:", err)
    } finally {
      setConfirmingId(null)
    }
  }

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
    <div className="flex flex-col flex-1 bg-cream">
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
              className="pl-9 bg-white border-cream-border rounded-xl"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-white border border-cream-border hover:bg-zinc-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
          {newCount > 0 && (
            <div className="flex items-center gap-2 bg-brand-ink text-white text-sm font-semibold px-4 py-2 rounded-xl animate-pulse">
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
                  ? "bg-charcoal text-white"
                  : "bg-white border border-cream-border text-zinc-600 hover:bg-zinc-50"
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

        {/* Bills Awaiting Payment */}
        {bills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Bills Awaiting Payment
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bills.map((bill) => {
                const pending = pendingBySession.get(bill.tableSessionId)
                return (
                  <div
                    key={bill.tableSessionId}
                    className="bg-white rounded-2xl border border-cream-border p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-zinc-900">Table {bill.tableNumber}</p>
                      <p className="text-lg font-bold text-brand-ink">
                        KES {bill.total.toLocaleString()}
                      </p>
                    </div>
                    {pending ? (
                      canConfirmPayment ? (
                        <button
                          onClick={() => confirmCashReceived(pending.ID)}
                          disabled={confirmingId === pending.ID}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                          {confirmingId === pending.ID ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm Cash
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 whitespace-nowrap">
                          Awaiting cashier
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => openPaymentDialog(bill)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        Collect Cash
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                    ? "border-brand/30 ring-1 ring-brand/25"
                    : "border-cream-border"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-charcoal text-white text-base font-bold flex items-center justify-center shrink-0">
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
                          {order.note && (
                            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
                              Guest note: {order.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <p className="text-lg font-bold text-zinc-900">
                        KES {order.total.toLocaleString()}
                      </p>
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
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
                              ? "bg-charcoal hover:bg-charcoal/90 text-cream shadow-sm shadow-charcoal/10"
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

      {/* Collect Cash dialog */}
      <Dialog open={!!payingSession} onOpenChange={(open) => !open && setPayingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Cash — Table {payingSession?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-zinc-500">
              This marks the bill as awaiting your confirmation — orders won&apos;t
              be marked paid until you tap &quot;Confirm Cash&quot; once the money is
              actually in hand. The amount charged is the full outstanding
              balance for this table, calculated by the server.
            </p>
            <div className="bg-zinc-50 border border-cream-border rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-zinc-500">Amount Due</p>
              <p className="text-2xl font-bold text-zinc-900">
                KES {payingSession?.total.toLocaleString()}
              </p>
            </div>
            {payError && (
              <p className="text-xs text-red-500">{payError}</p>
            )}
            <button
              onClick={submitCashPayment}
              disabled={payLoading}
              className="w-full bg-brand hover:bg-brand disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Cash Payment"}
            </button>
          </div>
   
        </DialogContent>
      </Dialog>
    </div>
  )
}