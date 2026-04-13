"use client"
import { useState, useEffect } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Users, Shield, ChefHat, Coffee, Loader2, AlertCircle } from "lucide-react"
import { staffAPI } from "@/lib/api/staff"
import { branchesAPI } from "@/lib/api/branches"
import { Branch } from "@/types"

const roleConfig: Record<string, { color: string; bg: string; icon: any }> = {
  manager: { color: "text-blue-700", bg: "bg-blue-100", icon: Shield },
  waiter: { color: "text-emerald-700", bg: "bg-emerald-100", icon: Coffee },
  kitchen: { color: "text-orange-700", bg: "bg-orange-100", icon: ChefHat },
  cashier: { color: "text-violet-700", bg: "bg-violet-100", icon: Users },
}



interface FieldErrors {
  name?: string
  email?: string
  password?: string
  branch_id?: string
}

export default function StaffPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "waiter", branch_id: "",
  })

useEffect(() => {
  branchesAPI.list().then((data) => {
    setBranches(data)
    if (data.length > 0) {
      setForm((prev) => ({ ...prev, branch_id: data[0].ID }))
    }
  }).catch(() => {})
}, [])

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (!form.name.trim()) errors.name = "Full name is required"
    if (!form.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address"
    }
    if (!form.password) {
      errors.password = "Password is required"
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }
    if (!form.branch_id) errors.branch_id = "Please select a branch"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Clear a field's error as the user types
  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAdd = async () => {
    if (!validate()) return
    setActionLoading(true)
    setError(null)
    try {
      await staffAPI.create(form)
      setSuccess(true)
      setShowDialog(false)
      setForm({ name: "", email: "", password: "", role: "waiter", branch_id: branches[0]?.ID ?? "" })
      setFieldErrors({})
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const raw = err.response?.data?.error ?? ""
      if (raw.includes("duplicate key") || raw.includes("staff_users_email_key")) {
        setFieldErrors({ email: "A staff member with this email already exists." })
      } else {
        setError(raw || "Failed to create staff member")
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setFieldErrors({})
    setError(null)
    setShowDialog(true)
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Staff" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">Manage your restaurant staff</p>
          <Button
            onClick={handleOpenDialog}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </Button>
        </div>

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-700 font-medium">
              ✅ Staff member created successfully
            </p>
          </div>
        )}

        {/* Page-level error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info card */}
        <Card className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-1">Staff Roles</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {Object.entries(roleConfig).map(([role, config]) => {
                const Icon = config.icon
                return (
                  <div key={role} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className={cn("text-xs font-semibold capitalize", config.color)}>{role}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 space-y-1.5">
              {[
                { role: "manager", desc: "Menu, reports, tables" },
                { role: "waiter", desc: "Create orders, view menu" },
                { role: "kitchen", desc: "View & update order status" },
                { role: "cashier", desc: "View orders, close bills" },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium capitalize text-zinc-700 w-16">{r.role}</span>
                  <span>— {r.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Note about staff listing */}
        <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500">
            Staff listing coming soon. Use the Add Staff button to create new staff members.
            Each staff member receives login credentials via email.
          </p>
        </div>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. James Ochieng"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={cn("rounded-xl", fieldErrors.name && "border-red-400 focus-visible:ring-red-300")}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="james@restaurant.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={cn("rounded-xl", fieldErrors.email && "border-red-400 focus-visible:ring-red-300")}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={cn("rounded-xl", fieldErrors.password && "border-red-400 focus-visible:ring-red-300")}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Role & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {["manager", "waiter", "kitchen", "cashier"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <select
                  value={form.branch_id}
                  onChange={(e) => handleChange("branch_id", e.target.value)}
                  className={cn(
                    "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300",
                    fieldErrors.branch_id ? "border-red-400" : "border-zinc-200"
                  )}
                >
                  {branches.map((b) => (
                    <option key={b.ID} value={b.ID}>{b.Name}</option>
                  ))}
                </select>
                {fieldErrors.branch_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.branch_id}
                  </p>
                )}
              </div>
            </div>

            {/* General API error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAdd}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}