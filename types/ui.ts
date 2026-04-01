import { MenuItem } from "./index"

// UI cart (frontend state)
export interface CartEntry {
  id: string
  name: string
  price: number
  qty: number
}

// UI-friendly menu structure
export interface FullMenuCategory {
  category_id: string
  category_name: string
  display_order: number
  items: MenuItem[]
}