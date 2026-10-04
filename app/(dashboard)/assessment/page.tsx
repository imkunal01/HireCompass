"use client"

import React, { useState, useEffect } from "react"
import { AssessmentSession } from "@/types/assessment"
import { AssessmentLobby } from "@/components/features/assessment/assessment-lobby"
import { ExamEnvironment } from "@/components/features/assessment/exam-environment"

const ACTIVE_SESSION_STORAGE_KEY = "hirecompass_active_assessment_id"

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
            } else if (data.activeSession && data.activeSession.status === "ACTIVE") {
              // If there's an authoritative active session on server
              setActiveExamSession(data.activeSession)
              localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, data.activeSession._id || data.activeSession.id)
            } else {
              localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
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
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  }

  const handleSessionUpdated = (updated: AssessmentSession) => {
    setActiveExamSession(updated)
    if (updated.status !== "ACTIVE") {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  }

  const handleExitExam = () => {
    // If the session was completed or abandoned, clear localStorage
    if (activeExamSession && activeExamSession.status !== "ACTIVE") {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
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

