"use client"

import React, { useState } from "react"
import { AssessmentSession } from "@/types/assessment"
import { AssessmentLobby } from "@/components/features/assessment/assessment-lobby"
import { ExamEnvironment } from "@/components/features/assessment/exam-environment"

export default function AssessmentPage() {
  const [activeExamSession, setActiveExamSession] = useState<AssessmentSession | null>(null)

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
          onExit={() => setActiveExamSession(null)}
          onSessionUpdated={(updated) => setActiveExamSession(updated)}
        />
      ) : (
        <AssessmentLobby
          onStartExam={(session) => setActiveExamSession(session)}
        />
      )}
    </div>
  )
}
