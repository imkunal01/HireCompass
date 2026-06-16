import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

// ── GET /api/outreach/stats ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id

    const [campaigns, recordAgg] = await Promise.all([
      db.collection("outreach_campaigns").countDocuments({ userId }),
      db.collection("outreach_records").aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $in: ["$status", ["SENT", "REPLIED", "INTERVIEW", "OFFER", "REJECTED", "FOLLOW_UP_SENT"]] }, 1, 0] } },
            replied: { $sum: { $cond: [{ $in: ["$status", ["REPLIED", "INTERVIEW", "OFFER"]] }, 1, 0] } },
            interview: { $sum: { $cond: [{ $eq: ["$status", "INTERVIEW"] }, 1, 0] } },
            offer: { $sum: { $cond: [{ $eq: ["$status", "OFFER"] }, 1, 0] } },
          }
        }
      ]).toArray()
    ])

    const agg = recordAgg[0] || { total: 0, sent: 0, replied: 0, interview: 0, offer: 0 }

    return NextResponse.json({
      totalCampaigns: campaigns,
      totalRecruitersSaved: agg.total,
      totalEmailsSent: agg.sent,
      totalReplied: agg.replied,
      totalInterviews: agg.interview,
      totalOffers: agg.offer,
      responseRate: agg.sent > 0 ? Math.round((agg.replied / agg.sent) * 100) : 0,
      interviewRate: agg.sent > 0 ? Math.round((agg.interview / agg.sent) * 100) : 0,
    })
  } catch (err) {
    console.error("[GET /api/outreach/stats]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
