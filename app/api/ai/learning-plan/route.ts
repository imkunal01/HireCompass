import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { streamText, isGeminiConfigured } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys" }, { status: 503 })
    }

    const { missingSkills } = await request.json()
    if (!missingSkills || missingSkills.length === 0) {
      return NextResponse.json({ error: "Missing skills array required" }, { status: 400 })
    }

    const prompt = `Create a practical learning plan for these skills that are needed for a job application:
${missingSkills.map((s: any) => `- ${s.skill} (${s.importance}, estimated ${s.learnTime})`).join("\n")}

Write a structured markdown learning plan with:
1. Priority order (must-have skills first)
2. For each skill: what to learn, best free resources, mini-project to prove proficiency
3. Weekly schedule suggestion
4. Keep it motivating and practical

Use clear markdown headers and bullet points.`

    return new Response(streamText(prompt), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[POST /api/ai/learning-plan]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
