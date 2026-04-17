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
  Plus, Users, Shield, ChefHat, Coffee,
  Loader2, AlertCircle, Trash2, RefreshCw
} from "lucide-react"
import { staffAPI } from "@/lib/api/staff"
import { branchesAPI } from "@/lib/api/branches"
import { useBranch } from "@/hooks/useBranch"
import { Branch } from "@/types"

const roleConfig: Record<string, { color: string; bg: string; icon: any }> = {
  owner:   { color: "text-zinc-700",    bg: "bg-zinc-100",    icon: Users },
  manager: { color: "text-blue-700",    bg: "bg-blue-100",    icon: Shield },
  waiter:  { color: "text-emerald-700", bg: "bg-emerald-100", icon: Coffee },
  kitchen: { color: "text-orange-700",  bg: "bg-orange-100",  icon: ChefHat },
  cashier: { color: "text-violet-700",  bg: "bg-violet-100",  icon: Users },
}

interface StaffMember {
  ID: string
  Name: string
  Email: string
  Role: string
  BranchID: any
  CreatedAt: string
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  branch_id?: string
}

export default function StaffPage() {
  const { branchId } = useBranch()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "waiter", branch_id: "",
  })

  const fetchStaff = useCallback(async () => {
    if (!branchId) return
    try {
      setError(null)
      const data = await staffAPI.list(branchId)
      setStaff(data ?? [])
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchStaff()
    branchesAPI.list().then((data) => {
      setBranches(data)
      if (data.length > 0) {
        setForm((prev) => ({ ...prev, branch_id: data[0].ID }))
      }
    }).catch(() => {})
  }, [fetchStaff])

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
      setSuccess("Staff member created successfully")
      setShowDialog(false)
      setForm({ name: "", email: "", password: "", role: "waiter", branch_id: branches[0]?.ID ?? "" })
      setFieldErrors({})
      await fetchStaff()
      setTimeout(() => setSuccess(null), 3000)
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

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      await staffAPI.delete(id)
      setStaff((prev) => prev.filter((s) => s.ID !== id))
      setSuccess("Staff member removed")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to delete staff member")
    } finally {
      setDeleteId(null)
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
          <p className="text-sm text-zinc-500">
            {staff.length} {staff.length === 1 ? "member" : "members"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStaff}
              className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </button>
            <Button
              onClick={handleOpenDialog}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-700 font-medium">✅ {success}</p>
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
        {!loading && staff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No staff yet</p>
            <p className="text-xs text-zinc-400 mt-1">Add your first staff member to get started</p>
          </div>
        )}

        {/* Staff Grid */}
        {!loading && staff.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => {
              const config = roleConfig[member.Role] ?? roleConfig.waiter
              const Icon = config.icon
              const initials = member.Name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              return (
                <Card
                  key={member.ID}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{member.Name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{member.Email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(member.ID)}
                        disabled={deleteId === member.ID}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deleteId === member.ID
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                        config.bg, config.color
                      )}>
                        <Icon className="w-3 h-3" />
                        {member.Role}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-zinc-500">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
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

            {/* General API error inside dialog */}
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