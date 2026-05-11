import API from "@/lib/client"

export const analyticsAPI = {
  dashboard: async (branchId: string) => {
    const res = await API.get("/reports/analytics/dashboard", {
      params: { branch_id: branchId },
    })
    return res.data
  },
}