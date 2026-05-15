"use client"
import React from "react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useBranch } from "@/hooks/useBranch"
import { sessionsAPI } from "@/lib/api/tables"
import {
  TableProperties,
  ClipboardList,
  LogOut,
  Clock,
  QrCode,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import QRCode from "react-qr-code"

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "active" | "expiring"

interface Table {
  id: string
  tableNumber: number
  status: TableStatus
  sessionId?: string
  expiresAt?: Date
  openedAt?: Date
}

interface RawTable {
  id: string
  table_number: number
  status: string
  session_id?: string
  expires_at?: string
  created_at?: string
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  table_number: number
  items: OrderItem[]
  total: number
  status: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMenuUrl(tableId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return `${base}/menu/${tableId}`
}

function getToken(): string {
  return typeof window !== "undefined"
    ? (localStorage.getItem("access_token") ?? "")
    : ""
}

function getMinutesLeft(expiresAt?: Date) {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
}

function getElapsed(openedAt?: Date) {
  if (!openedAt) return ""
  const mins = Math.floor((Date.now() - openedAt.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function getOrderElapsed(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ─── Config ───────────────────────────────────────────────────────────────────

const orderStatusConfig: Record<string, { label: string; class: string }> = {
  pending:   { label: "New",            class: "bg-orange-100 text-orange-700" },
  accepted:  { label: "Accepted",       class: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing",      class: "bg-yellow-100 text-yellow-700" },
  ready:     { label: "Ready to serve", class: "bg-emerald-100 text-emerald-700" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all",
        active
          ? "border-orange-500 text-orange-600"
          : "border-transparent text-zinc-400 hover:text-zinc-600"
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── QRCode wrapper to fix TS2607 (react-qr-code JSX props conflict) ──────────

const QRCodeWrapper = QRCode as unknown as React.FC<{
  value: string
  size?: number
  style?: React.CSSProperties
}>

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  const { logout } = useAuth()
  const { branchId } = useBranch()

  const [tab, setTab] = useState<"tables" | "orders">("tables")
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [duration, setDuration] = useState("120")
  const [actionLoading, setActionLoading] = useState(false)

  // FIX: Use a mounted flag to drive client-only ticks, avoiding hydration mismatch
  // from Date.now() differences between SSR and client render.
  const [isMounted, setIsMounted] = useState(false)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Live tick for elapsed/countdown timers — only after mount to avoid hydration mismatch
  useEffect(() => {
    if (!isMounted) return
    const t = setInterval(() => forceUpdate((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [isMounted])

  // ── Fetch tables ─────────────────────────────────────────────────────────────
  // Uses /api/waiter/tables — scoped to branch_id from JWT,
  // requires create_orders permission which waiters already have.

  const fetchTables = useCallback(async () => {
    if (!branchId) return
    try {
      setError(null)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/waiter/tables`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const data: RawTable[] = await res.json()
      setTables(data.map((t) => ({
        id: t.id,
        tableNumber: t.table_number,
        status: t.status as TableStatus,
        sessionId: t.session_id,
        expiresAt: t.expires_at ? new Date(t.expires_at) : undefined,
        openedAt: t.created_at ? new Date(t.created_at) : undefined,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables")
    } finally {
      setLoading(false)
    }
  }, [branchId])

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  // Uses /api/orders/recent — waiters have no permission restriction on this.
  // Filters out served/paid so only active orders are shown.

  const fetchOrders = useCallback(async () => {
    if (!branchId) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/recent?branch_id=${branchId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Order[] = await res.json()
      setOrders(data.filter((o) => o.status !== "served" && o.status !== "paid"))
    } catch {
      // Non-fatal — tables still work without orders
    } finally {
      setOrdersLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchTables()
    fetchOrders()
    const t = setInterval(() => { fetchTables(); fetchOrders() }, 30000)
    return () => clearInterval(t)
  }, [fetchTables, fetchOrders])

  // ── Session actions ───────────────────────────────────────────────────────────

  const handleActivate = (table: Table) => {
    setSelectedTable(table)
    setShowActivateDialog(true)
  }

  const confirmActivate = async () => {
    if (!selectedTable) return
    setActionLoading(true)
    try {
      await sessionsAPI.start(selectedTable.id, Number(duration))
      await fetchTables()
      setShowActivateDialog(false)
      setSelectedTable(null)
      setDuration("120")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start session"
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExtend = async (table: Table) => {
    if (!table.sessionId) return
    try {
      await sessionsAPI.heartbeat(table.sessionId)
      await fetchTables()
    } catch {
      setError("Failed to extend session")
    }
  }

  const handleClose = async (table: Table) => {
    if (!table.sessionId) return
    try {
      await sessionsAPI.close(table.sessionId)
      await fetchTables()
    } catch {
      setError("Failed to close session")
    }
  }

  // Uses /api/orders/:id/status — waiters have update_order_status permission.
  // This is the single correct route; /api/waiter/orders/:id/status was removed
  // as it was a redundant duplicate with a conflicting permission stack.
  const handleMarkServed = async (orderId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ order_id: orderId, status: "served" }),
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchOrders()
    } catch {
      setError("Failed to mark order as served")
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeTables   = tables.filter((t) => t.status === "active" || t.status === "expiring")
  const expiringTables = tables.filter((t) => t.status === "expiring")
  const freeTables     = tables.filter((t) => t.status === "free")
  const readyOrders    = orders.filter((o) => o.status === "ready")

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!branchId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] max-w-md mx-auto flex flex-col">

{/* Header */}
<div className="bg-white border-b border-zinc-200 px-5 py-4 sticky top-0 z-10">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-base font-bold text-zinc-900">
        Waiter View
      </h1>

      {/* FIX: suppressHydrationWarning prevents hydration mismatch on
          counts that differ between SSR (empty arrays) and first client render */}
      <p className="text-xs text-zinc-400 mt-0.5" suppressHydrationWarning>
        {activeTables.length} active · {freeTables.length} free
      </p>
    </div>

    <button
      onClick={logout}
      className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400"
    >
      <LogOut className="w-4 h-4" />
    </button>
  </div>

  {expiringTables.length > 0 && (
    <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />

      <p className="text-xs font-medium text-amber-700" suppressHydrationWarning>
        Table {expiringTables.map((t) => t.tableNumber).join(", ")} expiring — extend or close
      </p>
    </div>
  )}

  {readyOrders.length > 0 && (
    <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

      <p className="text-xs font-medium text-emerald-700" suppressHydrationWarning>
        {readyOrders.length}{" "}
        {readyOrders.length === 1 ? "order is" : "orders are"} ready to serve
      </p>
    </div>
  )}

  {error && (
    <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />

      <p className="text-xs text-red-600">{error}</p>
    </div>
  )}
</div>

      {/* Tabs */}
      <div className="bg-white border-b border-zinc-200 flex sticky top-[72px] z-10">
        <TabButton active={tab === "tables"} onClick={() => setTab("tables")}>
          <TableProperties className="w-4 h-4" />
          Tables
        </TabButton>
        <TabButton
          active={tab === "orders"}
          onClick={() => setTab("orders")}
          badge={readyOrders.length}
        >
          <ClipboardList className="w-4 h-4" />
          Orders
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 pb-8">

        {/* ── TABLES TAB ── */}
        {tab === "tables" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <TableProperties className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No tables found</p>
              </div>
            ) : (
              tables
                .sort((a, b) => {
                  const rank: Record<TableStatus, number> = { expiring: 0, active: 1, free: 2 }
                  return rank[a.status] - rank[b.status] || a.tableNumber - b.tableNumber
                })
                .map((table) => {
                  const minsLeft   = getMinutesLeft(table.expiresAt)
                  const elapsed    = getElapsed(table.openedAt)
                  const isCritical = table.status === "expiring"

                  return (
                    <div
                      key={table.id}
                      className={cn(
                        "bg-white rounded-2xl border p-4 transition-all",
                        isCritical
                          ? "border-amber-300 ring-1 ring-amber-200"
                          : table.status === "active"
                          ? "border-emerald-200"
                          : "border-zinc-200"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl text-lg font-bold flex items-center justify-center shrink-0",
                          isCritical
                            ? "bg-amber-500 text-white"
                            : table.status === "active"
                            ? "bg-[#0f172a] text-white"
                            : "bg-zinc-100 text-zinc-400"
                        )}>
                          {table.tableNumber}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-zinc-900">Table {table.tableNumber}</p>
                            {table.status !== "free" && (
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                isCritical
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              )} suppressHydrationWarning>
                                {isCritical ? `${minsLeft}m left` : "Active"}
                              </span>
                            )}
                          </div>

                          {table.status !== "free" ? (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span className="flex items-center gap-1" suppressHydrationWarning>
                                  <Clock className="w-3 h-3" />
                                  {isMounted ? elapsed : ""}
                                </span>
                              </div>
                              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isCritical ? "bg-amber-500" : "bg-emerald-500"
                                  )}
                                  style={{ width: isMounted ? `${Math.min((minsLeft / 120) * 100, 100)}%` : "0%" }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 mt-0.5">No active session</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {table.status === "free" ? (
                          <button
                            onClick={() => handleActivate(table)}
                            className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            Start Session
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setSelectedTable(table); setShowQRDialog(true) }}
                              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExtend(table)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              +30 min
                            </button>
                            <button
                              onClick={() => handleClose(table)}
                              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          <>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ClipboardList className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No active orders</p>
                <p className="text-xs text-zinc-300 mt-1">Orders appear here when customers place them</p>
              </div>
            ) : (
              orders
                .sort((a, b) => {
                  const rank: Record<string, number> = { ready: 0, pending: 1, accepted: 2, preparing: 3 }
                  return (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
                })
                .map((order) => {
                  const statusCfg = orderStatusConfig[order.status] ?? orderStatusConfig.pending
                  const isReady   = order.status === "ready"
                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "bg-white rounded-2xl border p-4 transition-all",
                        isReady ? "border-emerald-300 ring-1 ring-emerald-100" : "border-zinc-200"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center">
                            {order.table_number}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">Table {order.table_number}</p>
                            <p className="text-xs text-zinc-400" suppressHydrationWarning>
                              {isMounted ? getOrderElapsed(order.created_at) : ""}
                            </p>
                          </div>
                        </div>
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.class)}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-400 w-4 text-xs">{item.quantity}×</span>
                            <span className="text-zinc-700">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                        <span className="text-base font-bold text-zinc-900">
                          KES {order.total.toLocaleString()}
                        </span>
                        {isReady && (
                          <button
                            onClick={() => handleMarkServed(order.id)}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
            )}
          </>
        )}
      </div>

      {/* Activate Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Start Session — Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {["60", "120", "180"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-all",
                      duration === d
                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {Number(d) / 60}h
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowActivateDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-xl"
                onClick={confirmActivate}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>QR Code — Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedTable && (
              <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                {/* FIX: Cast through unknown to avoid TS2607 caused by react-qr-code's
                    SVGProps-based typing conflicting with React's JSX element props check */}
                <QRCodeWrapper
                  value={buildMenuUrl(selectedTable.id)}
                  size={180}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            )}
            <p className="text-xs text-zinc-500 text-center">
              Table {selectedTable?.tableNumber} · Scan to view menu
            </p>
            <Button
              className="w-full bg-[#0f172a] text-white rounded-xl"
              onClick={() => setShowQRDialog(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}