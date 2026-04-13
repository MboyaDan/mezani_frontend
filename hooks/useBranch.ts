"use client"
import { useState, useCallback } from "react"
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

function getInitialBranchName(): string | null {
  return localStorage.getItem("branch_name")
}

export function useBranch() {
  const [branchId, setBranchId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return getInitialBranchId()
  })

  const [branchName, setBranchName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return getInitialBranchName()
  })

  const selectBranch = useCallback((id: string, name?: string) => {
    setBranchId(id)
    localStorage.setItem("branch_id", id)
    if (name) {
      setBranchName(name)
      localStorage.setItem("branch_name", name)
    }
  }, []) // stable — setBranchId/setBranchName from useState are already stable

  return { branchId, branchName, selectBranch }
}