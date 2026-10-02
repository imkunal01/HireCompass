import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findOwnedSheet } from "@/lib/sheets-db"
import { parseSheetCsv, parseSpreadsheetBuffer } from "@/lib/csv-import"
import { getUserAiConfig } from "@/lib/ai-quota"

// POST /api/sheets/[id]/import — bulk import problems from CSV
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const aiConfig = await getUserAiConfig(session.user.id).catch(() => null)
    const db = await getSheetsDb()
    const sheet = await findOwnedSheet(db, params.id, session.user.id)
    if (!sheet) {
      return NextResponse.json({ error: "Sheet not found or unauthorized" }, { status: 404 })
    }

    let parseResult: { items: any[]; errors: any[]; summary?: any }
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "Spreadsheet or CSV file is required" }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      parseResult = await parseSpreadsheetBuffer(buffer, file.name, {
        apiKey: aiConfig?.apiKey,
        model: aiConfig?.model,
        sheetTitle: sheet.title,
      })
    } else {
      const body = await request.json().catch(() => ({}))
      const csvText = body.csvText || ""
      if (!csvText.trim()) {
        return NextResponse.json({ error: "File content cannot be empty" }, { status: 400 })
      }
      parseResult = await parseSheetCsv(csvText, {
        apiKey: aiConfig?.apiKey,
        model: aiConfig?.model,
        sheetTitle: sheet.title,
      })
    }

    const { items, errors } = parseResult
    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid problem rows found in spreadsheet or CSV file", errors },
        { status: 400 }
      )
    }

    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")

    // Register any new topics in first-seen order
    const rawTopics = Array.isArray(sheet.topics) ? sheet.topics : []
    const knownTopics = new Set(rawTopics.map((t: any) => t.name.toLowerCase()))

    for (const it of items) {
      if (!knownTopics.has(it.topic.toLowerCase())) {
        rawTopics.push({ name: it.topic, order: rawTopics.length })
        knownTopics.add(it.topic.toLowerCase())
      }
    }

    // Determine starting order offsets for each topic
    const counters = new Map<string, number>()
    for (const it of items) {
      if (!counters.has(it.topic)) {
        const existingCount = await itemsCol.countDocuments({ sheet: sheet._id, topic: it.topic })
        counters.set(it.topic, existingCount)
      }
    }

    const now = new Date()
    const docs = items.map((it) => {
      const currentOrder = counters.get(it.topic) || 0
      counters.set(it.topic, currentOrder + 1)
      return {
        sheet: sheet._id,
        topic: it.topic,
        title: it.title,
        difficulty: it.difficulty,
        platform: it.platform,
        problemLink: it.problemLink,
        articleLink: it.articleLink,
        youtubeLink: it.youtubeLink,
        tags: it.tags,
        order: currentOrder,
        createdAt: now,
        updatedAt: now,
      }
    })

    // ordered: false => keep inserting even if some rows are duplicates
    let inserted = 0
    let duplicates = 0

    try {
      const result = await itemsCol.insertMany(docs, { ordered: false })
      inserted = result.insertedCount
    } catch (e: any) {
      if (e.code === 11000 || e.writeErrors) {
        inserted = e.result?.insertedCount ?? (docs.length - (e.writeErrors?.length || 0))
        duplicates = docs.length - inserted
      } else {
        throw e
      }
    }

    const totalCount = await itemsCol.countDocuments({ sheet: sheet._id })
    await sheetsCol.updateOne(
      { _id: sheet._id },
      { $set: { topics: rawTopics, itemCount: totalCount, updatedAt: now } }
    )

    return NextResponse.json({
      success: true,
      inserted,
      duplicates,
      rejected: errors.length,
      errors,
      totalCount,
      summary: parseResult.summary,
    })
  } catch (error) {
    console.error("[POST /api/sheets/[id]/import]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
