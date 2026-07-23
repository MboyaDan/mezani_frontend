"use client"

import { useUser } from "@/hooks/useUser"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Menu } from "lucide-react"
import { useSidebar } from "@/components/layout/sidebar-context"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user, loading } = useUser()
  const { open } = useSidebar()

  const userInitials =
    user?.role?.slice(0, 2).toUpperCase() ?? ".."

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center gap-3 justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={open}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-zinc-600" />
        </button>
        <h2 className="text-lg font-semibold text-zinc-900 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <Bell className="w-5 h-5 text-zinc-500" />
        </button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-zinc-900 text-white text-xs">
            {loading ? ".." : userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}