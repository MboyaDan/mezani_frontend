import { MenuItem } from "./index"

// UI cart (frontend state)
export interface CartEntry {
  id: string
  name: string
  price: number
  qty: number
}

// UI-friendly order summary
export interface OrderSummaryItem {
  name: string
  price: number
  qty: number
  total: number
}

export interface OrderSummary {
  items: OrderSummaryItem[]
  total: number
} 
// UI-friendly menu structure
export interface FullMenuCategory {
  category_id: string
  category_name: string
  display_order: number
  items: MenuItem[]
}