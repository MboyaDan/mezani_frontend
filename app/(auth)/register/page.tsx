"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useCallback } from "react"
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

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

  const levels: StrengthResult[] = [
    { score: 0, label: "", color: "", barColor: "" },
    { score: 1, label: "Weak", color: "text-red-500", barColor: "bg-red-500" },
    { score: 2, label: "Fair", color: "text-orange-500", barColor: "bg-orange-500" },
    { score: 3, label: "Good", color: "text-yellow-500", barColor: "bg-yellow-500" },
    { score: 4, label: "Strong", color: "text-green-500", barColor: "bg-green-500" },
  ]
  return levels[score]
}

export default function RegisterPage() {
  const { register: registerOwner, loading, error } = useAuth()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const password = watch("password") ?? ""

  const strength = getStrength(password)

  const reqs = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Mezzani</h1>
          <p className="text-zinc-500 mt-1">Set up your restaurant</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Start managing your restaurant today</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) =>
                registerOwner(data.restaurantName, data.email, data.password)
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant name</Label>
                <Input
                  id="restaurantName"
                  placeholder="Mezzani Nairobi"
                  {...register("restaurantName")}
                />
                {errors.restaurantName && (
                  <p className="text-sm text-red-500">{errors.restaurantName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password with strength meter */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>

                {/* Strength bars — only show when user has typed */}
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i <= strength.score ? strength.barColor : "bg-zinc-200"
                          )}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={cn("text-xs font-medium", strength.color)}>
                        {strength.label}
                      </p>
                    )}
                    <div className="space-y-1.5 pt-1">
                      {reqs.map((req) => (
                        <div
                          key={req.label}
                          className={cn(
                            "flex items-center gap-2 text-xs transition-colors",
                            req.met ? "text-green-600" : "text-zinc-400"
                          )}
                        >
                          {req.met
                            ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                            : <Circle className="w-3 h-3 shrink-0" />
                          }
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirm
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <a href="/login" className="text-zinc-900 font-medium hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}