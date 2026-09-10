import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

interface OutreachResult {
  connectionNote: string
  subject: string
  inmail: string
  followUpNote: string
}

export async function OPTIONS(request: NextRequest) {
  return handleOptionsCors(request)
}

export async function POST(request: NextRequest) {
  const corsHeaders = getExtensionCorsHeaders(request)
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const {
      recruiterName = "there",
      recruiterTitle = "Recruiter",
      company = "the team",
      jobTitle = "Software Engineer",
      context = "",
    } = body

    const client = await clientPromise
    const db = client.db()
    const outreachProfile = await db.collection("outreach_profiles").findOne({ userId: session.user.id })

    const candidateName = outreachProfile?.fullName || session.user.name || "Candidate"
    const candidateSkills = (outreachProfile?.skills || []).slice(0, 5).join(", ")
    const candidateBio = outreachProfile?.bio || ""

    const fallbackResult: OutreachResult = {
      connectionNote: `Hi ${recruiterName}, came across your profile while exploring ${jobTitle} opportunities at ${company}. Would love to connect and follow your work!`,
      subject: `Interest in ${jobTitle} role at ${company} — ${candidateName}`,
      inmail: `Hi ${recruiterName},\n\nI noticed the ${jobTitle} opening at ${company} and wanted to reach out directly. With my background in ${candidateSkills || "modern software engineering"}, I've built scalable applications and would love to contribute to ${company}'s engineering goals.\n\nI'd welcome the chance for a brief chat if you have a moment this week.\n\nBest regards,\n${candidateName}`,
      followUpNote: `Hi ${recruiterName}, circling back on my note regarding the ${jobTitle} role at ${company}. Still very enthusiastic about the team's mission. Looking forward to connecting!`,
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(fallbackResult)
    }

    try {
      const prompt = `You are a cold outreach and networking strategist. Draft personalized outreach for a candidate reaching out to a recruiter/hiring manager on LinkedIn.

Candidate:
Name: ${candidateName}
Skills: ${candidateSkills}
Background: ${candidateBio}

Recipient:
Name: ${recruiterName}
Title: ${recruiterTitle}
Company: ${company}
Target Role: ${jobTitle}
Additional Context: ${context || "Looking to apply / just applied"}

Instructions:
1. "connectionNote": MUST BE UNDER 290 CHARACTERS (LinkedIn limit is 300). Punchy, professional, and friendly.
2. "subject": High-converting 5-8 word subject line.
3. "inmail": 80-120 words. Clear value proposition, mentions 1-2 key candidate strengths, polite low-friction call to action.
4. "followUpNote": 40-60 words polite follow-up for 5 days later.

Return pure JSON:
{
  "connectionNote": "...",
  "subject": "...",
  "inmail": "...",
  "followUpNote": "..."
}`

      const result = await extractJSON<OutreachResult>(prompt, undefined, undefined, 1024)
      return NextResponse.json(result, { headers: corsHeaders })
    } catch (aiErr) {
      console.warn("Outreach AI failed, using fallback:", aiErr)
      return NextResponse.json(fallbackResult, { headers: corsHeaders })
    }
  } catch (error) {
    console.error("[POST /api/extension/outreach]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
