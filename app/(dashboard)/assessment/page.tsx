"use client"

import React, { useState, useEffect } from "react"
import { AssessmentSession } from "@/types/assessment"
import { AssessmentLobby } from "@/components/features/assessment/assessment-lobby"
import { ExamEnvironment } from "@/components/features/assessment/exam-environment"

import {
  saveAssessmentSessionSnapshot,
  clearAssessmentSessionSnapshot,
} from "@/lib/resume-session"

const ACTIVE_SESSION_STORAGE_KEY = "hirecompass_active_assessment_id"

const STAGE_LABELS: Record<string, string> = {
  PROBLEM_PRESENTED: "Stage 1/6 • Requirements & Clarification",
  UNDERSTANDING: "Stage 1/6 • Requirements & Clarification",
  APPROACH: "Stage 2/6 • Architecture & Approach",
  IMPLEMENTATION_PROMPT: "Stage 3/6 • Implementation Prompting",
  CODE_GENERATION: "Stage 4/6 • Code Generation",
  CODE_REVIEW: "Stage 4/6 • Defect & Code Review",
  REFINEMENT: "Stage 5/6 • Refinement & Bug Fixes",
  FINAL_REVIEW: "Stage 6/6 • Final Comprehensive Review",
  COMPLETED: "Stage 6/6 • Completed",
}

function getStageStepIndex(stage?: string): number {
  switch (stage) {
    case "PROBLEM_PRESENTED":
    case "UNDERSTANDING":
      return 0
    case "APPROACH":
      return 1
    case "IMPLEMENTATION_PROMPT":
      return 2
    case "CODE_GENERATION":
    case "CODE_REVIEW":
      return 3
    case "REFINEMENT":
      return 4
    case "FINAL_REVIEW":
    case "COMPLETED":
      return 5
    default:
      return 0
  }
}

function syncAssessmentSnapshot(session: AssessmentSession | null) {
  if (!session || session.status !== "ACTIVE" || !session.problem) {
    clearAssessmentSessionSnapshot()
    return
  }
  const stageIndex = getStageStepIndex(session.currentStage)
  const progressPercent = Math.min(100, Math.round(((stageIndex + 1) / 6) * 100))
  const stageLabel =
    STAGE_LABELS[session.currentStage] || `Stage ${stageIndex + 1}/6 • In Progress`

  saveAssessmentSessionSnapshot({
    id: session._id || session.id || "active_assessment_exam",
    toolType: "assessment",
    title: session.problem.title || "Proctored Coding Exam",
    subtitle: stageLabel,
    badgeText: "In-Progress Exam",
    badgeVariant: "indigo",
    progressPercent,
    progressLabel: `${stageIndex + 1} of 6 stages completed`,
    lastActive: session.updatedAt || session.startedAt || new Date().toISOString(),
    href: "/assessment",
    actionLabel: "Resume Exam",
    meta: {
      stageIndex,
      totalStages: 6,
      difficulty: session.problem.difficulty,
    },
  })
}

export default function AssessmentPage() {
  const [activeExamSession, setActiveExamSession] = useState<AssessmentSession | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  // On initial mount, attempt to restore any in-progress active assessment session
  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      try {
        const savedSessionId = typeof window !== "undefined"
          ? localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
          : null

        const endpoint = savedSessionId
          ? `/api/prep/assessment?sessionId=${savedSessionId}`
          : "/api/prep/assessment"

        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            if (savedSessionId && data.session && data.session.status === "ACTIVE") {
              setActiveExamSession(data.session)
              syncAssessmentSnapshot(data.session)
            } else if (data.activeSession && data.activeSession.status === "ACTIVE") {
              setActiveExamSession(data.activeSession)
              localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, data.activeSession._id || data.activeSession.id)
              syncAssessmentSnapshot(data.activeSession)
            } else {
              localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
              clearAssessmentSessionSnapshot()
            }
          }
        }
      } catch (err) {
        console.error("[AssessmentPage] Failed to restore session:", err)
      } finally {
        if (isMounted) setIsRestoring(false)
      }
    }

    restoreSession()
    return () => {
      isMounted = false
    }
  }, [])

  // Keep localStorage in sync when active session changes
  const handleStartExam = (session: AssessmentSession) => {
    setActiveExamSession(session)
    if (session.status === "ACTIVE") {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, session._id || session.id || "")
      syncAssessmentSnapshot(session)
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
      clearAssessmentSessionSnapshot()
    }
  }

  const handleSessionUpdated = (updated: AssessmentSession) => {
    setActiveExamSession(updated)
    if (updated.status !== "ACTIVE") {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
      clearAssessmentSessionSnapshot()
    } else {
      syncAssessmentSnapshot(updated)
    }
  }

  const handleExitExam = () => {
    // If the session was completed or abandoned, clear localStorage
    if (activeExamSession && activeExamSession.status !== "ACTIVE") {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
      clearAssessmentSessionSnapshot()
    }
    setActiveExamSession(null)
  }

  if (isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#0070ad] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading AI Assessment Console...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 
        When an exam is active:
        ExamEnvironment takes over the full viewport (fixed inset-0 z-[100] h-screen w-screen),
        completely hiding sidebar, navbar, and floating agents for a true proctored exam experience!
      */}
      {activeExamSession ? (
        <ExamEnvironment
          initialSession={activeExamSession}
          onExit={handleExitExam}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : (
        <AssessmentLobby
          onStartExam={handleStartExam}
        />
      )}
    </div>
  )
}

