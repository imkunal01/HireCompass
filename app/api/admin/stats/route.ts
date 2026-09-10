import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const client = await clientPromise
    const db = client.db()

    const [
      totalUsers,
      totalAdmins,
      totalOpportunities,
      totalResumes,
      aiUsageAggregation,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ role: "admin" }),
      db.collection("opportunities").countDocuments(),
      db.collection("cv_documents").countDocuments(),
      db.collection("users").aggregate([
        { $group: { _id: null, totalCalls: { $sum: { $ifNull: ["$aiUsage.count", 0] } } } }
      ]).toArray(),
    ])

    const totalAiRequests = aiUsageAggregation[0]?.totalCalls ?? 0

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalOpportunities,
      totalResumes,
      totalAiRequests,
      systemModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      hasSystemApiKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key_here"),
      freeLimitDefault: process.env.FREE_AI_LIMIT ? parseInt(process.env.FREE_AI_LIMIT, 10) : 30,
    })
  } catch (error) {
    console.error("[GET /api/admin/stats]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
