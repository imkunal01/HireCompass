import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")
    const userId = session.user.id

    const [total, applied, interviews, offers] = await Promise.all([
      col.countDocuments({ userId }),
      col.countDocuments({ userId, status: { $in: ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "INTERVIEWING"] } }),
      col.countDocuments({ userId, status: { $in: ["INTERVIEW", "INTERVIEWING", "ASSESSMENT"] } }),
      col.countDocuments({ userId, status: "OFFER" }),
    ])

    // Follow-ups due: opportunities applied > 7 days ago without status change
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const followUpsDue = await col.countDocuments({
      userId,
      status: "APPLIED",
      updatedAt: { $lte: sevenDaysAgo },
    })

    const responseRate = applied > 0
      ? Math.round(((interviews + offers) / applied) * 100)
      : 0

    return NextResponse.json({
      totalSaved: total,
      applicationsSent: applied,
      interviewsScheduled: interviews,
      responseRate,
      followUpsDue,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
