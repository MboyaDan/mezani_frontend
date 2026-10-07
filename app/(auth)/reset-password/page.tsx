"use client"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import API from "@/lib/client"
import { AuthShell, AuthHeading } from "@/components/auth/auth-shell"
import { AuthPasswordField, AuthSubmit, AuthError, authLinkClass } from "@/components/auth/fields"

const schema = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      await API.post("/auth/reset-password", {
        token,
        new_password: data.new_password,
      })
      setDone(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Reset failed. Link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div>
        <AuthHeading
          title="This reset link isn't valid"
          description="It may have expired or already been used. Request a fresh one from the sign in page."
        />
        <Link href="/login" className={authLinkClass}>Back to sign in</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div role="status">
        <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-5 text-emerald-700" aria-hidden />
        </div>
        <AuthHeading title="Password updated" description="Taking you back to sign in…" />
      </div>
    )
  }

  return (
    <div>
      <AuthHeading title="Set a new password" description="Choose a password you haven't used before." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthPasswordField
          id="new_password"
          label="New password"
          autoComplete="new-password"
          autoFocus
          placeholder="At least 6 characters"
          error={errors.new_password?.message}
          {...register("new_password")}
        />
        <AuthPasswordField
          id="confirm_password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />
        {error && <AuthError>{error}</AuthError>}
        <AuthSubmit loading={loading} loadingLabel="Updating…">Update password</AuthSubmit>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell headline="Back in, in a moment.">
      <Suspense fallback={<Loader2 className="mx-auto size-5 animate-spin text-charcoal/40" aria-label="Loading" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
