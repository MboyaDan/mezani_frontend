"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useBranch } from "@/hooks/useBranch"
import { orderStatus } from "@/lib/order-status"
import { Logo } from "@/components/brand/logo"
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

// Only ever called inside useEffect / event handlers, so localStorage is safe.
function getToken(): string {
  return localStorage.getItem("access_token") ?? ""
}

function getMinutesLeft(expiresAt?: Date) {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
}

// Real length of this session = when it expires minus when it started. The backend
// does not store the chosen duration separately, but both timestamps come back with
// each table, and extending a session moves expires_at, so this stays correct for
// 1h / 2h / 3h tables and after "+30 min". (The bar used to assume 120 minutes.)
function getProgressPct(minsLeft: number, openedAt?: Date, expiresAt?: Date) {
  if (!openedAt || !expiresAt) return 0
  const totalMins = (expiresAt.getTime() - openedAt.getTime()) / 60000
  if (totalMins <= 0) return 0
  return Math.min(100, Math.max(0, (minsLeft / totalMins) * 100))
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

// ─── QRCode wrapper ───────────────────────────────────────────────────────────
// react-qr-code types its export via SVGProps which conflicts with React's JSX
// props check (TS2607). Casting to a plain FC with only the props we use fixes it.
const QRCodeWrapper = QRCode as unknown as React.FC<{
  value: string
  size?: number
  style?: React.CSSProperties
}>

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  const { logout } = useAuth()
  const { branchId } = useBranch()

  const [tab, setTab]                               = useState<"tables" | "orders">("tables")
  const [tables, setTables]                         = useState<Table[]>([])
  const [orders, setOrders]                         = useState<Order[]>([])
  const [loading, setLoading]                       = useState(true)
  const [ordersLoading, setOrdersLoading]           = useState(true)
  const [error, setError]                           = useState<string | null>(null)
  const [selectedTable, setSelectedTable]           = useState<Table | null>(null)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog]             = useState(false)
  const [duration, setDuration]                     = useState("120")
  const [actionLoading, setActionLoading]           = useState(false)
  const [closeTarget, setCloseTarget]               = useState<Table | null>(null)

  // Gates any Date.now()-derived rendering so SSR and the first client paint are
  // identical (empty strings / zero widths). Flips to true in the mount effect.
  const [isMounted, setIsMounted] = useState(false)
  // Incremented every 30 s to re-render elapsed timers without a full refetch.
  const [, forceUpdate] = useState(0)

  // ── Fetch callbacks ───────────────────────────────────────────────────────────

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
        openedAt:  t.created_at ? new Date(t.created_at) : undefined,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables")
    } finally {
      setLoading(false)
    }
  }, [branchId])

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

  // Refs so the single mount effect always calls the latest callback version
  // without needing to list them in its dep array (which would change its size).
  const fetchTablesRef = useRef(fetchTables)
  const fetchOrdersRef = useRef(fetchOrders)
  useEffect(() => { fetchTablesRef.current = fetchTables }, [fetchTables])
  useEffect(() => { fetchOrdersRef.current = fetchOrders }, [fetchOrders])

  // Single mount effect — dep array is permanently [].
  // • Marks isMounted so time-derived values render correctly client-side.
  // • Fires the first fetch after localStorage is available (no empty-token risk).
  // • Starts the 30 s data-polling and UI-tick intervals.
  useEffect(() => {
    setIsMounted(true)
    fetchTablesRef.current()
    fetchOrdersRef.current()

    const dataInterval = setInterval(() => {
      fetchTablesRef.current()
      fetchOrdersRef.current()
    }, 30_000)

    const tickInterval = setInterval(() => forceUpdate((n) => n + 1), 30_000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(tickInterval)
    }
  }, []) // must stay []

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
      await fetchTablesRef.current()
      setShowActivateDialog(false)
      setSelectedTable(null)
      setDuration("120")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session")
    } finally {
      setActionLoading(false)
    }
  }

  const handleExtend = async (table: Table) => {
    if (!table.sessionId) return
    try {
      await sessionsAPI.heartbeat(table.sessionId)
      await fetchTablesRef.current()
    } catch {
      setError("Failed to extend session")
    }
  }

  const handleClose = async (table: Table) => {
    if (!table.sessionId) return
    setActionLoading(true)
    try {
      await sessionsAPI.close(table.sessionId)
      await fetchTablesRef.current()
      setCloseTarget(null)
    } catch {
      setError("Failed to close session")
      setCloseTarget(null)
    } finally {
      setActionLoading(false)
    }
  }

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
      await fetchOrdersRef.current()
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

  // Both the server and client's first paint must render the same HTML.
  // branchId comes from a hook that reads client-only state, so it is falsy on
  // the server but may already be truthy on the client — causing a tree mismatch.
  // Gating on !isMounted means both environments always render the spinner first.
  if (!isMounted || !branchId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="size-5 animate-spin text-charcoal/40" aria-label="Loading" />
      </div>
    )
  }

  // Sorted copies. The previous code called .sort() on state inside render, which
  // mutates the array React owns.
  const sortedTables = [...tables].sort((a, b) => {
    const rank: Record<TableStatus, number> = { expiring: 0, active: 1, free: 2 }
    return rank[a.status] - rank[b.status] || a.tableNumber - b.tableNumber
  })
  const sortedOrders = [...orders].sort((a, b) => {
    const rank: Record<string, number> = { ready: 0, pending: 1, accepted: 2, preparing: 3 }
    return (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  })

  const tabClass = (active: boolean) =>
    cn(
      "flex h-12 flex-1 items-center justify-center gap-2 border-b-2 text-sm font-semibold transition-colors",
      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
      active ? "border-brand text-charcoal" : "border-transparent text-charcoal/45 hover:text-charcoal/70"
    )

  const iconBtn =
    "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-cream">

      {/* ── Header + tabs: ONE sticky block, so alert banners can never push the
            tabs out of alignment (they used to sit at a hard-coded top-[72px]). ── */}
      <div className="sticky top-0 z-20 border-b border-cream-border bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Logo variant="mark" className="h-6" title="Mezzani" />
            <div className="leading-tight">
              <h1 className="text-base font-semibold text-charcoal">Waiter view</h1>
              {/* suppressHydrationWarning: counts are 0 on the server, real values on client */}
              <p className="text-xs text-charcoal/50" suppressHydrationWarning>
                {activeTables.length} active · {freeTables.length} free
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            className={cn(iconBtn, "text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal")}
          >
            <LogOut className="size-4" />
          </button>
        </div>

        <div role="tablist" aria-label="Waiter sections" className="flex">
          <button
            role="tab"
            aria-selected={tab === "tables"}
            onClick={() => setTab("tables")}
            className={tabClass(tab === "tables")}
          >
            <TableProperties className="size-4" aria-hidden />
            Tables
          </button>
          <button
            role="tab"
            aria-selected={tab === "orders"}
            onClick={() => setTab("orders")}
            className={tabClass(tab === "orders")}
          >
            <ClipboardList className="size-4" aria-hidden />
            Orders
            {readyOrders.length > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {readyOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 space-y-3 p-4 pb-10">

        {/* Alerts live in the content flow, not in the sticky header */}
        {expiringTables.length > 0 && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3">
            <AlertCircle className="size-4 shrink-0 text-amber-700" aria-hidden />
            <p className="text-sm font-medium text-amber-900">
              Table {expiringTables.map((t) => t.tableNumber).join(", ")} expiring. Extend or close.
            </p>
          </div>
        )}
        {readyOrders.length > 0 && tab === "tables" && (
          <button
            onClick={() => setTab("orders")}
            className="flex w-full items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-left"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
            <span className="text-sm font-medium text-emerald-900">
              {readyOrders.length} {readyOrders.length === 1 ? "order is" : "orders are"} ready to serve. View
            </span>
          </button>
        )}
        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <AlertCircle className="size-4 shrink-0 text-red-600" aria-hidden />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* TABLES TAB */}
        {tab === "tables" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-6 animate-spin text-charcoal/40" aria-label="Loading tables" />
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <TableProperties className="mb-3 size-10 text-charcoal/20" aria-hidden />
                <p className="text-sm font-medium text-charcoal/60">No tables found</p>
                <p className="mt-1 text-xs text-charcoal/40">Ask a manager to add tables for this branch.</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {sortedTables.map((table) => {
                  // isMounted guard: return 0 / "" on server so output matches SSR
                  const minsLeft   = isMounted ? getMinutesLeft(table.expiresAt) : 0
                  const elapsed    = isMounted ? getElapsed(table.openedAt) : ""
                  const isCritical = table.status === "expiring"
                  const isFree     = table.status === "free"

                  return (
                    <li
                      key={table.id}
                      className={cn(
                        "rounded-2xl border bg-white p-4",
                        isCritical ? "border-amber-400 ring-1 ring-amber-200" : "border-cream-border"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold tabular-nums",
                            isCritical
                              ? "bg-amber-500 text-charcoal"
                              : isFree
                              ? "bg-charcoal/6 text-charcoal/40"
                              : "bg-charcoal text-cream"
                          )}
                        >
                          {table.tableNumber}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-charcoal">Table {table.tableNumber}</p>
                            {!isFree && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  isCritical ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                )}
                              >
                                {isCritical ? `${minsLeft}m left` : "Active"}
                              </span>
                            )}
                          </div>

                          {!isFree ? (
                            <div className="mt-1.5 space-y-2">
                              <p className="flex items-center gap-1.5 text-xs text-charcoal/55">
                                <Clock className="size-3" aria-hidden />
                                Open {elapsed}
                              </p>
                              <div className="h-1 overflow-hidden rounded-full bg-charcoal/8">
                                <div
                                  className={cn("h-full rounded-full transition-all", isCritical ? "bg-amber-500" : "bg-emerald-600")}
                                  style={{ width: `${isMounted ? getProgressPct(minsLeft, table.openedAt, table.expiresAt) : 0}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-charcoal/45">Free. No active session.</p>
                          )}
                        </div>
                      </div>

                      {/* Actions: 44px touch targets, labelled */}
                      <div className="mt-3.5 flex items-center gap-2">
                        {isFree ? (
                          <button
                            onClick={() => handleActivate(table)}
                            className="h-11 flex-1 rounded-xl bg-charcoal text-sm font-medium text-cream transition-colors hover:bg-charcoal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            Start session
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setSelectedTable(table); setShowQRDialog(true) }}
                              aria-label={`Show QR code for table ${table.tableNumber}`}
                              className={cn(iconBtn, "bg-charcoal/6 text-charcoal/70 hover:bg-charcoal/10")}
                            >
                              <QrCode className="size-4" />
                            </button>
                            <button
                              onClick={() => handleExtend(table)}
                              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-charcoal/6 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <RefreshCw className="size-3.5" aria-hidden />
                              +30 min
                            </button>
                            <button
                              onClick={() => setCloseTarget(table)}
                              aria-label={`Close table ${table.tableNumber}`}
                              className={cn(iconBtn, "bg-red-50 text-red-600 hover:bg-red-100")}
                            >
                              <X className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-6 animate-spin text-charcoal/40" aria-label="Loading orders" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <ClipboardList className="mb-3 size-10 text-charcoal/20" aria-hidden />
                <p className="text-sm font-medium text-charcoal/60">No active orders</p>
                <p className="mt-1 text-xs text-charcoal/40">Orders appear here when guests place them.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {sortedOrders.map((order) => {
                  const st      = orderStatus(order.status)
                  const isReady = order.status === "ready"
                  return (
                    <li
                      key={order.id}
                      className={cn(
                        "rounded-2xl border bg-white p-4",
                        isReady ? "border-emerald-400 ring-1 ring-emerald-100" : "border-cream-border"
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-charcoal text-sm font-semibold tabular-nums text-cream">
                            {order.table_number}
                          </span>
                          <div className="leading-tight">
                            <p className="text-sm font-semibold text-charcoal">Table {order.table_number}</p>
                            <p className="mt-0.5 text-xs text-charcoal/50">
                              {isMounted ? getOrderElapsed(order.created_at) : ""}
                            </p>
                          </div>
                        </div>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", st.chip)}>
                          {isReady ? "Ready to serve" : st.label}
                        </span>
                      </div>

                      <ul className="mb-3 space-y-1">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex items-baseline gap-2 text-sm">
                            <span className="w-6 shrink-0 text-xs tabular-nums text-charcoal/45">{item.quantity}×</span>
                            <span className="text-charcoal/80">{item.name}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between gap-3 border-t border-cream-border pt-3">
                        <span className="text-base font-semibold tabular-nums text-charcoal">
                          KES {order.total.toLocaleString()}
                        </span>
                        {isReady && (
                          <button
                            onClick={() => handleMarkServed(order.id)}
                            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                          >
                            <CheckCircle2 className="size-4" aria-hidden />
                            Mark served
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {/* ── Start session dialog ── */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="mx-4 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Start session: Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label>How long should the table stay open?</Label>
              <div className="grid grid-cols-3 gap-2">
                {["60", "120", "180"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    aria-pressed={duration === d}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-medium transition-colors",
                      duration === d
                        ? "border-charcoal bg-charcoal text-cream"
                        : "border-cream-border bg-white text-charcoal/70 hover:bg-cream"
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
                className="h-11 flex-1 rounded-xl"
                onClick={() => setShowActivateDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl bg-charcoal text-cream hover:bg-charcoal/90"
                onClick={confirmActivate}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Start"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Close table confirmation ──
            One tap used to end a table's session instantly. On a busy floor that
            is easy to hit by accident, and it invalidates the guests' QR menu. ── */}
      <Dialog open={closeTarget !== null} onOpenChange={(o) => !o && setCloseTarget(null)}>
        <DialogContent className="mx-4 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Close Table {closeTarget?.tableNumber}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-charcoal/65">
            This ends the session. Guests at the table won&apos;t be able to order from their phones until you
            start a new one.
          </p>
          <div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => setCloseTarget(null)}
              disabled={actionLoading}
            >
              Keep open
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={() => closeTarget && handleClose(closeTarget)}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Close table"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── QR dialog ── */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="mx-4 max-w-sm rounded-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>QR code: Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {selectedTable && (
              <div className="rounded-2xl border border-cream-border bg-white p-4">
                <QRCodeWrapper
                  value={buildMenuUrl(selectedTable.id)}
                  size={180}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            )}
            <p className="text-center text-xs text-charcoal/55">
              Table {selectedTable?.tableNumber} · Guests scan this to see the menu
            </p>
            <Button
              className="h-11 w-full rounded-xl bg-charcoal text-cream hover:bg-charcoal/90"
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
