"use client"
import { useState, useEffect } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Clock, Users, QrCode, X, RefreshCw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "active" | "expiring" | "closed"

interface Table {
  id: string
  tableNumber: number
  status: TableStatus
  sessionId?: string
  customerCount?: number
  expiresAt?: Date
  openedAt?: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMinutesLeft(expiresAt?: Date): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
}

function getElapsed(openedAt?: Date): string {
  if (!openedAt) return ""
  const mins = Math.floor((Date.now() - openedAt.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const statusConfig: Record<TableStatus, {
  label: string
  dot: string
  card: string
  badge: string
}> = {
  free: {
    label: "Free",
    dot: "bg-zinc-300",
    card: "border-zinc-200 bg-white hover:border-zinc-300",
    badge: "bg-zinc-100 text-zinc-500",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300",
    badge: "bg-emerald-100 text-emerald-700",
  },
  expiring: {
    label: "Expiring",
    dot: "bg-amber-500 animate-pulse",
    card: "border-amber-300 bg-amber-50/40 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  closed: {
    label: "Closed",
    dot: "bg-zinc-200",
    card: "border-zinc-100 bg-zinc-50 opacity-60",
    badge: "bg-zinc-100 text-zinc-400",
  },
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTables: Table[] = [
  { id: "1", tableNumber: 1, status: "active", sessionId: "s1", customerCount: 3, expiresAt: new Date(Date.now() + 95 * 60000), openedAt: new Date(Date.now() - 25 * 60000) },
  { id: "2", tableNumber: 2, status: "active", sessionId: "s2", customerCount: 2, expiresAt: new Date(Date.now() + 110 * 60000), openedAt: new Date(Date.now() - 10 * 60000) },
  { id: "3", tableNumber: 3, status: "free" },
  { id: "4", tableNumber: 4, status: "active", sessionId: "s4", customerCount: 5, expiresAt: new Date(Date.now() + 18 * 60000), openedAt: new Date(Date.now() - 102 * 60000) },
  { id: "5", tableNumber: 5, status: "expiring", sessionId: "s5", customerCount: 2, expiresAt: new Date(Date.now() + 8 * 60000), openedAt: new Date(Date.now() - 112 * 60000) },
  { id: "6", tableNumber: 6, status: "free" },
  { id: "7", tableNumber: 7, status: "active", sessionId: "s7", customerCount: 4, expiresAt: new Date(Date.now() + 75 * 60000), openedAt: new Date(Date.now() - 45 * 60000) },
  { id: "8", tableNumber: 8, status: "free" },
  { id: "9", tableNumber: 9, status: "closed" },
  { id: "10", tableNumber: 10, status: "active", sessionId: "s10", customerCount: 1, expiresAt: new Date(Date.now() + 55 * 60000), openedAt: new Date(Date.now() - 65 * 60000) },
  { id: "11", tableNumber: 11, status: "free" },
  { id: "12", tableNumber: 12, status: "expiring", sessionId: "s12", customerCount: 3, expiresAt: new Date(Date.now() + 5 * 60000), openedAt: new Date(Date.now() - 115 * 60000) },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TableCard({
  table,
  onActivate,
  onExtend,
  onClose,
  onShowQR,
}: {
  table: Table
  onActivate: (t: Table) => void
  onExtend: (t: Table) => void
  onClose: (t: Table) => void
  onShowQR: (t: Table) => void
}) {
  const [, forceUpdate] = useState(0)
  const config = statusConfig[table.status]
  const minsLeft = getMinutesLeft(table.expiresAt)
  const elapsed = getElapsed(table.openedAt)
  const isCritical = table.status === "expiring" && minsLeft <= 10

  // Live tick for expiring tables
  useEffect(() => {
    if (table.status !== "active" && table.status !== "expiring") return
    const t = setInterval(() => forceUpdate((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [table.status])

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all duration-150 cursor-default",
      config.card,
      isCritical && "ring-2 ring-amber-400 ring-offset-1"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", config.dot)} />
          <span className="text-base font-bold text-zinc-900">
            Table {table.tableNumber}
          </span>
        </div>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          config.badge
        )}>
          {config.label}
        </span>
      </div>

      {/* Session info */}
      {(table.status === "active" || table.status === "expiring") && (
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {table.customerCount ?? 0} {table.customerCount === 1 ? "guest" : "guests"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed} open
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs font-semibold",
              isCritical ? "text-amber-600" : "text-zinc-500"
            )}>
              {isCritical ? `⚠ ${minsLeft}m left` : `${minsLeft}m remaining`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isCritical ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min((minsLeft / 120) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state for free table */}
      {table.status === "free" && (
        <p className="text-xs text-zinc-400 mb-4">No active session</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {table.status === "free" && (
          <button
            onClick={() => onActivate(table)}
            className="flex-1 text-xs font-semibold bg-[#0f172a] hover:bg-zinc-800 text-white py-2 rounded-xl transition-colors"
          >
            Start Session
          </button>
        )}

        {(table.status === "active" || table.status === "expiring") && (
          <>
            <button
              onClick={() => onShowQR(table)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onExtend(table)}
              className="flex-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Extend
            </button>
            <button
              onClick={() => onClose(table)}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Close Session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {table.status === "closed" && (
          <button
            onClick={() => onActivate(table)}
            className="flex-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(mockTables)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [duration, setDuration] = useState("120")
  const [newTableNumber, setNewTableNumber] = useState("")
  const [filter, setFilter] = useState<"all" | TableStatus>("all")

  const counts = {
    all: tables.length,
    free: tables.filter((t) => t.status === "free").length,
    active: tables.filter((t) => t.status === "active").length,
    expiring: tables.filter((t) => t.status === "expiring").length,
    closed: tables.filter((t) => t.status === "closed").length,
  }

  const filtered = filter === "all" ? tables : tables.filter((t) => t.status === filter)

  const handleActivate = (table: Table) => {
    setSelectedTable(table)
    setShowActivateDialog(true)
  }

  const confirmActivate = () => {
    if (!selectedTable) return
    setTables((prev) => prev.map((t) =>
      t.id === selectedTable.id ? {
        ...t,
        status: "active",
        sessionId: `s${t.id}`,
        customerCount: 0,
        expiresAt: new Date(Date.now() + Number(duration) * 60000),
        openedAt: new Date(),
      } : t
    ))
    setShowActivateDialog(false)
    setSelectedTable(null)
    setDuration("120")
  }

  const handleExtend = (table: Table) => {
    setTables((prev) => prev.map((t) =>
      t.id === table.id && t.expiresAt
        ? { ...t, expiresAt: new Date(t.expiresAt.getTime() + 30 * 60000), status: "active" }
        : t
    ))
  }

  const handleClose = (table: Table) => {
    setTables((prev) => prev.map((t) =>
      t.id === table.id
        ? { ...t, status: "closed", sessionId: undefined, customerCount: undefined, expiresAt: undefined, openedAt: undefined }
        : t
    ))
  }

  const handleShowQR = (table: Table) => {
    setSelectedTable(table)
    setShowQRDialog(true)
  }

  const handleAddTable = () => {
    if (!newTableNumber) return
    setTables((prev) => [...prev, {
      id: String(Date.now()),
      tableNumber: Number(newTableNumber),
      status: "free",
    }])
    setShowAddDialog(false)
    setNewTableNumber("")
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Tables" />

      <div className="p-6 space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "free", "active", "expiring", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  filter === s
                    ? "bg-[#0f172a] text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {s === "all" ? "All" : s}
                <span className={cn(
                  "ml-1.5 font-bold",
                  filter === s ? "text-white/70" : "text-zinc-400"
                )}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </Button>
        </div>

        {/* Expiring alert */}
        {counts.expiring > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-600 text-sm font-semibold">
              ⚠ {counts.expiring} {counts.expiring === 1 ? "table is" : "tables are"} expiring soon
            </span>
            <span className="text-xs text-amber-600">
              — extend sessions or close to free up
            </span>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No {filter} tables</p>
            <p className="text-xs text-zinc-400 mt-1">
              {filter === "free" ? "All tables are currently occupied" : "Nothing to show here"}
            </p>
          </div>
        )}

        {/* Table Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered
            .sort((a, b) => {
              const order: Record<TableStatus, number> = { expiring: 0, active: 1, free: 2, closed: 3 }
              return order[a.status] - order[b.status] || a.tableNumber - b.tableNumber
            })
            .map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onActivate={handleActivate}
                onExtend={handleExtend}
                onClose={handleClose}
                onShowQR={handleShowQR}
              />
            ))}
        </div>
      </div>

      {/* Activate Session Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Start Session — Table {selectedTable?.tableNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Session Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {["60", "120", "180"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "py-2 rounded-xl text-sm font-medium border transition-all",
                      duration === d
                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {Number(d) / 60}h
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-xl"
                  placeholder="Custom minutes"
                />
                <span className="text-sm text-zinc-500 shrink-0">min</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowActivateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-xl"
                onClick={confirmActivate}
              >
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {/* QR Placeholder — replace with real QR library */}
            <div className="w-48 h-48 bg-zinc-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-300">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-400 mt-2">
                  /menu/{selectedTable?.sessionId}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 text-center">
              Customers scan this to view the menu and place orders for Table {selectedTable?.tableNumber}
            </p>
            <Button
              className="w-full bg-[#0f172a] hover:bg-zinc-800 text-white rounded-xl"
              onClick={() => setShowQRDialog(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input
                type="number"
                placeholder="e.g. 13"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAddTable}
              >
                Add Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}