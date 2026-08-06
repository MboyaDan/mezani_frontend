import API from "@/lib/client"

export interface Payment {
  ID: string
  TenantID: string
  BranchID: string
  TableSessionID: string
  Method: "cash" | "mpesa"
  Status: "pending" | "confirmed" | "failed" | "cancelled"
  Amount: number
  MpesaReceipt?: string
  InitiatedBy?: string
  ConfirmedBy?: string
  CreatedAt: string
  ConfirmedAt?: string
}

export const paymentsAPI = {
  initiateCash: async (tableSessionId: string, amount: number) => {
    const res = await API.post("/payments/cash", {
      table_session_id: tableSessionId,
      amount,
    })
    return res.data as Payment
  },

  confirm: async (paymentId: string) => {
    const res = await API.post("/payments/confirm", {
      payment_id: paymentId,
    })
    return res.data as Payment
  },

  getPending: async (branchId: string) => {
    const res = await API.get(`/payments/pending/${branchId}`)
    return res.data as Payment[]
  },
}