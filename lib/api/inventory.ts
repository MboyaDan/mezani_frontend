import API from "@/lib/client"

export const inventoryAPI = {
  list: async (branchId: string) => {
    const res = await API.get(`/branches/${branchId}/inventory/`)
    return res.data
  },

  create: async (branchId: string, data: {
    name: string
    stock: number
    threshold: number
  }) => {
    const res = await API.post(`/branches/${branchId}/inventory/`, data)
    return res.data
  },

  setStock: async (branchId: string, itemId: string, stock: number) => {
    const res = await API.patch(`/branches/${branchId}/inventory/${itemId}/stock`, { stock })
    return res.data
  },

  getLowStock: async (branchId: string) => {
    const res = await API.patch(`/branches/${branchId}/inventory/low-stock`)
    return res.data
  },

  delete: async (branchId: string, itemId: string) => {
    await API.delete(`/branches/${branchId}/inventory/${itemId}`)
},

}