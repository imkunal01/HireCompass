"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Terminal,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Send,
  Code2,
  Bug,
  Award,
  ChevronRight,
  FileCode2,
  Copy,
  Check,
  Eye,
  Zap,
  Info,
  ArrowLeft,
  Clock,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  TrendingUp,
  XCircle,
  FileText,
  Lock,
} from "lucide-react"
import {
  AssessmentSession,
  AssessmentStage,
  AssessmentProblem,
  AssessmentScorecard,
  AssessmentDifficulty,
} from "@/types/assessment"
import { cn } from "@/lib/utils"

interface ExamEnvironmentProps {
  initialSession: AssessmentSession
  onExit: () => void
  onSessionUpdated?: (updated: AssessmentSession) => void
}

const STAGE_STEPS: Array<{
  id: AssessmentStage
  label: string
  shortLabel: string
  num: number
  description: string
}> = [
  {
    id: "UNDERSTANDING",
    label: "Stage 1 — Understanding",
    shortLabel: "1. Understand",
    num: 1,
    description: "Input, output, constraints & boundary comprehension",
  },
  {
    id: "APPROACH",
    label: "Stage 2 — Approach",
    shortLabel: "2. Approach",
    num: 2,
    description: "Algorithm, data structures & complexity reasoning",
  },
  {
    id: "IMPLEMENTATION_PROMPT",
    label: "Stage 3 — Prompting",
    shortLabel: "3. Prompt",
    num: 3,
    description: "Structured implementation request specification",
  },
  {
    id: "CODE_REVIEW",
    label: "Stage 4 — Code Review",
    shortLabel: "4. Review",
    num: 4,
    description: "Line-by-line inspection & test-case tracing",
  },
  {
    id: "REFINEMENT",
    label: "Stage 5 — Refinement",
    shortLabel: "5. Refine",
    num: 5,
    description: "Targeted modification & boundary resolution",
  },
  {
    id: "FINAL_REVIEW",
    label: "Stage 6 — Final Review",
    shortLabel: "6. Finalize",
    num: 6,
    description: "Process rubric & comprehensive evaluation",
  },
]

function getStageStepIndex(stage: AssessmentStage): number {
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

export function ExamEnvironment({
  initialSession,
  onExit,
  onSessionUpdated,
}: ExamEnvironmentProps) {
  const [session, setSession] = useState<AssessmentSession>(initialSession)
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState<"specs" | "criteria" | "rubric" | "scratchpad">("specs")
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeRevisionIdx, setActiveRevisionIdx] = useState<number>(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [scratchpadText, setScratchpadText] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Enforce zero-cheat exam mode: hide Sweety and all floating chatbots on document.body
  useEffect(() => {
    document.body.setAttribute("data-in-exam", "true")
    document.body.classList.add("exam-mode-active")
    window.dispatchEvent(new Event("exam-mode-change"))

    return () => {
      document.body.removeAttribute("data-in-exam")
      document.body.classList.remove("exam-mode-active")
      window.dispatchEvent(new Event("exam-mode-change"))
    }
  }, [])

  // Intercept browser back button (popstate) to prevent accidental state reset
  useEffect(() => {
    window.history.pushState({ inExam: true, sessionId: session._id || session.id }, "", window.location.href)

    const handlePopState = () => {
      setShowExitConfirm(true)
      window.history.pushState({ inExam: true, sessionId: session._id || session.id }, "", window.location.href)
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [session._id, session.id])

  // Practice Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Keep active revision synced to latest
  useEffect(() => {
    if (session.revisions && session.revisions.length > 0) {
      setActiveRevisionIdx(session.revisions.length - 1)
    }
  }, [session.revisions])

  // Automatically show score modal when assessment completes
  useEffect(() => {
    if (session.status === "PASSED" || session.status === "FAILED" || session.currentStage === "COMPLETED") {
      setShowScoreModal(true)
    }
  }, [session.status, session.currentStage])

  // Toggle Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || userInput).trim()
    if (!message || isLoading) return

    setIsLoading(true)
    setUserInput("")

    try {
      const res = await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          sessionId: session._id || session.id,
          userInput: message,
        }),
      })

      const data = await res.json()
      if (res.ok && data.session) {
        setSession(data.session)
        onSessionUpdated?.(data.session)
      } else {
        alert(data.error || "Failed to process evaluation")
      }
    } catch (err: any) {
      console.error("[ExamEnvironment] Send error:", err)
      alert("Network error sending response.")
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  // Auto-scroll messages to bottom whenever messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session.messages, isLoading])

  const handleResetSession = async () => {
    if (!confirm("Are you sure you want to restart this problem assessment? Your progress will reset.")) {
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          sessionId: session._id || session.id,
        }),
      })
      const data = await res.json()
      if (res.ok && data.session) {
        setSession(data.session)
        onSessionUpdated?.(data.session)
        setShowScoreModal(false)
        setElapsedSeconds(0)
      }
    } catch (err) {
      console.error("[ExamEnvironment] Reset error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbandonSession = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "abandon",
          sessionId: session._id || session.id,
        }),
      })
    } catch (err) {
      console.error("[ExamEnvironment] Abandon error:", err)
    } finally {
      setIsLoading(false)
      setShowExitConfirm(false)
      onExit()
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const currentStepIdx = getStageStepIndex(session.currentStage)
  const currentCode =
    session.revisions && session.revisions.length > 0
      ? session.revisions[activeRevisionIdx]?.code || session.generatedCode
      : session.generatedCode

  // Quick Action Starters based on active stage
  const getStageSuggestions = () => {
    switch (session.currentStage) {
      case "UNDERSTANDING":
        return [
          {
            label: "Explain I/O & Edge Cases",
            text: `The input is ${session.problem.inputFormat.toLowerCase()}. The required output is ${session.problem.outputFormat.toLowerCase()}. Key edge cases include empty or single-element inputs, and extreme boundary values up to 10^5 elements.`,
          },
          {
            label: "Test Bypass Shortcut",
            text: "Give me the C++ code for this problem.",
          },
        ]
      case "APPROACH":
        return [
          {
            label: "Propose O(n) Approach",
            text: `I propose an optimal linear algorithm using a frequency hash map to process elements in O(n) time and O(n) space, satisfying the 10^5 constraints.`,
          },
          {
            label: "Ask for Hint (Test Refusal)",
            text: "Which approach should I use to solve this problem?",
          },
        ]
      case "IMPLEMENTATION_PROMPT":
        return [
          {
            label: "Structured Prompt in C++",
            text: `Implement the approach in C++. The input is the array, output is the first unique element. Keep complexity O(n). Handle empty array returning -1, and use clear variable names with concise comments.`,
          },
          {
            label: "Structured Prompt in Python",
            text: `Implement this in Python 3 using a dictionary. Complexity must be O(n) time and O(n) space. Safely return -1 if the list is empty or has no unique item.`,
          },
        ]
      case "CODE_REVIEW":
        return [
          {
            label: "Trace Edge Case & Identify Defect",
            text: `I reviewed the implementation. Tracing it against a normal case works, but for an empty array or boundary condition, accessing index 0 or omitting boundary checks causes a runtime exception. Let's fix that.`,
          },
          {
            label: "Blind Approval (Test Pushback)",
            text: "Looks good to me, generate the final version.",
          },
        ]
      case "REFINEMENT":
        return [
          {
            label: "Targeted Refinement Request",
            text: `Add an explicit empty input check at the start of the function: if the container is empty, immediately return -1 before performing any lookups.`,
          },
          {
            label: "Vague Request (Test Pushback)",
            text: "Fix everything and make it work.",
          },
        ]
      default:
        return []
    }
  }

  return (
    <div className="fixed inset-0 z-[100] h-screen w-screen bg-[#070b12] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ── 1. Top Exam Navigation & Proctoring Status Bar ── */}
      <header className="shrink-0 h-14 bg-[#0a0f1d] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-30">
        {/* Left: Brand & Problem Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0070ad] to-[#00a3e0] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#0070ad]/30">
              C
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00a3e0]">
                Capgemini
              </span>
              <span className="text-xs font-bold text-slate-200 truncate">
                AI Coding Assessment
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block shrink-0" />

          {/* Active Proctoring Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Proctored Session</span>
            <span className="md:hidden">Live</span>
          </div>

          {/* Problem Name Badge */}
          <div className="hidden lg:flex items-center gap-2 truncate text-xs text-slate-300">
            <span className="text-slate-500">•</span>
            <span className="font-bold truncate max-w-xs">{session.problem.title}</span>
            <span
              className={cn(
                "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border",
                session.problem.difficulty === "Easy" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                session.problem.difficulty === "Medium" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                session.problem.difficulty === "Hard" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              {session.problem.difficulty}
            </span>
          </div>
        </div>

        {/* Center: Stage Stepper Pills */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono">
          {STAGE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx
            const isCurrent = idx === currentStepIdx
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
                  isCurrent &&
                    "bg-[#0070ad] text-white border-[#00a3e0]/60 shadow-md shadow-[#0070ad]/30 ring-1 ring-[#00a3e0]/40",
                  isCompleted &&
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  idx > currentStepIdx &&
                    "bg-slate-900/60 text-slate-500 border-slate-800/60"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="text-[10px] opacity-70">#{step.num}</span>
                )}
                <span>{step.shortLabel}</span>
              </div>
            )
          })}
        </div>

        {/* Right: Timer, Fullscreen, Scorecard, and Exit Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Exam Digital Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 text-xs font-mono font-bold border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-[#00a3e0]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Bypass Flags Warning */}
          {session.bypassAttemptsCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{session.bypassAttemptsCount} Bypass Flags</span>
            </div>
          )}

          {/* Scorecard Button (Visible when evaluation exists) */}
          {session.evaluation && (
            <button
              onClick={() => setShowScoreModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Scorecard ({session.evaluation.totalScore}/100)</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Restart Assessment"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Exit Exam */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Exam</span>
          </button>
        </div>
      </header>

      {/* ── 2. Dual-Pane Immersive Exam Workspace (Calculated 100% Height - Zero Outer Scroll) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#070b12]">
        {/* ── Left Pane: Specifications, Stage Objectives, Test Cases & Scratchpad (5 cols) ── */}
        <section className="lg:col-span-5 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#090e1a] overflow-hidden min-h-0">
          {/* Sub-Tabs Navigation */}
          <div className="shrink-0 flex items-center gap-1 p-2 bg-[#0c1222] border-b border-slate-800/80 text-xs">
            <button
              onClick={() => setActiveLeftTab("specs")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate",
                activeLeftTab === "specs"
                  ? "bg-[#0070ad] text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              Problem Spec
            </button>
            <button
              onClick={() => setActiveLeftTab("criteria")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate",
                activeLeftTab === "criteria"
                  ? "bg-[#0070ad] text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              Stage Criteria
            </button>
            <button
              onClick={() => setActiveLeftTab("rubric")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate",
                activeLeftTab === "rubric"
                  ? "bg-[#0070ad] text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              100-Pt Rubric
            </button>
            <button
              onClick={() => setActiveLeftTab("scratchpad")}
              className={cn(
                "py-1.5 px-2.5 rounded-lg font-bold transition-all text-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
                activeLeftTab === "scratchpad" && "bg-[#0070ad] text-white shadow-xs"
              )}
            >
              Scratchpad
            </button>
          </div>

          {/* Left Scrollable Body (Independent scroll) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs select-text">
            {activeLeftTab === "specs" && (
              <div className="space-y-4">
                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-black text-white mb-2">
                    {session.problem.title}
                  </h3>
                  <div className="text-slate-300 leading-relaxed font-sans bg-[#0c1222] p-3.5 rounded-2xl border border-slate-800 whitespace-pre-line">
                    {session.problem.description}
                  </div>
                </div>

                {/* Input & Output Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-[#0c1222] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Input Format
                    </span>
                    <p className="text-xs font-mono text-slate-200 mt-1">
                      {session.problem.inputFormat}
                    </p>
                  </div>
                  <div className="bg-[#0c1222] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Output Format
                    </span>
                    <p className="text-xs font-mono text-slate-200 mt-1">
                      {session.problem.outputFormat}
                    </p>
                  </div>
                </div>

                {/* Constraints */}
                <div className="bg-[#0c1222] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#00a3e0]" />
                    Constraints & Targets
                  </span>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    {session.problem.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#00a3e0]">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Examples
                  </span>
                  {session.problem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0c1222] border border-slate-800 font-mono text-xs space-y-1"
                    >
                      <div>
                        <span className="text-slate-500">Input: </span>
                        <span className="text-white font-bold">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Output: </span>
                        <span className="text-[#00a3e0] font-bold">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="text-[11px] text-slate-400 font-sans border-t border-slate-800/80 pt-1 mt-1">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Key Edge Cases */}
                <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Crucial Edge Cases Evaluator Checks
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {session.problem.keyEdgeCases.map((ec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">⚠️</span>
                        <span>{ec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeLeftTab === "criteria" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-[#00a3e0] font-bold text-xs">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Current Active Stage Objective</span>
                  </div>
                  <h4 className="text-sm font-black text-white">
                    {STAGE_STEPS[currentStepIdx]?.label}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {STAGE_STEPS[currentStepIdx]?.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Stage-by-Stage Rulebook
                  </h4>

                  {session.currentStage === "UNDERSTANDING" && (
                    <div className="p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 space-y-2 text-slate-300">
                      <p className="font-bold text-white">
                        ✓ Explain Problem Understanding
                      </p>
                      <p>
                        State what the input represents, what output is required, and identify key boundary constraints.
                      </p>
                      <p className="text-[11px] text-rose-400">
                        ✕ Asking &quot;Give me the code&quot; or &quot;Solve this&quot; will be rejected.
                      </p>
                    </div>
                  )}

                  {session.currentStage === "APPROACH" && (
                    <div className="p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 space-y-2 text-slate-300">
                      <p className="font-bold text-white">
                        ✓ Algorithm & Complexity Reasoning
                      </p>
                      <p>
                        Present your proposed algorithm, selected data structures, and explain why your approach satisfies time & space constraints.
                      </p>
                    </div>
                  )}

                  {session.currentStage === "IMPLEMENTATION_PROMPT" && (
                    <div className="p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 space-y-2 text-slate-300">
                      <p className="font-bold text-white">
                        ✓ Structured Implementation Prompt
                      </p>
                      <p>
                        Craft the actual prompt instructing the AI to generate code. Specify programming language, chosen approach, edge-case constraints, and output format.
                      </p>
                    </div>
                  )}

                  {(session.currentStage === "CODE_REVIEW" || session.currentStage === "CODE_GENERATION") && (
                    <div className="p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 space-y-2 text-slate-300">
                      <p className="font-bold text-white">
                        ✓ Critical Code Review
                      </p>
                      <p>
                        Inspect the AI-generated draft line-by-line. Trace with a normal case and an edge case. Identify any logical errors or seeded defects.
                      </p>
                    </div>
                  )}

                  {session.currentStage === "REFINEMENT" && (
                    <div className="p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 space-y-2 text-slate-300">
                      <p className="font-bold text-white">
                        ✓ Targeted Code Refinement
                      </p>
                      <p>
                        Provide specific, surgical instructions to fix the detected defect. Avoid lazy instructions like &quot;Fix everything&quot;.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-[#050810] border border-slate-800 text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Authoritative State Machine</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The backend strictly validates candidate reasoning before unlocking each stage. You cannot jump stages by prompting shortcuts.
                  </p>
                </div>
              </div>
            )}

            {activeLeftTab === "rubric" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  HireCompass Capgemini 100-Point Practice Evaluation Rubric:
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#0c1222] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>1. AI Literacy</span>
                      <span className="text-[#00a3e0]">25 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Problem interpretation, requirement awareness & semantic understanding of AI outputs.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1222] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>2. Prompt Quality</span>
                      <span className="text-[#00a3e0]">25 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Context, objective, constraints, edge cases, language specificity & absence of blind bypasses.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1222] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>3. Problem Solving</span>
                      <span className="text-[#00a3e0]">25 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Algorithm selection, data structures, complexity justification & constraint satisfaction.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1222] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>4. Review & Adapt</span>
                      <span className="text-[#00a3e0]">25 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Line inspection, seeded bug detection, test-case tracing & targeted code refinement.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  <span className="font-bold">Pass Criterion:</span> Overall score ≥ 70/100 and no persistent bypass failures.
                </div>
              </div>
            )}

            {activeLeftTab === "scratchpad" && (
              <div className="space-y-3 h-full flex flex-col">
                <span className="text-xs font-bold text-slate-400">
                  Candidate Scratchpad / Tracing Notes (Private):
                </span>
                <textarea
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Use this scratchpad to dry-run test cases, track variable states, or draft complexities..."
                  className="flex-1 w-full p-3 rounded-xl bg-[#0c1222] border border-slate-800 text-slate-200 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-[#0070ad]"
                  rows={15}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Right Pane: AI Assistant Terminal, Generated Code & DOCKED FIXED Bottom Composer (7 cols) ── */}
        <section className="lg:col-span-7 h-full flex flex-col bg-[#070b12] overflow-hidden min-h-0 relative">
          {/* Scrollable Chat & Code Stream (Messages scroll INTERNALLY; Composer is PINNED at bottom!) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
            {session.messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant"
              const isCandidate = msg.role === "candidate"

              return (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "flex flex-col space-y-1.5 max-w-[90%]",
                    isCandidate ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-1">
                    {isAssistant ? (
                      <span className="flex items-center gap-1 font-bold text-[#00a3e0]">
                        <Terminal className="w-3 h-3" />
                        Capgemini Assessment AI
                      </span>
                    ) : (
                      <span className="font-bold text-slate-400">Candidate</span>
                    )}
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase font-mono text-[9px]">
                      {msg.stage}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md",
                      isCandidate
                        ? "bg-gradient-to-r from-[#0070ad] to-[#005a8c] text-white rounded-tr-xs"
                        : msg.isBypassAttempt
                        ? "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-tl-xs"
                        : "bg-[#0d1424] border border-slate-800 text-slate-200 rounded-tl-xs"
                    )}
                  >
                    {msg.isBypassAttempt && (
                      <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs mb-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Prompt Bypass Rejected</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line font-sans">{msg.content}</div>

                    {/* Identified Gaps / Missing Requirements */}
                    {msg.missingRequirements && msg.missingRequirements.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">
                          Missing Requirements:
                        </span>
                        <ul className="space-y-0.5 text-xs text-rose-400">
                          {msg.missingRequirements.map((r, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span>•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Generated Code Window in Stream */}
            {currentCode && (
              <div className="rounded-2xl border border-slate-800 bg-[#090e1c] text-slate-200 shadow-xl overflow-hidden my-3">
                <div className="flex items-center justify-between px-4 py-2 bg-[#0c1326] border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-[#00a3e0]" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      AI Generated Code Draft
                    </span>
                    {session.revisions && session.revisions.length > 1 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Revision #{activeRevisionIdx + 1}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopyCode(currentCode)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed">
                  <pre className="text-slate-100">
                    <code>
                      {currentCode.split("\n").map((line, i) => (
                        <div key={i} className="flex gap-4 hover:bg-slate-800/40 px-1 rounded">
                          <span className="text-slate-600 select-none w-6 text-right shrink-0">
                            {i + 1}
                          </span>
                          <span className="flex-1">{line}</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>

                <div className="px-4 py-2 bg-[#0c1326] border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Review Required: Inspect boundary conditions before approval.
                  </span>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0d1424] border border-slate-800 text-xs text-slate-400 max-w-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#0070ad] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#0070ad] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#0070ad] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Evaluating reasoning against assessment rubric...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── 3. DOCKED BOTTOM COMPOSER OR REVIEW MODE BANNER ── */}
          {session.status !== "ACTIVE" ? (
            <div className="shrink-0 bg-[#0a0f1d] border-t border-slate-800/80 p-3 sm:p-4 z-20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-extrabold uppercase border",
                    session.status === "PASSED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    session.status === "FAILED" && "bg-rose-500/10 text-rose-400 border-rose-500/30",
                    session.status === "ABANDONED" && "bg-slate-500/10 text-slate-400 border-slate-500/30"
                  )}
                >
                  {session.status}
                </span>
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Attempt Review Mode:</span> All candidate prompts and AI responses from this attempt are preserved above.
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {session.evaluation && (
                  <button
                    onClick={() => setShowScoreModal(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:scale-105 transition-all"
                  >
                    View Scorecard ({session.evaluation.totalScore}/100)
                  </button>
                )}
                <button
                  onClick={onExit}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Exit to Lobby
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 bg-[#0a0f1d] border-t border-slate-800/80 p-3 sm:p-4 z-20 space-y-2 shadow-2xl">
              {/* Quick Stage Prompts Chips */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 shrink-0">
                  Suggested Prompts:
                </span>
                {getStageSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserInput(suggestion.text)}
                    disabled={isLoading}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-[#0e162a] text-slate-300 hover:text-white hover:bg-[#131e3a] border border-slate-800 hover:border-[#0070ad]/50 transition-all font-medium"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>

              {/* Input Textarea Box */}
              <div className="relative rounded-2xl border border-slate-700/80 bg-[#060a14] p-2 focus-within:ring-2 focus-within:ring-[#0070ad]/40 focus-within:border-[#0070ad] transition-all">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isLoading}
                  placeholder={
                    session.currentStage === "UNDERSTANDING"
                      ? "Explain your problem understanding: input, output, constraints, edge cases..."
                      : session.currentStage === "APPROACH"
                      ? "State your proposed algorithm, data structure, and O(...) complexity..."
                      : session.currentStage === "IMPLEMENTATION_PROMPT"
                      ? "Write the structured prompt directing the AI to implement the solution..."
                      : session.currentStage === "CODE_REVIEW"
                      ? "Identify logical errors, trace normal and edge cases, explain findings..."
                      : session.currentStage === "REFINEMENT"
                      ? "Provide specific targeted modification instructions to fix the code..."
                      : "Type your response..."
                  }
                  rows={2}
                  className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 p-1"
                />

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 px-1">
                  <span className="text-[10px] text-slate-500">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[9px] text-slate-400">Ctrl+Enter</kbd> to submit
                  </span>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!userInput.trim() || isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] disabled:opacity-50 text-white shadow-md shadow-[#0070ad]/30 transition-all hover:scale-[1.02] cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── 4. End Exam Confirmation Modal ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1424] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
              <h3 className="text-base font-black text-white">Exit Active Assessment?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your assessment state and chat history are securely preserved in your database. You can pause and return to resume anytime, or explicitly abandon this test attempt.
            </p>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Pause & Save: You can resume this exact test at any time without losing progress.</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Abandon & Reset: Terminates this active test attempt.</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={handleAbandonSession}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
              >
                Abandon & Reset
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false)
                  onExit()
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white transition-all shadow-md shadow-[#0070ad]/30"
              >
                Pause & Return to Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Post-Assessment Final Rubric Scorecard Modal ── */}
      {showScoreModal && session.evaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0d1424] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#0070ad]/20 text-[#00a3e0] border border-[#0070ad]/40">
                    Capgemini Assessment Evaluation
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                      session.evaluation.passed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}
                  >
                    {session.evaluation.passed ? "PASSED" : "NEEDS REFINEMENT"}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {session.problem.title}
                </h3>
              </div>

              {/* Total Score Badge */}
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0070ad] to-[#00a3e0] text-white shadow-lg shrink-0">
                <span className="text-2xl font-black">{session.evaluation.totalScore}</span>
                <span className="text-[10px] font-bold uppercase opacity-80">/ 100 PTS</span>
              </div>
            </div>

            {/* Official Result Banner */}
            <div
              className={cn(
                "p-4 rounded-2xl border text-xs sm:text-sm font-medium leading-relaxed",
                session.evaluation.passed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-200"
              )}
            >
              {session.evaluation.passed ? (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Assessment criteria for this problem have been satisfied.
                  </p>
                  <p className="text-xs opacity-90">
                    You have passed this question and may proceed to the next problem.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Process requirements were not fully satisfied.
                  </p>
                  <p className="text-xs opacity-90">{session.evaluation.summary}</p>
                </div>
              )}
            </div>

            {/* 4-Pillar Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#090e1c] border border-slate-800 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  AI Literacy
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {session.evaluation.aiLiteracy} <span className="text-xs text-slate-500">/ 25</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090e1c] border border-slate-800 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  Prompt Quality
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {session.evaluation.promptQuality} <span className="text-xs text-slate-500">/ 25</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090e1c] border border-slate-800 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  Problem Solving
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {session.evaluation.problemSolving} <span className="text-xs text-slate-500">/ 25</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090e1c] border border-slate-800 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  Review & Adapt
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {session.evaluation.reviewAndAdapt} <span className="text-xs text-slate-500">/ 25</span>
                </div>
              </div>
            </div>

            {/* Strengths & Gaps Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {session.evaluation.strengths && session.evaluation.strengths.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Observed Strengths
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {session.evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.evaluation.gaps && session.evaluation.gaps.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Areas to Refine
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {session.evaluation.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">!</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close Modal
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white shadow-md shadow-[#0070ad]/30 transition-all hover:scale-[1.02]"
              >
                Exit to Assessment Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
