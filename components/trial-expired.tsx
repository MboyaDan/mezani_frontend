"use client"
import { useState, useEffect } from "react"
import { clearTokens } from "@/lib/auth"
import { useUser } from "@/hooks/useUser"
import { ChefHat, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function TrialExpiredGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user?.subscription_expires_at) {
      setExpired(false)
      return
    }
    const expiresAt = new Date(user.subscription_expires_at)
    setExpired(expiresAt.getTime() < Date.now())
  }, [user, loading])

  if (!expired) return <>{children}</>

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[#F8FAFC] p-6 min-h-screen">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-zinc-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Your subscription has ended</h2>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
            Renew to keep access to your restaurant dashboard, menus, staff and order history.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Your data is safe — renew to regain access to:
          </p>
          {[
            "All orders and order history",
            "Menu items and categories",
            "Staff accounts and permissions",
            "Table sessions and QR codes",
            "Analytics and reports",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-zinc-700">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/billing/renew"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
          >
            View plans & renew →
          </Link>
          <button
            onClick={() => {
              clearTokens()
              localStorage.clear()
              router.push("/login")
            }}
            className="block w-full text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-2"
          >
            Sign in to a different account
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Questions? Email us at{" "}
          <a href="mailto:customercare@mezzani.co.ke" className="text-orange-500 hover:underline">
            customercare@mezzani.co.ke
          </a>
        </p>
      </div>
    </div>
  )
}