import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"


// POST /api/projects/[id]/snippets — add a new snippet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { roleTag, length, content, isAiGenerated } = body

    if (!roleTag || !length || !content) {
      return NextResponse.json({ error: "roleTag, length, and content are required" }, { status: 400 })
    }

    const snippet = {
      id: crypto.randomUUID(),
      roleTag,
      length,
      content,
      isAiGenerated: Boolean(isAiGenerated),
      createdAt: new Date(),
    }

    const client = await clientPromise
    const db = client.db()

    const result = await db.collection("projects").findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: session.user.id },
      {
        $push: { snippets: snippet } as any,
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(
      { ...snippet, createdAt: snippet.createdAt.toISOString() },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/projects/[id]/snippets]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/snippets — update a snippet by snippetId
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
    const { snippetId, roleTag, length, content, isAiGenerated } = body

    if (!snippetId) {
      return NextResponse.json({ error: "snippetId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const setFields: Record<string, any> = { updatedAt: new Date() }
    if (roleTag !== undefined) setFields["snippets.$[elem].roleTag"] = roleTag
    if (length !== undefined) setFields["snippets.$[elem].length"] = length
    if (content !== undefined) setFields["snippets.$[elem].content"] = content
    if (isAiGenerated !== undefined) setFields["snippets.$[elem].isAiGenerated"] = isAiGenerated

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: setFields },
      { arrayFilters: [{ "elem.id": snippetId }] }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PATCH /api/projects/[id]/snippets]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/snippets — remove a snippet by snippetId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const snippetId = searchParams.get("snippetId")

    if (!snippetId) {
      return NextResponse.json({ error: "snippetId query param is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(params.id), userId: session.user.id },
      {
        $pull: { snippets: { id: snippetId } } as any,
        $set: { updatedAt: new Date() },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/projects/[id]/snippets]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
