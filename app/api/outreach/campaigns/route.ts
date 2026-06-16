import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// ── GET /api/outreach/campaigns — list user campaigns ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const col = client.db().collection("outreach_campaigns")

    const campaigns = await col
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    const serialized = campaigns.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: c._id.toString(),
      createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
      updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    }))

    return NextResponse.json(serialized)
  } catch (err) {
    console.error("[GET /api/outreach/campaigns]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST /api/outreach/campaigns — create campaign + seed records ─────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, recruiters, attachedCvId, dailyLimit = 20, delaySeconds = 30 } = body

    if (!name || !recruiters?.length) {
      return NextResponse.json({ error: "Campaign name and recruiters are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const campaignsCol = db.collection("outreach_campaigns")
    const recordsCol = db.collection("outreach_records")

    const now = new Date()

    // Create campaign
    const campaignDoc = {
      userId: session.user.id,
      name,
      status: "DRAFT",
      totalRecords: recruiters.length,
      sentCount: 0,
      repliedCount: 0,
      interviewCount: 0,
      attachedCvId: attachedCvId || null,
      dailyLimit,
      delaySeconds,
      createdAt: now,
      updatedAt: now,
    }

    const campaignResult = await campaignsCol.insertOne(campaignDoc)
    const campaignId = campaignResult.insertedId.toString()

    // Create outreach records for each recruiter
    const recordDocs = recruiters.map((r: any) => ({
      campaignId,
      userId: session.user.id,
      recruiterName: r.recruiterName || "",
      recruiterEmail: r.recruiterEmail || "",
      recruiterRole: r.recruiterRole || "",
      companyName: r.companyName || "",
      companyDescription: r.companyDescription || "",
      industry: r.industry || "",
      techStack: r.techStack || [],
      hiringRequirements: r.hiringRequirements || "",
      additionalNotes: r.additionalNotes || "",
      companyContext: null,
      generatedEmail: null,
      emailSubject: null,
      finalEmail: null,
      finalSubject: null,
      status: "PENDING",
      sentAt: null,
      repliedAt: null,
      messageId: null,
      followUpSentAt: null,
      opportunityId: null,
      createdAt: now,
      updatedAt: now,
    }))

    if (recordDocs.length > 0) {
      await recordsCol.insertMany(recordDocs)
    }

    return NextResponse.json({
      id: campaignId,
      ...campaignDoc,
      _id: campaignId,
      createdAt: campaignDoc.createdAt.toISOString(),
      updatedAt: campaignDoc.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/outreach/campaigns]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
