import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, findOwnedSheet, toObjectId } from "@/lib/sheets-db"
import { parseSheetCsv, parseSpreadsheetBuffer } from "@/lib/csv-import"
import { getUserAiConfig } from "@/lib/ai-quota"

// POST /api/sheets/import — bulk import problems (either create new sheet or append to existing)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const aiConfig = await getUserAiConfig(session.user.id).catch(() => null)
    const db = await getSheetsDb()
    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")

    let existingSheetId: string | null = null
    let newSheetTitle = ""
    let newSheetCategory = "DSA"
    let newSheetDesc = ""
    let parseResult: { items: any[]; errors: any[]; summary?: any }

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "Spreadsheet or CSV file is required" }, { status: 400 })
      }
      existingSheetId = (formData.get("sheetId") as string) || null
      newSheetTitle = (formData.get("title") as string) || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      newSheetCategory = (formData.get("category") as string) || "DSA"
      newSheetDesc = (formData.get("description") as string) || ""

      const buffer = Buffer.from(await file.arrayBuffer())
      parseResult = await parseSpreadsheetBuffer(buffer, file.name, {
        apiKey: aiConfig?.apiKey,
        model: aiConfig?.model,
        sheetTitle: newSheetTitle,
      })
    } else {
      const body = await request.json().catch(() => ({}))
      const csvText = body.csvText || ""
      if (!csvText.trim()) {
        return NextResponse.json({ error: "File content cannot be empty" }, { status: 400 })
      }
      existingSheetId = body.sheetId || null
      newSheetTitle = body.title || "Imported Roadmap"
      newSheetCategory = body.category || "DSA"
      newSheetDesc = body.description || ""

      parseResult = await parseSheetCsv(csvText, {
        apiKey: aiConfig?.apiKey,
        model: aiConfig?.model,
        sheetTitle: newSheetTitle,
      })
    }

    const { items, errors } = parseResult
    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid problem rows found in spreadsheet or CSV file", errors },
        { status: 400 }
      )
    }

    const now = new Date()
    let targetSheet: any = null

    if (existingSheetId) {
      targetSheet = await findOwnedSheet(db, existingSheetId, session.user.id)
      if (!targetSheet) {
        return NextResponse.json({ error: "Target sheet not found or unauthorized" }, { status: 404 })
      }
    } else {
      // Create new sheet
      const uniqueTopics: Array<{ name: string; order: number }> = []
      const seen = new Set<string>()
      for (const it of items) {
        const lower = it.topic.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          uniqueTopics.push({ name: it.topic, order: uniqueTopics.length })
        }
      }

      const newDoc = {
        owner: toObjectId(session.user.id) || session.user.id,
        isTemplate: false,
        templateKey: null,
        clonedFrom: null,
        title: newSheetTitle.trim() || "Imported Roadmap",
        description: newSheetDesc.trim(),
        category: newSheetCategory,
        topics: uniqueTopics,
        itemCount: 0,
        createdAt: now,
        updatedAt: now,
      }

      const insertResult = await sheetsCol.insertOne(newDoc)
      targetSheet = { ...newDoc, _id: insertResult.insertedId }
    }

    // Register any new topics
    const rawTopics = Array.isArray(targetSheet.topics) ? targetSheet.topics : []
    const knownTopics = new Set(rawTopics.map((t: any) => t.name.toLowerCase()))

    for (const it of items) {
      if (!knownTopics.has(it.topic.toLowerCase())) {
        rawTopics.push({ name: it.topic, order: rawTopics.length })
        knownTopics.add(it.topic.toLowerCase())
      }
    }

    // Determine starting order offsets
    const counters = new Map<string, number>()
    for (const it of items) {
      if (!counters.has(it.topic)) {
        const existingCount = await itemsCol.countDocuments({ sheet: targetSheet._id, topic: it.topic })
        counters.set(it.topic, existingCount)
      }
    }

    const docs = items.map((it) => {
      const currentOrder = counters.get(it.topic) || 0
      counters.set(it.topic, currentOrder + 1)
      return {
        sheet: targetSheet._id,
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

    const totalCount = await itemsCol.countDocuments({ sheet: targetSheet._id })
    await sheetsCol.updateOne(
      { _id: targetSheet._id },
      { $set: { topics: rawTopics, itemCount: totalCount, updatedAt: now } }
    )

    return NextResponse.json({
      success: true,
      sheetId: targetSheet._id.toString(),
      sheetTitle: targetSheet.title,
      inserted,
      duplicates,
      rejected: errors.length,
      errors,
      totalCount,
      summary: parseResult.summary,
    })
  } catch (error) {
    console.error("[POST /api/sheets/import]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
