import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function serialize(p: any) {
  return {
    ...p,
    id: p._id.toString(),
    _id: p._id.toString(),
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    snippets: (p.snippets || []).map((s: any) => ({
      ...s,
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
    })),
  }
}

// GET /api/projects/[id]
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
    const db = client.db()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(serialize(project))
  } catch (error) {
    console.error("[GET /api/projects/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/projects/[id] — update project fields
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
    const { name, description, documentationText, techStack, roleCategories, metrics, links } = body

    const client = await clientPromise
    const db = client.db()

    const updateDoc: Record<string, any> = { updatedAt: new Date() }
    if (name !== undefined) updateDoc.name = name
    if (description !== undefined) updateDoc.description = description
    if (documentationText !== undefined) updateDoc.documentationText = documentationText
    if (techStack !== undefined) updateDoc.techStack = techStack
    if (roleCategories !== undefined) updateDoc.roleCategories = roleCategories
    if (metrics !== undefined) updateDoc.metrics = metrics
    if (links !== undefined) updateDoc.links = links

    const result = await db.collection("projects").findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: updateDoc },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(serialize(result))
  } catch (error) {
    console.error("[PATCH /api/projects/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]
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
    const db = client.db()

    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/projects/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
