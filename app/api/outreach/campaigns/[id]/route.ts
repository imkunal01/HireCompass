import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// ── GET /api/outreach/campaigns/[id] — get campaign + its records ─────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const records = await db.collection("outreach_records")
      .find({ campaignId: params.id, userId: session.user.id })
      .sort({ createdAt: 1 })
      .toArray()

    const serializeDoc = (d: any) => ({
      ...d,
      id: d._id.toString(),
      _id: d._id.toString(),
      createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
      updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
      sentAt: d.sentAt?.toISOString?.() ?? d.sentAt,
      repliedAt: d.repliedAt?.toISOString?.() ?? d.repliedAt,
      followUpSentAt: d.followUpSentAt?.toISOString?.() ?? d.followUpSentAt,
    })

    return NextResponse.json({
      campaign: serializeDoc(campaign),
      records: records.map(serializeDoc),
    })
  } catch (err) {
    console.error("[GET /api/outreach/campaigns/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PATCH /api/outreach/campaigns/[id] — update campaign meta ────────────────
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
    const { name, status, attachedCvId, dailyLimit, delaySeconds,
            sentCount, repliedCount, interviewCount } = body

    const update: Record<string, any> = { updatedAt: new Date() }
    if (name !== undefined) update.name = name
    if (status !== undefined) update.status = status
    if (attachedCvId !== undefined) update.attachedCvId = attachedCvId
    if (dailyLimit !== undefined) update.dailyLimit = dailyLimit
    if (delaySeconds !== undefined) update.delaySeconds = delaySeconds
    if (sentCount !== undefined) update.sentCount = sentCount
    if (repliedCount !== undefined) update.repliedCount = repliedCount
    if (interviewCount !== undefined) update.interviewCount = interviewCount

    const client = await clientPromise
    const result = await client.db().collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(params.id), userId: session.user.id },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PATCH /api/outreach/campaigns/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── DELETE /api/outreach/campaigns/[id] — delete campaign + records ───────────
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
    const db = client.db()

    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Delete campaign + all its records
    await Promise.all([
      db.collection("outreach_campaigns").deleteOne({ _id: new ObjectId(params.id) }),
      db.collection("outreach_records").deleteMany({ campaignId: params.id }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/outreach/campaigns/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
