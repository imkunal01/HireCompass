import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    const body = await request.json()
    const { broadcastId, visitorId } = body

    if (!broadcastId || !ObjectId.isValid(broadcastId)) {
      return NextResponse.json({ error: "Valid broadcast ID is required" }, { status: 400 })
    }

    const currentUserId = session?.user?.id || visitorId
    if (!currentUserId) {
      return NextResponse.json({ error: "User identity is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    await broadcastsCol.updateOne(
      { _id: new ObjectId(broadcastId) },
      { $addToSet: { dismissedBy: currentUserId } }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[POST /api/broadcasts/dismiss]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
