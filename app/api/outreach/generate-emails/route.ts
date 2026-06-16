import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { streamText } from "@/lib/gemini"
import pdfParse from "pdf-parse"

function buildOutreachEmailPrompt(record: any, profile: any, cvText: string | null) {
  return `You are a professional cold email writer helping a student/graduate land internship opportunities.

Write a highly personalized internship outreach email to this recruiter:

RECRUITER INFO:
- Name: ${record.recruiterName || "Hiring Manager"}
- Role: ${record.recruiterRole || "Recruiter"}
- Company: ${record.companyName}
- Industry: ${record.industry || "Tech"}
- Company Description: ${record.companyDescription || ""}
- Tech Stack: ${(record.techStack || []).join(", ") || ""}
- Hiring Requirements: ${record.hiringRequirements || ""}

APPLICANT PROFILE:
- Name: ${profile.fullName}
- Email: ${profile.email}
- Skills: ${(profile.skills || []).join(", ")}
- Bio: ${profile.bio || ""}
- LinkedIn: ${profile.linkedin || ""}
- GitHub: ${profile.github || ""}
- Projects:
${(profile.projects || []).map((p: any) => `  • ${p.name}: ${p.description} (${p.techStack?.join(", ")})`).join("\n")}
${cvText ? `\nAPPLICANT RESUME / CV:\n${cvText}\n` : ""}
INSTRUCTIONS:
1. Start with a compelling subject line
2. Address recruiter by name if available, else "Hiring Team"
3. First sentence: show you know what the company does
4. Second paragraph: Introduce yourself briefly (mention your tech background and experience). Then connect 2-3 of your specific skills/projects (from Profile or Resume) to the company's tech stack or needs.
5. Third paragraph: express genuine interest + clear ask (15-min call or internship consideration)
6. Keep it under 200 words total (tight, punchy, no fluff)
7. Tone: Genuine, a little casual but still highly professional.

FORMAT EXACTLY LIKE THIS:
<SUBJECT>
[subject line here]
</SUBJECT>
<EMAIL>
[email body here — no subject line in body, start with greeting]
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
          const buffer = Buffer.from(cvDoc.data, "base64")
          const pdfData = await pdfParse(buffer)
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
