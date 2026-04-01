import API from "@/lib/client"
import { Order, SharedCart } from "@/types"

/**
 * =========================
 * CART API
 * =========================
 */

export const cartAPI = {
  create: async (
    tableSessionId: string,
    customerSessionId: string
  ) => {
    const res = await API.post("/cart/create", {
      table_session_id: tableSessionId,
      customer_id: customerSessionId,   //  backend expects customer_id
    })

    return res.data as SharedCart
  },

  addItem: async (
    cartId: string,
    menuItemId: string,
    quantity: number,
    customerSessionId: string
  ) => {
    const res = await API.post("/cart/add-item", {
      cart_id: cartId,
      menu_item_id: menuItemId,
      quantity,
      customer_id: customerSessionId,   // backend expects customer_id
    })

    return res.data
  },
}

/**
 * =========================
 * ORDERS API
 * =========================
 */

export const ordersAPI = {
  submit: async (
    tableSessionId: string,
    customerSessionId: string,
    cartId: string
  ) => {
    const res = await API.post("/orders/submit", {
      table_session_id: tableSessionId,
      customer_session_id: customerSessionId,  // order handler uses customer_session_id
      cart_id: cartId,
    })

    return res.data as Order
  },

  updateStatus: async (orderId: string, status: string) => {
    await API.patch(`/kitchen/orders/${orderId}/status`, {
      order_id: orderId,
      status,
    })
  },

  getBySession: async (sessionId: string) => {
    const res = await API.get(`/orders/session/${sessionId}`)
    return res.data as Order[]
  },
}