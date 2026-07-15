import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { listUpcomingEvents } from "@/lib/google-calendar"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    })

    if (!user?.googleCalendarTokens?.access_token) {
      return NextResponse.json({ connected: false, events: [] })
    }

    const events = await listUpcomingEvents(user.googleCalendarTokens, 20)

    return NextResponse.json({
      connected: true,
      events: events.map((e) => ({
        id: e.id,
        title: e.summary,
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime ?? e.end?.date,
        colorId: e.colorId,
        htmlLink: e.htmlLink,
        description: e.description,
      })),
    })
  } catch (err) {
    console.error("[google-calendar/events]", err)
    return NextResponse.json({ connected: false, events: [], error: "Failed to fetch events" })
  }
}

// Check connection status
export async function HEAD(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })

  if (user?.googleCalendarConnected) {
    return new NextResponse(null, { status: 200, headers: { "X-Connected": "true" } })
  }
  return new NextResponse(null, { status: 200, headers: { "X-Connected": "false" } })
}
