"use client"

import API from "@/lib/client"

export interface AIChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface AIChatResponse {
  response: string
  tokens_used: number
  from_cache: boolean
  context_summary: {
    total_orders?: number
    total_revenue?: number
    top_item?: string
    low_stock_count?: number
    source: string
  }
}

export const aiAPI = {
  chat: async (
    message: string,
    branchId: string,
    sessionId?: string
  ): Promise<AIChatResponse> => {
    const res = await API.post(
      `/ai/chat?branch_id=${branchId}`,
      { message, session_id: sessionId }
    )
    return res.data
  },
}