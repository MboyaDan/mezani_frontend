"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react"

const categories = ["All", "Breakfast", "Main", "Fast Food", "Drinks"]

const mockItems = [
  { id: "1", name: "Mandazi + Chai", description: "Golden fried mandazi served with hot masala chai", category: "Breakfast", price: 200, available: true, soldOut: false },
  { id: "2", name: "Chapati + Beans", description: "Soft layered chapati with spiced bean stew", category: "Breakfast", price: 250, available: true, soldOut: false },
  { id: "3", name: "Uji Power Bowl", description: "Fermented porridge with honey, nuts & banana", category: "Breakfast", price: 180, available: true, soldOut: false },
  { id: "4", name: "Ugali + Beef Stew", description: "Classic ugali with slow-cooked beef stew", category: "Main", price: 450, available: true, soldOut: false },
  { id: "5", name: "Nyama Choma + Ugali", description: "Grilled goat meat with ugali & kachumbari", category: "Main", price: 800, available: true, soldOut: false },
  { id: "6", name: "Chicken Pilau", description: "Aromatic spiced rice with tender chicken", category: "Main", price: 550, available: true, soldOut: false },
  { id: "7", name: "Beef Pilau", description: "Fragrant pilau rice with seasoned beef", category: "Main", price: 500, available: true, soldOut: false },
  { id: "8", name: "Tilapia + Ugali", description: "Whole fried tilapia with ugali & fresh salad", category: "Main", price: 650, available: true, soldOut: false },
  { id: "9", name: "Goat Stew", description: "Tender goat in aromatic Kenyan spice broth", category: "Main", price: 600, available: false, soldOut: true },
  { id: "10", name: "Beef Burger", description: "Juicy beef patty with lettuce, tomato & cheese", category: "Fast Food", price: 500, available: true, soldOut: false },
  { id: "11", name: "Chips Masala", description: "Crispy fries tossed in house masala spice blend", category: "Fast Food", price: 200, available: true, soldOut: false },
  { id: "12", name: "Fresh Mango Juice", description: "Cold-pressed Kenyan mangoes, no added sugar", category: "Drinks", price: 150, available: true, soldOut: false },
  { id: "13", name: "Masala Chai", description: "Spiced milk tea, East African style", category: "Drinks", price: 80, available: true, soldOut: false },
]

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  available: boolean
  soldOut: boolean
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(mockItems)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name: "", description: "", category: "Breakfast", price: "" })

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === "All" || item.category === activeCategory
    return matchSearch && matchCategory
  })

  const handleSave = () => {
    if (editItem) {
      setItems((prev) => prev.map((i) =>
        i.id === editItem.id
          ? { ...i, name: form.name, description: form.description, category: form.category, price: Number(form.price) }
          : i
      ))
    } else {
      setItems((prev) => [...prev, {
        id: String(Date.now()),
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        available: true,
        soldOut: false,
      }])
    }
    setShowAddDialog(false)
    setEditItem(null)
    setForm({ name: "", description: "", category: "Breakfast", price: "" })
  }

  const handleEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({ name: item.name, description: item.description, category: item.category, price: String(item.price) })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const toggleSoldOut = (id: string) => {
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, soldOut: !i.soldOut, available: i.soldOut } : i
    ))
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Menu" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-200 rounded-xl"
            />
          </div>
          <Button
            onClick={() => { setEditItem(null); setForm({ name: "", description: "", category: "Breakfast", price: "" }); setShowAddDialog(true) }}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-[#0f172a] text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Items", value: items.length },
            { label: "Available", value: items.filter((i) => i.available).length },
            { label: "Sold Out", value: items.filter((i) => i.soldOut).length },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Item</th>
                  <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-zinc-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 max-w-xs truncate">{item.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-zinc-900">
                        KES {item.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleSoldOut(item.id)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                          item.soldOut
                            ? "bg-red-100 text-red-600 border-red-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {item.soldOut ? "Sold Out" : "Available"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-900"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-zinc-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                placeholder="e.g. Nyama Choma + Ugali"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of the item"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {["Breakfast", "Main", "Fast Food", "Drinks"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Price (KES)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleSave}
              >
                {editItem ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}