"use client"
import { useState, useEffect } from "react"
import { subscriptionAPI, Plan } from "@/lib/api/subscription"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"

export default function RenewSubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingPlan, setPayingPlan] = useState<string | null>(null)

  useEffect(() => {
    subscriptionAPI
      .getPlans()
      .then(setPlans)
      .catch(() => setError("Failed to load plans — please refresh and try again"))
      .finally(() => setLoading(false))
  }, [])

  const handleRenew = async (planName: string) => {
    setPayingPlan(planName)
    setError(null)
    try {
      const { authorization_url } = await subscriptionAPI.renew(planName)
      window.location.href = authorization_url
    } catch (err) {
      console.error("Failed to start checkout:", err)
      setError("Failed to start checkout — please try again")
      setPayingPlan(null)
    }
  }

  const featuresByTier: Record<string, string[]> = {
    tier1: ["Core order & table management", "Menu management", "Basic reports"],
    tier2: ["Everything in Basic", "Inventory tracking", "Staff accounts", "Analytics"],
    tier3: ["Everything in Standard", "AI Assistant", "Priority support"],
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center px-6 py-16">
      <Logo variant="horizontal" className="h-9 mb-8" />

      <h1 className="text-3xl font-bold text-zinc-900 text-center">Renew your subscription</h1>
      <p className="text-zinc-500 mt-2 text-center max-w-md">
        Pick a plan to keep your dashboard, menus, staff, and order history up and running.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-4xl w-full">
          {plans.map((plan) => {
            const isPaying = payingPlan === plan.name
            const isMiddle = plan.name === "tier2"
            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-white rounded-2xl border p-6 flex flex-col",
                  isMiddle ? "border-orange-300 ring-2 ring-orange-100 shadow-md" : "border-zinc-200"
                )}
              >
                {isMiddle && (
                  <span className="text-xs font-semibold text-orange-500 mb-2">MOST POPULAR</span>
                )}
                <h3 className="text-lg font-bold text-zinc-900">{plan.display_name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-zinc-900">
                    KES {plan.price_kes.toLocaleString()}
                  </span>
                  <span className="text-zinc-400 text-sm"> / {plan.billing_period_days} days</span>
                </p>

                <div className="mt-6 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plan.max_branches === 1
                      ? "1 branch"
                      : `Up to ${plan.max_branches} branches`}
                  </div>
                  {(featuresByTier[plan.name] ?? []).map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleRenew(plan.name)}
                  disabled={payingPlan !== null}
                  className={cn(
                    "mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                    isMiddle
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  )}
                >
                  {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renew now"}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400 mt-10">
        Payments processed securely by Paystack. Questions? Email{" "}
        <a href="mailto:customercare@mezzani.co.ke" className="text-orange-500 hover:underline">
          customercare@mezzani.co.ke
        </a>
      </p>
    </div>
  )
}