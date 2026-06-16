import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// ── GET /api/documents/[id] — download CV with data ─────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const col = client.db().collection("cv_documents")

    const doc = await col.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

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
  } catch (err) {
    console.error("[GET /api/documents/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PATCH /api/documents/[id] — update name/type/targetRole ─────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, targetRole } = body

    const client = await clientPromise
    const col = client.db().collection("cv_documents")

    const result = await col.updateOne(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: { name, type, targetRole, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PATCH /api/documents/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── DELETE /api/documents/[id] — delete CV ───────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const col = client.db().collection("cv_documents")

    const result = await col.deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/documents/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
