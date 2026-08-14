"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginData = z.infer<typeof loginSchema>

export default function SuperAdminLoginPage() {
  const { login, loading, error } = useAdminAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mezzani Platform</h1>
          <p className="text-zinc-400 mt-1 text-sm">Superadmin access only</p>
        </div>

        <Card className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription className="text-zinc-400">
              This account has access to every tenant on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => login(data.email, data.password))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@els.dev"
                  {...register("email")}
                  className="rounded-xl bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="rounded-xl bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-950 border border-red-900 p-3 text-sm text-red-400">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}