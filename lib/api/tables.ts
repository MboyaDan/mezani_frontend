import API from "@/lib/client"
import { TableSession } from "@/types"

export const tablesAPI = {
  list: async (branchId: string) => {
    const res = await API.get(`/owner/tables?branch_id=${branchId}`)
    return res.data  // ← no cast, let the caller type it
  },

  create: async (branchId: string, tableNumber: number) => {
    const res = await API.post(`/owner/branches/${branchId}/tables`, {
      table_number: tableNumber,
    })
    return res.data
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
    await API.post("/table-session/heartbeat", {
      session_id: sessionId,
    })
  },
}