import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { BroadcastMessage } from "@/types/broadcast"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ personalBroadcast: null, isDismissed: false })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    const doc = await broadcastsCol.findOne(
      {
        isActive: true,
        targetType: "USER",
        targetUserId: session.user.id,
      },
      { sort: { createdAt: -1 } }
    )

    if (!doc) {
      return NextResponse.json({ personalBroadcast: null, isDismissed: false })
    }

    const isDismissed = (doc.dismissedBy || []).includes(session.user.id)

    const personalBroadcast: BroadcastMessage = {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type || "announcement",
      targetType: "USER",
      targetUserId: doc.targetUserId,
      targetUserEmail: doc.targetUserEmail || null,
      targetUserName: doc.targetUserName || null,
      createdByName: doc.createdByName || "Administrator",
      createdByEmail: doc.createdByEmail || "admin@hirecompass.io",
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      dismissedBy: doc.dismissedBy || [],
      isActive: doc.isActive !== false,
    }

    return NextResponse.json({ personalBroadcast, isDismissed })
  } catch (error: any) {
    console.error("[GET /api/broadcasts/personal]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
