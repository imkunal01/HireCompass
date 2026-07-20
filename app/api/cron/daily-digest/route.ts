import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { sendDailyDigestEmail } from "@/lib/email"

// GET /api/cron/daily-digest
// Call from cron-job.org at 08:00 IST (02:30 UTC) daily
// Header: Authorization: Bearer <CRON_SECRET>
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)
    const in3Days    = new Date(now.getTime() + 3 * 86400000)
    const ghost14    = new Date(now.getTime() - 14 * 86400000)

    // Users who explicitly opted out
    const optedOut = await db.collection("user_settings").find({ dailyDigest: false }).toArray()
    const optoutIds = new Set(optedOut.map((u) => u.userId))

    const allUsers = await db.collection("users").find({ email: { $exists: true, $ne: "" } }).toArray()
    const targets  = allUsers.filter((u) => !optoutIds.has(u._id.toString()))

    let sent = 0, failed = 0

    for (const user of targets) {
      try {
        const userId = user._id.toString()

        const [todayRem, upcoming, ghosted, allOpps] = await Promise.all([
          db.collection("reminders").find({ userId, done: false, dueAt: { $gte: todayStart, $lte: todayEnd } }).toArray(),
          db.collection("interviews").find({ userId, date: { $gte: now.toISOString().split("T")[0], $lte: in3Days.toISOString().split("T")[0] } }).sort({ date: 1 }).limit(5).toArray(),
          db.collection("opportunities").find({ userId, status: { $in: ["APPLIED","ASSESSMENT"] }, updatedAt: { $lt: ghost14 } }).sort({ updatedAt: 1 }).limit(10).toArray(),
          db.collection("opportunities").find({ userId }).toArray(),
        ])

        const pipeline = {
          total:     allOpps.length,
          applied:   allOpps.filter((o) => ["APPLIED","ASSESSMENT","INTERVIEW","OFFER"].includes(o.status)).length,
          interview: allOpps.filter((o) => ["INTERVIEW","OFFER"].includes(o.status)).length,
          offer:     allOpps.filter((o) => o.status === "OFFER").length,
          rejected:  allOpps.filter((o) => o.status === "REJECTED").length,
        }

        await sendDailyDigestEmail(user.email, {
          userName: user.name || user.email.split("@")[0],
          todayReminders: todayRem.map((r) => ({
            message: r.message, company: r.company, type: r.type,
            dueAt: r.dueAt?.toISOString?.() ?? r.dueAt,
          })),
          upcomingInterviews: upcoming.map((i) => ({
            company: i.company, role: i.role, date: i.date, time: i.time, type: i.type,
          })),
          ghostedApps: ghosted.map((g) => ({
            company: g.company, title: g.title,
            daysSince: Math.floor((now.getTime() - new Date(g.updatedAt).getTime()) / 86400000),
          })),
          pipeline, baseUrl,
        })
        sent++
      } catch (err) {
        console.error(`[daily-digest] user ${user._id}:`, err)
        failed++
      }
    }

    return NextResponse.json({ sent, failed, total: targets.length })
  } catch (err) {
    console.error("[GET /api/cron/daily-digest]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
