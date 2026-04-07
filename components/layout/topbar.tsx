"use client"

import { useUser } from "@/hooks/useUser"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user, loading } = useUser()

  const userInitials =
    user?.role?.slice(0, 2).toUpperCase() ?? ".."

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

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