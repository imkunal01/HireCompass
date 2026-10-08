import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { BroadcastMessage } from "@/types/broadcast"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get("visitorId") || ""
    const currentUserId = session?.user?.id || visitorId

    if (!currentUserId) {
      return NextResponse.json({ broadcast: null })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    // Match broadcasts that target ALL or specifically this user, and where currentUserId is not in dismissedBy
    const query: Record<string, any> = {
      isActive: true,
      dismissedBy: { $ne: currentUserId },
      $or: [
        { targetType: "ALL" },
        ...(session?.user?.id ? [{ targetType: "USER", targetUserId: session.user.id }] : []),
      ],
    }

    const doc = await broadcastsCol.findOne(query, { sort: { createdAt: -1 } })

    if (!doc) {
      return NextResponse.json({ broadcast: null })
    }

    const broadcast: BroadcastMessage = {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type || "announcement",
      targetType: doc.targetType || "ALL",
      targetUserId: doc.targetUserId || null,
      targetUserEmail: doc.targetUserEmail || null,
      targetUserName: doc.targetUserName || null,
      createdByName: doc.createdByName || "Administrator",
      createdByEmail: doc.createdByEmail || "admin@hirecompass.io",
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      dismissedBy: doc.dismissedBy || [],
      isActive: doc.isActive !== false,
    }

    return NextResponse.json({ broadcast })
  } catch (error: any) {
    console.error("[GET /api/broadcasts/active]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
