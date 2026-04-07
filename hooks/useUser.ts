"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth"
import { JWTPayload } from "@/types"

export function useUser() {
  const [user, setUser] = useState<JWTPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  return { user, loading }
}