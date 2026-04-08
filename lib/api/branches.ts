import API from "@/lib/client"


export const branchesAPI = {
  list: async () => {
    const res = await API.get("/owner/branches")
    return res.data
  },

  create: async (name: string, location: string) => {
    const res = await API.post("/owner/branches", { name, location })
    return res.data
  },
}