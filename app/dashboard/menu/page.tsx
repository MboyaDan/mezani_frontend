"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Search, Pencil, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { menuAPI } from "@/lib/api/menu"
import { useBranch } from "@/hooks/useBranch"

// ── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: string
  description: string
  category_id: string
  price: number
  available: boolean
  sold_out: boolean
  is_special: boolean
}

interface Category {
  category_id: string
  category_name: string
  display_order: number
  items: MenuItem[]
}

interface FlatItem extends MenuItem {
  categoryName: string
}

interface ItemFieldErrors {
  name?: string
  price?: string
  categoryId?: string
}

interface CategoryFieldErrors {
  name?: string
  order?: string
}

type ApiError = {
  response?: { data?: { error?: string } }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { branchId } = useBranch()

  const [categories, setCategories]         = useState<Category[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [search, setSearch]                 = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [actionLoading, setActionLoading]   = useState(false)
  const [menuId, setMenuId]                 = useState<string | null>(null)

  // dialogs
  const [showAddDialog, setShowAddDialog]           = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editItem, setEditItem]                     = useState<FlatItem | null>(null)

  // forms
  const [form, setForm] = useState({ name: "", description: "", categoryId: "", price: "" })
  const [categoryForm, setCategoryForm] = useState({ name: "", order: "1" })

  // validation
  const [itemFieldErrors, setItemFieldErrors]         = useState<ItemFieldErrors>({})
  const [categoryFieldErrors, setCategoryFieldErrors] = useState<CategoryFieldErrors>({})

  // ── Derived ────────────────────────────────────────────────────────────────

  const flatItems: FlatItem[] = categories.flatMap((cat) =>
    (cat.items ?? []).map((item) => ({ ...item, categoryName: cat.category_name ?? "" }))
  )

  const filtered = flatItems.filter((item) => {
    const matchSearch = (item.name ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCat    = activeCategory === "All" || item.categoryName === activeCategory
    return matchSearch && matchCat
  })

  const categoryNames = ["All", ...categories.map((c) => c.category_name)]

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMenu = useCallback(async () => {
    if (!branchId) return
    try {
      setError(null)
      const menus = await menuAPI.getByBranch(branchId)
      if (!menus?.length) { setLoading(false); return }

      const menu = menus[0]
      setMenuId(menu.ID)
      const full = await menuAPI.getFull(menu.ID)
      setCategories(full)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setError(apiErr?.response?.data?.error ?? "Failed to load menu")
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  // ── Create menu ────────────────────────────────────────────────────────────

  const handleCreateMenu = async () => {
    if (!branchId) return
    setActionLoading(true)
    try {
      const menu = await menuAPI.createMenu(branchId)
      setMenuId(menu.ID)
      await fetchMenu()
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setError(apiErr?.response?.data?.error ?? "Failed to create menu")
    } finally {
      setActionLoading(false)
    }
  }

  // ── Category validation + create ───────────────────────────────────────────

  const validateCategory = (): boolean => {
    const errors: CategoryFieldErrors = {}
    if (!categoryForm.name.trim()) errors.name = "Category name is required"
    const n = Number(categoryForm.order)
    if (!categoryForm.order) errors.order = "Display order is required"
    else if (isNaN(n) || n < 1) errors.order = "Order must be a positive number"
    setCategoryFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCategory = async () => {
    if (!menuId || !validateCategory()) return
    setActionLoading(true)
    try {
      await menuAPI.createCategory(menuId, categoryForm.name, Number(categoryForm.order))
      await fetchMenu()
      setShowCategoryDialog(false)
      setCategoryForm({ name: "", order: "1" })
      setCategoryFieldErrors({})
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setError(apiErr?.response?.data?.error ?? "Failed to add category")
    } finally {
      setActionLoading(false)
    }
  }

  // ── Item validation + save ─────────────────────────────────────────────────

  const validateItem = (): boolean => {
    const errors: ItemFieldErrors = {}
    if (!editItem) {
      if (!form.name.trim()) errors.name = "Item name is required"
      if (!form.categoryId)  errors.categoryId = "Please select a category"
    }
    if (!form.price) {
      errors.price = "Price is required"
    } else if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      errors.price = "Price must be a positive number"
    }
    setItemFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveItem = async () => {
    if (actionLoading || !validateItem()) return
    setActionLoading(true)

    try {
      if (editItem) {
        // edit — only price update is supported
        await menuAPI.updatePrice(editItem.id, Number(form.price))
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((i) =>
              i.id === editItem.id ? { ...i, price: Number(form.price) } : i
            ),
          }))
        )
      } else {
        // create with optimistic UI
        const tempId = crypto.randomUUID()
        const optimistic: MenuItem = {
          id: tempId,
          name: form.name,
          description: form.description,
          category_id: form.categoryId,
          price: Number(form.price),
          available: true,
          sold_out: false,
          is_special: false,
        }

        setCategories((prev) =>
          prev.map((cat) =>
            cat.category_id === form.categoryId
              ? { ...cat, items: [...(cat.items ?? []), optimistic] }
              : cat
          )
        )

        try {
          const created = await menuAPI.createItem(
            form.categoryId, form.name, form.description, Number(form.price)
          )
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              items: cat.items.map((i) => (i.id === tempId ? created : i)),
            }))
          )
        } catch {
          // rollback
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              items: cat.items.filter((i) => i.id !== tempId),
            }))
          )
          throw new Error("Failed to create item")
        }
      }

      setShowAddDialog(false)
      setEditItem(null)
      setForm({ name: "", description: "", categoryId: "", price: "" })
      setItemFieldErrors({})
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setError(apiErr?.response?.data?.error ?? "Failed to save item")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (item: FlatItem) => {
    setEditItem(item)
    setItemFieldErrors({})
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
      categoryId: item.category_id ?? "",
      price: String(item.price ?? ""),
    })
    setShowAddDialog(true)
  }

  // ── Toggle sold-out (optimistic, constraint-safe) ──────────────────────────

  const handleToggleSoldOut = async (item: FlatItem) => {
    if (actionLoading) return
    const newSoldOut = !item.sold_out

    // Optimistic update — when marking sold out, also flip available to false
    // to respect DB check constraint: NOT (available=true AND sold_out=true)
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((i) =>
          i.id === item.id
            ? { ...i, sold_out: newSoldOut, available: newSoldOut ? false : i.available }
            : i
        ),
      }))
    )

    try {
      if (newSoldOut) {
        await menuAPI.setSoldOut(item.id)
      } else {
        await menuAPI.setAvailable(item.id)
      }
    } catch {
      // rollback to original state
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((i) =>
            i.id === item.id
              ? { ...i, sold_out: item.sold_out, available: item.available }
              : i
          ),
        }))
      )
      setError("Failed to update item status")
    }
  }

  // ── Empty state — no menu yet ──────────────────────────────────────────────

  if (!loading && !menuId) {
    return (
      <div className="flex flex-col flex-1 bg-[#F8FAFC]">
        <Topbar title="Menu" />
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-zinc-700">No menu set up yet</p>
            <p className="text-xs text-zinc-400">Create a menu to start adding items</p>
          </div>
          <Button
            onClick={handleCreateMenu}
            disabled={actionLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Menu"}
          </Button>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────

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
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMenu}
              className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </button>
            <Button
              variant="outline"
              onClick={() => { setCategoryFieldErrors({}); setShowCategoryDialog(true) }}
              className="rounded-xl border-zinc-200"
            >
              Add Category
            </Button>
            <Button
              onClick={() => {
                setEditItem(null)
                setItemFieldErrors({})
                setForm({ name: "", description: "", categoryId: categories[0]?.category_id ?? "", price: "" })
                setShowAddDialog(true)
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryNames.map((cat) => (
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Items",  value: flatItems.length },
            { label: "Available",    value: flatItems.filter((i) => i.available && !i.sold_out).length },
            { label: "Sold Out",     value: flatItems.filter((i) => i.sold_out).length },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-zinc-400">No items found</p>
            <p className="text-xs text-zinc-300 mt-1">
              {search ? "Try a different search" : "Add your first menu item"}
            </p>
          </div>
        )}

        {/* Items table */}
        {!loading && filtered.length > 0 && (
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
                    <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 max-w-xs truncate">{item.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full font-medium">
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-zinc-900">
                          KES {(item.price ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleSoldOut(item)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                            item.sold_out
                              ? "bg-red-100 text-red-600 border-red-200"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {item.sold_out ? "Sold Out" : "Available"}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Add / Edit Item Dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            {!editItem && (
              <>
                {/* Name */}
                <div className="space-y-1.5">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g. Nyama Choma + Ugali"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      if (itemFieldErrors.name) setItemFieldErrors((p) => ({ ...p, name: undefined }))
                    }}
                    className={cn("rounded-xl", itemFieldErrors.name && "border-red-400 focus-visible:ring-red-300")}
                  />
                  {itemFieldErrors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {itemFieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Description <span className="text-zinc-400 font-normal">(optional)</span></Label>
                  <Input
                    placeholder="Brief description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => {
                      setForm({ ...form, categoryId: e.target.value })
                      if (itemFieldErrors.categoryId) setItemFieldErrors((p) => ({ ...p, categoryId: undefined }))
                    }}
                    className={cn(
                      "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300",
                      itemFieldErrors.categoryId ? "border-red-400" : "border-zinc-200"
                    )}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                  {itemFieldErrors.categoryId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {itemFieldErrors.categoryId}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Price */}
            <div className="space-y-1.5">
              <Label>Price (KES)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: e.target.value })
                  if (itemFieldErrors.price) setItemFieldErrors((p) => ({ ...p, price: undefined }))
                }}
                className={cn("rounded-xl", itemFieldErrors.price && "border-red-400 focus-visible:ring-red-300")}
              />
              {itemFieldErrors.price && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {itemFieldErrors.price}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setShowAddDialog(false); setItemFieldErrors({}) }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleSaveItem}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : editItem ? "Save Changes" : "Add Item"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Category Dialog ── */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            <div className="space-y-1.5">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Main Dishes"
                value={categoryForm.name}
                onChange={(e) => {
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                  if (categoryFieldErrors.name) setCategoryFieldErrors((p) => ({ ...p, name: undefined }))
                }}
                className={cn("rounded-xl", categoryFieldErrors.name && "border-red-400 focus-visible:ring-red-300")}
              />
              {categoryFieldErrors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {categoryFieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={categoryForm.order}
                onChange={(e) => {
                  setCategoryForm({ ...categoryForm, order: e.target.value })
                  if (categoryFieldErrors.order) setCategoryFieldErrors((p) => ({ ...p, order: undefined }))
                }}
                className={cn("rounded-xl", categoryFieldErrors.order && "border-red-400 focus-visible:ring-red-300")}
              />
              {categoryFieldErrors.order && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {categoryFieldErrors.order}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setShowCategoryDialog(false); setCategoryFieldErrors({}) }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAddCategory}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}