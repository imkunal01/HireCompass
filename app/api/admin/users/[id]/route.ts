import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const targetUserId = params.id
    if (!ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    const {
      role,
      aiAccess,
      aiLimit,
      resetAiUsage,
      name,
      email,
      password,
    } = body

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const existingUser = await users.findOne({ _id: new ObjectId(targetUserId) })
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateSet: Record<string, any> = { updatedAt: new Date() }
    const unsetFields: Record<string, any> = {}

    // Prevent demoting yourself if you are the logged in admin
    if (role && role !== existingUser.role) {
      if (session.user.id === targetUserId && role !== "admin") {
        return NextResponse.json({ error: "You cannot demote your own admin account." }, { status: 400 })
      }
      if (["admin", "user"].includes(role)) {
        updateSet.role = role
      }
    }

    if (aiAccess && ["DEFAULT", "UNRESTRICTED", "DISABLED"].includes(aiAccess)) {
      updateSet.aiAccess = aiAccess
    }

    if (typeof aiLimit === "number") {
      if (aiLimit > 0) {
        updateSet.aiLimit = aiLimit
      } else {
        unsetFields.aiLimit = ""
      }
    }

    if (resetAiUsage === true) {
      updateSet["aiUsage.count"] = 0
    }

    if (name && typeof name === "string" && name.trim().length >= 2) {
      updateSet.name = name.trim()
    }

    if (email && typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const normalizedEmail = email.toLowerCase().trim()
      if (normalizedEmail !== existingUser.email) {
        const dup = await users.findOne({ email: normalizedEmail, _id: { $ne: new ObjectId(targetUserId) } })
        if (dup) {
          return NextResponse.json({ error: "Another account already uses this email." }, { status: 409 })
        }
        updateSet.email = normalizedEmail
      }
    }

    if (password && typeof password === "string" && password.length >= 6) {
      updateSet.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    }

    const updateDoc: Record<string, any> = { $set: updateSet }
    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields
    }

    await users.updateOne({ _id: new ObjectId(targetUserId) }, updateDoc)

    const updatedUser = await users.findOne(
      { _id: new ObjectId(targetUserId) },
      { projection: { passwordHash: 0, "groqKey.ciphertext": 0 } }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role || "user",
        aiAccess: updatedUser?.aiAccess || "DEFAULT",
        aiUsage: updatedUser?.aiUsage,
        aiLimit: updatedUser?.aiLimit,
      },
    })
  } catch (error) {
    console.error("[PATCH /api/admin/users/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const targetUserId = params.id
    if (!ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const user = await db.collection("users").findOne({ _id: new ObjectId(targetUserId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cascade delete user data
    await Promise.all([
      db.collection("users").deleteOne({ _id: new ObjectId(targetUserId) }),
      db.collection("opportunities").deleteMany({ userId: targetUserId }),
      db.collection("cv_documents").deleteMany({ userId: targetUserId }),
      db.collection("reminders").deleteMany({ userId: targetUserId }),
    ])

    return NextResponse.json({ success: true, message: "User and associated records removed successfully." })
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
