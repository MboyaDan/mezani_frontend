"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Plus, Search, AlertTriangle, Package,
  TrendingDown, Loader2, RefreshCw, AlertCircle,
} from "lucide-react"
import { inventoryAPI } from "@/lib/api/inventory"
import { useBranch } from "@/hooks/useBranch"
import { useToast } from "@/hooks/useToast"

interface InventoryItem {
  ID: string
  Name: string
  Stock: number
  Threshold: number
  BranchID: string
  CreatedAt: string
}

interface FormErrors {
  name?: string
  stock?: string
  threshold?: string
}

export default function InventoryPage() {
  const { branchId } = useBranch()
  const { toasts, toast } = useToast()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [editStockId, setEditStockId] = useState<string | null>(null)
  const [newStock, setNewStock] = useState("")
  const [stockError, setStockError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", stock: "", threshold: "" })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [dialogServerError, setDialogServerError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    if (!branchId) return
    try {
      setPageError(null)
      const data = await inventoryAPI.list(branchId)
      setItems(data ?? [])
    } catch (err: any) {
      setPageError(err.response?.data?.error ?? "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // ── Validate dialog form, returns true if valid ──────────────────────────
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!form.name.trim()) {
      errors.name = "Item name is required"
    }
    if (form.stock === "") {
      errors.stock = "Stock is required"
    } else if (Number(form.stock) < 0) {
      errors.stock = "Stock cannot be negative"
    }
    if (form.threshold === "") {
      errors.threshold = "Threshold is required"
    } else if (Number(form.threshold) < 0) {
      errors.threshold = "Threshold cannot be negative"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    if (!branchId) return
    setDialogServerError(null)

    if (!validateForm()) return

    setActionLoading(true)
    try {
      await inventoryAPI.create(branchId, {
        name: form.name,
        stock: Number(form.stock),
        threshold: Number(form.threshold),
      })

      const addedName = form.name
      const addedStock = form.stock
      const addedThreshold = form.threshold

      await fetchInventory()
      setShowDialog(false)
      setForm({ name: "", stock: "", threshold: "" })
      setFormErrors({})

      setTimeout(() => {
        toast("success", "Item added to inventory", `${addedName} · stock: ${addedStock} · threshold: ${addedThreshold}`)
      }, 150)

    } catch {
      setDialogServerError("Server error — please try again")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setForm({ name: "", stock: "", threshold: "" })
    setFormErrors({})
    setDialogServerError(null)
  }

  const handleUpdateStock = async (id: string) => {
    if (!branchId) return

    const stockVal = Number(newStock)
    if (newStock === "" || isNaN(stockVal)) {
      setStockError("Please enter a stock value")
      return
    }
    if (stockVal < 0) {
      setStockError("Stock cannot be negative")
      return
    }

    setStockError(null)
    setActionLoading(true)
    try {
      await inventoryAPI.setStock(branchId, id, stockVal)
      const itemName = items.find((i) => i.ID === id)?.Name ?? "Item"
      await fetchInventory()
      setEditStockId(null)
      setNewStock("")
      toast("success", "Stock updated successfully", `${itemName} → ${stockVal} units`)
    } catch {
      toast("error", "Failed to update stock", "Server error — please try again")
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = items.filter((i) =>
    i.Name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = items.filter((i) => i.Stock <= i.Threshold)
  const outOfStock = items.filter((i) => i.Stock === 0)

  const getStockStatus = (item: InventoryItem) => {
    if (item.Stock === 0) return { label: "Out of Stock", class: "bg-red-100 text-red-600 border-red-200" }
    if (item.Stock <= item.Threshold) return { label: "Low Stock", class: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "In Stock", class: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  }

  const getBarColor = (item: InventoryItem) => {
    const pct = item.Stock / (item.Threshold * 2)
    if (pct <= 0.25) return "bg-red-500"
    if (pct <= 0.5) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Inventory" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-200 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInventory}
              className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </button>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Page-level error (fetch failures only) */}
        {pageError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{pageError}</p>
          </div>
        )}

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {lowStock.length} {lowStock.length === 1 ? "item needs" : "items need"} restocking
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {lowStock.map((i) => i.Name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Items", value: items.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Low Stock", value: lowStock.length, icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Out of Stock", value: outOfStock.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-zinc-900">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-zinc-200 mb-3" />
            <p className="text-sm text-zinc-400 font-medium">No inventory items yet</p>
            <p className="text-xs text-zinc-300 mt-1">Add ingredients and supplies to track stock</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Item</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Stock Level</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Threshold</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-zinc-500 px-5 py-3">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const status = getStockStatus(item)
                    const barColor = getBarColor(item)
                    const barWidth = Math.min(
                      (item.Stock / Math.max(item.Threshold * 2, 1)) * 100,
                      100
                    )
                    return (
                      <tr
                        key={item.ID}
                        className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-zinc-900">{item.Name}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-zinc-900 w-8">
                              {item.Stock}
                            </span>
                            <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", barColor)}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-zinc-500">{item.Threshold}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full border font-medium",
                            status.class
                          )}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {editStockId === item.ID ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) => {
                                      setNewStock(e.target.value)
                                      setStockError(null)
                                    }}
                                    className={cn(
                                      "w-20 h-8 text-sm rounded-lg",
                                      stockError ? "border-red-400 focus-visible:ring-red-300" : ""
                                    )}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateStock(item.ID)}
                                    disabled={actionLoading}
                                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                                  >
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditStockId(null)
                                      setStockError(null)
                                      setNewStock("")
                                    }}
                                    className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {/* Inline stock error */}
                                {stockError && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {stockError}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditStockId(item.ID)
                                  setNewStock(String(item.Stock))
                                  setStockError(null)
                                }}
                                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Update Stock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Server error inside dialog */}
            {dialogServerError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{dialogServerError}</p>
              </div>
            )}

            {/* Item name */}
            <div className="space-y-1.5">
              <Label>Item Name</Label>
              <Input
                placeholder="e.g. Beef (kg)"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value })
                  setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
                className={cn(
                  "rounded-xl",
                  formErrors.name ? "border-red-400 focus-visible:ring-red-300" : ""
                )}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Stock + Threshold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => {
                    setForm({ ...form, stock: e.target.value })
                    setFormErrors((prev) => ({ ...prev, stock: undefined }))
                  }}
                  className={cn(
                    "rounded-xl",
                    formErrors.stock ? "border-red-400 focus-visible:ring-red-300" : ""
                  )}
                />
                {formErrors.stock && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.stock}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10"
                  value={form.threshold}
                  onChange={(e) => {
                    setForm({ ...form, threshold: e.target.value })
                    setFormErrors((prev) => ({ ...prev, threshold: undefined }))
                  }}
                  className={cn(
                    "rounded-xl",
                    formErrors.threshold ? "border-red-400 focus-visible:ring-red-300" : ""
                  )}
                />
                {formErrors.threshold && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.threshold}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={handleCloseDialog}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAdd}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast notifications — success & server errors only */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-sm animate-in slide-in-from-bottom-2",
              t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
              t.type === "error"   && "bg-red-50 border-red-200 text-red-800",
              t.type === "warning" && "bg-amber-50 border-amber-200 text-amber-800",
            )}
          >
            <span className="mt-0.5 shrink-0 font-semibold">
              {t.type === "success" ? "✓" : t.type === "warning" ? "⚠" : "✕"}
            </span>
            <div>
              <p className="font-semibold">{t.message}</p>
              {t.sub && <p className="text-xs opacity-75 mt-0.5">{t.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}