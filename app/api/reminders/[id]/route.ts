import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { done, snooze } = body

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")

    const updates: Record<string, any> = { updatedAt: new Date() }

    if (typeof done === "boolean") updates.done = done

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid reminder ID format" }, { status: 400 })
    }

    if (snooze) {
      const snoozeMap: Record<string, number> = {
        "1day": 1, "3days": 3, "1week": 7,
      }
      const days = snoozeMap[snooze] ?? 1
      // Get current reminder to calculate new dueAt
      const current = await col.findOne({ _id: new ObjectId(params.id), userId: session.user.id })
      if (current) {
        const base = current.dueAt > new Date() ? current.dueAt : new Date()
        updates.dueAt = new Date(base.getTime() + days * 86400000)
      }
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: updates },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...result,
      id: result._id.toString(),
      _id: result._id.toString(),
      dueAt: result.dueAt?.toISOString?.() ?? result.dueAt,
    })
  } catch (error) {
    console.error("[PATCH /api/reminders/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid reminder ID format" }, { status: 400 })
    }

    const result = await col.deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/reminders/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
