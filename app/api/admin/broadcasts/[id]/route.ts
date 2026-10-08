import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const broadcastId = params.id
    if (!ObjectId.isValid(broadcastId)) {
      return NextResponse.json({ error: "Invalid broadcast ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    const result = await broadcastsCol.deleteOne({ _id: new ObjectId(broadcastId) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Broadcast message not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Broadcast deleted successfully" })
  } catch (error: any) {
    console.error("[DELETE /api/admin/broadcasts/[id]]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const broadcastId = params.id
    if (!ObjectId.isValid(broadcastId)) {
      return NextResponse.json({ error: "Invalid broadcast ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const broadcastsCol = db.collection("broadcast_messages")

    // Reping: Clears dismissedBy array so the message pops up again for the recipient(s),
    // updates timestamp to current time, and increments reping counter.
    const result = await broadcastsCol.findOneAndUpdate(
      { _id: new ObjectId(broadcastId) },
      {
        $set: {
          dismissedBy: [],
          createdAt: new Date(),
          isActive: true,
        },
        $inc: { repingCount: 1 },
      },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Broadcast message not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Reping dispatched! Alert will pop up on the candidate's screen again.",
      broadcast: {
        ...result,
        id: result._id.toString(),
        _id: result._id.toString(),
        createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : String(result.createdAt),
      },
    })
  } catch (error: any) {
    console.error("[POST /api/admin/broadcasts/[id]]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
