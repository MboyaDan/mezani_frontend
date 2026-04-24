"use client"
import { useState, use, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { customerAPI, cartAPI, ordersAPI, menuAPI } from "@/lib/api"
import { CustomerSession, MenuItem } from "@/types"
import { FullMenuCategory, CartEntry } from "@/types/ui"
import { ShoppingCart, Plus, Minus, X, ChevronRight, Loader2, AlertCircle, Clock } from "lucide-react"
import { getErrorMessage } from "@/lib/api/error"

// ─── Types ────────────────────────────────────────────────────────────────────

// "waiting" is the new state — table exists but no active session yet.
// The WaitingScreen polls until a session goes live, then auto-advances to "join".
type PageState = "checking" | "waiting" | "join" | "menu" | "ordering" | "success" | "error" | "expired"

// ─── WaitingScreen ────────────────────────────────────────────────────────────

/**
 * Shown when a customer scans a QR code but no session is active yet.
 *
 * Polls the session-check endpoint every POLL_INTERVAL_MS.
 * The moment a session becomes active, onSessionActive() is called
 * and the page transitions to the join screen — no manual refresh needed.
 *
 * This is the correct UX for the intended flow:
 *   Owner prints QR codes → laminates on tables → activates session when
 *   guests sit down → customer's waiting screen auto-proceeds to ordering.
 */
const POLL_INTERVAL_MS = 4000

function WaitingScreen({
  tableId,
  onSessionActive,
}: {
  tableId: string
  onSessionActive: (sessionId: string, tableNumber: number) => void
}) {
  const [dots, setDots] = useState(".")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animated ellipsis so the screen feels alive, not frozen
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."))
    }, 600)
    return () => clearInterval(id)
  }, [])

  // Poll for active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await menuAPI.checkSession(tableId)
        if (data?.active && data.session_id) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onSessionActive(data.session_id, data.table_number || 0)
        }
      } catch {
        // Session not active yet — keep polling silently
      }
    }

    // Check immediately on mount, then on interval
    checkSession()
    intervalRef.current = setInterval(checkSession, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tableId, onSessionActive])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
            <Clock className="w-9 h-9 text-orange-400" />
          </div>
          {/* Pulse ring to signal active polling */}
          <span className="absolute inset-0 rounded-full border-2 border-orange-300 animate-ping opacity-30" />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900">Table not active yet</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your waiter will activate this table shortly.
            <br />
            This page will update automatically{dots}
          </p>
        </div>

        {/* Reassurance card */}
        <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-left space-y-2 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">What happens next</p>
          {[
            "Staff activate your table",
            "This screen opens the menu automatically",
            "You enter your name and start ordering",
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-600">{step}</p>
            </div>
          ))}
        </div>

        {/* Subtle polling indicator */}
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          Checking every few seconds
        </p>
      </div>
    </div>
  )
}

// ─── CheckingScreen ───────────────────────────────────────────────────────────

// Shown for the brief moment on first load while we check session status.
// Distinct from LoadingScreen (which is shown while fetching the menu after join).
function CheckingScreen() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-sm text-zinc-400">Checking table status…</p>
      </div>
    </div>
  )
}

// ─── JoinScreen ───────────────────────────────────────────────────────────────

function JoinScreen({
  tableNumber,
  onJoin,
  loading,
  error,
}: {
  tableNumber: number | null
  onJoin: (name: string) => void
  loading: boolean
  error: string | null
}) {
  const [name, setName] = useState("")

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0f172a] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome</h1>
          <p className="text-sm text-zinc-500">Enter your name to start ordering</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Your name</label>
            <input
              type="text"
              placeholder="e.g. John"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && onJoin(name.trim())}
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={() => name.trim() && onJoin(name.trim())}
            disabled={!name.trim() || loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "View Menu"}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Table {tableNumber ?? "Loading..."} · No app download needed
        </p>
      </div>
    </div>
  )
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────

function SuccessScreen({ onOrderMore }: { onOrderMore: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Order placed!</h2>
        <p className="text-sm text-zinc-500">
          Your order has been sent to the kitchen. We&apos;ll bring it to your table shortly.
        </p>
        <button
          onClick={onOrderMore}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all"
        >
          Order More
        </button>
      </div>
    </div>
  )
}

// ─── ErrorScreen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Something went wrong</h2>
        <p className="text-sm text-zinc-500">{message}</p>
        <p className="text-xs text-zinc-400">Ask your waiter for assistance.</p>
      </div>
    </div>
  )
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-sm text-zinc-400">Loading menu...</p>
      </div>
    </div>
  )
}

// ─── PhoneInput ───────────────────────────────────────────────────────────────

function PhoneInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState<string>("")

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, "")
    const phoneRegex = /^(07|01)\d{8}$/
    if (phone && !phoneRegex.test(cleaned)) {
      setError("Enter a valid phone number (e.g., 0712345678)")
      return false
    }
    setError("")
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    const cleaned = newValue.replace(/\s/g, "")
    if (cleaned.length <= 10) {
      if (cleaned.length > 6) {
        newValue = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`.trim()
      } else if (cleaned.length > 4) {
        newValue = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)}`.trim()
      } else {
        newValue = cleaned
      }
    }
    onChange(newValue)
    validatePhone(newValue)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-600">
        Phone Number <span className="text-zinc-400">(for order updates)</span>
      </label>
      <input
        type="tel"
        placeholder="e.g., 0712 345 678"
        value={value}
        onChange={handleChange}
        className={cn(
          "w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 transition-all",
          error
            ? "border-red-300 focus:ring-red-300 focus:border-red-300"
            : "border-zinc-200 focus:ring-orange-300 focus:border-orange-300",
        )}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      <p className="text-xs text-zinc-400">We&apos;ll text you when your order is ready</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>
}) {
  const { tableId } = use(params)

  // ── State ──
  const [pageState, setPageState] = useState<PageState>("checking")
  const [menuData, setMenuData] = useState<FullMenuCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [cart, setCart] = useState<CartEntry[]>([])
  const [showCart, setShowCart] = useState(false)
  const [note, setNote] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [tableNumber, setTableNumber] = useState<number | null>(null)
  const [customer, setCustomer] = useState<CustomerSession | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // ── Initial session check on mount ──────────────────────────────────────────
  //
  // When the customer first lands on this URL (by scanning the QR code),
  // we immediately check whether a session is active for this table.
  //
  //   Active   → show "join" screen (enter name → menu)
  //   Inactive → show "waiting" screen (polls until active, then auto-advances)
  //   Error    → show error screen
  //
  // This is the gateway that makes permanent table-ID QR codes work correctly.
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const data = await menuAPI.checkSession(tableId)
        if (data?.active === true && data.session_id) {
          setSessionId(data.session_id)
          setTableNumber(data.table_number ?? null)
          setPageState("join")
        } else {
          setPageState("waiting")
        }
      } catch {
        // If the table ID itself doesn't exist, show a permanent error.
        // If it's just a network hiccup, default to waiting so we keep polling.
        setPageState("waiting")
      }
    }
    checkInitialSession()
  }, [tableId])

  // ── Cart helpers ─────────────────────────────────────────────────────────────

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const getQty = (id: string) => cart.find((i) => i.id === id)?.qty ?? 0

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (!existing) return prev
      if (existing.qty === 1) return prev.filter((i) => i.id !== id)
      return prev.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  // ── Fetch table number ───────────────────────────────────────────────────────

  const fetchTableNumber = async (tid: string) => {
    try {
      const data = await menuAPI.getSessionInfo(tid)
      setTableNumber(data.table_number)
    } catch {
      // Non-critical — falls back to truncated ID in the header
    }
  }

  // ── Load menu ────────────────────────────────────────────────────────────────

  const loadMenu = async (tid: string) => {
    setMenuLoading(true)
    try {
      const data = await menuAPI.getBySession(tid)
      setMenuData(data)
      if (data.length > 0) setActiveCategory(data[0].category_id)
    } catch {
      setErrorMessage("Could not load menu. Please ask your waiter for assistance.")
      setPageState("error")
    } finally {
      setMenuLoading(false)
    }
  }

  // ── Join table ───────────────────────────────────────────────────────────────

  const handleJoin = async (name: string) => {
    setLoading(true)
    setJoinError(null)
    try {
      const customerSession = await customerAPI.join(tableId, name)
      setCustomer(customerSession)
      // Use sessionId instead of tableId for cart creation
      const newCart = await cartAPI.create(sessionId!, customerSession.ID)
      setCartId(newCart.ID)
      await loadMenu(sessionId!)
      setPageState("menu")
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to join table")
      if (msg.includes("expired") || msg.includes("closed") || msg.includes("session")) {
        // Session was active when they hit the join screen but expired before
        // they submitted their name — send them back to waiting to re-poll.
        setPageState("waiting")
      } else {
        setJoinError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Submit order ─────────────────────────────────────────────────────────────

  const handleSubmitOrder = async () => {
    if (!customer || !cartId || cart.length === 0) return

    if (phone) {
      const cleanedPhone = phone.replace(/\s/g, "")
      const phoneRegex = /^(07|01)\d{8}$/
      if (!phoneRegex.test(cleanedPhone)) {
        setSubmitError("Please enter a valid phone number (e.g., 0712345678)")
        return
      }
    }

    setLoading(true)
    setSubmitError(null)
    try {
      await Promise.all(
        cart.map((item) => cartAPI.addItem(cartId, item.id, item.qty, customer.ID))
      )
      // Use sessionId instead of tableId
      await ordersAPI.submit(sessionId!, customer.ID, cartId)
      setCart([])
      setNote("")
      setPhone("")
      setShowCart(false)
      setPageState("success")
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, "Failed to place order. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  // ── Order more ───────────────────────────────────────────────────────────────

  const handleOrderMore = async () => {
    if (!customer) return
    try {
      // Use sessionId instead of tableId
      const newCart = await cartAPI.create(sessionId!, customer.ID)
      setCartId(newCart.ID)
    } catch {
      // Best effort — existing cartId may still work
    }
    setPageState("menu")
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (pageState === "checking") return <CheckingScreen />

  // WaitingScreen polls and calls onSessionActive when the table goes live.
  if (pageState === "waiting") {
    return (
      <WaitingScreen
        tableId={tableId}
        onSessionActive={(newSessionId, newTableNumber) => {
          setSessionId(newSessionId)
          setTableNumber(newTableNumber)
          setPageState("join")
        }}
      />
    )
  }

  if (pageState === "join") {
    return (
      <JoinScreen
        tableNumber={tableNumber}
        onJoin={handleJoin}
        loading={loading}
        error={joinError}
      />
    )
  }

  if (pageState === "success") return <SuccessScreen onOrderMore={handleOrderMore} />
  if (pageState === "error" || pageState === "expired") return <ErrorScreen message={errorMessage} />
  if (menuLoading) return <LoadingScreen />

  const activeCategoryData = menuData.find((c) => c.category_id === activeCategory)

  return (
    <div className="min-h-screen bg-[#F8FAFC] max-w-md mx-auto relative">

      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-5 pt-5 pb-4 sticky top-0 z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Menu</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Hi {customer?.Name} · Table {tableNumber ?? tableId.slice(0, 8) + "…"}
            </p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2.5 bg-[#0f172a] rounded-xl"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {menuData.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setActiveCategory(cat.category_id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                activeCategory === cat.category_id
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
              )}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3 pb-32">
        {menuData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-zinc-400">No menu items available</p>
            <p className="text-xs text-zinc-300 mt-1">Ask your waiter for assistance</p>
          </div>
        )}

        {activeCategoryData?.items.map((item) => {
          const qty = getQty(item.id)
          return (
            <div
              key={item.id}
              className={cn(
                "bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm transition-all",
                (!item.available || item.sold_out) && "opacity-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                    {item.is_special && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        ⭐ Special
                      </span>
                    )}
                    {item.sold_out && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Sold Out
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                  )}
                  <p className="text-sm font-bold text-orange-500 mt-2">
                    KES {item.price.toLocaleString()}
                  </p>
                </div>

                {item.available && !item.sold_out && (
                  <div className="shrink-0">
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        className="w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-orange-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center transition-all active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5 text-zinc-600" />
                        </button>
                        <span className="text-sm font-bold text-zinc-900 w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addItem(item)}
                          className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky cart button */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
          >
            <span className="bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
            <span>View Cart — KES {totalPrice.toLocaleString()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cart sheet */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="max-w-md w-full mx-auto flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                <h2 className="text-lg font-bold text-zinc-900">Your Order</h2>
                <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-zinc-100">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-400">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-400">KES {item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-zinc-600" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => {
                            const menuItem = activeCategoryData?.items.find((i) => i.id === item.id)
                            if (menuItem) addItem(menuItem)
                          }}
                          className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold text-zinc-900 w-16 text-right">
                          KES {(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-100 bg-white shrink-0">
                <div className="px-5 pt-4 pb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-zinc-900">Total</span>
                    <span className="text-xl font-bold text-orange-500">
                      KES {totalPrice.toLocaleString()}
                    </span>
                  </div>

                  <PhoneInput value={phone} onChange={setPhone} />

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">Special Instructions</label>
                    <textarea
                      placeholder="Any special requests? (e.g., no onions, extra sauce)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 resize-none transition-all"
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 flex-1">{submitError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || cart.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Place Order — KES {totalPrice.toLocaleString()}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCart(false)}
                    className="w-full text-center text-sm text-zinc-500 hover:text-orange-500 transition-colors py-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}