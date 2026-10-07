"use client"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/useAuth"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthShell, AuthHeading } from "@/components/auth/auth-shell"
import {
  AuthField, AuthPasswordField, AuthSubmit, AuthError, authLinkClass,
} from "@/components/auth/fields"

const schema = z.object({
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

interface StrengthResult {
  score: number
  label: string
  color: string
  barColor: string
}

function getStrength(password: string): StrengthResult {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  // Semantic scale kept off brand orange so "Fair" never reads as a brand highlight
  const levels: StrengthResult[] = [
    { score: 0, label: "", color: "", barColor: "" },
    { score: 1, label: "Weak", color: "text-red-600", barColor: "bg-red-500" },
    { score: 2, label: "Fair", color: "text-amber-700", barColor: "bg-amber-500" },
    { score: 3, label: "Good", color: "text-lime-700", barColor: "bg-lime-600" },
    { score: 4, label: "Strong", color: "text-emerald-700", barColor: "bg-emerald-600" },
  ]
  return levels[score]
}

export default function RegisterPage() {
  const { register: registerOwner, loading, error } = useAuth()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch("password") ?? ""
  const strength = getStrength(password)

  const reqs = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  return (
    <AuthShell
      headline="Set up your restaurant in an afternoon."
      points={[
        "14-day free trial, no card needed",
        "Add your menu, print table QR codes, and take orders the same day",
        "Works on any phone, tablet or computer",
      ]}
    >
      <AuthHeading title="Create your account" description="Start managing your restaurant today." />

      <form
        onSubmit={handleSubmit((data) =>
          registerOwner(data.restaurantName, data.email, data.password)
        )}
        className="space-y-5"
        noValidate
      >
        <AuthField
          id="restaurantName"
          label="Restaurant name"
          autoComplete="organization"
          placeholder="Mezzani Nairobi"
          error={errors.restaurantName?.message}
          {...register("restaurantName")}
        />

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
          autoComplete="new-password"
          placeholder="Create a password"
          error={errors.password?.message}
          {...register("password")}
        >
          {/* Strength meter — only once the user starts typing */}
          {password.length > 0 && (
            <div className="space-y-2.5 pt-1" aria-live="polite">
              <div className="flex items-center gap-3">
                <div className="flex flex-1 gap-1" aria-hidden>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        i <= strength.score ? strength.barColor : "bg-charcoal/10"
                      )}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className={cn("w-12 text-right text-xs font-medium", strength.color)}>
                    {strength.label}
                  </p>
                )}
              </div>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {reqs.map((req) => (
                  <li
                    key={req.label}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      req.met ? "text-emerald-700" : "text-charcoal/50"
                    )}
                  >
                    {req.met
                      ? <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                      : <Circle className="size-3 shrink-0" aria-hidden />}
                    <span>
                      {req.label}
                      <span className="sr-only">{req.met ? " (met)" : " (not met)"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AuthPasswordField>

        <AuthPasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {error && <AuthError>{error}</AuthError>}

        <AuthSubmit loading={loading} loadingLabel="Creating account…">Create account</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/65">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>Sign in</Link>
      </p>
    </AuthShell>
  )
}
