import { NextRequest, NextResponse } from "next/server"
import { getSession, signToken } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

/** PUT /api/auth/profile — update name, email, and/or notification prefs */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, notifications } = body

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 })
    }
    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name) updates.name = name.trim()
    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      // Check for duplicate
      const existing = await users.findOne({
        email: normalizedEmail,
        _id: { $ne: new ObjectId(session.user.id) },
      })
      if (existing) {
        return NextResponse.json({ error: "Email already in use." }, { status: 409 })
      }
      updates.email = normalizedEmail
    }
    if (notifications && typeof notifications === "object") {
      updates.notifications = notifications
    }

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updates }
    )

    // Re-issue token with updated name/email
    const updatedUser = await users.findOne({ _id: new ObjectId(session.user.id) })
    const sessionUser = {
      id: session.user.id,
      name: updatedUser?.name ?? session.user.name,
      email: updatedUser?.email ?? session.user.email,
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
    console.error("[PUT /api/auth/profile]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** GET /api/auth/profile — get current user including notification prefs */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      notifications: user.notifications || {
        emailAlerts: true,
        weeklyReport: true,
        interviewRemind: true,
        marketingEmails: false,
      },
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("[GET /api/auth/profile]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
