/**
 * One status palette for every screen (dashboard overview, orders, waiter).
 * Text colours are the -800 shades so chips stay readable (>= 4.5:1) on their tints.
 */
export interface OrderStatusStyle {
  label: string
  chip: string
}

export const ORDER_STATUS: Record<string, OrderStatusStyle> = {
  pending:   { label: "New",       chip: "bg-brand/12 text-brand-ink" },
  accepted:  { label: "Accepted",  chip: "bg-sky-100 text-sky-800" },
  preparing: { label: "Preparing", chip: "bg-amber-100 text-amber-800" },
  ready:     { label: "Ready",     chip: "bg-emerald-100 text-emerald-800" },
  served:    { label: "Served",    chip: "bg-stone-100 text-stone-600" },
  paid:      { label: "Paid",      chip: "bg-teal-100 text-teal-800" },
  closed:    { label: "Closed",    chip: "bg-stone-100 text-stone-500" },
}

export function orderStatus(status: string): OrderStatusStyle {
  return ORDER_STATUS[status] ?? { label: status, chip: ORDER_STATUS.served.chip }
}
