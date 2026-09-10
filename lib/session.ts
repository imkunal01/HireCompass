/**
 * lib/session.ts
 *
 * Custom JWT-based auth (replaces NextAuth).
 *
 * Strategy:
 *  - JWT is signed with HS256 using JWT_SECRET env var
 *  - Token is stored in an httpOnly, Secure, SameSite=Lax cookie named "auth-token"
 *  - Token expiry: 30 days (refreshed on activity is an optional future improvement)
 *  - Payload contains ONLY: { sub: userId, name, email } — no sensitive data
 *
 * Best practices applied:
 *  - httpOnly cookie → XSS-proof (JS cannot read it)
 *  - SameSite=Lax    → CSRF protection for most cases
 *  - Secure flag      → HTTPS-only in production
 *  - Short payload    → minimal JWT surface area
 *  - HS256            → fast, symmetric signing appropriate for single-server apps
 */

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "auth-token"
const TOKEN_EXPIRY = "30d"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random 64-char string in .env"
    )
  }
  return new TextEncoder().encode(secret)
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role?: string
}

export interface Session {
  user: SessionUser
}

// ─── Token Operations ──────────────────────────────────────────────────────

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role || "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || !payload.email) return null
    return {
      id: payload.sub,
      name: (payload.name as string) || "",
      email: payload.email as string,
      role: (payload.role as string) || "user",
    }
  } catch {
    // Token expired, invalid signature, malformed — all treated as unauthenticated
    return null
  }
}

/**
 * Guard for Admin API routes.
 * Returns { session } or { errorResponse }
 */
export async function requireAdmin(request: NextRequest): Promise<
  { session: Session; errorResponse: null } | { session: null; errorResponse: NextResponse }
> {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (session.user.role !== "admin") {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    }
  }

  return { session, errorResponse: null }
}

// ─── Cookie Helpers ────────────────────────────────────────────────────────

export function cookieOptions(maxAge: number) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge, // seconds
  }
}

/** Set auth cookie after successful login / signup (call from Route Handlers) */
export async function setAuthCookie(
  res: Response,
  user: SessionUser
): Promise<string> {
  const token = await signToken(user)
  const age = 30 * 24 * 60 * 60 // 30 days in seconds
  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  )
  return token
}

// ─── Session Getters ───────────────────────────────────────────────────────

/**
 * Use in API Route Handlers (App Router).
 * Reads the auth cookie from the incoming Request object.
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const user = await verifyToken(token)
  if (!user) return null
  return { user }
}

/**
 * Use in Server Components / layouts.
 * Reads the auth cookie from the Next.js cookie store.
 */
export async function getServerSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const user = await verifyToken(token)
  if (!user) return null
  return { user }
}
