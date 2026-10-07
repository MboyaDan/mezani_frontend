"use client"
import { useState } from "react"
import Link from "next/link"
import { Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react"
import { contactAPI } from "@/lib/api/contact"
import { Logo } from "@/components/brand/logo"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("") // honeypot — see below
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (message.trim().length < 10) {
      setError("Please give us a bit more detail so we can help properly.")
      return
    }

    setLoading(true)
    try {
      await contactAPI.send({ name, email, message, website })
      setSent(true)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } }
      setError(
        apiError?.response?.data?.error ??
          "Something went wrong sending your message. Please try again, or email us directly."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Mezzani home" className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Logo variant="horizontal" className="h-7" />
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900">Talk to us</h1>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto leading-relaxed">
            Questions about pricing, setting up your restaurant, or whether Mezzani
            fits how you work? Send us a message — a real person will reply.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8">
              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-zinc-900">Message sent</h2>
                  <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Thanks for reaching out — we&apos;ll get back to you as soon as we can,
                    usually within a day.
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-6 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    ← Back to home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Your name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Wanjiku"
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Your email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@myrestaurant.co.ke"
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
                    />
                    <p className="text-xs text-zinc-400 mt-1.5">We&apos;ll reply to this address.</p>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-1.5">
                      How can we help?
                    </label>
                    <textarea
                      id="message"
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your restaurant — how many branches, how you take orders today, and what you're hoping to fix."
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all resize-none"
                    />
                    <p className="text-xs text-zinc-400 mt-1.5">{message.length}/2000</p>
                  </div>

                  {/* Honeypot: hidden from real users, but bots that fill every
                      field will trip it. The backend silently discards any
                      submission where this is non-empty. Not aria-hidden alone —
                      tabIndex={-1} and autoComplete="off" keep it out of the way
                      of keyboard and screen-reader users too. */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="website">Website (leave this blank)</label>
                    <input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">Prefer email?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                Write to us directly and we&apos;ll pick it up.
              </p>
              <a
                href="mailto:jengatechhub@gmail.com"
                className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors break-all"
                >   
                
                jengatechhub@gmail.com
            </a>
              
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">Setting up a restaurant?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                We onboard every restaurant personally — menu setup, QR codes and
                staff accounts. Tell us about your setup and we&apos;ll walk you through it.
              </p>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Just want to try it?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                You don&apos;t need to talk to us first. Start a free 14-day trial — no card required.
              </p>
              <Link
                href="/register"
                className="block text-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}