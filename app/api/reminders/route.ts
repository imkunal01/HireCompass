import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { sendReminderConfirmation } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "pending" | "done" | "all"

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")

    const query: Record<string, any> = { userId: session.user.id }
    if (status === "pending") query.done = { $ne: true }
    if (status === "done") query.done = true

    const reminders = await col
      .find(query)
      .sort({ dueAt: 1 })
      .toArray()

    return NextResponse.json(
      reminders.map((r) => ({
        ...r,
        id: r._id.toString(),
        _id: r._id.toString(),
        dueAt: r.dueAt?.toISOString?.() ?? r.dueAt,
        eventDate: r.eventDate?.toISOString?.() ?? r.eventDate ?? null,
        registrationDeadline: r.registrationDeadline?.toISOString?.() ?? r.registrationDeadline ?? null,
        createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      }))
    )
  } catch (error) {
    console.error("[GET /api/reminders]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      jobId, jobTitle, company, type, dueAt, message,
      eventDate, registrationDeadline, customAlerts = []
    } = body

    if (!type || !dueAt) {
      return NextResponse.json({ error: "type and dueAt are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("reminders")
    const emailJobsCol = db.collection("email_jobs")

    const now = new Date()
    const parsedEventDate = eventDate ? new Date(eventDate) : null
    const parsedRegDeadline = registrationDeadline ? new Date(registrationDeadline) : null

    const doc = {
      userId: session.user.id,
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      company: company || null,
      type,
      dueAt: new Date(dueAt),
      eventDate: parsedEventDate,
      registrationDeadline: parsedRegDeadline,
      customAlerts: Array.isArray(customAlerts) ? customAlerts.map(a => new Date(a)) : [],
      message: message || "",
      done: false,
      googleCalendarEventId: null,
      emailsSent: [],
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)
    const reminderId = result.insertedId.toString()

    // ── Schedule email jobs ──────────────────────────────────────────────
    // Email is included in the JWT session payload
    const userEmail = session.user.email
    if (userEmail) {
      const emailJobs: Array<{
        userId: string
        reminderId: string
        userEmail: string
        sendAt: Date
        alertType: "24h" | "5h" | "exact"
        dateType: "event" | "registration" | "exact"
        status: string
        createdAt: Date
      }> = []

      // Helper: schedule 24h and 5h before a date
      const scheduleAlerts = (targetDate: Date, dateType: "event" | "registration") => {
        const h24 = new Date(targetDate.getTime() - 24 * 3600000)
        const h5  = new Date(targetDate.getTime() - 5  * 3600000)

        if (h24 > now) {
          emailJobs.push({
            userId: session.user.id,
            reminderId,
            userEmail,
            sendAt: h24,
            alertType: "24h",
            dateType,
            status: "pending",
            createdAt: now,
          })
        }
        if (h5 > now) {
          emailJobs.push({
            userId: session.user.id,
            reminderId,
            userEmail,
            sendAt: h5,
            alertType: "5h",
            dateType,
            status: "pending",
            createdAt: now,
          })
        }
      }

      if (parsedEventDate) scheduleAlerts(parsedEventDate, "event")
      if (parsedRegDeadline) scheduleAlerts(parsedRegDeadline, "registration")

      // Schedule exact time alert for 'dueAt' (Reminder On)
      const parsedDueAt = new Date(dueAt)
      if (parsedDueAt > now) {
        emailJobs.push({
          userId: session.user.id,
          reminderId,
          userEmail,
          sendAt: parsedDueAt,
          alertType: "exact",
          dateType: "exact",
          status: "pending",
          createdAt: now,
        })
      }

      // Schedule exact time alerts for any customAlerts
      if (Array.isArray(customAlerts)) {
        for (const alertDateStr of customAlerts) {
          const d = new Date(alertDateStr)
          if (d > now) {
            emailJobs.push({
              userId: session.user.id,
              reminderId,
              userEmail,
              sendAt: d,
              alertType: "exact",
              dateType: "exact",
              status: "pending",
              createdAt: now,
            })
          }
        }
      }

      if (emailJobs.length > 0) {
        await emailJobsCol.insertMany(emailJobs)
      }
    }

    // ── Send confirmation email immediately ──────────────────────────────
    if (userEmail) {
      try {
        await sendReminderConfirmation(userEmail, {
          id: reminderId,
          company: company || null,
          jobTitle: jobTitle || null,
          message: message || "",
          type,
          eventDate: parsedEventDate?.toISOString() ?? null,
          registrationDeadline: parsedRegDeadline?.toISOString() ?? null,
          dueAt: new Date(dueAt).toISOString(),
        })
      } catch (emailErr) {
        console.error("[POST /api/reminders] email send failed:", emailErr)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      ...doc,
      id: reminderId,
      _id: reminderId,
      dueAt: doc.dueAt.toISOString(),
      eventDate: doc.eventDate?.toISOString() ?? null,
      registrationDeadline: doc.registrationDeadline?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/reminders]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
