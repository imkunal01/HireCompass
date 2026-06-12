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

    // Get recent opportunities sorted by createdAt/updatedAt
    const recent = await col
      .find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray()

    // Flatten timeline events from each opportunity and sort by timestamp
    const events: any[] = []

    for (const opp of recent) {
      const timeline = opp.timeline || []
      for (const event of timeline) {
        events.push({
          id: `${opp._id}-${event.timestamp}`,
          type: mapEventType(event.event),
          title: event.event,
          description: event.description || `${opp.company} — ${opp.title}`,
          timestamp: event.timestamp,
          jobId: opp._id.toString(),
          company: opp.company,
          role: opp.title,
        })
      }

      // Also generate an event for the creation if no timeline
      if (!timeline.length) {
        events.push({
          id: `${opp._id}-created`,
          type: "JOB_ADDED",
          title: "Job added",
          description: `${opp.company} — ${opp.title}`,
          timestamp: opp.createdAt,
          jobId: opp._id.toString(),
          company: opp.company,
          role: opp.title,
        })
      }
    }

    // Sort all events by timestamp descending and take top 15
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const topEvents = events.slice(0, 15).map((e) => ({
      ...e,
      timestamp: e.timestamp?.toISOString?.() ?? e.timestamp,
    }))

    return NextResponse.json(topEvents)
  } catch (error) {
    console.error("[GET /api/dashboard/activity]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function mapEventType(event: string): string {
  const lower = event.toLowerCase()
  if (lower.includes("added") || lower.includes("created")) return "JOB_ADDED"
  if (lower.includes("status")) return "STATUS_CHANGED"
  if (lower.includes("email")) return "EMAIL_SENT"
  if (lower.includes("interview")) return "INTERVIEW_SCHEDULED"
  return "NOTE_ADDED"
}
