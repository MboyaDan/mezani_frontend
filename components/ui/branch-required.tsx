import { GitBranch } from "lucide-react"
import Link from "next/link"

export function BranchRequired() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full py-24 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
        <GitBranch className="w-7 h-7 text-brand-ink" />
      </div>
      <p className="text-base font-semibold text-zinc-900 mb-1">
        No branch set up yet
      </p>
      <p className="text-sm text-zinc-400 max-w-xs mb-6">
        You need to create a branch before you can manage orders, tables, staff, and more.
      </p>
      <Link
        href="/dashboard/branches"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-charcoal/90 text-cream text-sm font-medium rounded-xl transition-colors"
      >
        <GitBranch className="w-4 h-4" />
        Create your first branch
      </Link>
    </div>
  )
}