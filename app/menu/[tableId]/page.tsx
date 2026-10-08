"use client"
import { useState, use, useEffect, useRef } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { customerAPI, cartAPI, ordersAPI, menuAPI } from "@/lib/api"
import { CustomerSession, MenuItem } from "@/types"
import { FullMenuCategory, CartEntry } from "@/types/ui"
import {
  ShoppingCart, Plus, Minus, X, ChevronRight, Loader2, AlertCircle, CheckCircle2, Star,
} from "lucide-react"
import { getErrorMessage } from "@/lib/api/error"
import { Logo } from "@/components/brand/logo"

// ─── Types ────────────────────────────────────────────────────────────────────

// "waiting" = table exists but no active session yet.
// The WaitingScreen polls until a session goes live, then auto-advances to "join".
type PageState = "checking" | "waiting" | "join" | "menu" | "ordering" | "success" | "error" | "expired"

interface PlacedOrder {
  items: CartEntry[]
  total: number
}

// ─── Shared building blocks ───────────────────────────────────────────────────

/** Centered single-column layout for every screen before the menu. */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}

// 16px inputs: anything smaller makes iOS Safari zoom the page when a field is focused.
const fieldClass =
  "w-full rounded-xl border border-cream-border bg-white px-4 py-3 text-base text-charcoal outline-none transition-colors " +
  "placeholder:text-charcoal/40 focus:border-brand focus:ring-2 focus:ring-brand/25"

const primaryBtn =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-charcoal text-base font-medium text-cream transition-colors " +
  "hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

// ─── WaitingScreen ────────────────────────────────────────────────────────────

/**
 * Shown when a guest scans a QR code but no session is active yet.
 * Polls the session-check endpoint every POLL_INTERVAL_MS and advances the
 * moment a session goes live, so nobody has to refresh.
 */
const POLL_INTERVAL_MS = 4000

function WaitingScreen({
  tableId,
  onSessionActive,
}: {
  tableId: string
  onSessionActive: (sessionId: string, tableNumber: number) => void
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await menuAPI.checkSession(tableId)
        if (data?.active && data.session_id) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onSessionActive(data.session_id, data.table_number || 0)
        }
      } catch {
        // Session not active yet. Keep polling silently.
      }
    }

    checkSession()
    intervalRef.current = setInterval(checkSession, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tableId, onSessionActive])

  return (
    <Screen>
      <div className="space-y-8 text-center">
        <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-white ring-1 ring-cream-border">
          <span
            className="absolute inset-0 rounded-full border-2 border-brand/40 opacity-40 motion-safe:animate-ping"
            aria-hidden
          />
          <Logo variant="mark" className="h-7" title="Mezzani" />
        </div>

        <div className="space-y-2" role="status" aria-live="polite">
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal">Your table isn&apos;t open yet</h1>
          <p className="text-[0.9375rem] leading-relaxed text-charcoal/65">
            Your waiter will open it shortly. This page updates by itself, so there&apos;s no need to refresh.
          </p>
        </div>

        <ol className="space-y-3.5 rounded-2xl border border-cream-border bg-white p-5 text-left">
          {[
            "Staff open your table",
            "This screen moves on to the menu",
            "You enter your name and start ordering",
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/12 text-xs font-semibold text-brand-ink">
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm text-charcoal/75">{step}</span>
            </li>
          ))}
        </ol>

        <p className="flex items-center justify-center gap-2 text-xs text-charcoal/45">
          <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden />
          Checking every few seconds
        </p>
      </div>
    </Screen>
  )
}

// ─── CheckingScreen / LoadingScreen ───────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="space-y-4 text-center" role="status">
        <Logo variant="mark" className="mx-auto h-8 motion-safe:animate-pulse" title="Mezzani" />
        <p className="text-sm text-charcoal/55">{label}</p>
      </div>
    </main>
  )
}

const CheckingScreen = () => <Spinner label="Checking your table…" />
const LoadingScreen = () => <Spinner label="Loading the menu…" />

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
  const submit = () => name.trim() && !loading && onJoin(name.trim())

  return (
    <Screen>
      <div className="space-y-8">
        <div className="space-y-5 text-center">
          <Logo variant="horizontal" className="mx-auto h-8" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
              {tableNumber ? `Welcome to Table ${tableNumber}` : "Welcome"}
            </h1>
            <p className="text-[0.9375rem] text-charcoal/65">Tell us your name and the menu opens.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit() }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="guest-name" className="text-sm font-medium text-charcoal">Your name</label>
            <input
              id="guest-name"
              type="text"
              inputMode="text"
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="go"
              placeholder="e.g. John"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              autoFocus
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={!name.trim() || loading} className={primaryBtn}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-label="Opening menu" /> : "View menu"}
          </button>
        </form>

        <p className="text-center text-xs leading-relaxed text-charcoal/50">
          No app to download, no account to create.
          <br />
          By continuing you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-charcoal">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </Screen>
  )
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────

function SuccessScreen({
  order,
  tableNumber,
  onOrderMore,
}: {
  order: PlacedOrder | null
  tableNumber: number | null
  onOrderMore: () => void
}) {
  return (
    <Screen>
      <div className="space-y-6">
        <div className="space-y-3 text-center" role="status">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-7 text-emerald-700" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal">Order placed</h1>
          <p className="text-[0.9375rem] leading-relaxed text-charcoal/65">
            The kitchen has it{tableNumber ? ` for Table ${tableNumber}` : ""}. Your waiter will bring it to you.
          </p>
        </div>

        {order && order.items.length > 0 && (
          <div className="rounded-2xl border border-cream-border bg-white p-5">
            <ul className="space-y-2.5">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-charcoal/80">
                    <span className="mr-2 tabular-nums text-charcoal/45">{i.qty}×</span>
                    {i.name}
                  </span>
                  <span className="tabular-nums text-charcoal/60">KES {(i.price * i.qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-cream-border pt-4">
              <span className="text-sm font-medium text-charcoal">Total</span>
              <span className="text-lg font-semibold tabular-nums text-charcoal">KES {order.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-charcoal/55">
          When you&apos;re ready to pay, ask your waiter or visit the cashier.
        </p>

        <button onClick={onOrderMore} className={primaryBtn}>Order more</button>
      </div>
    </Screen>
  )
}

// ─── ErrorScreen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <Screen>
      <div className="space-y-4 text-center" role="alert">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="size-7 text-red-600" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">Something went wrong</h1>
        <p className="text-[0.9375rem] text-charcoal/65">{message}</p>
        <p className="text-sm text-charcoal/45">Please ask your waiter for help.</p>
      </div>
    </Screen>
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
  const [loading, setLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [tableNumber, setTableNumber] = useState<number | null>(null)
  const [customer, setCustomer] = useState<CustomerSession | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)

  // ── Initial session check on mount ──────────────────────────────────────────
  //   Active   → "join" screen (enter name → menu)
  //   Inactive → "waiting" screen (polls until active, then auto-advances)
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
        // Network hiccup or unknown table: default to waiting so we keep polling.
        setPageState("waiting")
      }
    }
    checkInitialSession()
  }, [tableId])

  // Escape closes the cart sheet
  useEffect(() => {
    if (!showCart) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowCart(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showCart])

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

  // ── Load menu ────────────────────────────────────────────────────────────────

  const loadMenu = async (tid: string) => {
    setMenuLoading(true)
    try {
      const data = await menuAPI.getBySession(tid)
      setMenuData(data)
      if (data.length > 0) setActiveCategory(data[0].category_id)
    } catch {
      setErrorMessage("We couldn't load the menu.")
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
      const newCart = await cartAPI.create(sessionId!, customerSession.ID)
      setCartId(newCart.ID)
      await loadMenu(sessionId!)
      setPageState("menu")
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to join table")
      if (msg.includes("expired") || msg.includes("closed") || msg.includes("session")) {
        // Session was active when they hit the join screen but ended before they
        // submitted their name. Send them back to waiting to re-poll.
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

    setLoading(true)
    setSubmitError(null)
    try {
      await Promise.all(
        cart.map((item) => cartAPI.addItem(cartId, item.id, item.qty, customer.ID))
      )
      await ordersAPI.submit(sessionId!, customer.ID, cartId, note)
      // Keep a snapshot for the confirmation screen before the cart is cleared.
      setPlacedOrder({ items: cart, total: totalPrice })
      setCart([])
      setNote("")
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
      const newCart = await cartAPI.create(sessionId!, customer.ID)
      setCartId(newCart.ID)
    } catch {
      // Best effort. The existing cartId may still work.
    }
    setPageState("menu")
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (pageState === "checking") return <CheckingScreen />

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
    return <JoinScreen tableNumber={tableNumber} onJoin={handleJoin} loading={loading} error={joinError} />
  }

  if (pageState === "success") {
    return <SuccessScreen order={placedOrder} tableNumber={tableNumber} onOrderMore={handleOrderMore} />
  }
  if (pageState === "error" || pageState === "expired") return <ErrorScreen message={errorMessage} />
  if (menuLoading) return <LoadingScreen />

  const activeCategoryData = menuData.find((c) => c.category_id === activeCategory)
  const allItems = menuData.flatMap((c) => c.items)

  const stepBtn =
    "flex size-10 items-center justify-center rounded-full transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

  return (
    <div className="relative mx-auto min-h-dvh max-w-md bg-cream">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-cream-border bg-white px-5 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo variant="mark" className="h-6" title="Mezzani" />
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-base font-semibold text-charcoal">
                Table {tableNumber ?? "…"}
              </h1>
              <p className="truncate text-xs text-charcoal/50">Hi {customer?.Name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            aria-label={`Open your order, ${totalItems} ${totalItems === 1 ? "item" : "items"}`}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-charcoal text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {menuData.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setActiveCategory(cat.category_id)}
              aria-pressed={activeCategory === cat.category_id}
              className={cn(
                "h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                activeCategory === cat.category_id
                  ? "bg-charcoal text-cream"
                  : "bg-charcoal/6 text-charcoal/70 hover:bg-charcoal/10"
              )}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu items */}
      <main className="space-y-3 px-4 py-4 pb-32">
        {menuData.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-sm font-medium text-charcoal/60">The menu isn&apos;t available right now</p>
            <p className="mt-1 text-xs text-charcoal/40">Please ask your waiter for help.</p>
          </div>
        )}

        {activeCategoryData?.items.map((item) => {
          const qty = getQty(item.id)
          const orderable = item.available && !item.sold_out
          return (
            <article
              key={item.id}
              className={cn(
                "rounded-2xl border border-cream-border bg-white p-4",
                !orderable && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[0.9375rem] font-semibold text-charcoal">{item.name}</h2>
                    {item.is_special && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2 py-0.5 text-xs font-medium text-brand-ink">
                        <Star className="size-3 fill-current" aria-hidden />
                        Special
                      </span>
                    )}
                    {item.sold_out && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Sold out
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm leading-relaxed text-charcoal/55">{item.description}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold tabular-nums text-brand-ink">
                    KES {item.price.toLocaleString()}
                  </p>
                </div>

                {orderable && (
                  <div className="shrink-0">
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        aria-label={`Add ${item.name}`}
                        className="flex size-11 items-center justify-center rounded-full bg-charcoal text-cream transition-colors hover:bg-charcoal/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <Plus className="size-5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove one ${item.name}`}
                          className={cn(stepBtn, "bg-charcoal/6 text-charcoal hover:bg-charcoal/10")}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums text-charcoal" aria-live="polite">
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem(item)}
                          aria-label={`Add another ${item.name}`}
                          className={cn(stepBtn, "bg-charcoal text-cream hover:bg-charcoal/90")}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </main>

      {/* Sticky cart bar */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setShowCart(true)}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-charcoal px-5 text-cream shadow-lg shadow-charcoal/25 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
              {totalItems}
            </span>
            <span className="font-medium">View order · KES {totalPrice.toLocaleString()}</span>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Cart sheet */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Your order">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setShowCart(false)} aria-hidden />
          <div className="relative flex max-h-[88dvh] flex-col rounded-t-3xl bg-white">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-cream-border px-5 py-3">
                <h2 className="text-lg font-semibold text-charcoal">Your order</h2>
                <button
                  onClick={() => setShowCart(false)}
                  aria-label="Close"
                  className="-mr-2 flex size-11 items-center justify-center rounded-lg text-charcoal/60 hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-charcoal/50">Nothing here yet. Add something from the menu.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
                        <p className="text-xs tabular-nums text-charcoal/50">KES {item.price.toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove one ${item.name}`}
                          className={cn(stepBtn, "bg-charcoal/6 text-charcoal hover:bg-charcoal/10")}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                        <button
                          onClick={() => {
                            // Search every category: the item may belong to a tab the guest
                            // has since left. The old lookup only checked the open tab, so
                            // "+" silently did nothing for items from other categories.
                            const menuItem = allItems.find((i) => i.id === item.id)
                            if (menuItem) addItem(menuItem)
                          }}
                          aria-label={`Add another ${item.name}`}
                          className={cn(stepBtn, "bg-charcoal text-cream hover:bg-charcoal/90")}
                        >
                          <Plus className="size-4" />
                        </button>
                        <span className="w-20 text-right text-sm font-semibold tabular-nums text-charcoal">
                          KES {(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="shrink-0 border-t border-cream-border bg-white">
                <div className="space-y-4 px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <div className="space-y-1.5">
                    <label htmlFor="order-note" className="text-sm font-medium text-charcoal">
                      Special instructions <span className="font-normal text-charcoal/45">(optional)</span>
                    </label>
                    <textarea
                      id="order-note"
                      placeholder="e.g. no onions, sauce on the side"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      maxLength={300}
                      className={cn(fieldClass, "resize-none")}
                    />
                    <p className="text-xs text-charcoal/50">
                      Have an allergy? Please tell your waiter as well.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-charcoal">Total</span>
                    <span className="text-xl font-semibold tabular-nums text-charcoal">
                      KES {totalPrice.toLocaleString()}
                    </span>
                  </div>

                  {submitError && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                      <p className="flex-1 text-sm text-red-700">{submitError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || cart.length === 0}
                    className={cn(primaryBtn, "h-14 rounded-2xl")}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" aria-label="Placing order" />
                    ) : (
                      `Place order · KES ${totalPrice.toLocaleString()}`
                    )}
                  </button>

                  <button
                    onClick={() => setShowCart(false)}
                    className="h-11 w-full text-center text-sm font-medium text-charcoal/60 transition-colors hover:text-charcoal"
                  >
                    Keep browsing
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
