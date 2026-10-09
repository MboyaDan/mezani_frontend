import API from "@/lib/client"

export type AnalyticsRange = "today" | "7d" | "30d"

export const analyticsAPI = {
  // range: reporting window in Nairobi days. The backend defaults to 30d when omitted.
  dashboard: async (branchId: string, range?: AnalyticsRange) => {
    const res = await API.get("/reports/analytics/dashboard", {
      params: { branch_id: branchId, ...(range ? { range } : {}) },
    })
    return res.data
  },
}
