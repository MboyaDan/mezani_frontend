import API from "@/lib/client"

export const staffAPI = {
  list: async (branchId: string) => {
    const res = await API.get(`/staff/list?branch_id=${branchId}`)
    return res.data
  },

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

  delete: async (id: string) => {
    await API.delete(`/staff/${id}`)
  },
}