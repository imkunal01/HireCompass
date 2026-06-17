import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: { id: string }
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")

    const opp = await col.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!opp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...opp,
      id: opp._id.toString(),
      _id: opp._id.toString(),
      createdAt: opp.createdAt?.toISOString?.() ?? opp.createdAt,
      updatedAt: opp.updatedAt?.toISOString?.() ?? opp.updatedAt,
      deadline: opp.deadline?.toISOString?.() ?? opp.deadline,
    })
  } catch (error) {
    console.error("[GET /api/opportunities/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, ...rest } = body

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")

    const now = new Date()
    const updateFields: Record<string, any> = { ...rest, updatedAt: now }

    const pushOps: Record<string, any> = {}

    if (status) {
      updateFields.status = status
      pushOps.timeline = {
        event: "Status changed",
        description: `Status updated to ${status}`,
        timestamp: now,
      }
    }

    if ('deadline' in rest) {
      updateFields.deadline = rest.deadline ? new Date(rest.deadline) : null
    }

    const updateDoc: Record<string, any> = { $set: updateFields }
    if (Object.keys(pushOps).length > 0) {
      updateDoc.$push = pushOps
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: session.user.id },
      updateDoc,
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (status && (status === "APPLIED" || status === "INTERVIEW")) {
      const reminderCol = db.collection("reminders")
      const dueDays = status === "APPLIED" ? 7 : 1
      const type = status === "APPLIED" ? "FOLLOWUP" : "INTERVIEW"
      const message = status === "APPLIED" ? "Follow up on application" : "Prepare for interview"
      
      const dueAt = new Date(now.getTime() + dueDays * 86400000)
      
      // Prevent duplicates
      const existing = await reminderCol.findOne({
        jobId: params.id,
        type,
        done: false
      })
      
      if (!existing) {
        await reminderCol.insertOne({
          userId: session.user.id,
          jobId: params.id,
          jobTitle: result.title,
          company: result.company,
          type,
          dueAt,
          message,
          done: false,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return NextResponse.json({
      ...result,
      id: result._id.toString(),
      _id: result._id.toString(),
      createdAt: result.createdAt?.toISOString?.() ?? result.createdAt,
      updatedAt: result.updatedAt?.toISOString?.() ?? result.updatedAt,
      deadline: result.deadline?.toISOString?.() ?? result.deadline,
    })
  } catch (error) {
    console.error("[PATCH /api/opportunities/:id]", error)
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
    const col = db.collection("opportunities")

    const result = await col.deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/opportunities/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
