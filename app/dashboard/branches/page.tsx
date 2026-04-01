"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, MapPin, TableProperties, Users, MoreVertical } from "lucide-react"

const mockBranches = [
  { id: "1", name: "Westlands", location: "Westlands, Nairobi", tables: 12, staff: 8, active: true },
  { id: "2", name: "CBD", location: "Tom Mboya St, Nairobi CBD", tables: 8, staff: 5, active: true },
  { id: "3", name: "Kilimani", location: "Kilimani, Nairobi", tables: 10, staff: 6, active: false },
]

interface Branch {
  id: string
  name: string
  location: string
  tables: number
  staff: number
  active: boolean
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(mockBranches)
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({ name: "", location: "" })

  const handleAdd = () => {
    setBranches((prev) => [...prev, {
      id: String(Date.now()),
      name: form.name,
      location: form.location,
      tables: 0,
      staff: 0,
      active: true,
    }])
    setShowDialog(false)
    setForm({ name: "", location: "" })
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Topbar title="Branches" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              {branches.length} {branches.length === 1 ? "branch" : "branches"} · {branches.filter((b) => b.active).length} active
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-sm shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Branches", value: branches.length },
            { label: "Total Tables", value: branches.reduce((s, b) => s + b.tables, 0) },
            { label: "Total Staff", value: branches.reduce((s, b) => s + b.staff, 0) },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center">
                      {branch.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{branch.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <p className="text-xs text-zinc-400">{branch.location}</p>
                      </div>
                    </div>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-3">
                    <TableProperties className="w-4 h-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{branch.tables}</p>
                      <p className="text-xs text-zinc-400">Tables</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-3">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{branch.staff}</p>
                      <p className="text-xs text-zinc-400">Staff</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-50">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      branch.active ? "bg-emerald-500" : "bg-zinc-300"
                    )} />
                    <span className="text-xs text-zinc-500">
                      {branch.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button className="text-xs text-orange-500 font-medium hover:underline">
                    Manage →
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                placeholder="e.g. Westlands"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Westlands, Nairobi"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleAdd}
              >
                Add Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}