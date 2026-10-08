import { Db, ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import {
  AssessmentSession,
  AssessmentProblem,
  AssessmentDifficulty,
  AssessmentStage,
  AssessmentStatus,
  AssessmentScorecard,
} from "@/types/assessment"

let indexesEnsured = false

export async function getAssessmentDb(): Promise<Db> {
  const client = await clientPromise
  const db = client.db()
  if (!indexesEnsured) {
    await ensureAssessmentIndexes(db).catch((err) =>
      console.error("[assessment-db] Failed to ensure indexes:", err)
    )
    indexesEnsured = true
  }
  return db
}

export async function ensureAssessmentIndexes(db: Db) {
  const sessionsCol = db.collection("assessment_sessions")
  await sessionsCol.createIndex({ userId: 1, updatedAt: -1 })
  await sessionsCol.createIndex({ userId: 1, problemId: 1 })
  await sessionsCol.createIndex({ company: 1, status: 1 })
}

export async function createAssessmentSession(
  userId: string,
  problem: AssessmentProblem,
  difficulty: AssessmentDifficulty = "standard",
  timeLimitMinutes: number = 30,
  tokenLimit: number = 2000
): Promise<AssessmentSession> {
  const db = await getAssessmentDb()
  const sessionsCol = db.collection("assessment_sessions")

  const now = new Date().toISOString()

  // Initial stage is PROBLEM_PRESENTED
  const initialSession: Omit<AssessmentSession, "_id"> = {
    userId,
    company: problem.company || "Capgemini",
    problemId: problem.id,
    problem,
    difficulty,
    currentStage: "UNDERSTANDING",
    status: "ACTIVE",
    bypassAttemptsCount: 0,
    revisions: [],
    timeLimitMinutes,
    timeSpentSeconds: 0,
    isPaused: false,
    lastPausedAt: null,
    tokenLimit,
    tokensUsed: 0,
    failReason: null,
    messages: [
      {
        id: "msg-init-0",
        role: "assistant",
        content: `Welcome to the AI-Assisted Coding Assessment Simulator.

Problem: **${problem.title}** (${problem.difficulty})
Time Limit: **${timeLimitMinutes} minutes** | Token Budget: **${tokenLimit.toLocaleString()} tokens**

Before I generate code, explain your understanding of the problem. State what the input represents, what output is required, and which edge cases or constraints you think matter.`,
        stage: "UNDERSTANDING",
        timestamp: now,
      },
    ],
    startedAt: now,
    updatedAt: now,
  }

  const result = await sessionsCol.insertOne({
    ...initialSession,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return {
    ...initialSession,
    _id: result.insertedId.toString(),
    id: result.insertedId.toString(),
  }
}

export async function getAssessmentSession(
  sessionId: string,
  userId: string
): Promise<AssessmentSession | null> {
  const db = await getAssessmentDb()
  const sessionsCol = db.collection("assessment_sessions")

  if (!ObjectId.isValid(sessionId)) return null

  const doc = await sessionsCol.findOne({
    _id: new ObjectId(sessionId),
    userId,
  })

  if (!doc) return null

  return {
    ...doc,
    _id: doc._id.toString(),
    id: doc._id.toString(),
  } as unknown as AssessmentSession
}

export async function updateAssessmentSession(
  session: AssessmentSession
): Promise<void> {
  const db = await getAssessmentDb()
  const sessionsCol = db.collection("assessment_sessions")

  const sessionId = session._id || session.id
  if (!sessionId || !ObjectId.isValid(sessionId)) return

  const { _id, id, ...updateFields } = session

  await sessionsCol.updateOne(
    { _id: new ObjectId(sessionId), userId: session.userId },
    {
      $set: {
        ...updateFields,
        updatedAt: new Date().toISOString(),
      },
    }
  )
}

export async function getUserAssessmentSessions(
  userId: string,
  company: string = "Capgemini"
): Promise<AssessmentSession[]> {
  const db = await getAssessmentDb()
  const sessionsCol = db.collection("assessment_sessions")

  const docs = await sessionsCol
    .find({ userId, company })
    .sort({ updatedAt: -1 })
    .limit(20)
    .toArray()

  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    id: doc._id.toString(),
  })) as unknown as AssessmentSession[]
}

export async function getActiveAssessmentSession(
  userId: string,
  company: string = "Capgemini"
): Promise<AssessmentSession | null> {
  const db = await getAssessmentDb()
  const sessionsCol = db.collection("assessment_sessions")

  const doc = await sessionsCol.findOne(
    { userId, company, status: "ACTIVE" },
    { sort: { updatedAt: -1 } }
  )

  if (!doc) return null

  return {
    ...doc,
    _id: doc._id.toString(),
    id: doc._id.toString(),
  } as unknown as AssessmentSession
}

export async function abandonAssessmentSession(
  sessionId: string,
  userId: string
): Promise<AssessmentSession | null> {
  const existing = await getAssessmentSession(sessionId, userId)
  if (!existing) return null

  const now = new Date().toISOString()
  const abandonedSession: AssessmentSession = {
    ...existing,
    status: "ABANDONED",
    updatedAt: now,
  }

  await updateAssessmentSession(abandonedSession)
  return abandonedSession
}

export async function resetAssessmentSession(
  sessionId: string,
  userId: string
): Promise<AssessmentSession | null> {
  const existing = await getAssessmentSession(sessionId, userId)
  if (!existing) return null

  const now = new Date().toISOString()
  const resetSession: AssessmentSession = {
    ...existing,
    currentStage: "UNDERSTANDING",
    status: "ACTIVE",
    bypassAttemptsCount: 0,
    timeSpentSeconds: 0,
    tokensUsed: 0,
    isPaused: false,
    lastPausedAt: null,
    failReason: null,
    candidateUnderstanding: undefined,
    candidateApproach: undefined,
    implementationPrompt: undefined,
    generatedCode: undefined,
    seededDefect: null,
    reviewFindings: [],
    revisions: [],
    evaluation: null,
    messages: [
      {
        id: `msg-reset-${Date.now()}`,
        role: "assistant",
        content: `Session restarted.

Problem: **${existing.problem.title}** (${existing.problem.difficulty})
Time Limit: **${existing.timeLimitMinutes || 30} minutes** | Token Budget: **${(existing.tokenLimit || 2000).toLocaleString()} tokens**

Explain your understanding of the problem before proceeding: state the input, expected output, and key boundary conditions.`,
        stage: "UNDERSTANDING",
        timestamp: now,
      },
    ],
    updatedAt: now,
  }

  await updateAssessmentSession(resetSession)
  return resetSession
}

