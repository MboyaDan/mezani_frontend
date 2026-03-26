"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const { login, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h1 className="text-xl font-bold mb-4">Login</h1>

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-3 p-2 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={() => login(email, password)}
          className="w-full bg-black text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  )
}