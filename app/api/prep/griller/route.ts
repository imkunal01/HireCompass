import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getUserAiConfig, incrementUserAiUsage } from "@/lib/ai-quota"
import Groq from "groq-sdk"
import { ObjectId } from "mongodb"
import { InterviewerPersona } from "@/types/prep"

export const dynamic = "force-dynamic"

const PERSONA_PROMPTS: Record<InterviewerPersona, string> = {
  staff: `You are a Principal / Staff Distributed Systems Engineer conducting a grueling technical architecture & project defense round.
Your persona: Highly technical, relentless, zero tolerance for buzzword bingo or hand-waving.
Your objective: Probe deep into the candidate's actual architectural decisions, failure modes, concurrency, scalability limits (50k+ req/sec), caching race conditions, and database guarantees.
If their answer lacks depth, call out the specific flaw and ask an even sharper follow-up.`,

  lead: `You are a Pragmatic Tech Lead conducting a system deep-dive interview.
Your persona: Grounded, practical, experienced with production incidents, technical debt, and code health.
Your objective: Evaluate whether the candidate understands testing strategies, observability (metrics, tracing), rollback mechanisms, and maintainability trade-offs.`,

  em: `You are an Engineering Manager conducting a technical project ownership and leadership review.
Your persona: Insightful, empathetic but rigorous on delivery and execution.
Your objective: Evaluate cross-functional alignment, timeline estimation trade-offs, architectural compromises made under deadline pressure, and post-mortem incident handling.`,
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, persona = "staff", messages = [], userAnswer = "" } = body

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Find the candidate's project
    const project = await db.collection("projects").findOne({
      _id: ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId,
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
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

    const groq = new Groq({ apiKey: aiConfig.apiKey })
    const personaInstruction = PERSONA_PROMPTS[persona as InterviewerPersona] || PERSONA_PROMPTS.staff

    const projectContext = `Candidate's Real Project Details:
- Project Title: ${project.title}
- Tech Stack: ${Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack || "Not specified"}
- Description: ${project.description || "Not specified"}
- Architecture / Responsibilities: ${project.responsibilities || project.architecture || "Not specified"}
- Key Challenges: ${project.challenges || "Not specified"}
- Performance / Scale Metrics: ${project.metrics || "Not specified"}`

    // If initial greeting / first question
    const isFirstQuestion = !userAnswer && messages.length === 0

    const systemPrompt = `${personaInstruction}

${projectContext}

INSTRUCTIONS:
${
  isFirstQuestion
    ? `Initiate the defense round. Formulate your sharpest, most probing first technical question challenging a core architectural choice or trade-off in their project.
Keep your response concise, intimidatingly knowledgeable, and direct (2-3 sentences max).`
    : `The candidate just answered your previous probing question with:
"${userAnswer}"

Evaluate their answer critically:
1. Generate the next follow-up probing question or technical challenge.
2. Provide a rigorous defense scorecard grading their answer on:
   - Technical Depth (1-10)
   - Trade-Off Awareness (1-10)
   - Communication & Composure (1-10)
   - Key strengths observed
   - Gaps or flaws detected
   - A concise "Gold-Standard Counter-Response" demonstrating how a Senior/Staff engineer would articulate the trade-off.`
}

Respond ONLY with a valid JSON object matching this structure:
{
  "reply": "Your spoken dialogue and next probing question to the candidate...",
  "scorecard": ${
    isFirstQuestion
      ? "null"
      : `{
    "technicalDepth": 7,
    "tradeOffAwareness": 8,
    "communicationComposure": 8,
    "strengths": ["Clear explanation of data flow"],
    "gaps": ["Did not account for Redis failover or network partition"],
    "goldStandardAnswer": "A crisp, authoritative explanation illustrating senior-level maturity...",
    "feedback": "Short constructive critique of their response."
  }`
  }
}`

    const chatHistory = messages.map((m: any) => ({
      role: m.role === "candidate" ? "user" : m.role === "interviewer" ? "assistant" : m.role,
      content: m.content,
    }))

    if (userAnswer) {
      chatHistory.push({ role: "user", content: userAnswer })
    }

    const completion = await groq.chat.completions.create({
      model: aiConfig.model || "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-6), // Keep recent turns to save tokens
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    })

    const rawContent = completion.choices[0]?.message?.content || "{}"
    let parsedData: any

    try {
      parsedData = JSON.parse(rawContent)
    } catch {
      return NextResponse.json({ error: "Failed to parse simulation response" }, { status: 500 })
    }

    // Record AI quota usage
    await incrementUserAiUsage(session.user.id)

    return NextResponse.json({
      reply: parsedData.reply,
      scorecard: parsedData.scorecard || null,
    })
  } catch (error: any) {
    console.error("[POST /api/prep/griller]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
