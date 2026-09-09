"use client"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth"
import { JWTPayload } from "@/types"
import API from "@/lib/client"

export type UserProfile = JWTPayload & {
  name?: string
  email?: string
  subscription_status?: string
  subscription_expires_at?: string
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)

    if (!currentUser) {
      setLoading(false)
      return
    }

    API.get("/me")
      .then((res) => {
        setUser((prev) => (prev ? { ...prev, ...res.data } : prev))
      })
      .catch(() => {
        // fall back silently to JWT-only data
      })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}