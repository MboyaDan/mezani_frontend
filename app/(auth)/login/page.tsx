"use client"
import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/useAuth"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import API from "@/lib/client"
import { AuthShell, AuthHeading } from "@/components/auth/auth-shell"
import {
  AuthField, AuthPasswordField, AuthSubmit, AuthError, authLinkClass,
} from "@/components/auth/fields"

// ── Schemas ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const forgotSchema = z.object({
  email: z.string().email("Invalid email"),
})

type LoginData = z.infer<typeof loginSchema>
type ForgotData = z.infer<typeof forgotSchema>

type View = "login" | "forgot"

// ── Forgot Password Form ──────────────────────────────────
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotData) => {
    setLoading(true)
    setError(null)
    try {
      await API.post("/auth/forgot-password", { email: data.email })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="mb-6 -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-charcoal/60 transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-brand"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Back to sign in
    </button>
  )

  if (done) {
    return (
      <div role="status">
        {back}
        <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-5 text-emerald-700" aria-hidden />
        </div>
        <AuthHeading
          title="Check your email"
          description="If that address is registered, a reset link is on its way. It may take a minute to arrive."
        />
      </div>
    )
  }

  return (
    <div>
      {back}
      <AuthHeading
        title="Forgot your password?"
        description="Enter your email and we'll send you a link to reset it."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@restaurant.com"
          error={errors.email?.message}
          {...register("email")}
        />
        {error && <AuthError>{error}</AuthError>}
        <AuthSubmit loading={loading} loadingLabel="Sending link…">Send reset link</AuthSubmit>
      </form>
    </div>
  )
}

// ── Login Form ────────────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { login, loading, error } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div>
      <AuthHeading title="Welcome back" description="Sign in to manage your restaurant." />
      <form
        onSubmit={handleSubmit((data) => login(data.email, data.password))}
        className="space-y-5"
        noValidate
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@restaurant.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthPasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          labelAction={
            <button
              type="button"
              onClick={onForgot}
              className="rounded text-sm text-charcoal/60 transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-brand"
            >
              Forgot password?
            </button>
          }
          {...register("password")}
        />

        {error && <AuthError>{error}</AuthError>}

        <AuthSubmit loading={loading} loadingLabel="Signing in…">Sign in</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/65">
        New to Mezzani?{" "}
        <Link href="/register" className={authLinkClass}>Create an account</Link>
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function LoginPage() {
  const [view, setView] = useState<View>("login")

  return (
    <AuthShell>
      {view === "login" ? (
        <LoginForm onForgot={() => setView("forgot")} />
      ) : (
        <ForgotPasswordForm onBack={() => setView("login")} />
      )}
    </AuthShell>
  )
}
