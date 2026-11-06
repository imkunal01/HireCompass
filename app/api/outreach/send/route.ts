import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { google } from "googleapis"
import { getGoogleOAuth2Client } from "@/lib/google-auth"

// ── POST /api/outreach/send ────────────────────────────────────────────────────
// Sends approved emails for a campaign via the user's own connected Gmail account.
// Falls back to the server SMTP only if the user has not connected their Gmail.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, recordIds } = body // recordIds = specific records to send, or null = all approved

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // ── 1. Resolve how we will send emails ──────────────────────────────────
    // Preference: user's own connected Gmail (OAuth2 Gmail API)
    // Fallback: server SMTP (if no user token and server creds available)

    const gmailTokenDoc = await db
      .collection("outreach_gmail_tokens")
      .findOne({ userId: session.user.id })

    let sendEmail: (opts: {
      fromEmail: string
      fromName: string
      to: string
      subject: string
      text: string
      attachments?: { filename: string; content: string }[]
    }) => Promise<{ messageId: string }>

    let fromEmail: string
    let fromName: string

    if (gmailTokenDoc?.refreshToken) {
      // ── OAuth2 path: send as the user ──────────────────────────────────
      fromEmail = gmailTokenDoc.connectedEmail || session.user.email
      fromName = session.user.name || fromEmail

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/gmail-outreach/callback`
      const oauth2Client = getGoogleOAuth2Client(redirectUri)

      oauth2Client.setCredentials({
        refresh_token: gmailTokenDoc.refreshToken,
        access_token: gmailTokenDoc.accessToken || undefined,
        expiry_date: gmailTokenDoc.expiryDate ? new Date(gmailTokenDoc.expiryDate).getTime() : undefined,
      })

      // Auto-refresh the access token if expired
      oauth2Client.on("tokens", async (tokens) => {
        try {
          await db.collection("outreach_gmail_tokens").updateOne(
            { userId: session.user.id },
            {
              $set: {
                accessToken: tokens.access_token || gmailTokenDoc.accessToken,
                expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : gmailTokenDoc.expiryDate,
                updatedAt: new Date(),
                ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
              },
            }
          )
        } catch (e) {
          console.error("[outreach/send] token refresh persist error", e)
        }
      })

      const gmailApi = google.gmail({ version: "v1", auth: oauth2Client })

      sendEmail = async ({ fromEmail: from, fromName: name, to, subject, text, attachments }) => {
        // Build RFC 2822 raw message
        const boundary = `boundary_${Date.now()}`
        const hasAttachments = attachments && attachments.length > 0

        let rawLines: string[]

        if (!hasAttachments) {
          rawLines = [
            `From: ${name} <${from}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/plain; charset="UTF-8"`,
            ``,
            text,
          ]
        } else {
          rawLines = [
            `From: ${name} <${from}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset="UTF-8"`,
            ``,
            text,
            ...(attachments || []).flatMap((att) => [
              ``,
              `--${boundary}`,
              `Content-Type: application/octet-stream`,
              `Content-Transfer-Encoding: base64`,
              `Content-Disposition: attachment; filename="${att.filename}"`,
              ``,
              att.content,
            ]),
            ``,
            `--${boundary}--`,
          ]
        }

        const rawMessage = rawLines.join("\r\n")
        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        const res = await gmailApi.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        })

        return { messageId: res.data.id || res.data.threadId || "gmail-sent" }
      }
    } else {
      // ── SMTP fallback: send from server account ────────────────────────
      if (
        !process.env.GMAIL_USER ||
        !process.env.GMAIL_APP_PASSWORD ||
        process.env.GMAIL_APP_PASSWORD === "your_16_char_app_password_here"
      ) {
        return NextResponse.json(
          {
            error:
              "No Gmail account connected. Please connect your Gmail account in Outreach Settings before sending emails.",
            gmailNotConnected: true,
          },
          { status: 503 }
        )
      }

      fromEmail = process.env.GMAIL_USER
      fromName = session.user.name || fromEmail

      const nodemailer = (await import("nodemailer")).default
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      sendEmail = async ({ to, subject, text, attachments }) => {
        const payload: any = { from: fromEmail, to, subject, text }
        if (attachments?.length) {
          payload.attachments = attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          }))
        }
        const info = await transporter.sendMail(payload)
        return { messageId: info.messageId }
      }
    }

    // ── 2. Fetch campaign ───────────────────────────────────────────────────
    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId: session.user.id,
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // ── 3. Fetch approved records to send ──────────────────────────────────
    const query: any = {
      campaignId,
      userId: session.user.id,
      status: "APPROVED",
    }
    if (recordIds?.length) {
      query._id = { $in: recordIds.map((id: string) => new ObjectId(id)) }
    }

    const records = await db
      .collection("outreach_records")
      .find(query)
      .limit(campaign.dailyLimit || 20)
      .toArray()

    if (records.length === 0) {
      return NextResponse.json({ message: "No approved records to send", sent: 0 })
    }

    // ── 4. Fetch CV attachment if configured ───────────────────────────────
    let attachmentData: { filename: string; content: string } | null = null
    if (campaign.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({
        _id: new ObjectId(campaign.attachedCvId),
        userId: session.user.id,
      })
      if (cvDoc?.data) {
        attachmentData = { filename: cvDoc.name, content: cvDoc.data }
      }
    }

    // ── 5. Update campaign status ──────────────────────────────────────────
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      { $set: { status: "SENDING", updatedAt: new Date() } }
    )

    // ── 6. Send emails with delay ──────────────────────────────────────────
    const results: { recordId: string; success: boolean; messageId?: string; error?: string }[] = []
    const delayMs = (campaign.delaySeconds || 30) * 1000

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const recordId = record._id.toString()

      await db.collection("outreach_records").updateOne(
        { _id: record._id },
        { $set: { status: "SENDING", updatedAt: new Date() } }
      )

      try {
        const emailBody = record.finalEmail || record.generatedEmail || ""
        const subject =
          record.finalSubject ||
          record.emailSubject ||
          `Internship Inquiry – ${record.companyName}`
        const toEmail = record.recruiterEmail

        if (!toEmail || !emailBody) {
          throw new Error("Missing recipient email or email body")
        }

        const { messageId } = await sendEmail({
          fromEmail,
          fromName,
          to: toEmail,
          subject,
          text: emailBody,
          attachments: attachmentData ? [attachmentData] : undefined,
        })

        const sentAt = new Date()

        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          {
            $set: {
              status: "SENT",
              sentAt,
              messageId: messageId || null,
              sentFrom: fromEmail,
              updatedAt: new Date(),
            },
          }
        )

        // Auto-create opportunity record
        const opportunityDoc = {
          userId: session.user.id,
          title: `Internship at ${record.companyName}`,
          company: record.companyName,
          location: null,
          isRemote: false,
          employmentType: "INTERNSHIP",
          salary: null,
          url: null,
          sourcePlatform: "OTHER",
          status: "APPLIED",
          priority: "MEDIUM",
          deadline: null,
          skills: record.techStack || [],
          tags: ["outreach"],
          notes: `Auto-created from outreach campaign: ${campaign.name}\nRecruiter: ${record.recruiterName} (${record.recruiterEmail})\n\n${emailBody}`,
          outreachId: recordId,
          timeline: [
            {
              event: "Application sent",
              description: `Cold email sent to ${record.recruiterName || record.recruiterEmail} via HireCompass Outreach (from ${fromEmail})`,
              timestamp: sentAt,
            },
          ],
          createdAt: sentAt,
          updatedAt: sentAt,
        }

        const oppResult = await db.collection("opportunities").insertOne(opportunityDoc)

        await db.collection("reminders").insertOne({
          userId: session.user.id,
          jobId: oppResult.insertedId.toString(),
          jobTitle: opportunityDoc.title,
          company: record.companyName,
          type: "FOLLOWUP",
          dueAt: new Date(sentAt.getTime() + 7 * 86400000),
          message: "Follow up on outreach email",
          done: false,
          createdAt: sentAt,
          updatedAt: sentAt,
        })

        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { opportunityId: oppResult.insertedId.toString() } }
        )

        results.push({ recordId, success: true, messageId })

        if (i < records.length - 1) {
          await new Promise((r) => setTimeout(r, delayMs))
        }
      } catch (sendErr) {
        const errMsg = sendErr instanceof Error ? sendErr.message : "Send failed"
        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { status: "APPROVED", updatedAt: new Date() } }
        )
        results.push({ recordId, success: false, error: errMsg })
      }
    }

    // ── 7. Update campaign counts ──────────────────────────────────────────
    const sentCount = results.filter((r) => r.success).length
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      {
        $inc: { sentCount },
        $set: {
          status: sentCount === records.length ? "SENT" : "READY",
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      sent: sentCount,
      failed: results.filter((r) => !r.success).length,
      sentFrom: fromEmail,
      results,
    })
  } catch (err) {
    console.error("[POST /api/outreach/send]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
