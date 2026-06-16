import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// ── PATCH /api/outreach/records/[id] — update a single outreach record ────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      finalEmail,
      finalSubject,
      generatedEmail,
      emailSubject,
      companyContext,
      sentAt,
      repliedAt,
      messageId,
      opportunityId,
      followUpSentAt,
    } = body

    const update: Record<string, any> = { updatedAt: new Date() }
    if (status !== undefined) update.status = status
    if (finalEmail !== undefined) update.finalEmail = finalEmail
    if (finalSubject !== undefined) update.finalSubject = finalSubject
    if (generatedEmail !== undefined) update.generatedEmail = generatedEmail
    if (emailSubject !== undefined) update.emailSubject = emailSubject
    if (companyContext !== undefined) update.companyContext = companyContext
    if (sentAt !== undefined) update.sentAt = sentAt ? new Date(sentAt) : null
    if (repliedAt !== undefined) update.repliedAt = repliedAt ? new Date(repliedAt) : null
    if (messageId !== undefined) update.messageId = messageId
    if (opportunityId !== undefined) update.opportunityId = opportunityId
    if (followUpSentAt !== undefined) update.followUpSentAt = followUpSentAt ? new Date(followUpSentAt) : null

    const client = await clientPromise
    const result = await client.db().collection("outreach_records").updateOne(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PATCH /api/outreach/records/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── DELETE /api/outreach/records/[id] — remove a single record ────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const result = await client.db().collection("outreach_records").deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/outreach/records/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
