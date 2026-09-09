import API from "@/lib/client"

export interface Plan {
  id: string
  name: string
  display_name: string
  price_kes: number
  billing_period_days: number
  max_branches: number
}

export interface VerifyResult {
  subscription_status: string
  subscription_expires_at: string
}

export const subscriptionAPI = {
  getPlans: async () => {
    const res = await API.get("/subscription/plans")
    return res.data as Plan[]
  },

  renew: async (planName: string) => {
    const res = await API.post("/subscription/renew", { plan_name: planName })
    return res.data as { authorization_url: string }
  },

  verify: async (reference: string) => {
    const res = await API.post("/subscription/verify", { reference })
    return res.data as VerifyResult
  },
}