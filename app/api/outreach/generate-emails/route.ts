import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { streamText } from "@/lib/gemini"
// @ts-ignore
import pdfParse from "pdf-parse"

function buildOutreachEmailPrompt(record: any, profile: any, cvText: string | null) {
  const recruiterName = record.recruiterName || "Hiring Team";
  const companyName = record.companyName || "your company";

  return `Output the following EXACT email template, keeping all details exactly as written.

FORMAT EXACTLY LIKE THIS:
<SUBJECT>
Full-Stack Intern Application — MERN/Next.js/PostgreSQL
</SUBJECT>
<EMAIL>
Hi ${recruiterName},

I'm Kunal Dhangar, a final-year CS student at Lovely Professional University with hands-on full-stack experience in React, Next.js, Node.js, PostgreSQL, Redis, and Docker.

A few things I've shipped:
• Creolink — real-time collaborative video PM platform (WebSockets, Socket.io, PostgreSQL, Adobe UXP plugin) with 100ms state sync and 80% bandwidth reduction
• KripaConnect — full-stack ecommerce with JWT + Google OAuth 2.0 RBAC, Redis caching delivering 800ms API response under 1k+ concurrent users
• Orbosis Internship — reduced API latency by 30% via Redis caching, automated payment verification via Razorpay webhooks

I'd love to contribute to ${companyName}'s engineering team as an intern. My GitHub (github.com/imkunal01) has both projects live with documented READs.

Could we schedule a quick call?

Kunal Dhangar
+91-62660-89196 | kunaldhangar184@gmail.com
github.com/imkunal01 | linkedin.com/in/kunaldhangar
</EMAIL>`
}

// ── POST /api/outreach/generate-emails ────────────────────────────────────────
// Streams generated emails for a list of outreach records
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recordId, profile } = body

    if (!recordId || !profile) {
      return NextResponse.json({ error: "recordId and profile are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Fetch the record
    const record = await db.collection("outreach_records").findOne({
      _id: new ObjectId(recordId),
      userId: session.user.id,
    })

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Fetch campaign to check for attached CV
    const campaign = await db.collection("outreach_campaigns").findOne({
      _id: new ObjectId(record.campaignId),
      userId: session.user.id,
    })

    let cvText: string | null = null
    if (campaign?.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({
        _id: new ObjectId(campaign.attachedCvId),
        userId: session.user.id,
      })
      
      if (cvDoc?.data && cvDoc.mimeType === "application/pdf") {
        try {
          const base64Data = cvDoc.data.includes(',') ? cvDoc.data.split(',')[1] : cvDoc.data;
          const buffer = Buffer.from(base64Data, "base64")
          const { PDFParse } = require("pdf-parse")
          const parser = new PDFParse({ data: buffer })
          const pdfData = await parser.getText()
          cvText = pdfData.text
        } catch (err) {
          console.error("Error parsing PDF CV:", err)
        }
      }
    }

    const prompt = buildOutreachEmailPrompt(record, profile, cvText)

    // Update record status to DRAFT (generating)
    await db.collection("outreach_records").updateOne(
      { _id: new ObjectId(recordId) },
      { $set: { status: "DRAFT", updatedAt: new Date() } }
    )

    return new Response(streamText(prompt), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err) {
    console.error("[POST /api/outreach/generate-emails]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
