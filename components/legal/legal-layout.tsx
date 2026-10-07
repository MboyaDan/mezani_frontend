import Link from "next/link"
import { SiteNav } from "@/components/site/site-nav"
import { SiteFooter } from "@/components/site/site-footer"

export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <>
      <SiteNav />
      <main className="bg-cream px-6 pt-32 pb-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium text-brand-ink">Legal</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-charcoal/55">Last updated {updated}</p>
          <p className="mt-8 text-lg leading-relaxed text-charcoal/75">{intro}</p>
          <div className="mt-12 space-y-12">{children}</div>
          <p className="mt-16 border-t border-cream-border pt-6 text-sm text-charcoal/55">
            Questions about this page?{" "}
            <Link href="/contact" className="font-medium text-brand-ink underline-offset-4 hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`s${n}`} className="scroll-mt-24">
      <h2 id={`s${n}`} className="text-xl font-semibold text-charcoal">
        <span className="mr-3 tabular-nums text-brand">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-charcoal/75">{children}</div>
    </section>
  )
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-brand">{children}</ul>
}
