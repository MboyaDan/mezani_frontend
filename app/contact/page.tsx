import type { Metadata } from "next"
import Link from "next/link"
import { Mail, LifeBuoy, ArrowRight } from "lucide-react"
import { SiteNav } from "@/components/site/site-nav"
import { SiteFooter } from "@/components/site/site-footer"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about pricing, setup or whether Mezzani fits your restaurant? Talk to us.",
}

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <main className="bg-cream px-6 pt-32 pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">

          {/* Left: who we are and the other ways to reach us */}
          <div>
            <p className="text-sm font-medium text-brand-ink">Contact</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-charcoal sm:text-5xl">
              Talk to us
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-charcoal/65">
              Questions about pricing, setting up your restaurant, or whether Mezzani fits how you work?
              Send us a message and a real person will reply.
            </p>

            <ul className="mt-10 space-y-6">
              <li className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-charcoal text-brand-light">
                  <Mail className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold text-charcoal">Prefer email?</h2>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/65">
                    Write to us directly and we&apos;ll pick it up.
                  </p>
                  <a
                    href="mailto:jengatechhub@gmail.com"
                    className="mt-1.5 inline-block break-all text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
                  >
                    jengatechhub@gmail.com
                  </a>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-charcoal text-brand-light">
                  <LifeBuoy className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold text-charcoal">Setting up a restaurant?</h2>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/65">
                    We onboard every restaurant personally: menu setup, QR codes and staff accounts. Tell us
                    about your setup and we&apos;ll walk you through it.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-10 rounded-2xl bg-charcoal p-6 text-cream">
              <h2 className="font-semibold">Just want to try it?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/65">
                You don&apos;t need to talk to us first. Start a free 14-day trial, no card required.
              </p>
              <Link
                href="/register"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-light px-5 text-sm font-medium text-charcoal transition-colors hover:bg-brand-light/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light"
              >
                Start free trial
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Right: the form */}
          <div className="relative self-start rounded-2xl border border-cream-border bg-white p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
