import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findOwnedSheet, toObjectId } from "@/lib/sheets-db"

// PUT /api/sheets/[id]/items/[itemId] — update item fields
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const itemObjectId = toObjectId(params.itemId)
    if (!itemObjectId) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const body = await request.json()
    const allowed = [
      "topic",
      "title",
      "difficulty",
      "platform",
      "problemLink",
      "articleLink",
      "youtubeLink",
      "tags",
    ]
    const updateFields: any = { updatedAt: new Date() }
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateFields[key] = body[key]
      }
    }

    const itemsCol = db.collection("sheet_items")
    const result = await itemsCol.findOneAndUpdate(
      { _id: itemObjectId, sheet: sheet._id },
      { $set: updateFields },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({
      item: {
        ...result,
        _id: result._id.toString(),
        id: result._id.toString(),
        sheet: sheet._id.toString(),
      },
    })
  } catch (error) {
    console.error("[PUT /api/sheets/[id]/items/[itemId]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sheets/[id]/items/[itemId] — delete item and its progress rows
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const itemObjectId = toObjectId(params.itemId)
    if (!itemObjectId) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const itemsCol = db.collection("sheet_items")
    const progressCol = db.collection("item_progress")
    const sheetsCol = db.collection("sheets")

    const deleteResult = await itemsCol.deleteOne({ _id: itemObjectId, sheet: sheet._id })
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await progressCol.deleteMany({ item: itemObjectId })
    await sheetsCol.updateOne({ _id: sheet._id }, { $inc: { itemCount: -1 } })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("[DELETE /api/sheets/[id]/items/[itemId]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
