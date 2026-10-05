import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const interviewsCol = db.collection("interviews")
    const remindersCol = db.collection("reminders")
    const oppsCol = db.collection("opportunities")
    const sheetsCol = db.collection("sheets")

    // 1. Pull upcoming interviews
    const interviews = await interviewsCol
      .find({
        userId: session.user.id,
      })
      .sort({ date: 1 })
      .limit(3)
      .toArray()

    // 2. Pull pending reminders
    const reminders = await remindersCol
      .find({
        userId: session.user.id,
        done: { $ne: true },
      })
      .sort({ dueAt: 1 })
      .limit(4)
      .toArray()

    // 3. Pull overdue follow-ups (>7 days in APPLIED)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const overdueOpps = await oppsCol
      .find({
        userId: session.user.id,
        status: "APPLIED",
        updatedAt: { $lte: sevenDaysAgo },
      })
      .limit(3)
      .toArray()

    // 4. Pull active coding sheet topic recommendation
    const activeSheet = await sheetsCol.findOne({ isTemplate: true })
    const dsaGoal = activeSheet
      ? `Solve 2 problems from ${activeSheet.title || "Blind 75"}`
      : "Complete daily DSA problem set"

    const formattedInterviews = interviews.map((i) => ({
      company: i.company,
      role: i.role,
      time: i.time || (i.date ? new Date(i.date).toLocaleDateString([], { month: "short", day: "numeric" }) : "Scheduled"),
      type: i.type || "Technical Round",
    }))

    const formattedReminders = reminders.map((r) => ({
      message: r.message || `${r.type || "Reminder"} for ${r.company || "application"}`,
      dueAt: r.dueAt ? new Date(r.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
      company: r.company,
    }))

    const followUps = overdueOpps.map((o) => ({
      company: o.company,
      title: o.title,
    }))

    return NextResponse.json({
      interviews: formattedInterviews,
      reminders: formattedReminders,
      followUps,
      dsaGoal,
    })
  } catch (error) {
    console.error("[GET /api/planner/sync-context]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
