import Link from "next/link"
import { Logo } from "@/components/brand/logo"

const cols = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#payments", label: "Payments" },
      { href: "/#qr-codes", label: "QR codes" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Start free trial" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-charcoal px-6 pt-14 pb-8 text-cream">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo variant="horizontal" tone="reversed" className="h-7" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/55">
              QR ordering, a live kitchen screen and sales in one system for Kenyan restaurants.
            </p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">{c.title}</p>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-cream/70 transition-colors hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-cream/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Mezzani. All rights reserved.</p>
          <p>Built in Nairobi</p>
        </div>
      </div>
    </footer>
  )
}
