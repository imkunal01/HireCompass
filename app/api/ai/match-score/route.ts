import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured, formatGeminiError } from "@/lib/gemini"
import clientPromise from "@/lib/mongodb"

interface MatchResult {
  score: number
  grade: "Strong Fit" | "Good Fit" | "Partial Fit" | "Weak Fit"
  matched: { skill: string; evidence: string }[]
  missing: { skill: string; importance: "must-have" | "nice-to-have"; learnTime: string }[]
  suggestions: { action: string; priority: string }[]
  summary: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys"
      }, { status: 503 })
    }

    const { job, user, jobId } = await request.json()

    if (!job || !user) {
      return NextResponse.json({ error: "Job and user profile required" }, { status: 400 })
    }

    const prompt = `Compare this job posting with the applicant profile and evaluate fit.

Job:
${JSON.stringify(job, null, 2)}

Applicant Profile:
${JSON.stringify(user, null, 2)}

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 0-100,
  "grade": "Strong Fit" or "Good Fit" or "Partial Fit" or "Weak Fit",
  "matched": [{ "skill": "skill name", "evidence": "where in profile this appears" }],
  "missing": [{ "skill": "skill name", "importance": "must-have" or "nice-to-have", "learnTime": "e.g. 1 week" }],
  "suggestions": [{ "action": "specific actionable suggestion", "priority": "high" or "medium" }],
  "summary": "2 sentence overall assessment"
}`

    const result = await extractJSON<MatchResult>(prompt)

    // Persist the score in MongoDB for caching
    if (jobId) {
      try {
        const client = await clientPromise
        const db = client.db()
        await db.collection("matchScores").updateOne(
          { userId: session.user.id, jobId },
          { $set: { ...result, userId: session.user.id, jobId, computedAt: new Date() } },
          { upsert: true }
        )
      } catch {
        // Non-critical — don't fail the request
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/ai/match-score]", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 422 })
    }
    const { message, retryAfter } = formatGeminiError(error)
    if (message.includes("rate limit") || message.includes("quota")) {
      return NextResponse.json(
        { error: message, retryAfter },
        {
          status: 429,
          headers: retryAfter ? { "Retry-After": String(retryAfter) } : {},
        }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
