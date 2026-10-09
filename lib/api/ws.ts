import API from "@/lib/client"

const DEFAULT_WS_URL = "ws://localhost:8080/ws/kitchen"

export const wsAPI = {
  /**
   * Exchanges the signed-in user's access token for a short-lived (about 30s),
   * single-use ticket for one branch's live updates. The server checks that the
   * user's role and tenant allow that branch before issuing it.
   */
  ticket: async (branchId: string): Promise<string> => {
    const res = await API.post("/ws/ticket", { branch_id: branchId })
    return res.data.ticket as string
  },
}

/**
 * Full WebSocket URL for a branch, carrying a fresh ticket.
 *
 * A browser WebSocket cannot send an Authorization header, which is why the ticket
 * travels in the URL. It is single-use and expires within seconds, so it is not a
 * long-lived credential. Call this once per connection attempt: a ticket cannot be
 * reused for a reconnect.
 */
export async function getBranchSocketUrl(branchId: string): Promise<string> {
  const ticket = await wsAPI.ticket(branchId)
  const base = process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL
  return `${base}?ticket=${encodeURIComponent(ticket)}`
}

/** Reconnect delay: 3s, 6s, 12s ... capped at 30s. Reset to attempt 0 on a successful open. */
export const reconnectDelayMs = (attempt: number) => Math.min(3000 * 2 ** attempt, 30000)
