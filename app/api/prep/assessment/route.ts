import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUserAiConfig, incrementUserAiUsage } from "@/lib/ai-quota"
import { verifyAiRequestSecurity, createAiRateLimitResponse } from "@/lib/ai-security"
import { CAPGEMINI_PROBLEMS, getProblemById, getRandomProblem } from "@/lib/assessment-problems"
import {
  createAssessmentSession,
  getAssessmentSession,
  updateAssessmentSession,
  getUserAssessmentSessions,
  getActiveAssessmentSession,
  abandonAssessmentSession,
  resetAssessmentSession,
} from "@/lib/assessment-db"
import { evaluateAssessmentTurn } from "@/lib/assessment-engine"
import { AssessmentStage, AssessmentProblem } from "@/types/assessment"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const company = searchParams.get("company") || "Capgemini"
    const isHistory = searchParams.get("history") === "true"

    if (sessionId) {
      const assessmentSession = await getAssessmentSession(sessionId, session.user.id)
      if (!assessmentSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      return NextResponse.json({ session: assessmentSession })
    }

    const [pastSessions, activeSession] = await Promise.all([
      getUserAssessmentSessions(session.user.id, company),
      getActiveAssessmentSession(session.user.id, company),
    ])

    return NextResponse.json({
      company,
      activeSession,
      problems: CAPGEMINI_PROBLEMS,
      recentSessions: pastSessions,
    })
  } catch (error: any) {
    console.error("[GET /api/prep/assessment]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, problemId, difficulty = "standard", sessionId, userInput, customProblem } = body

    // ─── 1. Action: START ───────────────────────────────────────────────
    if (action === "start") {
      let problem: AssessmentProblem | undefined

      if (customProblem) {
        problem = customProblem
      } else if (problemId && problemId !== "random") {
        problem = getProblemById(problemId)
      } else {
        // Query candidate's past assessment attempts to guarantee true non-repeating random rotation
        const pastSessions = await getUserAssessmentSessions(session.user.id, "Capgemini")
        const attemptedIds = (pastSessions || [])
          .map((s) => s.problemId || s.problem?.id)
          .filter(Boolean) as string[]

        problem = getRandomProblem(attemptedIds)
      }

      if (!problem) {
        problem = getRandomProblem()
      }

      // Automatically supersede and abandon any existing ACTIVE sessions for this user
      // so they never get trapped in a stale session reload loop
      const existingActive = await getActiveAssessmentSession(session.user.id, "Capgemini")
      if (existingActive) {
        await abandonAssessmentSession(existingActive._id || existingActive.id || "", session.user.id)
      }

      const newSession = await createAssessmentSession(session.user.id, problem, difficulty)
      return NextResponse.json({ session: newSession })
    }

    // ─── 2. Action: ABANDON ─────────────────────────────────────────────
    if (action === "abandon") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }

      const abandoned = await abandonAssessmentSession(sessionId, session.user.id)
      if (!abandoned) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: abandoned })
    }

    // ─── 3. Action: RESET ───────────────────────────────────────────────
    if (action === "reset") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }

      const reset = await resetAssessmentSession(sessionId, session.user.id)
      if (!reset) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: reset })
    }

    // ─── 4. Action: RESPOND ─────────────────────────────────────────────
    if (action === "respond") {
      if (!sessionId || typeof userInput !== "string") {
        return NextResponse.json(
          { error: "Session ID and userInput string are required" },
          { status: 400 }
        )
      }

      // Security check: rate limiting, concurrency lock, duplicate spam, input bounding
      const securityCheck = await verifyAiRequestSecurity({
        userId: session.user.id,
        userInput,
        maxRequestsPerMinute: 15,
        maxInputChars: 3500,
        checkDuplicate: true,
        enforceConcurrencyLock: true,
      })

      if (!securityCheck.allowed) {
        return createAiRateLimitResponse(securityCheck)
      }

      try {
        const assessmentSession = await getAssessmentSession(sessionId, session.user.id)
        if (!assessmentSession) {
          return NextResponse.json({ error: "Assessment session not found" }, { status: 404 })
        }

        if (assessmentSession.status === "PASSED" || assessmentSession.status === "FAILED") {
          return NextResponse.json(
            { error: "This assessment session has already ended.", session: assessmentSession },
            { status: 400 }
          )
        }

        // Check AI config and quotas
        const aiConfig = await getUserAiConfig(session.user.id)
        if (aiConfig.usage.isLimitReached) {
          return NextResponse.json(
            {
              error:
                "Free AI quota limit reached. Add your personal Groq API key in Settings for unlimited generations.",
              isQuotaExceeded: true,
            },
            { status: 429 }
          )
        }

        const effectiveInput = securityCheck.sanitizedInput || userInput.trim()
        const now = new Date().toISOString()

        // Record candidate message into history
        assessmentSession.messages.push({
          id: `msg-cand-${Date.now()}`,
          role: "candidate",
          content: effectiveInput,
          stage: assessmentSession.currentStage,
          timestamp: now,
        })

        // Run evaluator turn
        const evaluatorResult = await evaluateAssessmentTurn({
          session: assessmentSession,
          userInput: effectiveInput,
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
        })

        // Update session state based on authoritative evaluator output
        if (evaluatorResult.isBypassAttempt) {
          assessmentSession.bypassAttemptsCount = (assessmentSession.bypassAttemptsCount || 0) + 1
        }

        if (evaluatorResult.unlockNextStage && evaluatorResult.nextStage) {
          assessmentSession.currentStage = evaluatorResult.nextStage
        }

        // Track stage inputs
        if (assessmentSession.currentStage === "UNDERSTANDING" && evaluatorResult.status === "SUFFICIENT") {
          assessmentSession.candidateUnderstanding = effectiveInput
        } else if (assessmentSession.currentStage === "APPROACH" && evaluatorResult.status === "VALID") {
          assessmentSession.candidateApproach = effectiveInput
        } else if (assessmentSession.currentStage === "IMPLEMENTATION_PROMPT" && evaluatorResult.status === "SUFFICIENT") {
          assessmentSession.implementationPrompt = effectiveInput
        }

        // If code was generated
        if (evaluatorResult.generatedCode) {
          assessmentSession.generatedCode = evaluatorResult.generatedCode
          assessmentSession.revisions.push({
            revisionNumber: assessmentSession.revisions.length + 1,
            timestamp: now,
            code: evaluatorResult.generatedCode,
            modificationRequest: effectiveInput,
            isCurrent: true,
          })
        }

        // If defect was seeded
        if (evaluatorResult.seededDefect) {
          assessmentSession.seededDefect = evaluatorResult.seededDefect
        }

        // If candidate identified defect during review
        if (evaluatorResult.defectAcknowledged && assessmentSession.seededDefect) {
          assessmentSession.seededDefect.wasIdentified = true
          assessmentSession.seededDefect.candidateIdentifiedDescription = effectiveInput
        }

        // If final scorecard produced
        if (evaluatorResult.scorecard) {
          assessmentSession.evaluation = evaluatorResult.scorecard
          assessmentSession.status = evaluatorResult.scorecard.passed ? "PASSED" : "FAILED"
          if (evaluatorResult.scorecard.passed) {
            assessmentSession.currentStage = "COMPLETED"
          }
        }

        // Add assistant response message
        assessmentSession.messages.push({
          id: `msg-ai-${Date.now()}`,
          role: "assistant",
          content: evaluatorResult.aiMessage,
          stage: assessmentSession.currentStage,
          timestamp: new Date().toISOString(),
          isBypassAttempt: evaluatorResult.isBypassAttempt,
          verdict: evaluatorResult.status,
          missingRequirements: evaluatorResult.missingRequirements,
          codeSnippet: evaluatorResult.generatedCode,
        })

        assessmentSession.updatedAt = new Date().toISOString()

        // Save updated authoritative state to MongoDB
        await updateAssessmentSession(assessmentSession)

        // Count AI usage
        await incrementUserAiUsage(session.user.id)

        return NextResponse.json({
          session: assessmentSession,
          evaluatorResult,
        })
      } finally {
        securityCheck.releaseLock?.()
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[POST /api/prep/assessment]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
