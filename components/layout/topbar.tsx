"use client"

import { useUser } from "@/hooks/useUser"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/layout/sidebar-context"

interface TopbarProps {
  title: string
}

function initialsFrom(...sources: (string | undefined)[]): string {
  const source = sources.find((s) => s && s.trim())
  if (!source) return ""
  const words = source.trim().split(/[\s@._-]+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase()
}

export function Topbar({ title }: TopbarProps) {
  const { user, loading } = useUser()
  const { open } = useSidebar()

  const initials = loading ? "" : initialsFrom(user?.name, user?.email, user?.tname, user?.role)
  // Sign-up only asks for the restaurant name, so an owner's account name can be the
  // literal role ("Owner"), which made the corner read "Owner / Owner". In that case
  // show the email as the secondary line instead of repeating the role.
  const nameIsRole = !!user?.name && user.name.trim().toLowerCase() === (user.role ?? "").toLowerCase()
  const displayName = user?.name || user?.email
  const secondary = nameIsRole ? user?.email : user?.role

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-cream-border bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={open}
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-charcoal/70 transition-colors hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="truncate text-lg font-semibold tracking-tight text-charcoal">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          {displayName && <p className="max-w-48 truncate text-sm font-medium text-charcoal">{displayName}</p>}
          {secondary && (
            <p className={cn("max-w-48 truncate text-xs text-charcoal/50", !nameIsRole && "capitalize")}>{secondary}</p>
          )}
        </div>
        <Avatar className="size-9">
          <AvatarFallback className="bg-charcoal text-xs font-medium text-cream">
            {initials || ".."}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
