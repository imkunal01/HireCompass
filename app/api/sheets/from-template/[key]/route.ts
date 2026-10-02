import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, toObjectId } from "@/lib/sheets-db"
import { BUILTIN_TEMPLATES } from "@/lib/sheet-templates"

// POST /api/sheets/from-template/[key] — clone a template into user's account
export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key } = params
    const template = BUILTIN_TEMPLATES[key]
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const db = await getSheetsDb()
    const sheetsCol = db.collection("sheets")
    const itemsCol = db.collection("sheet_items")

    // Check if user already cloned this template
    const existing = await sheetsCol.findOne({
      $or: [{ owner: session.user.id }, ...(toObjectId(session.user.id) ? [{ owner: toObjectId(session.user.id) }] : [])],
      title: template.title,
    })

    if (existing) {
      return NextResponse.json(
        { error: "You already have this roadmap in your sheets", sheet: existing },
        { status: 409 }
      )
    }

    const topicNames = Object.keys(template.topics)
    const now = new Date()

    const newSheet = {
      owner: session.user.id,
      isTemplate: false,
      templateKey: key,
      clonedFrom: null,
      title: template.title,
      description: template.description,
      category: template.category,
      topics: topicNames.map((name, i) => ({ name, order: i })),
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    const sheetResult = await sheetsCol.insertOne(newSheet)
    const sheetId = sheetResult.insertedId

    // Prepare item documents
    const itemsToInsert: any[] = []
    for (const topicName of topicNames) {
      const topicItems = template.topics[topicName] || []
      topicItems.forEach((it, order) => {
        itemsToInsert.push({
          sheet: sheetId,
          topic: topicName,
          title: it.title,
          difficulty: it.difficulty || "N/A",
          platform: it.platform || "Other",
          problemLink: it.problemLink || "",
          articleLink: it.articleLink || "",
          youtubeLink: it.youtubeLink || "",
          tags: it.tags || [],
          order,
          createdAt: now,
          updatedAt: now,
        })
      })
    }

    if (itemsToInsert.length > 0) {
      await itemsCol.insertMany(itemsToInsert, { ordered: false })
      await sheetsCol.updateOne({ _id: sheetId }, { $set: { itemCount: itemsToInsert.length } })
      newSheet.itemCount = itemsToInsert.length
    }

    return NextResponse.json(
      {
        sheet: {
          ...newSheet,
          _id: sheetId.toString(),
          id: sheetId.toString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/sheets/from-template/[key]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
