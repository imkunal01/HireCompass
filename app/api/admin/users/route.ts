import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const role = searchParams.get("role") || "ALL"
    const aiAccess = searchParams.get("aiAccess") || "ALL"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)))

    const client = await clientPromise
    const db = client.db()

    const query: Record<string, any> = {}

    if (search) {
      const regex = new RegExp(search, "i")
      query.$or = [{ name: regex }, { email: regex }]
    }

    if (role && role !== "ALL") {
      query.role = role
    }

    if (aiAccess && aiAccess !== "ALL") {
      query.aiAccess = aiAccess
    }

    const totalCount = await db.collection("users").countDocuments(query)

    const rawUsers = await db
      .collection("users")
      .find(query, { projection: { passwordHash: 0, "groqKey.ciphertext": 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Fetch counts of opportunities and resumes for these users
    const userIds = rawUsers.map((u) => u._id.toString())

    const [oppCounts, cvCounts] = await Promise.all([
      db.collection("opportunities").aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } }
      ]).toArray(),
      db.collection("cv_documents").aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } }
      ]).toArray(),
    ])

    const oppMap = new Map(oppCounts.map((o) => [o._id, o.count]))
    const cvMap = new Map(cvCounts.map((c) => [c._id, c.count]))

    const defaultLimit = process.env.FREE_AI_LIMIT ? parseInt(process.env.FREE_AI_LIMIT, 10) : 30

    const users = rawUsers.map((u) => {
      const id = u._id.toString()
      return {
        id,
        _id: id,
        name: u.name || "",
        email: u.email || "",
        role: u.role || "user",
        aiAccess: u.aiAccess || "DEFAULT", // "DEFAULT" | "UNRESTRICTED" | "DISABLED"
        aiUsage: {
          count: u.aiUsage?.count ?? 0,
          limit: u.role === "admin" || u.aiAccess === "UNRESTRICTED" ? "UNLIMITED" : (u.aiLimit || defaultLimit),
          lastUsedAt: u.aiUsage?.lastUsedAt?.toISOString?.() ?? u.aiUsage?.lastUsedAt ?? null,
        },
        hasCustomKey: Boolean(u.groqKey?.tag),
        opportunitiesCount: oppMap.get(id) || 0,
        resumesCount: cvMap.get(id) || 0,
        createdAt: u.createdAt?.toISOString?.() ?? u.createdAt ?? null,
        updatedAt: u.updatedAt?.toISOString?.() ?? u.updatedAt ?? null,
      }
    })

    return NextResponse.json({
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/users]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const body = await request.json()
    const { name, email, password, role = "user", aiAccess = "DEFAULT", aiLimit } = body

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const existing = await users.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const now = new Date()

    const doc: Record<string, any> = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      aiAccess: ["DEFAULT", "UNRESTRICTED", "DISABLED"].includes(aiAccess) ? aiAccess : "DEFAULT",
      aiUsage: { count: 0, lastUsedAt: null },
      createdAt: now,
      updatedAt: now,
    }

    if (typeof aiLimit === "number" && aiLimit > 0) {
      doc.aiLimit = aiLimit
    }

    const result = await users.insertOne(doc)

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        aiAccess: doc.aiAccess,
        aiUsage: doc.aiUsage,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/users]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
