import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const userId = searchParams.get("userId")

    const client = await clientPromise
    const db = client.db()

    const query: Record<string, any> = {}
    if (userId && ObjectId.isValid(userId)) {
      query.userId = userId
    }

    if (search) {
      const regex = new RegExp(search, "i")
      query.$or = [{ name: regex }, { targetRole: regex }]
    }

    const docs = await db
      .collection("cv_documents")
      .find(query, { projection: { data: 0 } })
      .sort({ uploadedAt: -1 })
      .toArray()

    // Fetch user details for each document
    const userIds = Array.from(new Set(docs.map((d) => d.userId))).filter(Boolean)
    const users = await db
      .collection("users")
      .find(
        { _id: { $in: userIds.map((id) => new ObjectId(id)) } },
        { projection: { name: 1, email: 1 } }
      )
      .toArray()

    const userMap = new Map(users.map((u) => [u._id.toString(), { name: u.name, email: u.email }]))

    const formattedDocs = docs.map((d) => {
      const owner = userMap.get(d.userId) || { name: "Unknown User", email: "N/A" }
      return {
        id: d._id.toString(),
        _id: d._id.toString(),
        name: d.name,
        type: d.type || "RESUME",
        targetRole: d.targetRole || null,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes || 0,
        userId: d.userId,
        userName: owner.name,
        userEmail: owner.email,
        uploadedAt: d.uploadedAt?.toISOString?.() ?? d.uploadedAt,
        updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
      }
    })

    return NextResponse.json(formattedDocs)
  } catch (error) {
    console.error("[GET /api/admin/resumes]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
