import API from "@/lib/client"
import { Menu, MenuCategory, MenuItem } from "@/types"
import { FullMenuCategory } from "@/types/ui"

// Add this interface
export interface SessionStatusResponse {
  active: boolean;
  session_id?: string;
  table_number?: number;
  expires_at?: string;
}

export const menuAPI = {
  getByBranch: async (branchId: string) => {
    const res = await API.get(`/menus/branch/${branchId}`)
    return res.data as Menu[]
  },

  getBySession: async (sessionId: string) => {
    const res = await API.get(`/table-sessions/${sessionId}/menu`)
    return res.data as FullMenuCategory[]
  },

  getFull: async (menuId: string) => {
    const res = await API.get(`/menus/${menuId}/full`)
    return res.data
  },

  createMenu: async (branchId: string) => {
    const res = await API.post("/menu/", { branch_id: branchId })
    return res.data as Menu
  },

  createCategory: async (menuId: string, name: string, order: number) => {
    const res = await API.post("/menu/categories", {
      menu_id: menuId,
      name,
      order,
    })
    return res.data as MenuCategory
  },

  createItem: async (categoryId: string, name: string, description: string, price: number) => {
    const res = await API.post("/menu/items", {
      category_id: categoryId,
      name,
      description,
      price,
    })
    return res.data as MenuItem
  },

  updatePrice: async (itemId: string, price: number) => {
    await API.patch(`/menu/items/${itemId}/price`, { price })
  },

  setSoldOut: async (itemId: string) => {
    await API.patch(`/menu/items/${itemId}/sold-out`)
  },

  setAvailable: async (itemId: string) => {
    await API.patch(`/menu/items/${itemId}/available`)
  },

  getSessionInfo: async (sessionId: string) => {
    const res = await API.get(`/table-sessions/${sessionId}/info`)
    return res.data as { table_number: number }
  },

  deleteItem: async (itemId: string) => {
    await API.delete(`/menu/items/${itemId}`)
  },

  checkSession: async (tableId: string) => {
    const res = await API.get(`/tables/${tableId}/session-status`)
    return res.data as SessionStatusResponse  // Update this line
  },
}