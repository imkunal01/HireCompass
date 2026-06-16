import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { CVDocument } from "@/types/outreach"

// ── GET /api/documents — list user's CVs ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const col = client.db().collection("cv_documents")

    const docs = await col
      .find({ userId: session.user.id }, { projection: { data: 0 } }) // Exclude binary data from list
      .sort({ uploadedAt: -1 })
      .toArray()

    const serialized = docs.map((d) => ({
      ...d,
      id: d._id.toString(),
      _id: d._id.toString(),
      uploadedAt: d.uploadedAt?.toISOString?.() ?? d.uploadedAt,
      updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
    }))

    return NextResponse.json(serialized)
  } catch (err) {
    console.error("[GET /api/documents]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST /api/documents — upload a CV ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, targetRole, mimeType, data, sizeBytes } = body

    if (!name || !data || !mimeType) {
      return NextResponse.json({ error: "name, mimeType, and data are required" }, { status: 400 })
    }

    if (sizeBytes > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 413 })
    }

    const client = await clientPromise
    const col = client.db().collection("cv_documents")

    const now = new Date()
    const doc = {
      userId: session.user.id,
      name,
      type: type || "RESUME",
      targetRole: targetRole || null,
      mimeType,
      data,       // base64 string
      sizeBytes: sizeBytes || 0,
      uploadedAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)

    return NextResponse.json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      data: undefined, // Don't return data on create
      uploadedAt: doc.uploadedAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/documents]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
