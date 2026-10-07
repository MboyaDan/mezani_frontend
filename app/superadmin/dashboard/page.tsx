"use client"
import { useState, useEffect, useCallback } from "react"
import ADMIN_API from "@/lib/adminClient"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { getErrorMessage } from "@/lib/api/error"
import { Loader2, RefreshCw, Building2, Users, ShoppingBag, TrendingUp, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Logo } from "@/components/brand/logo"

interface Overview {
  tenant_count: number
  branch_count: number
  staff_count: number
  total_platform_revenue: number
}

interface TenantRow {
  id: string
  name: string
  plan: string
  created_at: string
  branch_count: number
  staff_count: number
  total_revenue: number
  trial_expired: boolean
  trial_days_left: number
}

export default function SuperAdminDashboard() {
  const { logout } = useAdminAuth()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [overviewRes, tenantsRes] = await Promise.all([
        ADMIN_API.get<Overview>("/superadmin/overview"),
        ADMIN_API.get<TenantRow[]>("/superadmin/tenants"),
      ])
      setOverview(overviewRes.data)
      setTenants(tenantsRes.data ?? [])
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load platform data"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = [
    { label: "Tenants", value: overview?.tenant_count ?? 0, icon: Building2 },
    { label: "Branches", value: overview?.branch_count ?? 0, icon: ShoppingBag },
    { label: "Staff Accounts", value: overview?.staff_count ?? 0, icon: Users },
    {
      label: "Total Platform Revenue",
      value: `KES ${(overview?.total_platform_revenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="horizontal" tone="reversed" className="h-6" />
            <div className="h-6 w-px bg-zinc-700" aria-hidden />
            <h1 className="text-sm font-medium text-zinc-300">Platform admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-red-950 border border-red-900 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                      <Icon className="w-4 h-4 text-zinc-600" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white">Tenants</h2>
              </div>

              {tenants.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  No tenants registered yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Plan</th>
                        <th className="px-5 py-3 font-medium">Branches</th>
                        <th className="px-5 py-3 font-medium">Staff</th>
                        <th className="px-5 py-3 font-medium">Revenue</th>
                        <th className="px-5 py-3 font-medium">Trial</th>
                        <th className="px-5 py-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((t) => (
                        <tr key={t.id} className="border-b border-zinc-800/60 last:border-0">
                          <td className="px-5 py-3 font-medium text-white">{t.name}</td>
                          <td className="px-5 py-3 text-zinc-400 capitalize">{t.plan}</td>
                          <td className="px-5 py-3 text-zinc-400">{t.branch_count}</td>
                          <td className="px-5 py-3 text-zinc-400">{t.staff_count}</td>
                          <td className="px-5 py-3 text-zinc-400">
                            KES {t.total_revenue.toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded-full border font-medium",
                                t.trial_expired
                                  ? "bg-red-950 text-red-400 border-red-900"
                                  : t.trial_days_left <= 3
                                  ? "bg-orange-950 text-orange-400 border-orange-900"
                                  : "bg-emerald-950 text-emerald-400 border-emerald-900"
                              )}
                            >
                              {t.trial_expired ? "Expired" : `${t.trial_days_left}d left`}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-zinc-500">
                            {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}