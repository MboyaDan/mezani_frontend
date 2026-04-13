"use client"
import { useState, useEffect } from "react"
import { branchesAPI } from "@/lib/api/branches"
import { Branch } from "@/types"
import { Loader2, GitBranch, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface BranchSelectorProps {
  currentBranchId: string | null
  onSelect: (branchId: string, branchName: string) => void
}

export function BranchSelector({ currentBranchId, onSelect }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [currentName, setCurrentName] = useState<string | null>(null)

  useEffect(() => {
    branchesAPI
      .list()
      .then((data) => {
        setBranches(data)
        const current = data.find((b) => b.ID === currentBranchId)
        if (current) setCurrentName(current.Name)
        if (data.length === 1 && !currentBranchId) {
          onSelect(data[0].ID, data[0].Name)
          setCurrentName(data[0].Name)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBranchId, onSelect])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-400">Loading...</span>
      </div>
    )
  }

  if (branches.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors w-full"
      >
        <GitBranch className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs text-zinc-300 truncate flex-1 text-left">
          {currentName ?? "Select branch"}
        </span>
        <ChevronDown className={cn(
          "w-3 h-3 text-zinc-400 transition-transform shrink-0",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
            {branches.map((branch) => (
              <button
                key={branch.ID}
                onClick={() => {
                  onSelect(branch.ID, branch.Name)
                  setCurrentName(branch.Name)
                  setOpen(false)
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-200">{branch.Name}</p>
                  {branch.Location && (
                    <p className="text-xs text-zinc-500 mt-0.5">{branch.Location}</p>
                  )}
                </div>
                {branch.ID === currentBranchId && (
                  <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}