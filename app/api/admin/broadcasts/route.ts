import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { BroadcastMessage } from "@/types/broadcast"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    const raw = await broadcastsCol.find().sort({ createdAt: -1 }).limit(50).toArray()

    const broadcasts: BroadcastMessage[] = raw.map((b) => ({
      id: b._id.toString(),
      _id: b._id.toString(),
      title: b.title,
      message: b.message,
      type: b.type || "announcement",
      targetType: b.targetType || "ALL",
      targetUserId: b.targetUserId || null,
      targetUserEmail: b.targetUserEmail || null,
      targetUserName: b.targetUserName || null,
      createdByName: b.createdByName || "Administrator",
      createdByEmail: b.createdByEmail || session.user.email,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
      dismissedBy: b.dismissedBy || [],
      isActive: b.isActive !== false,
    }))

    return NextResponse.json({ broadcasts })
  } catch (error: any) {
    console.error("[GET /api/admin/broadcasts]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const body = await request.json()
    const {
      title,
      message,
      type = "announcement",
      targetType = "ALL",
      targetUserId,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")
    const usersCol = db.collection("users")

    let targetUserEmail: string | null = null
    let targetUserName: string | null = null

    if (targetType === "USER") {
      if (!targetUserId) {
        return NextResponse.json(
          { error: "Target user ID is required when broadcasting to a specific user" },
          { status: 400 }
        )
      }
      const targetUser = ObjectId.isValid(targetUserId)
        ? await usersCol.findOne({ _id: new ObjectId(targetUserId) })
        : await usersCol.findOne({ id: targetUserId })

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 })
      }
      targetUserEmail = targetUser.email
      targetUserName = targetUser.name
    }

    const doc = {
      title: title.trim(),
      message: message.trim(),
      type: ["announcement", "alert", "info"].includes(type) ? type : "announcement",
      targetType: targetType === "USER" ? "USER" : "ALL",
      targetUserId: targetType === "USER" ? targetUserId : null,
      targetUserEmail,
      targetUserName,
      createdByName: session.user.name || "Administrator",
      createdByEmail: session.user.email,
      createdAt: new Date(),
      dismissedBy: [],
      isActive: true,
    }

    const result = await broadcastsCol.insertOne(doc)

    return NextResponse.json(
      {
        success: true,
        broadcast: {
          ...doc,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
          createdAt: doc.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[POST /api/admin/broadcasts]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
