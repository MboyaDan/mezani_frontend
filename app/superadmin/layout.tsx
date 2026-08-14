"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isAdminLoggedIn } from "@/lib/adminAuth"
import { Loader2 } from "lucide-react"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  const isLoginPage = pathname === "/superadmin/login"

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true)
      return
    }
    if (!isAdminLoggedIn()) {
      router.replace("/superadmin/login")
      return
    }
    setChecked(true)
  }, [isLoginPage, router])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return <>{children}</>
}