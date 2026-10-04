import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getUserAiConfig, incrementUserAiUsage } from "@/lib/ai-quota"
import { verifyAiRequestSecurity, createAiRateLimitResponse, AI_MAX_TOKENS } from "@/lib/ai-security"
import Groq from "groq-sdk"
import { ObjectId } from "mongodb"
import { InterviewerPersona, CandidateRole, ExperienceLevel } from "@/types/prep"

export const dynamic = "force-dynamic"

const PERSONA_PROMPTS: Record<InterviewerPersona, string> = {
  mentor: `You are a Supportive Senior Engineering Mentor conducting a project defense interview tailored especially for Freshers, College Graduates, and Junior Engineers.
Your persona: Encouraging, insightful, inquisitive, but rigorous on core fundamentals.
Your objective: Verify that the candidate genuinely understands and built their project, rather than copying a boilerplate tutorial. Probe foundational implementation details, how data flows through their application, why specific libraries/databases were picked, error boundaries, and how they debugged tricky issues.
When they answer well, acknowledge their strength warmly and ask a logical next-level question. If their answer is vague or buzzwordy, gently prompt them to explain the underlying mechanics.`,

  lead: `You are a Pragmatic Tech Lead conducting a system deep-dive interview.
Your persona: Grounded, practical, experienced with production incidents, code health, and maintainability.
Your objective: Evaluate whether the candidate understands testing strategies, observability, error recovery, rollback mechanisms, and maintainability trade-offs.`,

  staff: `You are a Principal / Staff Distributed Systems Engineer conducting an intense technical architecture & project defense round.
Your persona: Highly technical, relentless, zero tolerance for buzzword bingo or hand-waving.
Your objective: Probe deep into the candidate's actual architectural decisions, failure modes, concurrency, scalability limits (50k+ req/sec), caching race conditions, and database guarantees.`,

  em: `You are an Engineering Manager conducting a technical project ownership and leadership review.
Your persona: Insightful, empathetic but rigorous on delivery, execution, and collaboration.
Your objective: Evaluate cross-functional alignment, timeline estimation trade-offs, architectural compromises made under deadline pressure, and post-mortem incident handling.`,
}

const ROLE_FOCUS_MAP: Record<CandidateRole, string> = {
  fullstack: `CANDIDATE ROLE FOCUS: Full Stack Developer.
Focus heavily on: End-to-end data lifecycle from client interaction to database persistence, API contracts, state synchronization, authentication, CORS, security, and full-system architecture.`,

  frontend: `CANDIDATE ROLE FOCUS: Frontend / UI Developer.
Focus heavily on: React hooks/lifecycle, state management (local vs global), component re-rendering triggers, DOM rendering performance, responsive layout, async data fetching (loading, error, race conditions), and UX resilience.`,

  backend: `CANDIDATE ROLE FOCUS: Backend / API Developer.
Focus heavily on: RESTful API design, database schema modeling, primary/foreign keys, indexing, query optimization, secure authentication (JWT/bcrypt), request validation, middleware, and database connection pooling.`,

  data_ml: `CANDIDATE ROLE FOCUS: Data / AI / ML Engineer.
Focus heavily on: Data preprocessing, handling missing/dirty data, feature engineering, model evaluation metrics (precision, recall, F1, ROC-AUC), avoiding data leakage, and deployment latency.`,

  devops: `CANDIDATE ROLE FOCUS: DevOps / Cloud Engineer.
Focus heavily on: Docker containerization, multi-stage builds, CI/CD pipeline automation, environment secrets management, cloud deployment hosting, health checks, and monitoring.`,

  mobile: `CANDIDATE ROLE FOCUS: Mobile App Developer.
Focus heavily on: Mobile UI performance, screen navigation lifecycle, offline caching/data storage, handling flaky network conditions, memory usage, and list virtualization.`,

  general_sde: `CANDIDATE ROLE FOCUS: General Software Engineer (SDE).
Focus heavily on: OOP principles, data structures used in the project, algorithmic complexity (Big-O), clean modular code, unit testing, and debugging methodologies.`,
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      projectData,
      persona = "mentor",
      candidateRole = "fullstack",
      experienceLevel = "fresher",
      messages = [],
      userAnswer = "",
      action = "answer",
    } = body

    let project = projectData

    // Fetch and merge with DB project if an ObjectId or project ID is provided
    if (projectId) {
      try {
        const client = await clientPromise
        const db = client.db()
        let objectId: ObjectId | null = null
        try {
          if (ObjectId.isValid(projectId) && String(new ObjectId(projectId)) === String(projectId)) {
            objectId = new ObjectId(projectId)
          }
        } catch {
          objectId = null
        }

        const query = objectId ? { _id: objectId, userId: session.user.id } : { id: projectId, userId: session.user.id }
        const dbProject = await db.collection("projects").findOne(query)

        if (dbProject) {
          project = {
            ...dbProject,
            ...projectData,
            name: dbProject.name || projectData?.name || projectData?.title,
            title: dbProject.name || projectData?.title || projectData?.name,
            description: dbProject.description || projectData?.description,
            documentationText: dbProject.documentationText || projectData?.documentationText,
            techStack: dbProject.techStack || projectData?.techStack,
            metrics: dbProject.metrics || projectData?.metrics,
            snippets: dbProject.snippets || projectData?.snippets,
          }
        }
      } catch (dbErr) {
        console.warn("[POST /api/prep/griller] DB lookup failed, falling back to payload projectData:", dbErr)
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found. Select a project from your Vault or choose a starter project." },
        { status: 404 }
      )
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
      userInput: userAnswer || action,
      messages: Array.isArray(messages) ? messages : [],
      maxRequestsPerMinute: 15,
      maxInputChars: 3000,
      maxHistoryTurns: 6,
      checkDuplicate: Boolean(userAnswer && userAnswer.trim().length > 10),
      enforceConcurrencyLock: true,
    })

    if (!securityCheck.allowed) {
      return createAiRateLimitResponse(securityCheck)
    }

    try {
      const groq = new Groq({ apiKey: aiConfig.apiKey })
      const personaInstruction = PERSONA_PROMPTS[persona as InterviewerPersona] || PERSONA_PROMPTS.mentor
      const roleFocusInstruction = ROLE_FOCUS_MAP[candidateRole as CandidateRole] || ROLE_FOCUS_MAP.fullstack

      // Normalize project data fields for rich, contextual prompt grounding
    const projectTitle = project.name || project.title || "Selected Project"
    const projectCategory =
      project.category ||
      (Array.isArray(project.roleCategories)
        ? project.roleCategories.join(", ")
        : project.roleCategories) ||
      "Software Application"
    const projectTech = Array.isArray(project.techStack)
      ? project.techStack.join(", ")
      : project.techStack || "Not specified"
    const projectDesc = project.description || "Not specified"
    const projectDoc =
      project.documentationText ||
      project.responsibilities ||
      project.architecture ||
      ""
    const projectChallenges = project.challenges || ""
    const projectMetrics = Array.isArray(project.metrics)
      ? project.metrics.join("; ")
      : project.metrics || ""
    const projectSnippets =
      Array.isArray(project.snippets) && project.snippets.length > 0
        ? project.snippets
            .slice(0, 3)
            .map(
              (s: any) =>
                `[Code Snippet: ${s.title || s.language || "Module"}]:\n${s.code ? s.code.slice(0, 350) : ""}`
            )
            .join("\n\n")
        : ""

    const experienceInstruction =
      experienceLevel === "fresher"
        ? `EXPERIENCE LEVEL: FRESHER / ENTRY-LEVEL (0-1 Years Experience / College Graduate).
CRITICAL GUIDELINES FOR FRESHER EVALUATION:
- The candidate is a college student or junior engineer defending their project.
- Test whether they genuinely built and understand the code vs copied a boilerplate tutorial.
- Ask foundational questions about how their components, functions, or APIs work under the hood.
- Probe how data flows through their application, why specific libraries or schemas were designed this way, and how they handled errors or debugged tricky bugs.
- Do NOT interrogate them on enterprise 50k+ QPS distributed clusters, multi-region replication lag, or Kafka partition rebalancing unless they explicitly claim it in their project metrics.
- Tone: Professional, inquisitive, and encouraging. Verify genuine understanding over memorized buzzwords.`
        : experienceLevel === "mid"
        ? `EXPERIENCE LEVEL: MID-LEVEL (1-3 Years Experience).
Focus on production maintainability, testing strategies, API contracts, caching, database indexing, and edge-case handling.`
        : `EXPERIENCE LEVEL: SENIOR / STAFF (3+ Years Experience).
Focus on distributed systems failure modes, high concurrency limits, latency SLAs, architectural trade-offs, and partial failure resiliency.`

    const projectContext = `PROJECT UNDER DEFENSE (READ CAREFULLY):
- Project Title: "${projectTitle}"
- Category: ${projectCategory}
- Primary Tech Stack: ${projectTech}
- Overview / Description: ${projectDesc}
${projectDoc ? `- Architecture & Implementation Details: ${projectDoc}` : ""}
${projectChallenges ? `- Key Engineering Challenges: ${projectChallenges}` : ""}
${projectMetrics ? `- Impact & Metrics: ${projectMetrics}` : ""}
${projectSnippets ? `- Actual Code Snippets from Project:\n${projectSnippets}` : ""}`

    // Determine action mode
    const isFirstQuestion = !userAnswer && messages.length === 0
    const isNextQuestionRequest = action === "next_question" || (!userAnswer && messages.length > 0)

    const systemPrompt = `${personaInstruction}

${roleFocusInstruction}

${experienceInstruction}

${projectContext}

MANDATORY RULES FOR QUESTION RELEVANCE (STRICT):
1. EVERY SINGLE QUESTION YOU ASK MUST BE 100% SPECIFIC TO "${projectTitle}" AND ITS ACTUAL TECH STACK (${projectTech}).
2. YOU ARE STRICTLY FORBIDDEN FROM ASKING HARDCODED, GENERIC, OR UNRELATED QUESTIONS.
   - Do NOT ask about JWT or authentication UNLESS "${projectTitle}" explicitly lists authentication or JWT in its tech stack or features.
   - Do NOT ask about MongoDB or PostgreSQL unless that specific database is used in "${projectTitle}".
   - Do NOT ask textbook trivia questions detached from the candidate's real project.
3. You MUST explicitly mention "${projectTitle}" by name or cite a concrete component, feature, or data flow from its details.
4. Align your question with the candidate's role (${candidateRole}) in relation to "${projectTitle}":
   - Full Stack: How the client UI interacts with the backend routes and database for a specific feature of "${projectTitle}".
   - Frontend: Component hierarchy, state lifecycle, render optimization, UI responsiveness, or client error states in "${projectTitle}".
   - Backend: API schema design, query structure, data integrity, request validation, or service logic in "${projectTitle}".
   - Data/ML: Data cleaning, feature preparation, model evaluation, or inference endpoints in "${projectTitle}".
   - DevOps: Containerization, build steps, CI/CD automation, or environment configurations for "${projectTitle}".
   - Mobile: Screen navigation, offline persistence, list rendering, or platform interactions in "${projectTitle}".
   - General SDE: Data structures, modular abstractions, boundary edge cases, and debugging in "${projectTitle}".

INSTRUCTIONS:
${
  isFirstQuestion
    ? `Initiate the technical defense round.
Formulate a sharp, highly relevant first technical question specifically grounded in "${projectTitle}"'s features and tech stack (${projectTech}).
- For a Fresher: Ask a foundational architectural or implementation question challenging why or how they structured a key feature of "${projectTitle}".
- Explicitly cite "${projectTitle}" and a specific component or technology in your question.
- Keep your spoken dialogue concise, engaging, and direct (2-3 sentences max).`
    : isNextQuestionRequest
    ? `TASK: The candidate has completed their previous review and clicked "Proceed to Next Question".
1. Acknowledge their previous defense in ONE brief sentence (e.g. "Good points on that last area; let's examine another core part of your architecture.").
2. Formulate your NEXT technical probing question specifically about "${projectTitle}" and its tech stack (${projectTech}).
3. Probe a DIFFERENT feature, data flow, failure mode, or architectural trade-off in "${projectTitle}" that has NOT been covered yet.
4. Keep your question direct, engaging, and professional (2-3 sentences max).
5. Set "scorecard" to null since this is a new question.`
    : `The candidate just answered your previous probing question about "${projectTitle}" with:
"${userAnswer}"

Evaluate their answer critically with respect to "${projectTitle}", their role (${candidateRole}), and experience level (${experienceLevel}):
1. In "reply": Give concise, spoken evaluation feedback on how well they defended their choices (2-3 sentences max). Do NOT formulate the next question here; simply deliver your expert appraisal of their response.
2. In "scorecard": Provide a thorough, constructive defense scorecard grading their answer on:
   - Technical Depth (1-10) [For freshers: Fundamentals & implementation comprehension]
   - Trade-Off Awareness (1-10) [For freshers: Why this approach vs alternatives]
   - Communication & Composure (1-10)
   - Specific strengths observed in their explanation of "${projectTitle}"
   - Specific gaps, vague statements, or flaws detected
   - A concise "Gold-Standard Counter-Response" demonstrating how an exceptional candidate would articulate this specific answer clearly and authoritatively.
   - Constructive critique feedback.`
}

Respond ONLY with a valid JSON object matching this structure:
{
  "reply": "Your spoken dialogue to the candidate...",
  "scorecard": ${
    isFirstQuestion || isNextQuestionRequest
      ? "null"
      : `{
    "technicalDepth": 7,
    "tradeOffAwareness": 8,
    "communicationComposure": 8,
    "strengths": ["Clear explanation of data flow in ${projectTitle}"],
    "gaps": ["Did not address how network or component error states are recovered"],
    "goldStandardAnswer": "A crisp, authoritative explanation illustrating how a standout candidate should articulate this implementation with technical precision...",
    "feedback": "Constructive critique of their response."
  }`
  }
}`

    const chatHistory: Groq.Chat.Completions.ChatCompletionMessageParam[] = messages.map((m: any) => ({
      role: (m.role === "candidate" ? "user" : "assistant") as "user" | "assistant",
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
      temperature: 0.6,
      response_format: { type: "json_object" },
      max_tokens: AI_MAX_TOKENS.GRILLER_EVALUATION,
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
    } finally {
      securityCheck.releaseLock?.()
    }
  } catch (error: any) {
    console.error("[POST /api/prep/griller]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

