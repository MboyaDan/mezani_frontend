import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/kitchen", "/waiter"]
const authRoutes = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check localStorage isn't available in middleware
  // Use a cookie set on login instead
  const token = req.cookies.get("access_token")?.value

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r))

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|menu).*)"],
}