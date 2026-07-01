import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("interviews")

    const interviews = await col
      .find({ userId: session.user.id })
      .sort({ date: 1 })
      .toArray()

    return NextResponse.json(
      interviews.map((i) => ({
        ...i,
        id: i._id.toString(),
        _id: undefined,
      }))
    )
  } catch (error) {
    console.error("[GET /api/interviews]", error)
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
    const { company, role, date, time, type, location, link, notes, opportunityId } = body

    if (!company || !role || !date) {
      return NextResponse.json(
        { error: "company, role, and date are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("interviews")

    const now = new Date()
    const result = await col.insertOne({
      userId: session.user.id,
      company,
      role,
      date,
      time: time || "",
      type: type || "Technical",
      location: location || "",
      link: link || "",
      notes: notes || "",
      opportunityId: opportunityId || null,
      status: "UPCOMING",
      createdAt: now,
      updatedAt: now,
    })

    const inserted = await col.findOne({ _id: result.insertedId })
    return NextResponse.json(
      { ...inserted, id: inserted!._id.toString(), _id: undefined },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/interviews]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
