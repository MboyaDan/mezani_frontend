"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import {
  TableProperties,
  ClipboardList,
  LogOut,
  Clock,
  Users,
  ChevronRight,
  QrCode,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "active" | "expiring"

interface Table {
  id: string
  tableNumber: number
  status: TableStatus
  sessionId?: string
  customerCount?: number
  expiresAt?: Date
  openedAt?: Date
  pendingOrders?: number
}

interface Order {
  id: string
  tableNumber: number
  items: { name: string; qty: number }[]
  total: number
  status: string
  time: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTables: Table[] = [
  { id: "1", tableNumber: 1, status: "active", sessionId: "s1", customerCount: 3, expiresAt: new Date(Date.now() + 95 * 60000), openedAt: new Date(Date.now() - 25 * 60000), pendingOrders: 1 },
  { id: "2", tableNumber: 2, status: "active", sessionId: "s2", customerCount: 2, expiresAt: new Date(Date.now() + 110 * 60000), openedAt: new Date(Date.now() - 10 * 60000), pendingOrders: 0 },
  { id: "3", tableNumber: 3, status: "free" },
  { id: "4", tableNumber: 4, status: "expiring", sessionId: "s4", customerCount: 5, expiresAt: new Date(Date.now() + 8 * 60000), openedAt: new Date(Date.now() - 112 * 60000), pendingOrders: 2 },
  { id: "5", tableNumber: 5, status: "free" },
  { id: "6", tableNumber: 6, status: "active", sessionId: "s6", customerCount: 4, expiresAt: new Date(Date.now() + 75 * 60000), openedAt: new Date(Date.now() - 45 * 60000), pendingOrders: 0 },
]

const mockOrders: Order[] = [
  { id: "1", tableNumber: 1, items: [{ name: "Chapati + Beans", qty: 2 }, { name: "Masala Chai", qty: 2 }], total: 660, status: "ready", time: "2m ago" },
  { id: "2", tableNumber: 4, items: [{ name: "Nyama Choma", qty: 1 }, { name: "Coca-Cola", qty: 2 }], total: 1000, status: "ready", time: "5m ago" },
  { id: "3", tableNumber: 4, items: [{ name: "Beef Burger", qty: 2 }], total: 1000, status: "pending", time: "1m ago" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const orderStatusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "New", class: "bg-orange-100 text-orange-700" },
  accepted: { label: "Accepted", class: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", class: "bg-yellow-100 text-yellow-700" },
  ready: { label: "Ready to serve", class: "bg-emerald-100 text-emerald-700" },
}

// ─── Components ───────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  const { logout } = useAuth()
  const [tab, setTab] = useState<"tables" | "orders">("tables")
  const [tables, setTables] = useState<Table[]>(mockTables)
  const [orders] = useState<Order[]>(mockOrders)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [duration, setDuration] = useState("120")
  const [, forceUpdate] = useState(0)

  // Live tick
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const readyOrders = orders.filter((o) => o.status === "ready")
  const activeTables = tables.filter((t) => t.status === "active" || t.status === "expiring")
  const expiringTables = tables.filter((t) => t.status === "expiring")

  const handleActivate = (table: Table) => {
    setSelectedTable(table)
    setShowActivateDialog(true)
  }

  const confirmActivate = () => {
    if (!selectedTable) return
    setTables((prev) => prev.map((t) =>
      t.id === selectedTable.id ? {
        ...t,
        status: "active" as TableStatus,
        sessionId: `s${t.id}`,
        customerCount: 0,
        expiresAt: new Date(Date.now() + Number(duration) * 60000),
        openedAt: new Date(),
        pendingOrders: 0,
      } : t
    ))
    setShowActivateDialog(false)
    setSelectedTable(null)
  }

  const handleExtend = (table: Table) => {
    setTables((prev) => prev.map((t) =>
      t.id === table.id && t.expiresAt
        ? { ...t, expiresAt: new Date(t.expiresAt.getTime() + 30 * 60000), status: "active" as TableStatus }
        : t
    ))
  }

  const handleClose = (table: Table) => {
    setTables((prev) => prev.map((t) =>
      t.id === table.id
        ? { ...t, status: "free" as TableStatus, sessionId: undefined, customerCount: undefined, expiresAt: undefined, openedAt: undefined, pendingOrders: undefined }
        : t
    ))
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] max-w-md mx-auto flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Waiter View</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeTables.length} active · {tables.filter((t) => t.status === "free").length} free
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Alert strip */}
        {expiringTables.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-medium text-amber-700">
              Table {expiringTables.map((t) => t.tableNumber).join(", ")} expiring soon — extend or close
            </p>
          </div>
        )}

        {readyOrders.length > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-medium text-emerald-700">
              {readyOrders.length} {readyOrders.length === 1 ? "order is" : "orders are"} ready to serve
            </p>
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
            {tables
              .sort((a, b) => {
                const order: Record<TableStatus, number> = { expiring: 0, active: 1, free: 2 }
                return order[a.status] - order[b.status] || a.tableNumber - b.tableNumber
              })
              .map((table) => {
                const minsLeft = getMinutesLeft(table.expiresAt)
                const elapsed = getElapsed(table.openedAt)
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
                      {/* Table number */}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl text-white text-lg font-bold flex items-center justify-center shrink-0",
                        isCritical ? "bg-amber-500" : table.status === "active" ? "bg-[#0f172a]" : "bg-zinc-200"
                      )}>
                        <span className={table.status === "free" ? "text-zinc-400" : "text-white"}>
                          {table.tableNumber}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-zinc-900">Table {table.tableNumber}</p>
                          {table.status !== "free" && (
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              isCritical ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {isCritical ? `⚠ ${minsLeft}m left` : "Active"}
                            </span>
                          )}
                        </div>

                        {table.status !== "free" ? (
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {table.customerCount ?? 0} guests
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {elapsed}
                              </span>
                              {(table.pendingOrders ?? 0) > 0 && (
                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-semibold">
                                  {table.pendingOrders} order{table.pendingOrders === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                            {/* Session progress */}
                            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isCritical ? "bg-amber-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min((minsLeft / 120) * 100, 100)}%` }}
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
                      {table.status === "free" && (
                        <button
                          onClick={() => handleActivate(table)}
                          className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          Start Session
                        </button>
                      )}

                      {table.status !== "free" && (
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
              })}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ClipboardList className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No orders yet</p>
                <p className="text-xs text-zinc-300 mt-1">Orders will appear here when customers place them</p>
              </div>
            ) : (
              orders
                .sort((a, b) => {
                  const order: Record<string, number> = { ready: 0, pending: 1, accepted: 2, preparing: 3 }
                  return (order[a.status] ?? 9) - (order[b.status] ?? 9)
                })
                .map((order) => {
                  const statusCfg = orderStatusConfig[order.status] ?? orderStatusConfig.pending
                  const isReady = order.status === "ready"
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
                            {order.tableNumber}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">Table {order.tableNumber}</p>
                            <p className="text-xs text-zinc-400">{order.time}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          statusCfg.class
                        )}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-400 w-4 text-xs">{item.qty}×</span>
                            <span className="text-zinc-700">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                        <span className="text-base font-bold text-zinc-900">
                          KES {order.total.toLocaleString()}
                        </span>
                        {isReady && (
                          <button className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
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
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowActivateDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-xl"
                onClick={confirmActivate}
              >
                Start
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
            <div className="w-44 h-44 bg-zinc-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-300">
              <div className="text-center">
                <QrCode className="w-10 h-10 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-400 mt-2">/menu/{selectedTable?.sessionId}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 text-center">
              Show this to customers at Table {selectedTable?.tableNumber}
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