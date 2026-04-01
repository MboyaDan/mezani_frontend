import {  isAxiosError } from "axios"
import { ApiErrorResponse } from "@/types/api"

export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong"
): string {
  // 1. Axios errors — most specific, handles 99% of your API calls
  if (isAxiosError<ApiErrorResponse>(err)) {
    return err.response?.data?.error ?? fallback
  }

  // 2. Any other object shaped like { response: { data: { error } } }
  //    e.g. fetch-based clients or custom wrappers
  if (typeof err === "object" && err !== null && "response" in err) {
    const e = err as { response?: { data?: { error?: string } } }
    return e.response?.data?.error ?? fallback
  }

  // 3. Plain JS Error — checked last so Axios errors don't short-circuit here
  if (err instanceof Error) {
    return err.message
  }

  // 4. Unknown shape — return fallback
  return fallback
}