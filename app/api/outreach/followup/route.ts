import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { extractJSON } from "@/lib/gemini"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})
const FROM_EMAIL = process.env.GMAIL_USER || ""

function buildFollowUpPrompt(record: any, profile: any, daysSinceSent: number) {
  return `You are a professional email writer. Write a brief, warm follow-up email.

Context:
- Original email was sent ${daysSinceSent} days ago to ${record.recruiterName || "the hiring team"} at ${record.companyName}
- Original email subject: ${record.finalSubject || record.emailSubject}
- Applicant: ${profile.fullName}
- Company: ${record.companyName} (${record.industry || "Tech"})
- Tech Stack: ${(record.techStack || []).join(", ")}

Write a short follow-up (max 80 words) that:
1. References the original email politely
2. Reiterates genuine interest in ${record.companyName}
3. Asks if they had a chance to review your application
4. Ends with a low-pressure ask

FORMAT:
<SUBJECT>
Re: [reference original subject]
</SUBJECT>
<EMAIL>
[follow-up body]
</EMAIL>`
}

// ── POST /api/outreach/followup ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recordId } = body

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const record = await db.collection("outreach_records").findOne({
      _id: new ObjectId(recordId),
      userId: session.user.id,
      status: { $in: ["SENT", "FOLLOW_UP_SENT"] },
    })

    if (!record) {
      return NextResponse.json({ error: "Record not found or not in SENT status" }, { status: 404 })
    }

    // Get user profile
    const profile = await db.collection("outreach_profiles").findOne({ userId: session.user.id })
    if (!profile) {
      return NextResponse.json({ error: "Please set up your outreach profile first" }, { status: 400 })
    }

    // Get campaign for CV attachment
    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(record.campaignId),
      userId: session.user.id,
    })

    const daysSinceSent = record.sentAt
      ? Math.floor((Date.now() - new Date(record.sentAt).getTime()) / (1000 * 60 * 60 * 24))
      : 7

    // Generate follow-up
    const prompt = buildFollowUpPrompt(record, profile, daysSinceSent)
    const generated = await extractJSON<{ subject: string; body: string }>(
      prompt + "\n\nReturn JSON: { \"subject\": \"...\", \"body\": \"...\" }"
    )

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === "your_16_char_app_password_here") {
      // Preview mode — return generated email without sending
      return NextResponse.json({
        preview: true,
        subject: generated.subject,
        body: generated.body,
      })
    }

    // Fetch CV if configured
    let attachmentData: { filename: string; content: string } | null = null
    if (campaign?.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({
        _id: new ObjectId(campaign.attachedCvId),
        userId: session.user.id,
      })
      if (cvDoc?.data) attachmentData = { filename: cvDoc.name, content: cvDoc.data }
    }

    // Send follow-up
    const payload: any = {
      from: FROM_EMAIL,
      to: [record.recruiterEmail],
      subject: generated.subject || `Following up – ${record.companyName}`,
      text: generated.body,
    }
    if (attachmentData) {
      payload.attachments = [{ filename: attachmentData.filename, content: attachmentData.content }]
    }

    const info = await transporter.sendMail(payload)

    const now = new Date()
    await db.collection("outreach_records").updateOne(
      { _id: new ObjectId(recordId) },
      { $set: { status: "FOLLOW_UP_SENT", followUpSentAt: now, updatedAt: now } }
    )

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (err) {
    console.error("[POST /api/outreach/followup]", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Follow-up failed" }, { status: 500 })
  }
}
