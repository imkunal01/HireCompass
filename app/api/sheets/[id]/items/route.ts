import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findOwnedSheet } from "@/lib/sheets-db"

// POST /api/sheets/[id]/items — add an item to a sheet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json()
    const title = body.title?.trim()
    const topic = body.topic?.trim()

    if (!title || !topic) {
      return NextResponse.json({ error: "Title and topic are required" }, { status: 400 })
    }

    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")

    // Check if topic is registered on sheet, if not auto-register it
    const rawTopics = Array.isArray(sheet.topics) ? sheet.topics : []
    const topicExists = rawTopics.some((t: any) => t.name.toLowerCase() === topic.toLowerCase())
    if (!topicExists) {
      const newTopic = { name: topic, order: rawTopics.length }
      await sheetsCol.updateOne({ _id: sheet._id }, { $push: { topics: newTopic } as any })
    }

    const countInTopic = await itemsCol.countDocuments({ sheet: sheet._id, topic })
    const now = new Date()

    const newItem = {
      sheet: sheet._id,
      topic,
      title,
      difficulty: body.difficulty || "N/A",
      platform: body.platform || "Other",
      problemLink: (body.problemLink || "").trim(),
      articleLink: (body.articleLink || "").trim(),
      youtubeLink: (body.youtubeLink || "").trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      order: countInTopic,
      createdAt: now,
      updatedAt: now,
    }

    const result = await itemsCol.insertOne(newItem)
    await sheetsCol.updateOne({ _id: sheet._id }, { $inc: { itemCount: 1 } })

    return NextResponse.json(
      {
        item: {
          ...newItem,
          _id: result.insertedId.toString(),
          id: result.insertedId.toString(),
          sheet: sheet._id.toString(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "An item with this title already exists in this topic" }, { status: 409 })
    }
    console.error("[POST /api/sheets/[id]/items]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
