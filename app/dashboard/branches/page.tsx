"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, MapPin, MoreVertical, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { branchesAPI } from "@/lib/api/branches"
import { Branch } from "@/types"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [form, setForm] = useState({ name: "", location: "" })

  const fetchBranches = useCallback(async () => {
    try {
      setError(null)
      const data = await branchesAPI.list()
      setBranches(data)  // no ?? [] needed
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load branches")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const handleAdd = async () => {
    if (!form.name) return
    setActionLoading(true)
    try {
      await branchesAPI.create(form.name, form.location)
      await fetchBranches()
      setShowDialog(false)
      setForm({ name: "", location: "" })
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create branch")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-cream">
      <Topbar title="Branches" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBranches}
              className="p-2.5 rounded-xl bg-white border border-cream-border hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </button>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-charcoal hover:bg-charcoal/90 text-cream rounded-xl gap-2 shadow-sm shadow-charcoal/10"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </Button>
          </div>
        </div>

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
        {!loading && branches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No branches yet</p>
            <p className="text-xs text-zinc-400 mt-1">Add your first branch to get started</p>
          </div>
        )}

        {/* Stats */}
        {!loading && branches.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Branches", value: branches.length },
              { label: "Active", value: branches.length },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white rounded-2xl border border-cream-border shadow-sm">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Branch Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card
                key={branch.ID}
                className="bg-white rounded-2xl border border-cream-border shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-charcoal text-white text-sm font-bold flex items-center justify-center">
                        {branch.Name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{branch.Name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <p className="text-xs text-zinc-400">
                            {branch.Location || "No location set"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-zinc-500">Active</span>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem("branch_id", branch.ID)
                        window.location.reload()
                      }}
                      className="text-xs text-brand-ink font-medium hover:underline"
                    >
                      Switch to →
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-charcoal hover:bg-charcoal/90 text-cream rounded-xl"
                onClick={handleAdd}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}