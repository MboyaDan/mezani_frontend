"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Search, MoreVertical, Users, Shield, ChefHat, Coffee } from "lucide-react"

const roleConfig: Record<string, { color: string; bg: string; icon: any }> = {
  manager: { color: "text-blue-700", bg: "bg-blue-100", icon: Shield },
  waiter: { color: "text-emerald-700", bg: "bg-emerald-100", icon: Coffee },
  kitchen: { color: "text-orange-700", bg: "bg-orange-100", icon: ChefHat },
  cashier: { color: "text-violet-700", bg: "bg-violet-100", icon: Users },
}

const mockStaff = [
  { id: "1", name: "James Ochieng", email: "james@mezzani.com", role: "manager", branch: "Westlands", active: true },
  { id: "2", name: "Grace Wanjiku", email: "grace@mezzani.com", role: "kitchen", branch: "Westlands", active: true },
  { id: "3", name: "Peter Kamau", email: "peter@mezzani.com", role: "waiter", branch: "CBD", active: true },
  { id: "4", name: "Faith Akinyi", email: "faith@mezzani.com", role: "cashier", branch: "Westlands", active: true },
  { id: "5", name: "David Mwangi", email: "david@mezzani.com", role: "kitchen", branch: "CBD", active: false },
  { id: "6", name: "Sarah Njeri", email: "sarah@mezzani.com", role: "waiter", branch: "Kilimani", active: true },
]

interface Staff {
  id: string
  name: string
  email: string
  role: string
  branch: string
  active: boolean
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>(mockStaff)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "waiter", branch: "" })

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    setStaff((prev) => [...prev, {
      id: String(Date.now()),
      name: form.name,
      email: form.email,
      role: form.role,
      branch: form.branch,
      active: true,
    }])
    setShowDialog(false)
    setForm({ name: "", email: "", password: "", role: "waiter", branch: "" })
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Staff" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search staff..."
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
            Add Staff
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {["manager", "kitchen", "waiter", "cashier"].map((role) => {
            const config = roleConfig[role]
            const Icon = config.icon
            const count = staff.filter((s) => s.role === role).length
            return (
              <Card key={role} className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-zinc-900">{count}</p>
                    <p className="text-xs text-zinc-500 capitalize">{role}s</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => {
            const config = roleConfig[member.role] ?? roleConfig.waiter
            const Icon = config.icon
            const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            return (
              <Card
                key={member.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{member.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{member.email}</p>
                      </div>
                    </div>
                    <button className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                      config.bg, config.color
                    )}>
                      <Icon className="w-3 h-3" />
                      {member.role}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        member.active ? "bg-emerald-500" : "bg-zinc-300"
                      )} />
                      <span className="text-xs text-zinc-500">
                        {member.active ? "Active" : "Offline"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-50">
                    <p className="text-xs text-zinc-400">
                      📍 {member.branch} branch
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. James Ochieng"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="james@restaurant.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {["manager", "waiter", "kitchen", "cashier"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input
                  placeholder="e.g. Westlands"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
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
                Add Staff
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}