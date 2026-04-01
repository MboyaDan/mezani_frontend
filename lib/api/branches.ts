import API from "@/lib/client"
import { Branch } from "@/types"

export const branchesAPI = {
  create: async (name: string, location: string) => {
    const res = await API.post("/owner/branches", { name, location })
    return res.data as Branch
  },

  list: async () => {
    // No list endpoint yet — owner sees their own branches via tenant_id in JWT
    // Will need to add GET /owner/branches to our backend
    const res = await API.get("/owner/branches")
    return res.data as Branch[]
  },
}