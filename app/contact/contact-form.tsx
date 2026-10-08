"use client"
import { useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { contactAPI } from "@/lib/api/contact"
import { AuthField, AuthSubmit, AuthError, authInputClass, authLinkClass } from "@/components/auth/fields"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const MAX_MESSAGE = 2000

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("") // honeypot, see below
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessageError(undefined)

    if (message.trim().length < 10) {
      setMessageError("Please give us a bit more detail so we can help properly.")
      return
    }

    setLoading(true)
    try {
      await contactAPI.send({ name, email, message, website })
      setSent(true)
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number; data?: { error?: string } } }
      const status = apiError?.response?.status
      // A 400 is the server's raw validation text ("Key: 'ContactRequest.Email' Error:..."),
      // which is meaningless to a visitor. Say what to do instead.
      setError(
        status === 400
          ? "Please check your name, email address and message, then try again."
          : status === 429
          ? "You've sent a few messages in a row. Please wait a moment and try again."
          : apiError?.response?.data?.error ??
            "Something went wrong sending your message. Please try again, or email us directly."
      )
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="py-10 text-center sm:py-14">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-7 text-emerald-700" aria-hidden />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-charcoal/65">
          Thanks for reaching out. We&apos;ll reply to <span className="font-medium text-charcoal">{email}</span>,
          usually within a day.
        </p>
        <Link href="/" className={cn(authLinkClass, "mt-6 inline-block text-sm")}>
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        id="name"
        label="Your name"
        type="text"
        autoComplete="name"
        required
        minLength={2}
        maxLength={100}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Jane Wanjiku"
      />

      <AuthField
        id="email"
        label="Your email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jane@myrestaurant.co.ke"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="message" className="text-sm text-charcoal">How can we help?</Label>
          <span
            className={cn("text-xs tabular-nums", message.length > MAX_MESSAGE - 100 ? "text-amber-700" : "text-charcoal/40")}
            aria-live="polite"
          >
            {message.length}/{MAX_MESSAGE}
          </span>
        </div>
        <textarea
          id="message"
          required
          minLength={10}
          maxLength={MAX_MESSAGE}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={messageError ? "message-error" : undefined}
          placeholder="Tell us about your restaurant: how many branches, how you take orders today, and what you're hoping to fix."
          className={cn(
            authInputClass,
            "h-auto min-h-36 w-full resize-y rounded-lg border px-3.5 py-3 leading-relaxed outline-none transition-colors focus:border-brand focus:ring-3 focus:ring-brand/25",
            messageError && "border-red-500"
          )}
        />
        {messageError && (
          <p id="message-error" role="alert" className="text-sm text-red-600">{messageError}</p>
        )}
      </div>

      {/* Honeypot: invisible to people, tempting to bots that fill every field. The
          backend silently discards any submission where this is non-empty. */}
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

      {error && <AuthError>{error}</AuthError>}

      <AuthSubmit loading={loading} loadingLabel="Sending…">Send message</AuthSubmit>

      <p className="text-center text-xs leading-relaxed text-charcoal/50">
        We only use your details to reply to you. See our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-charcoal">Privacy Policy</Link>.
      </p>
    </form>
  )
}
