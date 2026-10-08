import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { BroadcastMessage } from "@/types/broadcast"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    // Find the latest active broadcast targeting everyone
    const doc = await broadcastsCol.findOne(
      { isActive: true, targetType: "ALL" },
      { sort: { createdAt: -1 } }
    )

    if (!doc) {
      return NextResponse.json({ broadcast: null })
    }

    const broadcast: BroadcastMessage = {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type || "announcement",
      targetType: "ALL",
      targetUserId: null,
      targetUserEmail: null,
      targetUserName: null,
      createdByName: doc.createdByName || "Administrator",
      createdByEmail: doc.createdByEmail || "admin@hirecompass.io",
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      dismissedBy: doc.dismissedBy || [],
      isActive: doc.isActive !== false,
    }

    return NextResponse.json({ broadcast })
  } catch (error: any) {
    console.error("[GET /api/broadcasts/global]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
