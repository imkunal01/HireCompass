import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { sendEventAlertEmail } from "@/lib/email"

/**
 * GET /api/cron/process-emails
 *
 * This endpoint processes pending email_jobs and sends due alerts.
 * Call this from an external cron service (e.g., cron-job.org) every 30 minutes.
 *
 * Protect with a secret key in production:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // Optional: protect with a secret key
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const emailJobsCol = db.collection("email_jobs")
    const remindersCol = db.collection("reminders")

    const now = new Date()

    // Find pending jobs that are due (sendAt <= now)
    const pendingJobs = await emailJobsCol
      .find({ status: "pending", sendAt: { $lte: now } })
      .toArray()

    if (pendingJobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending email jobs" })
    }

    let processed = 0
    let failed = 0

    for (const job of pendingJobs) {
      try {
        // Get the reminder details
        const { ObjectId } = await import("mongodb")
        const reminder = await remindersCol.findOne({
          _id: ObjectId.isValid(job.reminderId) ? new ObjectId(job.reminderId) : undefined,
        })

        if (!reminder || reminder.done) {
          // Reminder is done or doesn't exist — cancel the job
          await emailJobsCol.updateOne(
            { _id: job._id },
            { $set: { status: "cancelled", processedAt: now } }
          )
          continue
        }

        // Send the alert email
        await sendEventAlertEmail(
          job.userEmail,
          {
            id: job.reminderId,
            company: reminder.company,
            jobTitle: reminder.jobTitle,
            message: reminder.message,
            type: reminder.type,
            eventDate: reminder.eventDate?.toISOString?.() ?? null,
            registrationDeadline: reminder.registrationDeadline?.toISOString?.() ?? null,
            dueAt: reminder.dueAt?.toISOString?.() ?? "",
          },
          job.alertType,
          job.dateType
        )

        // Mark as sent
        await emailJobsCol.updateOne(
          { _id: job._id },
          { $set: { status: "sent", processedAt: now } }
        )
        processed++
      } catch (err) {
        console.error(`[process-emails] Failed for job ${job._id}:`, err)
        await emailJobsCol.updateOne(
          { _id: job._id },
          { $set: { status: "failed", error: String(err), processedAt: now } }
        )
        failed++
      }
    }

    console.log(`[process-emails] Processed: ${processed}, Failed: ${failed}`)
    return NextResponse.json({ processed, failed, total: pendingJobs.length })
  } catch (error) {
    console.error("[GET /api/cron/process-emails]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
