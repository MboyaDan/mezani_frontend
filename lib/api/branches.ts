import API from "@/lib/client"
import { Branch } from "@/types"


export const branchesAPI = {
  list: async () => {
    const res = await API.get("/owner/branches")
    return (res.data ?? []) as Branch[]  // ← coerce null → []
  },

  create: async (name: string, location: string) => {
    const res = await API.post("/owner/branches", { name, location })
    return (res.data ?? []) as Branch[]  // ← coerce null → []
  },

  delete: async (id: string) => {
    await API.delete(`/owner/branches/${id}`)
},
}