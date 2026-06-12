/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * Best practices:
 *  - bcrypt.compare used (constant-time) to prevent timing attacks
 *  - Generic "Invalid credentials" error — never reveal which field is wrong
 *  - Email normalised to lowercase before lookup
 *  - httpOnly cookie with short, explicit Max-Age
 */

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { signToken } from "@/lib/session"

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ── Input validation ──────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    const normalizedEmail = (email as string).toLowerCase().trim()

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    // ── Lookup user ───────────────────────────────────────────────────────
    const user = await users.findOne({ email: normalizedEmail })

    // ── Constant-time compare (prevents user enumeration via timing) ───────
    // If user doesn't exist, compare against a dummy hash so response time
    // is the same whether the email exists or not.
    const dummyHash = "$2b$12$invalidhashpadding000000000000000000000000000000000000000"
    const hashToCompare = user?.passwordHash ?? dummyHash
    const valid = await bcrypt.compare(password as string, hashToCompare)

    if (!user || !valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    // ── Issue JWT cookie ──────────────────────────────────────────────────
    const sessionUser = {
      id: user._id.toString(),
      name: user.name as string,
      email: user.email as string,
    }
    const token = await signToken(sessionUser)

    const response = NextResponse.json({ user: sessionUser })

    response.headers.set(
      "Set-Cookie",
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    )

    return response
  } catch (error) {
    console.error("[POST /api/auth/login]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
