import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "pending" | "done" | "all"

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")

    const query: Record<string, any> = { userId: session.user.id }
    if (status === "pending") query.done = { $ne: true }
    if (status === "done") query.done = true

    const reminders = await col
      .find(query)
      .sort({ dueAt: 1 })
      .toArray()

    return NextResponse.json(
      reminders.map((r) => ({
        ...r,
        id: r._id.toString(),
        _id: r._id.toString(),
        dueAt: r.dueAt?.toISOString?.() ?? r.dueAt,
        createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      }))
    )
  } catch (error) {
    console.error("[GET /api/reminders]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, jobTitle, company, type, dueAt, message } = body

    if (!type || !dueAt) {
      return NextResponse.json({ error: "type and dueAt are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")

    const now = new Date()
    const doc = {
      userId: session.user.id,
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      company: company || null,
      type, // "DEADLINE" | "FOLLOWUP" | "INTERVIEW"
      dueAt: new Date(dueAt),
      message: message || "",
      done: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)

    return NextResponse.json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      dueAt: doc.dueAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/reminders]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
