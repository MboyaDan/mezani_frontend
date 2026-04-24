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
    return {
      uid:   decoded.uid,
      tid:   decoded.tid,
      tname: decoded.tname,
      bid:   decoded.bid,
      role:  decoded.role,
      tca:   decoded.tca,
      plan:  decoded.plan,
      exp:   decoded.exp,
      iat:   decoded.iat,
    }
  } catch {
    return null
  }
}

export function getCurrentUser(): JWTPayload | null {
  if (typeof window === "undefined") return null
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

// Helper to get trial info
export function getTrialInfo(): {
  daysLeft: number
  isExpired: boolean
  isExpiring: boolean  // <= 7 days
  isCritical: boolean  // <= 3 days
  plan: string
  trialEndsAt: Date
} | null {
  const user = getCurrentUser()
  if (!user?.tca) return null

  const TRIAL_DAYS = 14
  const trialEndsAt = new Date((user.tca + TRIAL_DAYS * 86400) * 1000)
  const now = new Date()
  const msLeft = trialEndsAt.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

  return {
    daysLeft,
    isExpired:  daysLeft === 0,
    isExpiring: daysLeft <= 7,
    isCritical: daysLeft <= 3,
    plan:       user.plan ?? "tier1",
    trialEndsAt,
  }
}