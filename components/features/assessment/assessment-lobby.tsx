"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Award,
  Play,
  Sliders,
  Plus,
  AlertTriangle,
  BrainCircuit,
  Zap,
  ChevronRight,
  History,
  FileText,
  RotateCcw,
  X,
  Copy,
  Check,
  FileCode2,
  Dice5,
  Dices,
  Layers,
  BookOpen,
  Filter,
} from "lucide-react"
import {
  AssessmentProblem,
  AssessmentSession,
  AssessmentDifficulty,
} from "@/types/assessment"
import { cn } from "@/lib/utils"

interface AssessmentLobbyProps {
  onStartExam: (session: AssessmentSession) => void
}

export function AssessmentLobby({ onStartExam }: AssessmentLobbyProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"arena" | "history">("arena")
  const [selectedDifficulty, setSelectedDifficulty] = useState<AssessmentDifficulty>("standard")
  const [isStarting, setIsStarting] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "PASSED" | "ACTIVE" | "FAILED">("ALL")
  const [selectedTranscriptSession, setSelectedTranscriptSession] = useState<AssessmentSession | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Custom problem form state
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customInputFormat, setCustomInputFormat] = useState("")
  const [customOutputFormat, setCustomOutputFormat] = useState("")
  const [customConstraints, setCustomConstraints] = useState("0 <= n <= 10^5\nTime: O(n)\nSpace: O(n)")

  // Fetch assessment data, active session & past attempts
  const { data, isLoading } = useQuery({
    queryKey: ["assessment-lobby-data"],
    queryFn: async () => {
      const res = await fetch("/api/prep/assessment?company=Capgemini")
      if (!res.ok) throw new Error("Failed to load assessment data")
      return res.json() as Promise<{
        company: string
        activeSession: AssessmentSession | null
        problems: AssessmentProblem[]
        recentSessions: AssessmentSession[]
      }>
    },
  })

  const activeSession = data?.activeSession || null
  const pastSessions = data?.recentSessions || []

  // Mutation to launch exam (with random problem from Capgemini dataset)
  const startExamMutation = useMutation({
    mutationFn: async ({
      problemId = "random",
      difficulty,
      customProblem,
    }: {
      problemId?: string
      difficulty: AssessmentDifficulty
      customProblem?: AssessmentProblem
    }) => {
      const res = await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          problemId,
          difficulty,
          customProblem,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to start assessment exam")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setIsStarting(false)
      queryClient.invalidateQueries({ queryKey: ["assessment-lobby-data"] })
      onStartExam(data.session)
    },
    onError: (err: any) => {
      alert(err.message || "Failed to start assessment")
      setIsStarting(false)
    },
  })

  // Mutation to abandon an active session
  const abandonExamMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "abandon",
          sessionId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to abandon assessment")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-lobby-data"] })
    },
    onError: (err: any) => {
      alert(err.message || "Failed to reset assessment")
    },
  })

  const handleLaunchRandom = () => {
    setIsStarting(true)
    startExamMutation.mutate({
      problemId: "random",
      difficulty: selectedDifficulty,
    })
  }

  const handleAbandonActive = () => {
    if (!activeSession) return
    if (confirm("Are you sure you want to abandon and reset this active test attempt? Progress will be marked as abandoned.")) {
      abandonExamMutation.mutate(activeSession._id || activeSession.id || "")
    }
  }

  const handleCreateCustomProblem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim() || !customDescription.trim()) return

    const customProblem: AssessmentProblem = {
      id: `custom-${Date.now()}`,
      title: customTitle,
      company: "Capgemini",
      category: "Custom Problem",
      difficulty: "Medium",
      tags: ["Custom", "User Defined"],
      description: customDescription,
      inputFormat: customInputFormat || "Standard input format",
      outputFormat: customOutputFormat || "Standard output format",
      constraints: customConstraints.split("\n").filter((c) => c.trim().length > 0),
      examples: [
        {
          input: "Example input",
          output: "Example output",
          explanation: "Standard evaluation example",
        },
      ],
      keyEdgeCases: ["Empty input condition", "Large boundary scale limits"],
      expectedComplexity: {
        time: "O(n)",
        space: "O(n)",
      },
    }

    setIsStarting(true)
    startExamMutation.mutate({
      customProblem,
      difficulty: selectedDifficulty,
    })
    setShowCustomModal(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const filteredPastSessions = pastSessions.filter((sess) => {
    if (historyFilter === "ALL") return true
    return sess.status === historyFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Level Navigation Tabs: Assessment Arena vs Recent Assessments ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("arena")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all",
              activeTab === "arena"
                ? "bg-[#0070ad] text-white shadow-md shadow-[#0070ad]/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Assessment Arena</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all",
              activeTab === "history"
                ? "bg-[#0070ad] text-white shadow-md shadow-[#0070ad]/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <History className="w-4 h-4" />
            <span>Recent Assessments</span>
            {pastSessions.length > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  activeTab === "history"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {pastSessions.length}
              </span>
            )}
          </button>
        </div>

        {activeSession && activeSession.status === "ACTIVE" && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Exam In Progress
            </span>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: ASSESSMENT ARENA                                                */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "arena" && (
        <div className="space-y-6">
          {/* Active In-Progress Assessment Alert Banner (Never lost on back button) */}
          {activeSession && activeSession.status === "ACTIVE" && (
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-600/15 via-[#0070ad]/10 to-transparent dark:from-blue-900/30 dark:via-slate-900 dark:to-slate-950 p-6 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      <Clock className="w-3 h-3" />
                      In-Progress Assessment Preserved
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      Stage: {activeSession.currentStage}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {activeSession.problem.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Your assessment state and chat history were preserved. Click resume to continue your proctored session right where you left off.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleAbandonActive}
                    disabled={abandonExamMutation.isPending}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                  >
                    Abandon & Reset
                  </button>
                  <button
                    onClick={() => onStartExam(activeSession)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#0070ad] to-[#00a3e0] text-white shadow-md shadow-[#0070ad]/30 hover:scale-105 transition-all"
                  >
                    <span>Resume Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[#0070ad]/30 bg-gradient-to-br from-[#0070ad]/15 via-[#00a3e0]/5 to-transparent dark:from-[#0070ad]/25 dark:via-slate-900/60 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0070ad] text-white shadow-xs">
                    Capgemini
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Coding Assessment Arena
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    29 Curated DSA Problems
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Capgemini AI Coding Assessment Simulator
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Experience authentic Capgemini AI-collaborative coding evaluation. Instead of asking AI to solve the question for you, you guide, direct, and critically review a restricted AI assistant through 6 authoritative stages.
                </p>

                {/* 6-Stage Process Flow */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                    1. Understand
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                    2. Approach
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                    3. Structured Prompt
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                    4. Code Review
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                    5. Refine
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    6. 100-Pt Scorecard
                  </span>
                </div>
              </div>

              {/* Simulation Difficulty Selector & Start Assessment Button */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#0070ad]" />
                      Simulation Difficulty:
                    </span>
                    <span className="text-[10px] uppercase font-extrabold text-[#0070ad] dark:text-[#00a3e0]">
                      {selectedDifficulty}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedDifficulty("standard")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center",
                        selectedDifficulty === "standard"
                          ? "bg-[#0070ad] text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      )}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty("hard")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center",
                        selectedDifficulty === "hard"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      )}
                    >
                      Strict / Hard
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {selectedDifficulty === "hard"
                      ? "Seeds realistic defects & aggressively evaluates edge cases."
                      : "Standard Capgemini rigor with targeted defect checks."}
                  </p>
                </div>

                <button
                  onClick={handleLaunchRandom}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-[#0070ad] to-[#00a3e0] hover:from-[#005a8c] hover:to-[#008cc0] text-white shadow-xl shadow-[#0070ad]/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <Dices className="w-4 h-4 fill-white" />
                  <span>{isStarting ? "Assigning Random Problem..." : "Start Assessment"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Random Problem Generator Information Card */}
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Dices className="w-5 h-5 text-[#0070ad]" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Random Problem Dispatcher (Capgemini DSA Bank)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When you click &ldquo;Start Assessment&rdquo;, a problem is selected at random from the 29-problem Capgemini practice set.
                </p>
              </div>

              <button
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Practice Custom Statement</span>
              </button>
            </div>

            {/* Categorical Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Arrays & Strings
                </span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  9 Core Problems
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Kadane, Sliding Window, Matrix, In-Place Shifts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
                  Math & Greedy
                </span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  7 Core Problems
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Stock Buy/Sell, Container, Two Sum, Jump Game
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                  Stacks & Lists
                </span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  5 Core Problems
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Cycle Detection, Reverse in K, NGE, Parentheses
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                  DP & Trees
                </span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  8 Core Problems
                </p>
                <span className="text-[10px] text-slate-400 block">
                  0/1 Knapsack, Coin Change, LCS, LIS, BST Pruning
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Flight Exam Protocol Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Bypass Guard Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Requests like &quot;Give me the code&quot; or &quot;Solve this&quot; are intercepted. Candidates must demonstrate semantic reasoning.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span>100-Point Process Rubric</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Graded on AI Literacy (25), Prompt Quality (25), Problem Solving (25), and Review & Adapt (25). Pass threshold: ≥70 pts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>State Persistence & Proctoring</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Exam states do not reset when clicking back or navigating away. All prompts and AI replies are saved securely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: RECENT ASSESSMENTS & ATTEMPT HISTORIES                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Recent Assessment Attempts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect your prompts given, AI responses, code drafts, and 100-point evaluation scorecards.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
              {(["ALL", "PASSED", "ACTIVE", "FAILED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs transition-all",
                    historyFilter === filter
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredPastSessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0070ad]/10 text-[#0070ad] flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                No Assessment Attempts Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Head over to the Assessment Arena tab to launch your first randomized Capgemini coding test.
              </p>
              <button
                onClick={() => setActiveTab("arena")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0070ad] text-white hover:bg-[#005a8c] transition-all"
              >
                <span>Go to Assessment Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm">
              {filteredPastSessions.map((sess) => {
                const candidatePromptsCount = sess.messages.filter((m) => m.role === "candidate").length
                const assistantRepliesCount = sess.messages.filter((m) => m.role === "assistant").length

                return (
                  <div
                    key={sess._id || sess.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                            sess.status === "PASSED" &&
                              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                            sess.status === "FAILED" &&
                              "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                            sess.status === "ACTIVE" &&
                              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                            sess.status === "ABANDONED" &&
                              "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          )}
                        >
                          {sess.status}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-mono text-slate-500">
                          Stage: {sess.currentStage}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">
                          {candidatePromptsCount} Prompts Given • {assistantRepliesCount} AI Responses
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {sess.problem.title}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {sess.problem.category} • Attempted on{" "}
                        {new Date(sess.startedAt).toLocaleDateString()} at{" "}
                        {new Date(sess.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {sess.evaluation && (
                        <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                          <div className="text-center">
                            <span className="text-[9px] font-bold uppercase text-slate-400">Total</span>
                            <div className="text-base font-black text-slate-900 dark:text-white">
                              {sess.evaluation.totalScore}/100
                            </div>
                          </div>
                          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <div>AI Lit: {sess.evaluation.aiLiteracy}/25</div>
                            <div>Prompt: {sess.evaluation.promptQuality}/25</div>
                          </div>
                        </div>
                      )}

                      {/* View Chat Transcript button */}
                      <button
                        onClick={() => setSelectedTranscriptSession(sess)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0070ad]" />
                        <span>View Transcript & Prompts</span>
                      </button>

                      {/* Inspect Exam in Console */}
                      <button
                        onClick={() => onStartExam(sess)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0070ad] text-white hover:bg-[#005a8c] transition-all hover:scale-105 shadow-xs"
                      >
                        <span>{sess.status === "ACTIVE" ? "Resume Exam" : "Open Console"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TRANSCRIPT & CHAT HISTORY MODAL (Full turn-by-turn prompt inspection)  */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {selectedTranscriptSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080d19] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-5 bg-slate-50 dark:bg-[#0c1326] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                      selectedTranscriptSession.status === "PASSED" &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                      selectedTranscriptSession.status === "FAILED" &&
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                      selectedTranscriptSession.status === "ACTIVE" &&
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                      selectedTranscriptSession.status === "ABANDONED" &&
                        "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    )}
                  >
                    {selectedTranscriptSession.status}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Stage Reached: {selectedTranscriptSession.currentStage}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {selectedTranscriptSession.problem.title} — Chat History & Prompts
                </h3>
              </div>

              <button
                onClick={() => setSelectedTranscriptSession(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard quick stats bar if evaluated */}
            {selectedTranscriptSession.evaluation && (
              <div className="shrink-0 px-6 py-3 bg-[#0070ad]/10 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-[#0070ad]" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Score: {selectedTranscriptSession.evaluation.totalScore}/100
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    AI Literacy: {selectedTranscriptSession.evaluation.aiLiteracy}/25
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Prompting: {selectedTranscriptSession.evaluation.promptQuality}/25
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Review: {selectedTranscriptSession.evaluation.reviewAndAdapt}/25
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedTranscriptSession.messages.filter((m) => m.role === "candidate").length} Candidate Prompts
                </span>
              </div>
            )}

            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {selectedTranscriptSession.messages.map((msg, idx) => {
                const isCandidate = msg.role === "candidate"
                const isAssistant = msg.role === "assistant"

                return (
                  <div
                    key={msg.id || idx}
                    className={cn(
                      "flex flex-col space-y-1.5 max-w-[90%]",
                      isCandidate ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-1">
                      {isCandidate ? (
                        <span className="font-bold text-[#0070ad] dark:text-[#00a3e0]">
                          Candidate Prompt
                        </span>
                      ) : (
                        <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-[#0070ad]" />
                          Capgemini AI Evaluator
                        </span>
                      )}
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 uppercase font-mono text-[9px]">
                        {msg.stage}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-line",
                        isCandidate
                          ? "bg-gradient-to-r from-[#0070ad] to-[#005a8c] text-white rounded-tr-xs"
                          : msg.isBypassAttempt
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-tl-xs"
                          : "bg-slate-100 dark:bg-[#0e1628] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-xs"
                      )}
                    >
                      {msg.content}

                      {/* Missing requirements if any */}
                      {msg.missingRequirements && msg.missingRequirements.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-300/40 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">
                            Required Focus Areas:
                          </span>
                          <ul className="space-y-0.5 text-xs text-rose-500 dark:text-rose-400">
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

              {/* Final Generated Code if exists */}
              {selectedTranscriptSession.generatedCode && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070c18] overflow-hidden my-4">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-[#0c1224] border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-[#0070ad]" />
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                        Final Generated Code
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedTranscriptSession.generatedCode || "")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="p-4 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed text-slate-800 dark:text-slate-200">
                    <pre>
                      <code>{selectedTranscriptSession.generatedCode}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-4 bg-slate-50 dark:bg-[#0c1326] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Attempt ID: <code className="font-mono">{selectedTranscriptSession._id || selectedTranscriptSession.id}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTranscriptSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const sess = selectedTranscriptSession
                    setSelectedTranscriptSession(null)
                    onStartExam(sess)
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white shadow-md shadow-[#0070ad]/20 transition-all hover:scale-[1.02]"
                >
                  Open in Exam Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CUSTOM PROBLEM BUILDER MODAL                                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Create Custom Assessment Problem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your own problem statement to test Capgemini&apos;s AI-assisted assessment state machine.
              </p>
            </div>

            <form onSubmit={handleCreateCustomProblem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Find Longest Substring Without Repeating Characters"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Problem Statement
                </label>
                <textarea
                  required
                  rows={4}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe what the problem requires..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Input Format
                  </label>
                  <input
                    type="text"
                    value={customInputFormat}
                    onChange={(e) => setCustomInputFormat(e.target.value)}
                    placeholder="e.g. string s"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Output Format
                  </label>
                  <input
                    type="text"
                    value={customOutputFormat}
                    onChange={(e) => setCustomOutputFormat(e.target.value)}
                    placeholder="e.g. integer length"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Constraints (one per line)
                </label>
                <textarea
                  rows={3}
                  value={customConstraints}
                  onChange={(e) => setCustomConstraints(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white shadow-md shadow-[#0070ad]/20 transition-all hover:scale-[1.02]"
                >
                  Start Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
