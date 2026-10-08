import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")

    const client = await clientPromise
    const db = client.db()
    const sessionsCol = db.collection("assessment_sessions")
    const usersCol = db.collection("users")

    // 1. If specific sessionId requested: return full detail of that session
    if (sessionId) {
      if (!ObjectId.isValid(sessionId)) {
        return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 })
      }
      const singleDoc = await sessionsCol.findOne({ _id: new ObjectId(sessionId) })
      if (!singleDoc) {
        return NextResponse.json({ error: "Assessment session not found" }, { status: 404 })
      }
      return NextResponse.json({
        session: {
          ...singleDoc,
          id: singleDoc._id.toString(),
          _id: singleDoc._id.toString(),
        },
      })
    }

    // 2. If specific userId requested: return all sessions and interaction history for that user
    if (userId) {
      const userSessions = await sessionsCol
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray()

      const userDoc = ObjectId.isValid(userId)
        ? await usersCol.findOne({ _id: new ObjectId(userId) })
        : await usersCol.findOne({ id: userId })

      const mappedSessions = userSessions.map((s: any) => ({
        ...s,
        id: s._id.toString(),
        _id: s._id.toString(),
      }))

      const totalAttempts = mappedSessions.length
      const solvedCount = mappedSessions.filter((s: any) => s.status === "PASSED").length
      const failedCount = mappedSessions.filter((s: any) => s.status === "FAILED").length
      const totalTokensUsed = mappedSessions.reduce((acc: number, s: any) => acc + (s.tokensUsed || 0), 0)

      return NextResponse.json({
        user: userDoc
          ? {
              id: userDoc._id.toString(),
              name: userDoc.name,
              email: userDoc.email,
              assessmentTokenLimit: userDoc.assessmentTokenLimit ?? 2000,
            }
          : null,
        stats: {
          totalAttempts,
          solvedCount,
          failedCount,
          totalTokensUsed,
        },
        sessions: mappedSessions,
      })
    }

    // 3. Global Overview: Aggregate metrics across all sessions and users
    const [totalAssessments, totalPassed, totalFailed, totalActive] = await Promise.all([
      sessionsCol.countDocuments(),
      sessionsCol.countDocuments({ status: "PASSED" }),
      sessionsCol.countDocuments({ status: "FAILED" }),
      sessionsCol.countDocuments({ status: "ACTIVE" }),
    ])

    // Aggregate tokens and counts per user
    const userAgg = await sessionsCol
      .aggregate([
        {
          $group: {
            _id: "$userId",
            totalAttempts: { $sum: 1 },
            solvedCount: {
              $sum: { $cond: [{ $eq: ["$status", "PASSED"] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
            },
            totalTokensUsed: { $sum: { $ifNull: ["$tokensUsed", 0] } },
            lastAssessmentDate: { $max: "$updatedAt" },
          },
        },
        { $sort: { lastAssessmentDate: -1 } },
      ])
      .toArray()

    // Fetch user details for each user in the aggregation
    const userObjectIds = userAgg
      .map((u) => u._id)
      .filter((id) => typeof id === "string" && ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    const usersList = await usersCol
      .find(
        { _id: { $in: userObjectIds } },
        { projection: { name: 1, email: 1, assessmentTokenLimit: 1, role: 1 } }
      )
      .toArray()

    const userMap = new Map(usersList.map((u) => [u._id.toString(), u]))

    const userRoster = userAgg.map((u) => {
      const userInfo = userMap.get(String(u._id))
      return {
        userId: String(u._id),
        name: userInfo?.name || "Unknown Candidate",
        email: userInfo?.email || "No email",
        role: userInfo?.role || "user",
        assessmentTokenLimit: userInfo?.assessmentTokenLimit ?? 2000,
        totalAttempts: u.totalAttempts,
        solvedCount: u.solvedCount,
        failedCount: u.failedCount,
        totalTokensUsed: u.totalTokensUsed,
        lastAssessmentDate: u.lastAssessmentDate,
      }
    })

    const totalTokensUsedAll = userAgg.reduce((acc, u) => acc + (u.totalTokensUsed || 0), 0)

    // Also get recent 10 sessions across all users for quick feed
    const recentSessionsRaw = await sessionsCol
      .find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray()

    const recentSessions = recentSessionsRaw.map((s) => ({
      ...s,
      id: s._id.toString(),
      _id: s._id.toString(),
    }))

    return NextResponse.json({
      overview: {
        totalAssessments,
        totalPassed,
        totalFailed,
        totalActive,
        totalTokensUsedAll,
        uniqueCandidates: userAgg.length,
      },
      userRoster,
      recentSessions,
    })
  } catch (error: any) {
    console.error("[GET /api/admin/assessments]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
