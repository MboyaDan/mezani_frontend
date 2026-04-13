import API from "@/lib/client"

export const analyticsAPI = {
  dashboard: async () => {
    const res = await API.get("/reports/analytics/dashboard")
    return res.data
  },
}