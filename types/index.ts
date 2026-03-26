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
  ID: string
  BranchID: string
  TableNumber: number
}

export interface TableSession {
  ID: string
  TableID: string
  Status: string
  ExpiresAt: string
  CreatedAt: string
}

export interface CustomerSession {
  ID: string
  TableSessionID: string
  Name: string
  CreatedAt: string
}

export interface MenuItem {
  ID: string
  CategoryID: string
  Name: string
  Description: string
  Price: number
  Available: boolean
  SoldOut: boolean
  IsSpecial: boolean
  CreatedAt: string
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
  user_id: string
  tenant_id: string
  branch_id: string
  role: Role
  exp: number
}