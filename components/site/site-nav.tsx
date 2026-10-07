"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/brand/logo"

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#payments", label: "Payments" },
  { href: "/#mezzani-ai", label: "Mezzani AI" },
  { href: "/#qr-codes", label: "QR Codes" },
  { href: "/#pricing", label: "Pricing" },
]

const linkClass =
  "text-sm text-charcoal/70 transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand rounded-sm"

/**
 * Fixed top bar. Solid cream (not translucent) so it never turns grey over the
 * dark sections. Collapses to a menu on small screens; the previous version had
 * no navigation at all below the md breakpoint.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cream-border bg-cream">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          aria-label="Mezzani home"
          className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Logo variant="horizontal" className="h-7" />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkClass}>{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className={`hidden sm:inline ${linkClass} font-medium text-charcoal`}>
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-charcoal px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-charcoal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex size-10 items-center justify-center rounded-lg text-charcoal hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-cream-border bg-cream px-6 pb-6 pt-2 md:hidden">
          <ul className="divide-y divide-cream-border">
            {[...links, { href: "/login", label: "Log in" }].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-base font-medium text-charcoal"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
