//backened + shared types for API responses and JWT payloads
export type Role = "owner" | "manager" | "waiter" | "kitchen" | "cashier"
export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface StaffUser {
  ID: string
  TenantID: string
  BranchID: string | null
  Name: string
  Email: string
  Role: Role
  CreatedAt: string
}

export interface Branch {
  ID: string
  TenantID: string
  Name: string
  Location: string
  CreatedAt: string
}

export interface Table {
  id: string
  branch_id: string
  table_number: number
}

export interface TableSession {
  id: string
  table_id: string
  status: string
  expires_at: string
  created_at: string
}
export interface CustomerSession {
  ID: string
  TableSessionID: string
  Name: string
  CreatedAt: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string
  price: number
  available: boolean
  sold_out: boolean
  is_special: boolean
  created_at: string
}

export interface MenuCategory {
  ID: string
  MenuID: string
  Name: string
  DisplayOrder: number
  CreatedAt: string
}

export interface Menu {
  ID: string
  BranchID: string
  CreatedAt: string
}

export interface CartItem {
  ID: string
  CartID: string
  MenuItemID: string
  Quantity: number
  AddedBy: string
  CreatedAt: string
}

export interface SharedCart {
  ID: string
  TableSessionID: string
  CreatedBy: string
  Status: string
  CreatedAt: string
}

export interface Order {
  ID: string
  TableSessionID: string
  CustomerSessionID: string
  CartID: string
  Status: string
  CreatedAt: string
}

export interface InventoryItem {
  ID: string
  BranchID: string
  Name: string
  Stock: number
  Threshold: number
  CreatedAt: string
}

// JWT decoded payload
export interface JWTPayload {
  uid: string
  tid: string
  tname: string
  bid?: string
  role: Role
  tca: number
  plan: string
  exp: number
  iat: number
}