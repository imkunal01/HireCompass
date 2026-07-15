import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createCalendarEvent } from "@/lib/google-calendar"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { reminderId, title, description, startDate, endDate, colorId } = body

    if (!startDate) {
      return NextResponse.json({ error: "startDate is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Get user's Google tokens
    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    })

    if (!user?.googleCalendarTokens?.access_token) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please connect first." },
        { status: 403 }
      )
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60000) // +1 hour default

    const eventId = await createCalendarEvent(user.googleCalendarTokens, {
      summary: title || "HireCompass Reminder",
      description: description || "",
      start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
      colorId: colorId ?? "9",
    })

    if (!eventId) {
      return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
    }

    // Store the calendar event ID on the reminder
    if (reminderId) {
      await db.collection("reminders").updateOne(
        { _id: new ObjectId(reminderId), userId: session.user.id },
        { $set: { googleCalendarEventId: eventId, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ eventId, success: true })
  } catch (err) {
    console.error("[google-calendar/sync]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
