import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findReadableSheet, toObjectId } from "@/lib/sheets-db"

// PUT /api/sheets/[id]/items/[itemId]/progress — atomic upsert item status & notes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (status && !["todo", "done", "revisit"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const db = await getSheetsDb()
    const sheet = await findReadableSheet(db, params.id, session.user.id)
    if (!sheet) {
      return NextResponse.json({ error: "Sheet not found" }, { status: 404 })
    }

    const itemObjectId = toObjectId(params.itemId)
    if (!itemObjectId) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const itemsCol = db.collection("sheet_items")
    const item = await itemsCol.findOne({ _id: itemObjectId, sheet: sheet._id }, { projection: { _id: 1 } })
    if (!item) {
      return NextResponse.json({ error: "Item not found in this sheet" }, { status: 404 })
    }

    const progressCol = db.collection("item_progress")
    const now = new Date()

    const setFields: any = { updatedAt: now }
    if (status !== undefined) {
      setFields.status = status
      setFields.completedAt = status === "done" ? now : null
    }
    if (notes !== undefined) {
      setFields.notes = String(notes).slice(0, 2000)
    }

    // Atomic upsert: compound unique index { user: 1, item: 1 } guarantees race-safe idempotent update
    const result = await progressCol.findOneAndUpdate(
      { user: session.user.id, item: itemObjectId },
      {
        $set: setFields,
        $setOnInsert: {
          user: session.user.id,
          sheet: sheet._id,
          item: itemObjectId,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

    return NextResponse.json({
      progress: {
        ...result,
        _id: result?._id?.toString(),
      },
    })
  } catch (error) {
    console.error("[PUT /api/sheets/[id]/items/[itemId]/progress]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
