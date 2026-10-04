import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getUserAiConfig, incrementUserAiUsage } from "@/lib/ai-quota"
import { verifyAiRequestSecurity, createAiRateLimitResponse, AI_MAX_TOKENS } from "@/lib/ai-security"
import Groq from "groq-sdk"
import { WarRoomDossier } from "@/types/prep"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const company = (body.company || "").trim()
    const role = (body.role || "").trim()
    const roundType = (body.roundType || "Technical Phone Screen").trim()

    if (!company) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const dossiersCol = db.collection("war_room_dossiers")

    // Check cached dossier (within last 7 days)
    const cached = await dossiersCol.findOne({
      userId: session.user.id,
      company: { $regex: new RegExp(`^${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      roundType: { $regex: new RegExp(`^${roundType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    })

    if (cached && !body.forceRefresh) {
      return NextResponse.json({
        dossier: cached.dossier,
        cached: true,
      })
    }

    // Resolve AI configuration and quota
    const aiConfig = await getUserAiConfig(session.user.id)
    if (aiConfig.usage.isLimitReached) {
      return NextResponse.json(
        {
          error: "Free AI quota limit reached. Add your personal Groq API key in Settings for unlimited generations.",
          isQuotaExceeded: true,
        },
        { status: 429 }
      )
    }

    if (!aiConfig.apiKey) {
      return NextResponse.json(
        { error: "AI service currently unavailable. Please provide a Groq API key in Settings." },
        { status: 503 }
      )
    }

    // AI Security Check: sliding window velocity, concurrency lock, and token defense
    const securityCheck = await verifyAiRequestSecurity({
      userId: session.user.id,
      userInput: `${company}:${role}:${roundType}`,
      maxRequestsPerMinute: 8,
      checkDuplicate: false, // forceRefresh may legitimately re-generate
      enforceConcurrencyLock: true,
    })

    if (!securityCheck.allowed) {
      return createAiRateLimitResponse(securityCheck)
    }

    try {
      const groq = new Groq({ apiKey: aiConfig.apiKey })

      const prompt = `You are a Principal Engineering Interview Coach & Technical Talent Strategist.
Generate a tactical interview preparation dossier for the following target:
- Company: ${company}
- Role: ${role || "Software Engineer"}
- Round Type: ${roundType}

Provide insider analysis on:
1. What this specific company and engineering team looks for in this round format.
2. The company engineering culture quirks, interview friction points, and evaluation criteria.
3. Top 5 high-yield technical and architectural topics to review right before this round.
4. 4 high-signal, remarkable "Reverse Interview Questions" the candidate should ask the interviewer at the end of the round.
Each reverse question MUST demonstrate deep technical maturity, trade-off understanding, and knowledge of the company's domain/scale.
5. Suggested problem-solving sheet category (one of: "DSA", "OS", "CN", "DBMS", "System Design").

Respond ONLY with a valid JSON object matching this structure:
{
  "company": "${company}",
  "role": "${role || "Software Engineer"}",
  "roundType": "${roundType}",
  "cultureNotes": "2-3 sentences analyzing how this company interviews and their engineering values.",
  "roundExpectations": ["Expectation 1", "Expectation 2", "Expectation 3", "Expectation 4"],
  "highYieldTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "reverseQuestions": [
    {
      "category": "Architecture | Scale & Reliability | Culture & Team",
      "question": "Exact question to ask...",
      "contextRationale": "Why this question establishes executive presence and technical depth."
    }
  ],
  "suggestedSheetCategory": "DSA | System Design | OS | DBMS"
}`

      const completion = await groq.chat.completions.create({
        model: aiConfig.model || "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You output only clean, valid JSON without markdown fences or additional commentary.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: AI_MAX_TOKENS.WAR_ROOM_DOSSIER,
      })

      const rawContent = completion.choices[0]?.message?.content || "{}"
      let dossier: WarRoomDossier

      try {
        dossier = JSON.parse(rawContent)
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
      }

      // Record AI quota usage
      await incrementUserAiUsage(session.user.id)

      // Cache the dossier in MongoDB
      const now = new Date()
      await dossiersCol.updateOne(
        {
          userId: session.user.id,
          company: company.toLowerCase(),
          roundType: roundType.toLowerCase(),
        },
        {
          $set: {
            userId: session.user.id,
            company: company.toLowerCase(),
            roundType: roundType.toLowerCase(),
            dossier,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      )

      return NextResponse.json({ dossier, cached: false })
    } finally {
      securityCheck.releaseLock?.()
    }
  } catch (error: any) {
    console.error("[POST /api/prep/war-room]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
