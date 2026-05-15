"use client"
import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Plus, Clock, Users, QrCode, X, RefreshCw,
  Loader2, AlertCircle, Download, Printer,
} from "lucide-react"
import { tablesAPI, sessionsAPI } from "@/lib/api/tables"
import { useBranch } from "@/hooks/useBranch"
import QRCode from "react-qr-code"

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "active" | "expiring"

interface Table {
  id: string
  tableNumber: number
  status: TableStatus
  sessionId?: string
  expiresAt?: Date
  createdAt?: Date
}

interface RawTable {
  id: string
  table_number: number
  status: string
  session_id?: string
  expires_at?: string
  created_at?: string
}

interface ApiError {
  response?: { data?: { error?: string } }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMinutesLeft(expiresAt?: Date): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
}

function getElapsed(createdAt?: Date): string {
  if (!createdAt) return ""
  const mins = Math.floor((Date.now() - createdAt.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as ApiError
  return apiErr?.response?.data?.error ?? fallback
}

/**
 * The QR code always encodes a permanent table-scoped URL.
 * The server resolves the active session when the customer hits this route.
 * This means the physical QR card printed on the table never needs replacing.
 *
 * Flow: customer scans → /menu/{tableId} → server checks active session
 *   → session found  → show menu + ordering
 *   → no session     → show "waiting for staff" screen (auto-polls)
 */
function buildMenuUrl(tableId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return `${base}/menu/${tableId}`
}

/**
 * Serialise an SVG element and download it as a 400×400 PNG.
 * Uses unescape+encodeURIComponent so btoa handles non-Latin characters
 * (e.g. restaurant names with accents) without throwing.
 */
function downloadSvgAsPng(svg: SVGElement, filename: string) {
  const SIZE = 400
  const svgData = new XMLSerializer().serializeToString(svg)
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  const img = new Image()
  img.onload = () => {
    ctx?.drawImage(img, 0, 0, SIZE, SIZE)
    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/png")
    link.click()
  }
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
}

// ─── Status config ────────────────────────────────────────────────────────────

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
}

// ─── useIsMounted ─────────────────────────────────────────────────────────────

function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

// ─── QRDialog ─────────────────────────────────────────────────────────────────

/**
 * Extracted into its own component for two reasons:
 * 1. Keeps the download handler co-located with the QR DOM node it targets.
 * 2. Allows early return when table is null without hook ordering issues.
 */
function QRDialog({
  open,
  table,
  onClose,
}: {
  open: boolean
  table: Table | null
  onClose: () => void
}) {
  if (!table) return null

  const url = buildMenuUrl(table.id)
  const isInactive = table.status === "free"

  const handleDownload = () => {
    const svg = document.querySelector("#qr-dialog-code svg") as SVGElement | null
    if (!svg) return
    downloadSvgAsPng(svg, `table-${table.tableNumber}-qr.png`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — Table {table.tableNumber}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/*
            Contextual hint when no session is active.
            We show it here (not block it) because printing QR codes
            before activating sessions is the intended workflow —
            laminate first, activate when guests arrive.
          */}
          {isInactive && (
            <div className="w-full flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">No active session.</span> Print & place this QR now.
                Customers will see a waiting screen until you start a session for this table.
              </p>
            </div>
          )}

          {/* QR code — encodes tableId, never the sessionId */}
          <div id="qr-dialog-code" className="bg-white p-4 rounded-2xl border border-zinc-200">
            <QRCode
              value={url}
              size={180}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>

          <p className="text-xs text-zinc-500 text-center">
            Table {table.tableNumber} · Permanent QR — safe to laminate
          </p>
          <p className="text-xs font-mono text-zinc-400 break-all px-2 text-center">{url}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0f172a] text-white text-sm font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <Button
              className="flex-1 rounded-xl border border-zinc-200"
              variant="outline"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── TableCard ────────────────────────────────────────────────────────────────

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
  const [tick, setTick] = useState(0)
  const mounted = useIsMounted()
  const config = statusConfig[table.status]
  const minsLeft = mounted ? getMinutesLeft(table.expiresAt) : 0
  const elapsed = mounted ? getElapsed(table.createdAt) : ""
  const isCritical = mounted && table.status === "expiring" && minsLeft <= 10
  void tick

  useEffect(() => {
    if (table.status === "free") return
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [table.status])

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-150 flex flex-col",
        config.card,
        isCritical && "ring-2 ring-amber-400 ring-offset-1",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", config.dot)} />
          <span className="text-base font-bold text-zinc-900">Table {table.tableNumber}</span>
        </div>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.badge)}>
          {config.label}
        </span>
      </div>

      {/* Session timer (only when session is live) */}
      {table.status !== "free" && (
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {mounted ? `${elapsed} open` : ""}
            </span>
            <span className={cn("text-xs font-semibold", isCritical ? "text-amber-600" : "text-zinc-500")}>
              {mounted ? (isCritical ? `⚠ ${minsLeft}m left` : `${minsLeft}m remaining`) : ""}
            </span>
          </div>
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", isCritical ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: mounted ? `${Math.min((minsLeft / 120) * 100, 100)}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {table.status === "free" && (
        <p className="text-xs text-zinc-400 mb-4">No active session</p>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 mt-auto">
        {/*
          QR button is ALWAYS shown — free or active.
          Owners print QR codes before activating sessions.
          The QR encodes tableId, not sessionId, so it never expires.
        */}
        <button
          onClick={() => onShowQR(table)}
          title="Show QR code"
          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>

        {table.status === "free" ? (
          <button
            onClick={() => onActivate(table)}
            className="flex-1 text-xs font-semibold bg-[#0f172a] hover:bg-zinc-800 text-white py-2 rounded-xl transition-colors"
          >
            Start Session
          </button>
        ) : (
          <>
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
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const { branchId } = useBranch()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [duration, setDuration] = useState("120")
  const [newTableNumber, setNewTableNumber] = useState("")
  const [filter, setFilter] = useState<"all" | TableStatus>("all")
  const [actionLoading, setActionLoading] = useState(false)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const fetchTables = useCallback(async () => {
    if (!branchId) return
    try {
      setError(null)
      const data = await tablesAPI.list(branchId) as unknown as RawTable[]
      setTables(data.map((t) => ({
        id: t.id,
        tableNumber: t.table_number,
        status: t.status as TableStatus,
        sessionId: t.session_id,
        expiresAt: t.expires_at ? new Date(t.expires_at) : undefined,
        createdAt: t.created_at ? new Date(t.created_at) : undefined,
      })))
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to load tables"))
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchTables()
    const t = setInterval(fetchTables, 30000)
    return () => clearInterval(t)
  }, [fetchTables])

  /**
   * Bulk QR download using the `qrcode` npm package.
   * This avoids having to render React components imperatively.
   * Each QR is generated as a canvas data URL and downloaded sequentially
   * with a 400ms gap so browsers don't suppress the downloads.
   *
   * Required: npm install qrcode @types/qrcode
   */
  const handleBulkDownload = async () => {
    if (tables.length === 0) return
    setBulkDownloading(true)
    try {
      const QRCodeGen = await import("qrcode")
      for (const table of tables) {
        const dataUrl = await QRCodeGen.default.toDataURL(buildMenuUrl(table.id), {
          width: 400,
          margin: 2,
        })
        const link = document.createElement("a")
        link.download = `table-${table.tableNumber}-qr.png`
        link.href = dataUrl
        link.click()
        await new Promise((r) => setTimeout(r, 400))
      }
    } catch {
      setError("Bulk download failed. Run: npm install qrcode @types/qrcode")
    } finally {
      setBulkDownloading(false)
    }
  }

  // ── Session handlers ─────────────────────────────────────────────────────────

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
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to start session"))
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

const handleAddTable = async () => {
  if (!newTableNumber || !branchId) return
  setActionLoading(true)
  try {
    await tablesAPI.create(branchId, Number(newTableNumber))
    await fetchTables()
    setShowAddDialog(false)
    setNewTableNumber("")
  } catch (err: unknown) {
    const raw = extractErrorMessage(err, "")
    if (raw.includes("unique_table_per_branch") || raw.includes("23505")) {
      setError(`Table ${newTableNumber} already exists in this branch`)
    } else {
      setError(raw || "Failed to add table")
    }
  } finally {
    setActionLoading(false)
  }
}

  // ── Derived state ────────────────────────────────────────────────────────────

  const counts = {
    all: tables.length,
    free: tables.filter((t) => t.status === "free").length,
    active: tables.filter((t) => t.status === "active").length,
    expiring: tables.filter((t) => t.status === "expiring").length,
  }

  const filtered = filter === "all" ? tables : tables.filter((t) => t.status === filter)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Tables" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "free", "active", "expiring"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  filter === s
                    ? "bg-[#0f172a] text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                )}
              >
                {s === "all" ? "All" : s}
                <span className={cn("ml-1.5 font-bold", filter === s ? "text-white/70" : "text-zinc-400")}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTables}
              title="Refresh"
              className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </button>

            {/*
              Print All QRs — available as long as tables exist, regardless of
              session state. Owner can print all QR codes on day one and laminate
              them before any sessions have ever been started.
            */}
            {tables.length > 0 && (
              <button
                onClick={handleBulkDownload}
                disabled={bulkDownloading}
                title="Download QR codes for all tables"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-600 disabled:opacity-50"
              >
                {bulkDownloading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Printer className="w-4 h-4" />
                }
                {bulkDownloading ? "Generating…" : "Print All QRs"}
              </button>
            )}

            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Expiring alert */}
        {counts.expiring > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              {counts.expiring} {counts.expiring === 1 ? "table is" : "tables are"} expiring soon
            </span>
            <span className="text-xs text-amber-600">— extend or close to free up</span>
          </div>
        )}

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

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No tables yet</p>
            <p className="text-xs text-zinc-400 mt-1">Add your first table to get started</p>
          </div>
        )}

        {/* Table grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered
              .sort((a, b) => {
                const order: Record<TableStatus, number> = { expiring: 0, active: 1, free: 2 }
                return order[a.status] - order[b.status] || a.tableNumber - b.tableNumber
              })
              .map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onActivate={handleActivate}
                  onExtend={handleExtend}
                  onClose={handleClose}
                  onShowQR={(t) => { setSelectedTable(t); setShowQRDialog(true) }}
                />
              ))}
          </div>
        )}
      </div>

      {/* QR dialog — session-independent */}
      <QRDialog
        open={showQRDialog}
        table={selectedTable}
        onClose={() => setShowQRDialog(false)}
      />

      {/* Activate dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
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
                      "py-2 rounded-xl text-sm font-medium border transition-all",
                      duration === d
                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50",
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
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-xl"
                onClick={confirmActivate}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add table dialog */}
  {/* Add table dialog */}
<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
  <DialogContent className="rounded-2xl max-w-sm">
    <DialogHeader>
      <DialogTitle>Add Table</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 mt-2">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label>Table Number</Label>
        <Input
          type="number"
          placeholder="e.g. 13"
          value={newTableNumber}
          onChange={(e) => {
            setNewTableNumber(e.target.value)
            setError(null) // clear error when user starts typing
          }}
          className="rounded-xl"
        />
      </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowAddDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAddTable}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Table"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}