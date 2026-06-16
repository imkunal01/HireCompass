import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "outreach@resend.dev"

// ── POST /api/outreach/send ────────────────────────────────────────────────────
// Sends approved emails for a campaign, respecting rate limits
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, recordIds } = body  // recordIds = specific records to send, or null = all approved

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "your_resend_api_key_here") {
      return NextResponse.json({
        error: "RESEND_API_KEY not configured. Add it to .env to enable email sending."
      }, { status: 503 })
    }

    const client = await clientPromise
    const db = client.db()

    // Fetch campaign
    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId: session.user.id,
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Fetch approved records to send
    const query: any = {
      campaignId,
      userId: session.user.id,
      status: "APPROVED",
    }
    if (recordIds?.length) {
      query._id = { $in: recordIds.map((id: string) => new ObjectId(id)) }
    }

    const records = await db.collection("outreach_records")
      .find(query)
      .limit(campaign.dailyLimit || 20)
      .toArray()

    if (records.length === 0) {
      return NextResponse.json({ message: "No approved records to send", sent: 0 })
    }

    // Fetch CV attachment if configured
    let attachmentData: { filename: string; content: string } | null = null
    if (campaign.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({
        _id: new ObjectId(campaign.attachedCvId),
        userId: session.user.id,
      })
      if (cvDoc?.data) {
        attachmentData = {
          filename: cvDoc.name,
          content: cvDoc.data,  // base64
        }
      }
    }

    // Update campaign status
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      { $set: { status: "SENDING", updatedAt: new Date() } }
    )

    // Send emails with delay
    const results: { recordId: string; success: boolean; messageId?: string; error?: string }[] = []
    const delayMs = (campaign.delaySeconds || 30) * 1000

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const recordId = record._id.toString()

      // Mark as sending
      await db.collection("outreach_records").updateOne(
        { _id: record._id },
        { $set: { status: "SENDING", updatedAt: new Date() } }
      )

      try {
        const emailBody = record.finalEmail || record.generatedEmail || ""
        const subject = record.finalSubject || record.emailSubject || `Internship Inquiry – ${record.companyName}`
        const toEmail = record.recruiterEmail

        if (!toEmail || !emailBody) {
          throw new Error("Missing recipient email or email body")
        }

        const payload: any = {
          from: FROM_EMAIL,
          to: [toEmail],
          subject,
          text: emailBody,
        }

        if (attachmentData) {
          payload.attachments = [{
            filename: attachmentData.filename,
            content: attachmentData.content,
          }]
        }

        const { data, error } = await resend.emails.send(payload)

        if (error) throw new Error(error.message)

        const sentAt = new Date()

        // Update record as SENT
        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { status: "SENT", sentAt, messageId: data?.id || null, updatedAt: new Date() } }
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
          timeline: [{
            event: "Application sent",
            description: `Cold email sent to ${record.recruiterName || record.recruiterEmail} via HireCompass Outreach`,
            timestamp: sentAt,
          }],
          createdAt: sentAt,
          updatedAt: sentAt,
        }

        const oppResult = await db.collection("opportunities").insertOne(opportunityDoc)

        // Link opportunity back to record
        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { opportunityId: oppResult.insertedId.toString() } }
        )

        results.push({ recordId, success: true, messageId: data?.id })

        // Delay before next email (except last)
        if (i < records.length - 1) {
          await new Promise((r) => setTimeout(r, delayMs))
        }
      } catch (sendErr) {
        const errMsg = sendErr instanceof Error ? sendErr.message : "Send failed"
        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { status: "APPROVED", updatedAt: new Date() } }  // Revert to approved on failure
        )
        results.push({ recordId, success: false, error: errMsg })
      }
    }

    // Update campaign counts
    const sentCount = results.filter((r) => r.success).length
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      {
        $inc: { sentCount },
        $set: {
          status: sentCount === records.length ? "SENT" : "READY",
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({
      sent: sentCount,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (err) {
    console.error("[POST /api/outreach/send]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
