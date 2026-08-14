"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import ADMIN_API from "@/lib/adminClient"
import { saveAdminTokens, clearAdminTokens, AdminTokenPair } from "@/lib/adminAuth"
import { getErrorMessage } from "@/lib/api/error"

export function useAdminAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await ADMIN_API.post<AdminTokenPair>("/superadmin/login", { email, password })
      saveAdminTokens(res.data)
      router.push("/superadmin/dashboard")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid email or password"))
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearAdminTokens()
    router.push("/superadmin/login")
  }

  return { login, logout, loading, error }
}