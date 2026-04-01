"use client"
import { useState } from "react"
import { getCurrentUser } from "@/lib/auth"

function getInitialBranchId(): string | null {
  const stored = localStorage.getItem("branch_id")
  if (stored) return stored

  const user = getCurrentUser()
  if (user?.branch_id && user.branch_id !== "00000000-0000-0000-0000-000000000000") {
    localStorage.setItem("branch_id", user.branch_id)
    return user.branch_id
  }

  return null
}

export function useBranch() {
  const [branchId, setBranchId] = useState<string | null>(() => {
    // Lazy initializer runs once on mount, never triggers a cascading render
    if (typeof window === "undefined") return null
    return getInitialBranchId()
  })

  const selectBranch = (id: string) => {
    setBranchId(id)
    localStorage.setItem("branch_id", id)
  }

  return { branchId, selectBranch }
}