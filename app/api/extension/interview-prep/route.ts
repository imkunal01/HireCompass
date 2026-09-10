import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

interface InterviewPrepResult {
  technicalQuestions: Array<{ question: string; focus: string }>
  behavioralQuestions: Array<{ question: string; frameworkTip: string }>
  keyTopicsToReview: string[]
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
    const { jobTitle = "Software Engineer", company = "Tech Company", description = "" } = body

    const fallback: InterviewPrepResult = {
      technicalQuestions: [
        {
          question: `How would you architect a resilient, scalable component system for a role like ${jobTitle}?`,
          focus: "System Architecture & Modularity",
        },
        {
          question: "Can you walk through a complex bug you resolved and how you profiled the root cause?",
          focus: "Debugging & Problem Solving",
        },
        {
          question: "How do you manage state consistency and API latency in high-traffic scenarios?",
          focus: "Performance & Data Flow",
        },
      ],
      behavioralQuestions: [
        {
          question: `Tell me about a time you had to adapt quickly to changing technical requirements at ${company || "work"}.`,
          frameworkTip: "Use STAR (Situation, Task, Action, Result) with quantified outcome.",
        },
        {
          question: "Describe a project where you balanced code quality with tight delivery deadlines.",
          frameworkTip: "Highlight trade-off analysis and team communication.",
        },
      ],
      keyTopicsToReview: [
        "Core framework lifecycles",
        "API error handling & retry strategies",
        "Asynchronous concurrency",
        "Database indexing & query optimization",
      ],
    }

    if (!isGeminiConfigured() || !description) {
      return NextResponse.json(fallback)
    }

    try {
      const prompt = `You are a technical hiring bar raiser. Given this job opening, generate 5 high-yield interview drill questions that an interviewer is most likely to ask for this role.

Job Title: ${jobTitle}
Company: ${company}
Description:
${description.slice(0, 2500)}

Return JSON:
{
  "technicalQuestions": [
    { "question": "...", "focus": "..." },
    { "question": "...", "focus": "..." },
    { "question": "...", "focus": "..." }
  ],
  "behavioralQuestions": [
    { "question": "...", "frameworkTip": "..." },
    { "question": "...", "frameworkTip": "..." }
  ],
  "keyTopicsToReview": ["...", "...", "...", "..."]
}`

      const result = await extractJSON<InterviewPrepResult>(prompt, undefined, undefined, 1024)
      return NextResponse.json(result, { headers: corsHeaders })
    } catch (err) {
      console.warn("Interview prep AI error:", err)
      return NextResponse.json(fallback, { headers: corsHeaders })
    }
  } catch (error) {
    console.error("[POST /api/extension/interview-prep]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
