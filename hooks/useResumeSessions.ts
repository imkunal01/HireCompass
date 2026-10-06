"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ResumeSessionSnapshot } from "@/types/resume-session"
import {
  getStoredSessionSnapshots,
  dismissSessionId,
  subscribeToSessionUpdates,
  saveAssessmentSessionSnapshot,
} from "@/lib/resume-session"

interface UseResumeSessionsOptions {
  serverActiveAssessment?: any
  serverSheets?: any[]
}

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

export function useResumeSessions(options?: UseResumeSessionsOptions) {
  const [localSnapshots, setLocalSnapshots] = useState<ResumeSessionSnapshot[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const reload = useCallback(() => {
    if (typeof window === "undefined") return
    const stored = getStoredSessionSnapshots()
    setLocalSnapshots(stored)
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    reload()
    const unsubscribe = subscribeToSessionUpdates(reload)
    return () => unsubscribe()
  }, [reload])

  // Synchronize server-side active assessment if active and not yet stored or newer
  useEffect(() => {
    if (!options?.serverActiveAssessment) return
    const sa = options.serverActiveAssessment
    if (sa.status === "ACTIVE" && sa.problem) {
      const stageIndex = typeof sa.stageIndex === "number" ? sa.stageIndex : getStageStepIndex(sa.currentStage)
      const currentStage = sa.currentStage || "UNDERSTANDING"
      const stageLabel = STAGE_LABELS[currentStage] || `Stage ${stageIndex + 1}/6 • In Progress`
      const progressPercent = Math.min(100, Math.round(((stageIndex + 1) / 6) * 100))

      const assessmentSnapshot: ResumeSessionSnapshot = {
        id: sa._id || sa.id || "active_assessment_exam",
        toolType: "assessment",
        title: sa.problem.title || "Proctored Coding Exam",
        subtitle: stageLabel,
        badgeText: "In-Progress Exam",
        badgeVariant: "indigo",
        progressPercent,
        progressLabel: `${stageIndex + 1} of 6 Stages Complete`,
        lastActive: sa.updatedAt || sa.createdAt || new Date().toISOString(),
        href: "/assessment",
        actionLabel: "Resume Exam",
        meta: {
          difficulty: sa.problem.difficulty || "Medium",
          stageIndex,
          totalStages: 6,
        },
      }

      saveAssessmentSessionSnapshot(assessmentSnapshot)
    }
  }, [options?.serverActiveAssessment])

  // Combine and deduplicate
  const mergedSessions = useMemo(() => {
    const list = [...localSnapshots]
    const hasSheet = list.some((s) => s.toolType === "sheet")

    // If no sheet snapshot was explicitly stored yet, check if there's an in-progress user sheet
    if (!hasSheet && options?.serverSheets && options.serverSheets.length > 0) {
      const activeSheet = options.serverSheets.find(
        (s) => (s.done || s.doneCount || 0) > 0 && (s.done || s.doneCount || 0) < (s.itemCount || 1)
      ) || options.serverSheets[0]

      if (activeSheet && (activeSheet._id || activeSheet.id)) {
        const done = activeSheet.done ?? activeSheet.doneCount ?? 0
        const total = activeSheet.itemCount || 75
        const pct = total > 0 ? Math.round((done / total) * 100) : 0

        list.push({
          id: activeSheet._id || activeSheet.id,
          toolType: "sheet",
          title: activeSheet.title || "DSA Revision Roadmap",
          subtitle: `${activeSheet.category || "DSA"} • ${done}/${total} Solved`,
          badgeText: `${pct}% Mastered`,
          badgeVariant: "emerald",
          progressPercent: pct,
          progressLabel: `${done} of ${total} problems solved`,
          lastActive: activeSheet.updatedAt || new Date().toISOString(),
          href: `/prep/problem-solving/${activeSheet._id || activeSheet.id}`,
          actionLabel: "Continue Sheet",
          meta: {
            sheetId: activeSheet._id || activeSheet.id,
            doneCount: done,
            totalCount: total,
            category: activeSheet.category,
          },
        })
      }
    }

    return list
  }, [localSnapshots, options?.serverSheets])

  const handleDismiss = useCallback((id: string) => {
    dismissSessionId(id)
    setLocalSnapshots((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return {
    sessions: mergedSessions,
    dismissSession: handleDismiss,
    hasActiveSessions: mergedSessions.length > 0,
    isLoaded,
  }
}
