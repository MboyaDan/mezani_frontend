"use client"
import { useState, useEffect } from "react"
import { getTrialInfo } from "@/lib/auth"
import { X, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function TrialBanner() {
  const [trial, setTrial] = useState<ReturnType<typeof getTrialInfo>>(null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const info = getTrialInfo()
    setTrial(info)

    // Check if dismissed today
    const dismissedAt = localStorage.getItem("trial_banner_dismissed")
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      // Re-show after 24 hours unless critical
      if (
        now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000 &&
        !info?.isCritical
      ) {
        setDismissed(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("trial_banner_dismissed", new Date().toISOString())
  }

  // Don't render on server, don't show if not expiring, don't show if dismissed
  if (!mounted || !trial || !trial.isExpiring || dismissed) return null

  // Don't show to non-owners
  const user = trial // already computed
  
  const bannerConfig = trial.isCritical
    ? {
        bg: "bg-red-50 border-red-200",
        text: "text-red-700",
        badge: "bg-red-500",
        badgeText: "text-white",
        message: `Your free trial ends in ${trial.daysLeft} ${trial.daysLeft === 1 ? "day" : "days"}`,
        sub: "Upgrade now to avoid losing access to your restaurant data",
        canDismiss: false, // can't dismiss when critical
      }
    : {
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100",
        badgeText: "text-amber-700",
        message: `${trial.daysLeft} days left on your free trial`,
        sub: "Upgrade to keep your menus, staff and order history",
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
          href="/#pricing"
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors",
            trial.isCritical
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          <Zap className="w-3 h-3" />
          Upgrade now
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