import { JWTPayload, TokenPair } from "@/types"

export function saveTokens(pair: TokenPair) {
  localStorage.setItem("access_token", pair.access_token)
  localStorage.setItem("refresh_token", pair.refresh_token)
  // Also set cookie for middleware
  document.cookie = `access_token=${pair.access_token}; path=/; max-age=900` // 15 mins
}

export function clearTokens() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  document.cookie = "access_token=; path=/; max-age=0"
}
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const base64 = token.split(".")[1]
    const decoded = JSON.parse(atob(base64))
    return decoded as JWTPayload
  } catch {
    return null
  }
}

export function getCurrentUser(): JWTPayload | null {
  const token = getAccessToken()
  if (!token) return null
  return decodeToken(token)
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  return decoded.exp * 1000 < Date.now()
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}
e