export interface AdminTokenPair {
  access_token: string
  refresh_token: string
}

export function saveAdminTokens(pair: AdminTokenPair) {
  localStorage.setItem("admin_access_token", pair.access_token)
  localStorage.setItem("admin_refresh_token", pair.refresh_token)
}

export function clearAdminTokens() {
  localStorage.removeItem("admin_access_token")
  localStorage.removeItem("admin_refresh_token")
}

export function getAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_access_token")
}

export function getAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_refresh_token")
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminAccessToken()
}