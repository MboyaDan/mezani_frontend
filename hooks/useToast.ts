import { useState, useCallback } from "react"

type ToastType = "success" | "error" | "warning"

interface Toast {
  id: number
  type: ToastType
  message: string
  sub?: string
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string, sub?: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message, sub }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return { toasts, toast }
}