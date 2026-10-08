"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import { decodeToken } from "@/lib/auth"
import { JWTPayload } from "@/types"
import { BranchSelector } from "@/components/branch/branch-selector"
import { useBranch } from "@/hooks/useBranch"
import {
  LayoutDashboard, UtensilsCrossed, Users,
  TableProperties, BarChart3, Package,
  ChefHat, LogOut, ShoppingBag, Network, Sparkles, X
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useSidebar } from "@/components/layout/sidebar-context"
import { Logo } from "@/components/brand/logo"

const ALL_ROLES = ["owner", "manager", "waiter", "kitchen", "cashier"]

// Grouped by what the person is doing, not by feature name. Nine flat links was a wall.
const navGroups = [
  {
    label: null,
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager"] },
    ],
  },
  {
    label: "Service",
    items: [
      { label: "Orders",          href: "/dashboard/orders", icon: ShoppingBag,     roles: ["owner", "manager", "waiter"] },
      { label: "Tables",          href: "/dashboard/tables", icon: TableProperties, roles: ["owner", "manager", "waiter"] },
      { label: "Kitchen display", href: "/kitchen",          icon: ChefHat,         roles: ALL_ROLES },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Menu",      href: "/dashboard/menu",      icon: UtensilsCrossed, roles: ["owner", "manager"] },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package,         roles: ["owner", "manager"] },
      { label: "Staff",     href: "/dashboard/staff",     icon: Users,           roles: ["owner", "manager"] },
      { label: "Branches",  href: "/dashboard/branches",  icon: Network,         roles: ["owner"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics",    href: "/dashboard/analytics", icon: BarChart3, roles: ["owner", "manager"] },
      { label: "AI assistant", href: "/dashboard/ai",        icon: Sparkles,  roles: ["owner", "manager"] },
    ],
  },
]

// The token lives in localStorage (an external store). Reading it with
// useSyncExternalStore gives the server snapshot (null) on first paint, then the real
// value after hydration, with no setState-in-effect and no hydration mismatch.
const noopSubscribe = () => () => {}
function useStoredToken(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem("access_token"),
    () => null
  )
}
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { branchId, selectBranch } = useBranch()
  const { isOpen, close } = useSidebar()
  const mounted = useHydrated()
  const token = useStoredToken()
  const user: JWTPayload | null = useMemo(() => (token ? decodeToken(token) : null), [token])

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    close()
  }, [pathname, close])

  // Escape closes the mobile drawer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-charcoal" />
    )
  }

  const groups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => (user?.role ? item.roles.includes(user.role) : false)),
    }))
    .filter((g) => g.items.length > 0)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col w-64 min-h-screen bg-charcoal text-cream",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" aria-label="Mezzani dashboard" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light">
            <Logo variant="horizontal" tone="reversed" className="h-6" />
          </Link>
          <button
            onClick={close}
            className="flex size-10 items-center justify-center rounded-lg text-cream/60 transition-colors hover:bg-white/5 hover:text-cream md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user?.tname && (
          <p className="mt-4 truncate text-sm font-medium text-cream">{user.tname}</p>
        )}
        <p className="mt-0.5 text-xs capitalize text-cream/45">{user?.role ?? ""}</p>
      </div>

      {/* Nav */}
      <nav aria-label="Dashboard" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => (
          <div key={g.label ?? gi}>
            {g.label && (
              <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-cream/35">
                {g.label}
              </p>
            )}
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-light",
                      active
                        ? "bg-brand-light/12 text-brand-light"
                        : "text-cream/60 hover:bg-white/5 hover:text-cream"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Branch Selector */}
      {(user?.role === "owner") && (
        <div className="px-3 pb-2 border-t border-white/10 pt-3">
          <p className="mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-cream/35">Branch</p>
          <BranchSelector
            currentBranchId={branchId}
            onSelect={(id, name) => {
              selectBranch(id, name)
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-cream/60 hover:bg-white/5 hover:text-red-300 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-light"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
      </aside>
    </>
  )
}