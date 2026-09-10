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

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // Pull interviews scheduled for today
    const interviews = await interviewsCol
      .find({
        userId: session.user.id,
      })
      .toArray()

    // Pull pending reminders
    const reminders = await remindersCol
      .find({
        userId: session.user.id,
        done: { $ne: true },
      })
      .limit(5)
      .toArray()

    const formattedInterviews = interviews.map((i) => ({
      company: i.company,
      role: i.role,
      time: i.time || (i.date ? new Date(i.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"),
      type: i.type,
    }))

    const formattedReminders = reminders.map((r) => ({
      message: r.message || `${r.type || "Reminder"} for ${r.company || "application"}`,
      dueAt: r.dueAt ? new Date(r.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
      company: r.company,
    }))

    return NextResponse.json({
      interviews: formattedInterviews,
      reminders: formattedReminders,
    })
  } catch (error) {
    console.error("[GET /api/planner/sync-context]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
