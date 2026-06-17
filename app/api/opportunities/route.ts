import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const employmentType = searchParams.get("employmentType")
    const sourcePlatform = searchParams.get("sourcePlatform")
    const deadline = searchParams.get("deadline")
    const tags = searchParams.get("tags")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")

    // Build query
    const query: Record<string, any> = { userId: session.user.id }

    if (status && status !== "ALL") {
      // Handle legacy status aliases
      const statusMap: Record<string, string[]> = {
        SAVED:      ["SAVED", "WISHLIST"],
        INTERVIEW:  ["INTERVIEW", "INTERVIEWING"],
      }
      query.status = statusMap[status]
        ? { $in: statusMap[status] }
        : status
    }

    if (priority && priority !== "ALL") {
      query.priority = priority
    }

    if (employmentType && employmentType !== "ALL") {
      query.employmentType = employmentType
    }

    if (sourcePlatform && sourcePlatform !== "ALL") {
      query.sourcePlatform = sourcePlatform
    }

    if (tags) {
      query.tags = { $in: tags.split(",") }
    }

    if (deadline) {
      const now = new Date()
      if (deadline === "3days") {
        query.deadline = { $lte: new Date(now.getTime() + 3 * 86400000) }
      } else if (deadline === "week") {
        query.deadline = { $lte: new Date(now.getTime() + 7 * 86400000) }
      } else if (deadline === "month") {
        query.deadline = { $lte: new Date(now.getTime() + 30 * 86400000) }
      }
    }

    if (search) {
      const regex = new RegExp(search, "i")
      query.$or = [
        { title: regex },
        { company: regex },
        { location: regex },
        { notes: regex },
        { tags: regex },
        { skills: regex },
      ]
    }

    const sortField: Record<string, string> = {
      deadline: "deadline",
      createdAt: "createdAt",
      priority: "priority",
      company: "company",
      salary: "salary",
    }

    const opportunities = await col
      .find(query)
      .sort({ [sortField[sortBy] || "createdAt"]: sortOrder })
      .toArray()

    const serialized = opportunities.map((opp) => ({
      ...opp,
      id: opp._id.toString(),
      _id: opp._id.toString(),
      createdAt: opp.createdAt?.toISOString?.() ?? opp.createdAt,
      updatedAt: opp.updatedAt?.toISOString?.() ?? opp.updatedAt,
      deadline: opp.deadline?.toISOString?.() ?? opp.deadline,
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("[GET /api/opportunities]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, company, location, isRemote, employmentType, salary, url,
            sourcePlatform, status, priority, deadline, skills, tags, notes } = body

    if (!title || !company) {
      return NextResponse.json({ error: "Title and company are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")

    const now = new Date()
    const doc = {
      userId: session.user.id,
      title,
      company,
      location: location || null,
      isRemote: Boolean(isRemote),
      employmentType: employmentType || "FULL_TIME",
      salary: salary || null,
      url: url || null,
      sourcePlatform: sourcePlatform || null,
      status: status || "SAVED",
      priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null,
      skills: skills || [],
      tags: tags || [],
      notes: notes || null,
      timeline: [{ event: "Job added", description: `Added ${company} – ${title}`, timestamp: now }],
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)

    if (deadline) {
      await db.collection("reminders").insertOne({
        userId: session.user.id,
        jobId: result.insertedId.toString(),
        jobTitle: title,
        company: company,
        type: "DEADLINE",
        dueAt: new Date(deadline),
        message: "Application deadline",
        done: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    return NextResponse.json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deadline: doc.deadline?.toISOString() ?? null,
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/opportunities]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
