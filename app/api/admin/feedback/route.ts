import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { UserFeedback } from "@/types/feedback"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const client = await clientPromise
    const db = client.db()
    const feedbackCol = db.collection("user_feedback")

    const raw = await feedbackCol.find().sort({ createdAt: -1 }).limit(100).toArray()

    const feedbacks: UserFeedback[] = raw.map((f) => ({
      id: f._id.toString(),
      _id: f._id.toString(),
      userId: f.userId || null,
      userName: f.userName || "HireCompass User",
      userEmail: f.userEmail || "Anonymous",
      type: f.type || "feedback",
      rating: f.rating || 5,
      category: f.category || "General",
      message: f.message || "",
      pageUrl: f.pageUrl || "/",
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
    }))

    const totalCount = await feedbackCol.countDocuments()
    const suggestionsCount = await feedbackCol.countDocuments({ type: "suggestion" })
    const feedbackCount = await feedbackCol.countDocuments({ type: "feedback" })

    return NextResponse.json({
      feedbacks,
      stats: {
        totalCount,
        suggestionsCount,
        feedbackCount,
      },
    })
  } catch (error: any) {
    console.error("[GET /api/admin/feedback]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid feedback ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const feedbackCol = db.collection("user_feedback")

    const result = await feedbackCol.deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Feedback deleted successfully" })
  } catch (error: any) {
    console.error("[DELETE /api/admin/feedback]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
