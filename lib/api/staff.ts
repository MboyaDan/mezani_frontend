import API from "@/lib/client"
export const staffAPI = {
  create: async (data: {
    name: string
    email: string
    password: string
    role: string
    branch_id: string
  }) => {
    const res = await API.post("/staff/create", data)
    return res.data
  },
}