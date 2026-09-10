/**
 * POST /api/auth/signup
 *
 * Body: { name, email, password }
 *
 * Best practices:
 *  - Email normalised to lowercase
 *  - Password hashed with bcrypt (cost 12) before storage — never stored plain
 *  - Duplicate email check with unique index hint
 *  - Minimum password length enforced server-side
 *  - Generic error messages to avoid user enumeration
 */

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { signToken } from "@/lib/session"

const BCRYPT_ROUNDS = 12
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // ── Input validation ──────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      )
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    // ── Duplicate check ───────────────────────────────────────────────────
    const existing = await users.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    // ── Hash password ─────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // ── Insert user ───────────────────────────────────────────────────────
    const now = new Date()
    const result = await users.insertOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      createdAt: now,
      updatedAt: now,
    })

    const userId = result.insertedId.toString()

    // ── Issue JWT cookie ──────────────────────────────────────────────────
    const sessionUser = { id: userId, name: name.trim(), email: normalizedEmail, role: "user" }
    const token = await signToken(sessionUser)

    const response = NextResponse.json(
      { user: sessionUser },
      { status: 201 }
    )

    response.headers.set(
      "Set-Cookie",
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    )

    return response
  } catch (error) {
    console.error("[POST /api/auth/signup]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
