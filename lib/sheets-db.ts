import { Db, ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { BUILTIN_TEMPLATES } from "@/lib/sheet-templates"

let indexesEnsured = false
let templatesSeeded = false

export function toObjectId(id: string | ObjectId): ObjectId | null {
  if (id instanceof ObjectId) return id
  if (typeof id === "string" && ObjectId.isValid(id) && id.length === 24) {
    return new ObjectId(id)
  }
  return null
}

export async function getSheetsDb(): Promise<Db> {
  const client = await clientPromise
  const db = client.db()
  if (!indexesEnsured) {
    await ensureSheetIndexes(db).catch((err) =>
      console.error("[sheets-db] Failed to ensure indexes:", err)
    )
    indexesEnsured = true
  }
  if (!templatesSeeded) {
    await seedBuiltinTemplates(db).catch((err) =>
      console.error("[sheets-db] Failed to seed templates:", err)
    )
    templatesSeeded = true
  }
  return db
}

export async function seedBuiltinTemplates(db: Db) {
  const sheetsCol = db.collection("sheets")
  const itemsCol = db.collection("sheet_items")

  const count = await sheetsCol.countDocuments({ isTemplate: true })
  if (count > 0) return

  const now = new Date()

  for (const [key, t] of Object.entries(BUILTIN_TEMPLATES)) {
    const topicNames = Object.keys(t.topics)
    const sheetDoc = {
      owner: null,
      isTemplate: true,
      templateKey: key,
      clonedFrom: null,
      title: t.title,
      description: t.description,
      category: t.category,
      topics: topicNames.map((name, i) => ({ name, order: i })),
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    const res = await sheetsCol.insertOne(sheetDoc)
    const sheetId = res.insertedId

    const itemsToInsert: any[] = []
    for (const topicName of topicNames) {
      const topicItems = t.topics[topicName] || []
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
    }
  }
}

export async function ensureSheetIndexes(db: Db) {
  try {
    const sheets = db.collection("sheets")
    const items = db.collection("sheet_items")
    const progress = db.collection("item_progress")

    // Sheets indexes
    await sheets.createIndex({ owner: 1, title: 1 })
    await sheets.createIndex({ isTemplate: 1, templateKey: 1 })

    // Sheet Items indexes
    await items.createIndex({ sheet: 1, topic: 1, order: 1 })
    // Unique item per topic in a sheet to prevent accidental duplicate additions / CSV spam
    await items.createIndex(
      { sheet: 1, topic: 1, title: 1 },
      { unique: true, background: true }
    )

    // Sparse Item Progress: 1 row per user per item
    // Compound unique index gives idempotent upserts and prevents race conditions
    await progress.createIndex({ user: 1, item: 1 }, { unique: true, background: true })
    await progress.createIndex({ user: 1, sheet: 1, status: 1 })
  } catch (error) {
    console.error("[ensureSheetIndexes] Error configuring indexes:", error)
  }
}

/**
 * Sheet the user may READ: their own sheet, OR a built-in template
 */
export async function findReadableSheet(db: Db, sheetId: string, userId: string) {
  const sId = toObjectId(sheetId)
  if (!sId) return null

  const sheets = db.collection("sheets")
  return await sheets.findOne({
    _id: sId,
    $or: [{ owner: userId }, { owner: toObjectId(userId) }, { isTemplate: true }],
  })
}

/**
 * Sheet the user may WRITE: strictly owned by the caller, never built-in templates (IDOR Guard)
 */
export async function findOwnedSheet(db: Db, sheetId: string, userId: string) {
  const sId = toObjectId(sheetId)
  if (!sId) return null

  const sheets = db.collection("sheets")
  return await sheets.findOne({
    _id: sId,
    $or: [{ owner: userId }, { owner: toObjectId(userId) }],
  })
}
