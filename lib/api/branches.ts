import API from "@/lib/client"
import { Branch } from "@/types"


export const branchesAPI = {
  list: async (role?: string) => {
    const endpoint = role === "manager" ? "/manager/branches" : "/owner/branches"
    const res = await API.get(endpoint)
    return (res.data ?? []) as Branch[]
  },

  create: async (name: string, location: string) => {
    const res = await API.post("/owner/branches", { name, location })  
    return (res.data ?? []) as Branch[]
  },

  delete: async (id: string) => {
    await API.delete(`/owner/branches/${id}`) 
  },
}