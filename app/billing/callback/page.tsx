"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { subscriptionAPI } from "@/lib/api/subscription"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

type Status = "verifying" | "success" | "failed"

function BillingCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>("verifying")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const reference = searchParams.get("reference") ?? searchParams.get("trxref")

    if (!reference) {
      setStatus("failed")
      setMessage("No payment reference found in the redirect — please contact support if you were charged.")
      return
    }

    subscriptionAPI
      .verify(reference)
      .then(() => {
        setStatus("success")
        setTimeout(() => router.push("/dashboard"), 2500)
      })
      .catch((err) => {
        setStatus("failed")
        setMessage(
          err?.response?.data?.error ??
            "We couldn't confirm this payment yet. If you were charged, it may still be processing — check back in a minute or contact support."
        )
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 text-center">
      {status === "verifying" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900">Confirming your payment...</h1>
          <p className="text-zinc-500 mt-1 text-sm">This only takes a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900">Payment confirmed</h1>
          <p className="text-zinc-500 mt-1 text-sm">Your subscription is active. Redirecting you to the dashboard...</p>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle className="w-14 h-14 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900">We couldn&apos;t confirm this payment</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-sm">{message}</p>
          <button
            onClick={() => router.push("/billing/renew")}
            className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to plans
          </button>
        </>
      )}
    </div>
  )
}

// useSearchParams() forces this page out of static prerendering unless
// wrapped in Suspense — Next.js needs a fallback to show while it
// resolves the search params on the client. The actual logic lives in
// BillingCallbackContent above; this default export just provides the
// boundary Next.js requires.
export default function BillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      }
    >
      <BillingCallbackContent />
    </Suspense>
  )
}