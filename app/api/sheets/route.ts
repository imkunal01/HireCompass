import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSheetsDb, toObjectId } from "@/lib/sheets-db"
import { ObjectId } from "mongodb"

// GET /api/sheets — list all sheets visible to user with progress summary (single aggregation)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    const userId = session?.user?.id || null
    const userObjectId = userId ? toObjectId(userId) : null

    const db = await getSheetsDb()
    const sheetsCol = db.collection("sheets")
    const progressCol = db.collection("item_progress")

    // Find sheets owned by user or built-in templates
    const query = userId
      ? {
          $or: [
            { owner: userId },
            ...(userObjectId ? [{ owner: userObjectId }] : []),
            { isTemplate: true },
          ],
        }
      : { isTemplate: true }

    const sheets = await sheetsCol
      .find(query)
      .sort({ isTemplate: 1, updatedAt: -1, createdAt: -1 })
      .toArray()

    // Single aggregation for all done counts of this user (prevents N+1 query problem)
    const doneCounts = userId
      ? await progressCol
          .aggregate([
            {
              $match: {
                $or: [{ user: userId }, ...(userObjectId ? [{ user: userObjectId }] : [])],
                status: "done",
              },
            },
            {
              $group: {
                _id: "$sheet",
                done: { $sum: 1 },
              },
            },
          ])
          .toArray()
      : []

    const doneMap = new Map<string, number>()
    for (const d of doneCounts) {
      doneMap.set(String(d._id), d.done)
    }

    const data = sheets.map((s) => {
      const idStr = s._id.toString()
      const done = doneMap.get(idStr) || 0
      const total = s.itemCount || 0
      return {
        ...s,
        _id: idStr,
        id: idStr,
        owner: s.owner?.toString() ?? null,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
        createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
        updatedAt: s.updatedAt?.toISOString?.() ?? s.updatedAt,
      }
    })

    return NextResponse.json({ sheets: data })
  } catch (error) {
    console.error("[GET /api/sheets]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sheets — create custom user sheet
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const title = body.title?.trim()
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const description = (body.description || "").trim()
    const category = body.category || "Custom"
    const rawTopics = Array.isArray(body.topics) ? body.topics : []

    const topics = rawTopics.map((t: string | { name: string; order: number }, idx: number) => {
      if (typeof t === "string") return { name: t.trim(), order: idx }
      return { name: (t.name || "").trim(), order: typeof t.order === "number" ? t.order : idx }
    }).filter((t: { name: string }) => Boolean(t.name))

    const db = await getSheetsDb()
    const sheetsCol = db.collection("sheets")

    // Check duplicate title for this owner
    const existing = await sheetsCol.findOne({
      $or: [{ owner: session.user.id }, ...(toObjectId(session.user.id) ? [{ owner: toObjectId(session.user.id) }] : [])],
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    })

    if (existing) {
      return NextResponse.json({ error: "You already have a sheet with this title" }, { status: 409 })
    }

    const now = new Date()
    const newDoc = {
      owner: session.user.id,
      isTemplate: false,
      templateKey: null,
      clonedFrom: null,
      title,
      description,
      category,
      topics,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    const result = await sheetsCol.insertOne(newDoc)

    return NextResponse.json({
      sheet: {
        ...newDoc,
        _id: result.insertedId.toString(),
        id: result.insertedId.toString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/sheets]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
