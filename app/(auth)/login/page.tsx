"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import API from "@/lib/client"

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

type View = "login" | "forgot" | "forgot-sent"

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

  return (
    <Card className="rounded-2xl border border-zinc-200 shadow-sm">
      <CardHeader>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-2 -ml-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </button>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-zinc-900">Check your email</p>
            <p className="text-xs text-zinc-500">
              If that address is registered, a reset link is on its way.
            </p>
            <button
              onClick={onBack}
              className="text-sm text-orange-500 hover:underline mt-2"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@restaurant.com"
                {...register("email")}
                className="rounded-xl"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// ── Login Form ────────────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { login, loading, error } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <Card className="rounded-2xl border border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => login(data.email, data.password))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@restaurant.com"
              {...register("email")}
              className="rounded-xl"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={onForgot}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="rounded-xl"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </Button>

          <p className="text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <a href="/register" className="text-zinc-900 font-medium hover:underline">
              Create one
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function LoginPage() {
  const [view, setView] = useState<View>("login")

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Mezzani</h1>
          <p className="text-zinc-500 mt-1">Restaurant Management</p>
        </div>

        {view === "login" && (
          <LoginForm onForgot={() => setView("forgot")} />
        )}
        {(view === "forgot" || view === "forgot-sent") && (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}
      </div>
    </div>
  )
}