import { NextRequest, NextResponse } from "next/server"
import { getSession, isEmailAdmin, signToken } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    let dbUser: any = null
    if (ObjectId.isValid(session.user.id)) {
      dbUser = await users.findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { passwordHash: 0, "groqKey.ciphertext": 0 } }
      )
    }

    if (!dbUser && session.user.email) {
      dbUser = await users.findOne(
        { email: session.user.email.toLowerCase().trim() },
        { projection: { passwordHash: 0, "groqKey.ciphertext": 0 } }
      )
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const email = dbUser.email || session.user.email
    const isAdmin = dbUser.role === "admin" || isEmailAdmin(email)

    // Self-heal DB role if user is designated admin in env
    if (isAdmin && dbUser.role !== "admin") {
      await users.updateOne(
        { _id: dbUser._id },
        { $set: { role: "admin", updatedAt: new Date() } }
      )
    }

    const resolvedRole: "admin" | "user" = isAdmin ? "admin" : "user"

    const resolvedUser = {
      id: dbUser._id.toString(),
      name: dbUser.name || session.user.name || "",
      email,
      role: resolvedRole,
    }

    const response = NextResponse.json({ user: resolvedUser })

    // If role or profile in token was outdated, refresh the cookie
    if (session.user.role !== resolvedRole || session.user.name !== resolvedUser.name) {
      const token = await signToken(resolvedUser)
      response.headers.set(
        "Set-Cookie",
        `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      )
    }

    return response
  } catch (error) {
    console.error("[GET /api/auth/me]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
