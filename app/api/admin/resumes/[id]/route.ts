import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })
    }

    const client = await clientPromise
    const doc = await client.db().collection("cv_documents").findOne({ _id: new ObjectId(params.id) })

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      uploadedAt: doc.uploadedAt?.toISOString?.() ?? doc.uploadedAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    })
  } catch (error) {
    console.error("[GET /api/admin/resumes/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })
    }

    const client = await clientPromise
    const result = await client.db().collection("cv_documents").deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Resume deleted successfully." })
  } catch (error) {
    console.error("[DELETE /api/admin/resumes/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
