import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

const BCRYPT_ROUNDS = 12

/** PUT /api/auth/password — change password */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      )
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")
    const user = await users.findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/auth/password]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
