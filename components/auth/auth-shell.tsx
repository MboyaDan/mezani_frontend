import Link from "next/link"
import { Logo } from "@/components/brand/logo"

interface AuthShellProps {
  children: React.ReactNode
  /** Large line on the brand panel (desktop only). */
  headline?: string
  /** Short supporting facts under the headline. */
  points?: string[]
}

const DEFAULT_POINTS = [
  "A QR menu on every table, no app to download",
  "Orders reach the kitchen screen the moment they're placed",
  "Cash, M-Pesa and card payments recorded against every bill",
]

/**
 * Split-screen layout shared by sign in / sign up / reset password.
 * Desktop: charcoal brand panel + cream form panel.
 * Mobile: brand panel is hidden; the logo sits above the form.
 */
export function AuthShell({
  children,
  headline = "Every table, kitchen and till in one place.",
  points = DEFAULT_POINTS,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-charcoal text-cream lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Oversized mark, cropped — decorative */}
        <Logo
          variant="mark"
          tone="reversed"
          aria-hidden
          role="presentation"
          className="pointer-events-none absolute -right-24 -bottom-16 h-[26rem] opacity-[0.07]"
        />

        <Link href="/" aria-label="Mezzani home" className="relative w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light">
          <Logo variant="horizontal" tone="reversed" className="h-9" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-[2.75rem]">
            {headline}
          </h2>
          <ul className="mt-8 space-y-3 text-[0.9375rem] leading-relaxed text-cream/70">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand-light" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-cream/45">
          Built in Nairobi, for Kenyan restaurants.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-dvh flex-col bg-cream px-5 py-8 sm:px-8 lg:min-h-0">
        <div className="lg:hidden">
          <Link href="/" aria-label="Mezzani home" className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Logo variant="horizontal" className="h-8" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[22rem]">{children}</div>
        </div>

        <p className="text-center text-xs text-charcoal/55">
          Need a hand?{" "}
          <Link href="/contact" className="font-medium text-brand-ink underline-offset-4 hover:underline">
            Contact us
          </Link>
        </p>
      </main>
    </div>
  )
}

export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-charcoal">{title}</h1>
      {description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-charcoal/65">{description}</p>}
    </header>
  )
}
