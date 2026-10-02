import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findOwnedSheet } from "@/lib/sheets-db"

// PUT /api/sheets/[id]/topics/[topicName] — rename and/or reorder topic
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; topicName: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getSheetsDb()
    const sheet = await findOwnedSheet(db, params.id, session.user.id)
    if (!sheet) {
      return NextResponse.json({ error: "Sheet not found or unauthorized" }, { status: 404 })
    }

    const oldName = decodeURIComponent(params.topicName)
    const rawTopics = Array.isArray(sheet.topics) ? sheet.topics : []
    const topic = rawTopics.find((t: any) => t.name.toLowerCase() === oldName.toLowerCase())

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    const body = await request.json()
    const newName = body.name?.trim()
    const order = typeof body.order === "number" ? body.order : topic.order

    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")

    if (newName && newName.toLowerCase() !== oldName.toLowerCase()) {
      const conflict = rawTopics.some(
        (t: any) => t.name.toLowerCase() === newName.toLowerCase() && t.name.toLowerCase() !== oldName.toLowerCase()
      )
      if (conflict) {
        return NextResponse.json({ error: "A topic with this name already exists" }, { status: 409 })
      }

      // Rename topic on all sheet items
      await itemsCol.updateMany(
        { sheet: sheet._id, topic: oldName },
        { $set: { topic: newName, updatedAt: new Date() } }
      )
      topic.name = newName
    }

    topic.order = order

    await sheetsCol.updateOne(
      { _id: sheet._id },
      { $set: { topics: rawTopics, updatedAt: new Date() } }
    )

    return NextResponse.json({ topics: rawTopics })
  } catch (error) {
    console.error("[PUT /api/sheets/[id]/topics/[topicName]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
