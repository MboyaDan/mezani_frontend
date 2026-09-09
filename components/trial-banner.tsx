"use client"
import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { X, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function TrialBanner() {
  const { user, loading } = useUser()
  const [dismissed, setDismissed] = useState(false)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (loading || !user?.subscription_expires_at) {
      setDaysLeft(null)
      return
    }
    const expiresAt = new Date(user.subscription_expires_at)
    const left = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    setDaysLeft(left)
  }, [user, loading])

  const isExpiring = daysLeft !== null && daysLeft <= 7
  const isCritical = daysLeft !== null && daysLeft <= 3

  useEffect(() => {
    const dismissedAt = localStorage.getItem("trial_banner_dismissed")
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000 && !isCritical) {
        setDismissed(true)
      }
    }
  }, [isCritical])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("trial_banner_dismissed", new Date().toISOString())
  }

  if (loading || !isExpiring || dismissed || daysLeft === null) return null

  const bannerConfig = isCritical
    ? {
        bg: "bg-red-50 border-red-200",
        text: "text-red-700",
        badge: "bg-red-500",
        badgeText: "text-white",
        message: `Your subscription ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`,
        sub: "Renew now to avoid losing access to your restaurant data",
        canDismiss: false,
      }
    : {
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100",
        badgeText: "text-amber-700",
        message: `${daysLeft} days left on your subscription`,
        sub: "Renew to keep your menus, staff and order history",
        canDismiss: true,
      }

  return (
    <div className={cn(
      "border-b px-6 py-3 flex items-center justify-between gap-4",
      bannerConfig.bg
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0",
          bannerConfig.badge, bannerConfig.badgeText
        )}>
          <Clock className="w-3 h-3" />
          Trial
        </div>
        <div className="min-w-0">
          <span className={cn("text-sm font-semibold", bannerConfig.text)}>
            {bannerConfig.message}
          </span>
          <span className={cn("text-xs ml-2 hidden sm:inline", bannerConfig.text, "opacity-70")}>
            — {bannerConfig.sub}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/billing/renew"
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors",
            isCritical
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          <Zap className="w-3 h-3" />
          Renew now
        </Link>
        {bannerConfig.canDismiss && (
          <button
            onClick={handleDismiss}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              "hover:bg-amber-100 text-amber-500"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}