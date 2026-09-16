import API from "@/lib/client"

export interface ContactPayload {
  name: string
  email: string
  message: string
  /** Honeypot — always empty for real users. See the contact page form. */
  website?: string
}

export const contactAPI = {
  send: async (payload: ContactPayload) => {
    const res = await API.post("/contact", payload)
    return res.data as { message: string }
  },
}