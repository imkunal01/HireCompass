import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getUserAiConfig, incrementUserAiUsage } from "@/lib/ai-quota"
import { verifyAiRequestSecurity, createAiRateLimitResponse, AI_MAX_TOKENS } from "@/lib/ai-security"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const oppsCol = db.collection("opportunities")

    // Find all rejected opportunities
    const rejectedOpps = await oppsCol
      .find({
        userId: session.user.id,
        $or: [{ status: "REJECTED" }, { "rejectionDetails.stage": { $exists: true } }],
      })
      .sort({ updatedAt: -1 })
      .toArray()

    // Aggregate drop-off stages and reason categories
    const stageCounts: Record<string, number> = {}
    const reasonCounts: Record<string, number> = {}

    for (const opp of rejectedOpps) {
      const stage = opp.rejectionDetails?.stage || "Technical Screen / OA"
      const reason = opp.rejectionDetails?.reasonCategory || "Skillset / Technical Gap"
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    }

    // Top failure patterns
    const topVulnerabilities = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        category: reason,
        occurrences: count,
      }))

    return NextResponse.json({
      totalRejections: rejectedOpps.length,
      topVulnerabilities,
      stageCounts,
      recentRejections: rejectedOpps.slice(0, 5).map((o) => ({
        id: o._id.toString(),
        company: o.company,
        role: o.role,
        stage: o.rejectionDetails?.stage || "Technical Round",
        reason: o.rejectionDetails?.reasonCategory || "Technical Gaps",
        notes: o.rejectionDetails?.notes || "",
      })),
    })
  } catch (error) {
    console.error("[GET /api/prep/remediation]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetCategory } = body

    const client = await clientPromise
    const db = client.db()
    const oppsCol = db.collection("opportunities")

    const rejectedOpps = await oppsCol
      .find({
        userId: session.user.id,
        $or: [{ status: "REJECTED" }, { "rejectionDetails.stage": { $exists: true } }],
      })
      .limit(8)
      .toArray()

    const rejectionContext = rejectedOpps.map((o) => ({
      company: o.company,
      stage: o.rejectionDetails?.stage || "Technical",
      reason: o.rejectionDetails?.reasonCategory || "Unknown",
      notes: o.rejectionDetails?.notes || "",
    }))

    // Resolve AI Config
    const aiConfig = await getUserAiConfig(session.user.id)
    if (aiConfig.usage.isLimitReached) {
      return NextResponse.json(
        {
          error: "Free AI quota limit reached. Add your Groq API key in Settings for unlimited drills.",
          isQuotaExceeded: true,
        },
        { status: 429 }
      )
    }

    // AI Security Check: velocity rate limit and concurrency lock
    const securityCheck = await verifyAiRequestSecurity({
      userId: session.user.id,
      userInput: targetCategory,
      maxRequestsPerMinute: 8,
      checkDuplicate: false,
      enforceConcurrencyLock: true,
    })

    if (!securityCheck.allowed) {
      return createAiRateLimitResponse(securityCheck)
    }

    try {
      const groq = new Groq({ apiKey: aiConfig.apiKey })

      const prompt = `You are a Principal Engineering Career Strategist & Post-Mortem Remediation Specialist.
The candidate has logged the following rejection drop-offs in their job hunt:
${JSON.stringify(rejectionContext, null, 2)}

Target focus: ${targetCategory || "Address top recurring failure points"}

Generate 3 targeted, high-impact "Anti-Pattern Recovery Drills" that specifically challenge the candidate on the exact technical or architectural weaknesses that got them rejected.
For each drill:
1. State the historical pitfall / anti-pattern they previously demonstrated.
2. Pose an active, concise technical challenge or trade-off scenario to test remediation.
3. Provide the gold-standard solution / mental model.
4. Recommend the specific topic sheet in Problem Solving Prep to practice (e.g. "Arrays & Hashing", "Dynamic Programming", "Concurrency & Synchronization", "Distributed Data", "System Design").

Respond ONLY with a valid JSON object matching this structure:
{
  "drills": [
    {
      "id": "drill-1",
      "historicalTrap": "Why candidates stumble on this in actual rounds...",
      "challengeTitle": "Crisp title of the remediation challenge",
      "challengePrompt": "Scenario or problem prompt to solve in 5 minutes...",
      "solutionKey": "Key insight and optimal architectural resolution...",
      "recommendedSheetTopic": "Exact topic name to practice",
      "recommendedCategory": "DSA | OS | CN | DBMS | System Design"
    }
  ],
  "confidenceRecoveryTip": "A 1-sentence psychological anchor to rebuild confidence before the next interview."
}`

      const completion = await groq.chat.completions.create({
        model: aiConfig.model || "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You output only clean, valid JSON without markdown fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: AI_MAX_TOKENS.REMEDIATION_DRILL,
      })

      const raw = completion.choices[0]?.message?.content || "{}"
      let parsed: any
      try {
        parsed = JSON.parse(raw)
      } catch {
        return NextResponse.json({ error: "Failed to parse remediation drills" }, { status: 500 })
      }

      await incrementUserAiUsage(session.user.id)

      return NextResponse.json({
        drills: parsed.drills || [],
        confidenceRecoveryTip: parsed.confidenceRecoveryTip || "",
      })
    } finally {
      securityCheck.releaseLock?.()
    }
  } catch (error: any) {
    console.error("[POST /api/prep/remediation]", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
