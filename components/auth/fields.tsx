"use client"
import * as React from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Input styled for the cream auth surface: 44px tall (touch-friendly), white fill, brand focus ring. */
export const authInputClass =
  "h-11 rounded-lg border-cream-border bg-white px-3.5 text-base text-charcoal shadow-none placeholder:text-charcoal/40 " +
  "focus-visible:border-brand focus-visible:ring-brand/25 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:bg-white dark:text-charcoal"

interface FieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string
  label: string
  error?: string
  /** Rendered on the right of the label row (e.g. "Forgot password?"). */
  labelAction?: React.ReactNode
}

export const AuthField = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ id, label, error, labelAction, className, ...props }, ref) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm text-charcoal">{label}</Label>
        {labelAction}
      </div>
      <Input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(authInputClass, className)}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
)
AuthField.displayName = "AuthField"

export const AuthPasswordField = React.forwardRef<
  HTMLInputElement,
  Omit<FieldProps, "type"> & { children?: React.ReactNode }
>(({ id, label, error, labelAction, className, children, ...props }, ref) => {
  const [show, setShow] = React.useState(false)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm text-charcoal">{label}</Label>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(authInputClass, "pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-charcoal/45 transition-colors hover:text-charcoal focus-visible:text-charcoal focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})
AuthPasswordField.displayName = "AuthPasswordField"

export function AuthSubmit({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean
  loadingLabel: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-11 w-full rounded-lg bg-charcoal text-[0.9375rem] font-medium text-cream transition-colors hover:bg-charcoal/90 focus-visible:border-brand focus-visible:ring-brand/30"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      {children}
    </div>
  )
}

export const authLinkClass =
  "font-medium text-brand-ink underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
