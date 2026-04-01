import API from "@/lib/client"
import { Table, TableSession } from "@/types"

export const tablesAPI = {
  list: async (branchId: string) => {
    const res = await API.get(`/owner/branches/${branchId}/tables`)
    return res.data as Table[]
  },

  create: async (branchId: string, tableNumber: number) => {
    const res = await API.post(`/owner/branches/${branchId}/tables`, { table_number: tableNumber })
    return res.data as Table
  },
}

export const sessionsAPI = {
  start: async (tableId: string, durationMinutes: number) => {
    const res = await API.post("/table-session/start", {
      table_id: tableId,
      duration_minutes: durationMinutes,
    })
    return res.data as TableSession
  },

  close: async (sessionId: string) => {
    await API.post(`/table-session/${sessionId}/close`)
  },

  heartbeat: async (sessionId: string) => {
    await API.post("/table-session/heartbeat", { session_id: sessionId })
  },
}