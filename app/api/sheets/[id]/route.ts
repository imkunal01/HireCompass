import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findReadableSheet, findOwnedSheet, toObjectId } from "@/lib/sheets-db"

// GET /api/sheets/[id] — get one sheet with items grouped by topic, merged with user progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getSheetsDb()
    const sheet = await findReadableSheet(db, params.id, session.user.id)
    if (!sheet) {
      return NextResponse.json({ error: "Sheet not found" }, { status: 404 })
    }

    const sheetId = sheet._id
    const userId = session.user.id
    const userObjectId = toObjectId(userId)

    const itemsCol = db.collection("sheet_items")
    const progressCol = db.collection("item_progress")

    const [items, progress] = await Promise.all([
      itemsCol.find({ sheet: sheetId }).sort({ topic: 1, order: 1 }).toArray(),
      progressCol
        .find({
          sheet: sheetId,
          $or: [{ user: userId }, ...(userObjectId ? [{ user: userObjectId }] : [])],
        })
        .toArray(),
    ])

    const progMap = new Map<string, any>()
    for (const p of progress) {
      progMap.set(String(p.item), p)
    }

    // Bucket items by topic name
    const byTopic = new Map<string, any[]>()
    for (const it of items) {
      const itId = it._id.toString()
      const p = progMap.get(itId)
      const merged = {
        ...it,
        _id: itId,
        id: itId,
        sheet: sheetId.toString(),
        status: p?.status || "todo",
        completedAt: p?.completedAt?.toISOString?.() ?? (p?.completedAt || null),
        notes: p?.notes || "",
        linkedProblem: p?.linkedProblem ? String(p.linkedProblem) : null,
      }

      if (!byTopic.has(it.topic)) {
        byTopic.set(it.topic, [])
      }
      byTopic.get(it.topic)!.push(merged)
    }

    // Determine ordered topic names from sheet.topics, append any extra topics from items
    const rawSheetTopics = Array.isArray(sheet.topics) ? sheet.topics : []
    const orderedTopicNames = [...rawSheetTopics]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((t) => t.name)

    for (const topicName of byTopic.keys()) {
      if (!orderedTopicNames.includes(topicName)) {
        orderedTopicNames.push(topicName)
      }
    }

    let total = 0
    let done = 0

    const topics = orderedTopicNames.map((name) => {
      const list = byTopic.get(name) || []
      const d = list.filter((i) => i.status === "done").length
      total += list.length
      done += d
      return {
        name,
        total: list.length,
        done: d,
        percent: list.length > 0 ? Math.round((d / list.length) * 100) : 0,
        items: list,
      }
    })

    return NextResponse.json({
      sheet: {
        ...sheet,
        _id: sheet._id.toString(),
        id: sheet._id.toString(),
        owner: sheet.owner?.toString() ?? null,
      },
      topics,
      summary: {
        total,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      },
    })
  } catch (error) {
    console.error("[GET /api/sheets/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/sheets/[id] — update sheet metadata (IDOR protected)
export async function PUT(
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
    const updateFields: any = { updatedAt: new Date() }

    if (body.title !== undefined && body.title.trim()) {
      updateFields.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateFields.description = body.description.trim()
    }
    if (body.category !== undefined) {
      updateFields.category = body.category
    }

    const sheetsCol = db.collection("sheets")
    await sheetsCol.updateOne({ _id: sheet._id }, { $set: updateFields })

    return NextResponse.json({
      sheet: {
        ...sheet,
        ...updateFields,
        _id: sheet._id.toString(),
        id: sheet._id.toString(),
      },
    })
  } catch (error) {
    console.error("[PUT /api/sheets/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sheets/[id] — cascade delete sheet, items, and progress (IDOR protected)
export async function DELETE(
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

    const sheetId = sheet._id
    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")
    const progressCol = db.collection("item_progress")

    await Promise.all([
      itemsCol.deleteMany({ sheet: sheetId }),
      progressCol.deleteMany({ sheet: sheetId }),
      sheetsCol.deleteOne({ _id: sheetId }),
    ])

    return NextResponse.json({ message: "Sheet deleted successfully" })
  } catch (error) {
    console.error("[DELETE /api/sheets/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
