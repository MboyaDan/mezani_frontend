"use client"
import { useBranch } from "@/hooks/useBranch"
import { branchesAPI } from "@/lib/api/branches"
import { useState, useEffect } from "react"
import { GitBranch, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Branch } from "@/types"

export function BranchGuard({ children }: { children: React.ReactNode }) {
  const { branchId, selectBranch } = useBranch()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const user = getCurrentUser()

  useEffect(() => {
    if (user?.role !== "owner" || branchId) {
      setLoading(false)
      return
    }

    branchesAPI
      .list()
      .then((data) => {
        setBranches(data)
        if (data.length === 1) {
          selectBranch(data[0].ID, data[0].Name)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [branchId, user?.role, selectBranch])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Has 2+ branches but none selected → force selection
  if (user?.role === "owner" && !branchId && branches.length > 1) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Select a Branch</h2>
            <p className="text-sm text-zinc-500">
              Choose which branch you want to manage
            </p>
          </div>
          <div className="space-y-2">
            {branches.map((branch) => (
              <button
                key={branch.ID}
                onClick={() => {
                  selectBranch(branch.ID, branch.Name)
                  window.location.reload()
                }}
                className="w-full flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-orange-300 hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {branch.Name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{branch.Name}</p>
                  <p className="text-xs text-zinc-400">{branch.Location || "No location"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No branches yet OR branch already selected → render normally
  return <>{children}</>
}