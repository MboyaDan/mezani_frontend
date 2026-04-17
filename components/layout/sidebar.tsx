"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth"
import { JWTPayload } from "@/types"
import { BranchSelector } from "@/components/branch/branch-selector"
import { useBranch } from "@/hooks/useBranch"
import {
  LayoutDashboard, UtensilsCrossed, Users,
  TableProperties, BarChart3, Package,
  ChefHat, LogOut, ShoppingBag, Network,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

const navItems = [
  { label: "Overview",   href: "/dashboard",            icon: LayoutDashboard, roles: ["owner", "manager"] },
  { label: "Orders",     href: "/dashboard/orders",     icon: ShoppingBag,     roles: ["owner", "manager", "waiter"] },
  { label: "Menu",       href: "/dashboard/menu",       icon: UtensilsCrossed, roles: ["owner", "manager"] },
  { label: "Tables",     href: "/dashboard/tables",     icon: TableProperties, roles: ["owner", "manager", "waiter"] },
  { label: "Staff",      href: "/dashboard/staff",      icon: Users,           roles: ["owner"] },
  { label: "Branches",   href: "/dashboard/branches",   icon: Network,         roles: ["owner"] },
  { label: "Inventory",  href: "/dashboard/inventory",  icon: Package,         roles: ["owner", "manager"] },
  { label: "Analytics",  href: "/dashboard/analytics",  icon: BarChart3,       roles: ["owner", "manager"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { branchId, selectBranch } = useBranch()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<JWTPayload | null>(null)

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUser())
  }, [])

  if (!mounted) {
    return (
      <aside className="flex flex-col w-64 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#111827]" />
    )
  }

  const filtered = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  )

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#111827] text-zinc-100">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Mezzani</h1>
        </div>

        {/* NOW FROM JWT */}
        {user?.tenant_name && (
          <p className="text-xs text-zinc-300 font-medium mt-1 ml-9 truncate">
            {user.tenant_name}
          </p>
        )}

        <p className="text-xs text-zinc-500 mt-0.5 capitalize ml-9">
          {user?.role ?? ""}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-orange-500/10 text-orange-400 border-l-4 border-orange-500 rounded-l-none pl-2"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Branch Selector */}
      {(user?.role === "owner" || user?.role === "manager") && (
        <div className="px-3 pb-2 border-t border-white/10 pt-3">
          <p className="text-xs text-zinc-500 px-3 mb-1">Current Branch</p>
          <BranchSelector
            currentBranchId={branchId}
            onSelect={(id, name) => {
              selectBranch(id, name)
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Kitchen shortcut */}
      <div className="px-3 pb-2">
        <Link
          href="/kitchen"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <ChefHat className="w-4 h-4" />
          Kitchen Display
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}