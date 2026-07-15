import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET /api/projects — list all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("projects")

    const projects = await col
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    const serialized = projects.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
      snippets: (p.snippets || []).map((s: any) => ({
        ...s,
        createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
      })),
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("[GET /api/projects]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, documentationText, techStack, roleCategories, metrics, links } = body

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("projects")

    const now = new Date()
    const doc = {
      userId: session.user.id,
      name,
      description: description || "",
      documentationText: documentationText || "",
      techStack: techStack || [],
      roleCategories: roleCategories || [],
      metrics: metrics || [],
      links: {
        github: links?.github || null,
        live: links?.live || null,
      },
      snippets: [],
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)

    return NextResponse.json(
      {
        ...doc,
        id: result.insertedId.toString(),
        _id: result.insertedId.toString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/projects]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
