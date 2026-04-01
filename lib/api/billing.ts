import API from "@/lib/client"
export const billingAPI = {
  close: async (tableSessionId: string) => {
    await API.post("/billing/close", { table_session_id: tableSessionId })
  },
}