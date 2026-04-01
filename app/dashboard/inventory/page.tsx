"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Search, AlertTriangle, Package, TrendingDown } from "lucide-react"

const mockInventory = [
  { id: "1", name: "Beef (kg)", stock: 12, threshold: 10, unit: "kg" },
  { id: "2", name: "Chicken (kg)", stock: 8, threshold: 10, unit: "kg" },
  { id: "3", name: "Ugali Flour (kg)", stock: 45, threshold: 20, unit: "kg" },
  { id: "4", name: "Cooking Oil (L)", stock: 6, threshold: 10, unit: "L" },
  { id: "5", name: "Tomatoes (kg)", stock: 3, threshold: 5, unit: "kg" },
  { id: "6", name: "Onions (kg)", stock: 18, threshold: 10, unit: "kg" },
  { id: "7", name: "Chapati Flour (kg)", stock: 22, threshold: 15, unit: "kg" },
  { id: "8", name: "Tilapia (fish)", stock: 4, threshold: 8, unit: "pcs" },
  { id: "9", name: "Coca-Cola (crates)", stock: 5, threshold: 3, unit: "crates" },
  { id: "10", name: "Milk (L)", stock: 2, threshold: 10, unit: "L" },
]

interface InventoryItem {
  id: string
  name: string
  stock: number
  threshold: number
  unit: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editStockId, setEditStockId] = useState<string | null>(null)
  const [newStock, setNewStock] = useState("")
  const [form, setForm] = useState({ name: "", stock: "", threshold: "", unit: "" })

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = items.filter((i) => i.stock <= i.threshold)
  const outOfStock = items.filter((i) => i.stock === 0)

  const handleUpdateStock = (id: string) => {
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, stock: Number(newStock) } : i
    ))
    setEditStockId(null)
    setNewStock("")
  }

  const handleAdd = () => {
    setItems((prev) => [...prev, {
      id: String(Date.now()),
      name: form.name,
      stock: Number(form.stock),
      threshold: Number(form.threshold),
      unit: form.unit,
    }])
    setShowDialog(false)
    setForm({ name: "", stock: "", threshold: "", unit: "" })
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: "Out of Stock", class: "bg-red-100 text-red-600 border-red-200" }
    if (item.stock <= item.threshold) return { label: "Low Stock", class: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "In Stock", class: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  }

  const getStockBarColor = (item: InventoryItem) => {
    const pct = item.stock / (item.threshold * 2)
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
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Alert Banner */}
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {lowStock.length} items need restocking
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {lowStock.map((i) => i.name).join(", ")}
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

        {/* Inventory Table */}
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
                  const barColor = getStockBarColor(item)
                  const barWidth = Math.min((item.stock / (item.threshold * 2)) * 100, 100)
                  return (
                    <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-zinc-900 w-16">
                            {item.stock} {item.unit}
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
                        <span className="text-sm text-zinc-500">
                          {item.threshold} {item.unit}
                        </span>
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
                          {editStockId === item.id ? (
                            <>
                              <Input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                className="w-20 h-8 text-sm rounded-lg"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateStock(item.id)}
                                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditStockId(null)}
                                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditStockId(item.id); setNewStock(String(item.stock)) }}
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
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                placeholder="e.g. Beef (kg)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="kg"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAdd}
              >
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}