"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import API from "@/lib/client"
import { saveTokens, clearTokens, getCurrentUser } from "@/lib/auth"
import { TokenPair } from "@/types"
import { getErrorMessage } from "@/lib/api/error"

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.post<TokenPair>("/auth/login", { email, password })
      saveTokens(res.data)

      // Clear stale branch from any previous session/tenant
      localStorage.removeItem("branch_id")
      localStorage.removeItem("branch_name")

      const user = getCurrentUser()
      switch (user?.role) {
        case "owner":
        case "manager":
          router.push("/dashboard")
          break
        case "kitchen":
          router.push("/kitchen")
          break
        case "waiter":
          router.push("/waiter")
          break
        default:
          router.push("/dashboard")
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid credentials"))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        await API.post("/auth/logout", { refresh_token: refreshToken })
      }
    } finally {
      clearTokens()
      localStorage.removeItem("branch_id")
      localStorage.removeItem("branch_name")
      router.push("/login")
    }
  }

  const register = async (
    restaurantName: string,
    email: string,
    password: string
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.post<TokenPair>("/auth/register-owner", {
        restaurant_name: restaurantName,
        email,
        password,
      })
      saveTokens(res.data)
      localStorage.removeItem("branch_id")
      localStorage.removeItem("branch_name")
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  return { login, logout, register, loading, error }
}