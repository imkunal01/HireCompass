import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
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
import { AssessmentStage, AssessmentProblem, AssessmentScorecard } from "@/types/assessment"

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
    const {
      action,
      problemId,
      difficulty = "standard",
      timeLimitMinutes = 30,
      sessionId,
      userInput,
      customProblem,
      timeSpentSeconds,
    } = body

    const client = await clientPromise
    const db = client.db()

    // ─── 1. Action: START ───────────────────────────────────────────────
    if (action === "start") {
      let problem: AssessmentProblem | undefined

      if (customProblem) {
        problem = customProblem
      } else if (problemId && problemId !== "random") {
        problem = getProblemById(problemId)
        if (!problem) {
          problem = CAPGEMINI_PROBLEMS.find(
            (p) =>
              p.id.toLowerCase() === problemId.toLowerCase() ||
              p.title.toLowerCase() === problemId.toLowerCase()
          )
        }
        // If still not found, check sheet_items collection
        if (!problem) {
          try {
            const query = ObjectId.isValid(problemId)
              ? { _id: new ObjectId(problemId) }
              : { title: new RegExp(`^${problemId}$`, "i") }
            const sheetItem = await db.collection("sheet_items").findOne(query)
            if (sheetItem) {
              const matchedCapgemini = CAPGEMINI_PROBLEMS.find(
                (p) => p.title.toLowerCase() === sheetItem.title.toLowerCase()
              )
              if (matchedCapgemini) {
                problem = matchedCapgemini
              } else {
                problem = {
                  id: sheetItem._id.toString(),
                  title: sheetItem.title,
                  company: "Capgemini",
                  category: sheetItem.topic || "DSA",
                  difficulty: (["Easy", "Medium", "Hard"].includes(sheetItem.difficulty)
                    ? sheetItem.difficulty
                    : "Medium") as "Easy" | "Medium" | "Hard",
                  tags: sheetItem.tags || [sheetItem.topic || "DSA"],
                  description: `Implement an optimal solution for "${sheetItem.title}". Formulate data structures, analyze algorithmic complexity, and structure your implementation.`,
                  inputFormat: "Standard problem input",
                  outputFormat: "Standard problem output",
                  constraints: ["Time complexity must be optimal for constraints", "Space complexity must be minimized"],
                  examples: [
                    {
                      input: "Sample input",
                      output: "Sample output",
                      explanation: "Standard evaluation example",
                    },
                  ],
                  keyEdgeCases: ["Empty input condition", "Boundary value limits"],
                  expectedComplexity: { time: "O(n)", space: "O(n)" },
                }
              }
            }
          } catch (e) {
            console.warn("[assessment] Could not lookup sheet item:", e)
          }
        }
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

      // Fetch user's custom assessmentTokenLimit if set by admin
      let userTokenLimit = 2000
      try {
        const userDoc = await db.collection("users").findOne(
          { _id: new ObjectId(session.user.id) },
          { projection: { assessmentTokenLimit: 1 } }
        )
        if (typeof userDoc?.assessmentTokenLimit === "number" && userDoc.assessmentTokenLimit > 0) {
          userTokenLimit = userDoc.assessmentTokenLimit
        }
      } catch (err) {
        console.warn("[assessment] User token limit fetch fallback:", err)
      }

      const parsedLimit = Math.max(5, Math.min(180, parseInt(String(timeLimitMinutes || 30), 10)))

      // Automatically supersede and abandon any existing ACTIVE sessions for this user
      const existingActive = await getActiveAssessmentSession(session.user.id, "Capgemini")
      if (existingActive) {
        await abandonAssessmentSession(existingActive._id || existingActive.id || "", session.user.id)
      }

      const newSession = await createAssessmentSession(
        session.user.id,
        problem,
        difficulty,
        parsedLimit,
        userTokenLimit
      )
      return NextResponse.json({ session: newSession })
    }

    // ─── 2. Action: PAUSE ───────────────────────────────────────────────
    if (action === "pause") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }
      const assessmentSession = await getAssessmentSession(sessionId, session.user.id)
      if (!assessmentSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      assessmentSession.isPaused = true
      assessmentSession.lastPausedAt = new Date().toISOString()
      if (typeof timeSpentSeconds === "number") {
        assessmentSession.timeSpentSeconds = Math.max(0, timeSpentSeconds)
      }
      assessmentSession.updatedAt = new Date().toISOString()
      await updateAssessmentSession(assessmentSession)
      return NextResponse.json({ session: assessmentSession })
    }

    // ─── 3. Action: RESUME ──────────────────────────────────────────────
    if (action === "resume") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }
      const assessmentSession = await getAssessmentSession(sessionId, session.user.id)
      if (!assessmentSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      assessmentSession.isPaused = false
      assessmentSession.lastPausedAt = null
      assessmentSession.updatedAt = new Date().toISOString()
      await updateAssessmentSession(assessmentSession)
      return NextResponse.json({ session: assessmentSession })
    }

    // ─── 4. Action: SYNC_TIMER ──────────────────────────────────────────
    if (action === "sync_timer") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }
      const assessmentSession = await getAssessmentSession(sessionId, session.user.id)
      if (!assessmentSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      if (typeof timeSpentSeconds === "number") {
        assessmentSession.timeSpentSeconds = Math.max(0, timeSpentSeconds)
      }

      const totalAllowedSecs = (assessmentSession.timeLimitMinutes || 30) * 60
      if (
        assessmentSession.status === "ACTIVE" &&
        (assessmentSession.timeSpentSeconds || 0) >= totalAllowedSecs
      ) {
        // Time limit reached!
        assessmentSession.status = "FAILED"
        assessmentSession.failReason = "TIME_EXCEEDED"
        const failedScorecard: AssessmentScorecard = {
          aiLiteracy: 8,
          promptQuality: 8,
          problemSolving: 8,
          reviewAndAdapt: 6,
          totalScore: 30,
          passed: false,
          summary: `Time limit exceeded (${assessmentSession.timeLimitMinutes} minutes). The candidate did not complete all assessment stages within the allotted time limit.`,
          strengths: ["Initiated problem assessment workflow"],
          gaps: ["Pacing: Could not complete reasoning, code review, and refinement within the allocated stopwatch time limit."],
          stageBreakdown: {
            understanding: { score: 8, verdict: "PARTIAL", notes: "Incomplete due to time expiration" },
            approach: { score: 8, verdict: "PARTIAL", notes: "Incomplete due to time expiration" },
            prompting: { score: 8, verdict: "PARTIAL", notes: "Incomplete due to time expiration" },
            review: { score: 6, verdict: "PARTIAL", notes: "Incomplete due to time expiration" },
            refinement: { score: 0, verdict: "INSUFFICIENT", notes: "Stage not reached before time expired" },
          },
        }
        assessmentSession.evaluation = failedScorecard
        assessmentSession.messages.push({
          id: `msg-timeout-${Date.now()}`,
          role: "assistant",
          content: `⏱️ **Time Limit Reached (${assessmentSession.timeLimitMinutes}m):** The allocated test stopwatch has expired before completing all problem stages. This assessment session has ended and is marked as FAILED.`,
          stage: assessmentSession.currentStage,
          timestamp: new Date().toISOString(),
        })
      }

      assessmentSession.updatedAt = new Date().toISOString()
      await updateAssessmentSession(assessmentSession)
      return NextResponse.json({ session: assessmentSession })
    }

    // ─── 5. Action: ABANDON ─────────────────────────────────────────────
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

    // ─── 6. Action: RESET ───────────────────────────────────────────────
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

    // ─── 7. Action: RESPOND ─────────────────────────────────────────────
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

        // Sync elapsed time if sent in payload
        if (typeof timeSpentSeconds === "number") {
          assessmentSession.timeSpentSeconds = Math.max(0, timeSpentSeconds)
        }

        const maxSecs = (assessmentSession.timeLimitMinutes || 30) * 60
        const tokenBudget = assessmentSession.tokenLimit || 2000

        // Check 1: Time limit expiration check
        if ((assessmentSession.timeSpentSeconds || 0) >= maxSecs) {
          assessmentSession.status = "FAILED"
          assessmentSession.failReason = "TIME_EXCEEDED"
          assessmentSession.evaluation = {
            aiLiteracy: 10,
            promptQuality: 10,
            problemSolving: 10,
            reviewAndAdapt: 5,
            totalScore: 35,
            passed: false,
            summary: `Time limit exceeded (${assessmentSession.timeLimitMinutes} minutes). Problem was not solved within the allotted time limit.`,
            strengths: ["Engagement with AI assistant"],
            gaps: ["Exceeded time limit before completing all assessment stages."],
            stageBreakdown: {
              understanding: { score: 10, verdict: "PARTIAL", notes: "Time limit expired" },
              approach: { score: 10, verdict: "PARTIAL", notes: "Time limit expired" },
              prompting: { score: 10, verdict: "PARTIAL", notes: "Time limit expired" },
              review: { score: 5, verdict: "PARTIAL", notes: "Time limit expired" },
              refinement: { score: 0, verdict: "INSUFFICIENT", notes: "Stage not reached" },
            },
          }
          await updateAssessmentSession(assessmentSession)
          return NextResponse.json({
            session: assessmentSession,
            error: "Assessment failed: Time limit exceeded.",
          })
        }

        // Check 2: Token limit check before LLM invocation
        if ((assessmentSession.tokensUsed || 0) >= tokenBudget) {
          assessmentSession.status = "FAILED"
          assessmentSession.failReason = "TOKEN_LIMIT_EXCEEDED"
          assessmentSession.evaluation = {
            aiLiteracy: 12,
            promptQuality: 10,
            problemSolving: 10,
            reviewAndAdapt: 6,
            totalScore: 38,
            passed: false,
            summary: `Token budget limit exceeded (${assessmentSession.tokensUsed}/${tokenBudget} tokens). The candidate ran out of tokens before solving the problem.`,
            strengths: ["Interactive prompting"],
            gaps: ["Excessive turn verbosity; exhausted token quota before achieving a verified solution."],
            stageBreakdown: {
              understanding: { score: 12, verdict: "PARTIAL", notes: "Tokens exhausted" },
              approach: { score: 10, verdict: "PARTIAL", notes: "Tokens exhausted" },
              prompting: { score: 10, verdict: "PARTIAL", notes: "Tokens exhausted" },
              review: { score: 6, verdict: "PARTIAL", notes: "Tokens exhausted" },
              refinement: { score: 0, verdict: "INSUFFICIENT", notes: "Tokens exhausted" },
            },
          }
          await updateAssessmentSession(assessmentSession)
          return NextResponse.json({
            session: assessmentSession,
            error: "Assessment failed: Token budget exhausted.",
          })
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

        // Update tokens used in session
        const turnTokens = evaluatorResult.tokensUsed || Math.max(40, Math.ceil((effectiveInput.length + 300) / 4))
        assessmentSession.tokensUsed = (assessmentSession.tokensUsed || 0) + turnTokens

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

        // Check if token limit was exceeded on this turn without passing
        const isSolved = evaluatorResult.scorecard?.passed === true
        if (!isSolved && (assessmentSession.tokensUsed || 0) >= tokenBudget) {
          assessmentSession.status = "FAILED"
          assessmentSession.failReason = "TOKEN_LIMIT_EXCEEDED"
          assessmentSession.evaluation = {
            aiLiteracy: 12,
            promptQuality: 10,
            problemSolving: 10,
            reviewAndAdapt: 6,
            totalScore: 38,
            passed: false,
            summary: `Token budget limit reached (${assessmentSession.tokensUsed}/${tokenBudget} tokens). Assessment failed because the problem was not solved within the allocated token budget.`,
            strengths: ["Iterative prompt collaboration"],
            gaps: ["Token budget exhausted prior to final verification."],
            stageBreakdown: {
              understanding: { score: 12, verdict: "PARTIAL", notes: "Exceeded token limit" },
              approach: { score: 10, verdict: "PARTIAL", notes: "Exceeded token limit" },
              prompting: { score: 10, verdict: "PARTIAL", notes: "Exceeded token limit" },
              review: { score: 6, verdict: "PARTIAL", notes: "Exceeded token limit" },
              refinement: { score: 0, verdict: "INSUFFICIENT", notes: "Stage not completed" },
            },
          }
          evaluatorResult.scorecard = assessmentSession.evaluation
        } else if (evaluatorResult.scorecard) {
          // If final scorecard produced by evaluator
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

        // If token limit was exceeded, append notification warning message
        if (assessmentSession.status === "FAILED" && assessmentSession.failReason === "TOKEN_LIMIT_EXCEEDED") {
          assessmentSession.messages.push({
            id: `msg-token-exhausted-${Date.now()}`,
            role: "assistant",
            content: `🚫 **Token Budget Exhausted (${assessmentSession.tokensUsed}/${tokenBudget} tokens):** You have exceeded the allocated token allowance for this assessment without reaching the final verified solution. This assessment has been concluded as FAILED.`,
            stage: assessmentSession.currentStage,
            timestamp: new Date().toISOString(),
          })
        }

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
