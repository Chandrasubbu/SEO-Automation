import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

// Use a separate auth instance for middleware to avoid bundling Prisma/bcrypt
const { auth } = NextAuth(authConfig)

// Routes that require authentication
const protectedRoutes = [
    "/analytics",
    "/workflows",
    // "/content-audit", 
]

// Routes that are only accessible when not authenticated
const authRoutes = ["/login", "/register"]

// Admin-only routes
const adminRoutes = ["/admin"]

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    )
    const isAdminRoute = adminRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    )

    // Redirect logged-in users away from auth pages
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", req.url)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Check admin access
    if (isAdminRoute) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
        if (req.auth?.user?.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Match all routes except static files and API routes
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
