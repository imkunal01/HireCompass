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
  Search,
  Shuffle,
  Coins,
  FileSpreadsheet,
} from "lucide-react"
import {
  AssessmentProblem,
  AssessmentSession,
  AssessmentDifficulty,
} from "@/types/assessment"
import { cn, formatFullDate } from "@/lib/utils"

interface AssessmentLobbyProps {
  onStartExam: (session: AssessmentSession) => void
}

export function AssessmentLobby({ onStartExam }: AssessmentLobbyProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"arena" | "from_sheet" | "history">("arena")
  const [selectedDifficulty, setSelectedDifficulty] = useState<AssessmentDifficulty>("standard")
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(30)
  const [isStarting, setIsStarting] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "PASSED" | "ACTIVE" | "FAILED">("ALL")
  const [selectedTranscriptSession, setSelectedTranscriptSession] = useState<AssessmentSession | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Problem Catalog Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [catalogDifficulty, setCatalogDifficulty] = useState<string>("ALL")
  const [visibleCount, setVisibleCount] = useState<number>(12)

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

  // Fetch candidate's DSA sheets (including Capgemini 150 roadmap)
  const { data: sheetsData } = useQuery({
    queryKey: ["assessment-user-sheets"],
    queryFn: async () => {
      const res = await fetch("/api/sheets")
      if (!res.ok) return { sheets: [] }
      return res.json() as Promise<{ sheets: any[] }>
    },
  })

  const activeSession = data?.activeSession || null
  const pastSessions = data?.recentSessions || []

  // Mutation to launch exam (with random problem from Capgemini dataset or chosen sheet problem)
  const startExamMutation = useMutation({
    mutationFn: async ({
      problemId = "random",
      difficulty,
      customProblem,
      timeLimitMinutes = selectedTimeLimit,
    }: {
      problemId?: string
      difficulty: AssessmentDifficulty
      customProblem?: AssessmentProblem
      timeLimitMinutes?: number
    }) => {
      const res = await fetch("/api/prep/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          problemId,
          difficulty,
          customProblem,
          timeLimitMinutes,
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

  const handleLaunchProblem = (problemId: string = "random", customMins: number = selectedTimeLimit) => {
    setIsStarting(true)
    startExamMutation.mutate({
      problemId,
      difficulty: selectedDifficulty,
      timeLimitMinutes: customMins,
    })
  }

  const handleLaunchRandom = () => {
    handleLaunchProblem("random", selectedTimeLimit)
  }

  const handleAbandonAndStartNew = (problemId: string = "random") => {
    if (activeSession) {
      if (confirm("Abandon active assessment and launch a new problem?")) {
        abandonExamMutation.mutate(activeSession._id || activeSession.id || "", {
          onSuccess: () => {
            handleLaunchProblem(problemId)
          },
        })
      }
    } else {
      handleLaunchProblem(problemId)
    }
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

  const problems = data?.problems || []

  const categories = [
    "ALL",
    "Dynamic Programming",
    "Arrays",
    "Trees",
    "Graphs",
    "Sliding Window",
    "Strings",
    "Mathematics",
    "Linked List",
    "Stack & Queue",
    "BST",
  ]

  const filteredProblems = problems.filter((p) => {
    if (selectedCategory !== "ALL" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false
    }
    if (catalogDifficulty !== "ALL" && p.difficulty.toLowerCase() !== catalogDifficulty.toLowerCase()) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = p.title.toLowerCase().includes(q)
      const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q))
      const catMatch = p.category.toLowerCase().includes(q)
      if (!titleMatch && !tagMatch && !catMatch) return false
    }
    return true
  })

  const filteredPastSessions = pastSessions.filter((sess) => {
    if (historyFilter === "ALL") return true
    return sess.status === historyFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Level Navigation Tabs: Assessment Arena vs Recent Assessments ── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("arena")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "arena"
                ? "bg-[#0070ad] text-white shadow-md shadow-[#0070ad]/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Random Assessment</span>
          </button>

          <button
            onClick={() => setActiveTab("from_sheet")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "from_sheet"
                ? "bg-[#0070ad] text-white shadow-md shadow-[#0070ad]/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Choose from Sheet</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 text-blue-700">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-[#0070ad] text-white shadow-md shadow-[#0070ad]/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                    : "bg-slate-200 text-slate-700"
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
            <span className="text-xs font-bold text-emerald-600">
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
            <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50/50 to-white p-6 backdrop-blur-xl shadow-xs animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      In-Progress Assessment Preserved
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Stage: {activeSession.currentStage}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeSession.problem.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Your assessment state and chat history were preserved. Click resume to continue your proctored session right where you left off.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleAbandonActive}
                    disabled={abandonExamMutation.isPending}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Abandon & Reset
                  </button>
                  <button
                    onClick={() => handleAbandonAndStartNew("random")}
                    disabled={abandonExamMutation.isPending || isStarting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Abandon & Roll New Random</span>
                  </button>
                  <button
                    onClick={() => onStartExam(activeSession)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#0070ad] to-[#00a3e0] text-white shadow-md shadow-[#0070ad]/25 hover:scale-105 transition-all"
                  >
                    <span>Resume Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[#0070ad]/20 bg-gradient-to-br from-[#0070ad]/10 via-[#00a3e0]/5 to-white p-6 sm:p-8 backdrop-blur-xl shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0070ad] text-white shadow-xs">
                    PROCTORED EXAM
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-[#0070ad]" />
                    AI Coding Assessment Arena
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {problems.length > 0 ? `${problems.length} Curated DSA Problems` : "150 Curated DSA Problems"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  AI-Assisted Coding Assessment Simulator
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Experience authentic enterprise AI-collaborative coding evaluation. Instead of asking AI to solve the question for you, you guide, direct, and critically review a restricted AI assistant through 6 authoritative stages.
                </p>

                {/* 6-Stage Process Flow */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs">
                    1. Understand
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs">
                    2. Approach
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs">
                    3. Structured Prompt
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs">
                    4. Code Review
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs">
                    5. Refine
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs">
                    6. 100-Pt Scorecard
                  </span>
                </div>
              </div>

              {/* Simulation Difficulty Selector, Stopwatch Time Limit & Start Assessment Button */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                {/* Difficulty Selector */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#0070ad]" />
                      Simulation Rigor:
                    </span>
                    <span className="text-[10px] uppercase font-extrabold text-[#0070ad]">
                      {selectedDifficulty}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedDifficulty("standard")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                        selectedDifficulty === "standard"
                          ? "bg-[#0070ad] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty("hard")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                        selectedDifficulty === "hard"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Strict / Hard
                    </button>
                  </div>
                </div>

                {/* Stopwatch Time Limit Selector */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0070ad]" />
                      Stopwatch Time Limit:
                    </span>
                    <span className="text-[10px] uppercase font-mono font-extrabold text-[#0070ad]">
                      {selectedTimeLimit} mins
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setSelectedTimeLimit(mins)}
                        className={cn(
                          "px-2 py-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer",
                          selectedTimeLimit === mins
                            ? "bg-[#0070ad] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  {/* Token Budget Notice */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" />
                      Budget: <strong>2,000 tokens</strong>
                    </span>
                    <span className="text-rose-600 font-semibold">Strict fail on limit</span>
                  </div>
                </div>

                {/* Launch Random Problem Button */}
                <button
                  onClick={handleLaunchRandom}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-[#0070ad] to-[#00a3e0] hover:from-[#005a8c] hover:to-[#008cc0] text-white shadow-lg shadow-[#0070ad]/25 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <Dices className="w-4 h-4 fill-white" />
                  <span>{isStarting ? "Assigning Random Problem..." : "Launch Random Problem"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Choose from Sheet quick link */}
                <button
                  onClick={() => setActiveTab("from_sheet")}
                  className="text-[11px] font-bold text-[#0070ad] hover:text-[#005a8c] text-center hover:underline cursor-pointer flex items-center justify-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Or Choose a Problem from Sheet →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Random Problem Generator Information Card */}
          <div className="p-6 rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Dices className="w-5 h-5 text-[#0070ad]" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Random Problem Dispatcher (DSA Question Bank)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When you click &ldquo;Start Assessment&rdquo;, a problem is selected at random from the 29-problem practice set.
                </p>
              </div>

              <button
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Practice Custom Statement</span>
              </button>
            </div>

            {/* Categorical Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-blue-700">
                  Arrays & Strings
                </span>
                <p className="text-xs font-bold text-slate-800">
                  9 Core Problems
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Kadane, Sliding Window, Matrix, In-Place Shifts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-700">
                  Math & Greedy
                </span>
                <p className="text-xs font-bold text-slate-800">
                  7 Core Problems
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Stock Buy/Sell, Container, Two Sum, Jump Game
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-indigo-700">
                  Stacks & Lists
                </span>
                <p className="text-xs font-bold text-slate-800">
                  5 Core Problems
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Cycle Detection, Reverse in K, NGE, Parentheses
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700">
                  DP & Trees
                </span>
                <p className="text-xs font-bold text-slate-800">
                  8 Core Problems
                </p>
                <span className="text-[10px] text-slate-500 block">
                  0/1 Knapsack, Coin Change, LCS, LIS, BST Pruning
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Flight Exam Protocol Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Bypass Guard Active</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Requests like &quot;Give me the code&quot; or &quot;Solve this&quot; are intercepted. Candidates must demonstrate semantic reasoning.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span>100-Point Process Rubric</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Graded on AI Literacy (25), Prompt Quality (25), Problem Solving (25), and Review & Adapt (25). Pass threshold: ≥70 pts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>State Persistence & Proctoring</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exam states do not reset when clicking back or navigating away. All prompts and AI replies are saved securely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CHOOSE PROBLEM FROM SHEET                                       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "from_sheet" && (
        <div className="space-y-6">
          {/* Active In-Progress Assessment Alert Banner */}
          {activeSession && activeSession.status === "ACTIVE" && (
            <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50/50 to-white p-6 backdrop-blur-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      Active Exam In Progress
                    </span>
                    <span className="text-xs font-bold text-slate-800">{activeSession.problem.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    You have an ongoing assessment session. Launching a new question will supersede and abandon the current session.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onStartExam(activeSession)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0070ad] text-white hover:bg-[#005a8c] transition-all shadow-xs"
                  >
                    Resume Current Exam
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sheet Browser Controls Bar */}
          <div className="p-6 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0070ad]" />
                  <h2 className="text-lg font-black text-slate-900">
                    Choose a Problem from DSA Sheet
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Select any problem from the 150-question syllabus to solve under proctored conditions with restricted AI collaboration.
                </p>
              </div>

              {/* Time & Rigor settings for selected problem */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Rigor Pill */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setSelectedDifficulty("standard")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      selectedDifficulty === "standard"
                        ? "bg-[#0070ad] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setSelectedDifficulty("hard")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      selectedDifficulty === "hard"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Strict / Hard
                  </button>
                </div>

                {/* Stopwatch Limit Pill */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold font-mono">
                  <span className="px-2 text-slate-500 font-sans text-[11px] hidden sm:inline">Limit:</span>
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSelectedTimeLimit(mins)}
                      className={cn(
                        "px-2 py-1 rounded-lg transition-all cursor-pointer",
                        selectedTimeLimit === mins
                          ? "bg-[#0070ad] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                {/* Token Budget indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>2,000 tokens</span>
                </div>
              </div>
            </div>

            {/* Search & Topic Filters */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search problem title, algorithm, or tags (e.g. Kadane, Two-Pointer, Sliding Window)..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Difficulty Filter Chips */}
                <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
                  {(["ALL", "Easy", "Medium", "Hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setCatalogDifficulty(diff)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        catalogDifficulty === diff
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                      selectedCategory === cat
                        ? "bg-[#0070ad] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problems Grid from Sheet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing {Math.min(visibleCount, filteredProblems.length)} of {filteredProblems.length} sheet problems</span>
              <span className="font-mono">Time Limit: {selectedTimeLimit} mins • Budget: 2,000 tokens</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProblems.slice(0, visibleCount).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#0070ad]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {p.category}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border",
                          p.difficulty === "Easy" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          p.difficulty === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
                          p.difficulty === "Hard" && "bg-rose-50 text-rose-700 border-rose-200"
                        )}
                      >
                        {p.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {p.title}
                    </h3>

                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.expectedComplexity?.time || "O(n)"}
                    </span>
                    <button
                      onClick={() => handleAbandonAndStartNew(p.id)}
                      disabled={isStarting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white shadow-xs transition-all hover:scale-105 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Start Assessment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < filteredProblems.length && (
              <div className="text-center pt-3">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  Load More Problems ({filteredProblems.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: RECENT ASSESSMENTS & ATTEMPT HISTORIES                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Recent Assessment Attempts
              </h2>
              <p className="text-xs text-slate-500">
                Inspect your prompts given, AI responses, code drafts, and 100-point evaluation scorecards.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(["ALL", "PASSED", "ACTIVE", "FAILED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs transition-all",
                    historyFilter === filter
                      ? "bg-white text-blue-600 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredPastSessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-slate-200/80 bg-white/70 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0070ad]/10 text-[#0070ad] flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                No Assessment Attempts Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Head over to the Assessment Arena tab to launch your first randomized coding assessment.
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
            <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
              {filteredPastSessions.map((sess) => {
                const candidatePromptsCount = sess.messages.filter((m) => m.role === "candidate").length
                const assistantRepliesCount = sess.messages.filter((m) => m.role === "assistant").length

                return (
                  <div
                    key={sess._id || sess.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                            sess.status === "PASSED" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                            sess.status === "FAILED" &&
                            "bg-rose-50 text-rose-700 border-rose-200",
                            sess.status === "ACTIVE" &&
                            "bg-blue-50 text-blue-700 border-blue-200",
                            sess.status === "ABANDONED" &&
                            "bg-slate-100 text-slate-600 border-slate-200"
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

                      <h4 className="font-bold text-base text-slate-900">
                        {sess.problem.title}
                      </h4>

                      <p className="text-xs text-slate-500" suppressHydrationWarning>
                        {sess.problem.category} • Attempted on{" "}
                        {formatFullDate(sess.startedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {sess.evaluation && (
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                          <div className="text-center">
                            <span className="text-[9px] font-bold uppercase text-slate-400">Total</span>
                            <div className="text-base font-black text-slate-900">
                              {sess.evaluation.totalScore}/100
                            </div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <div>AI Lit: {sess.evaluation.aiLiteracy}/25</div>
                            <div>Prompt: {sess.evaluation.promptQuality}/25</div>
                          </div>
                        </div>
                      )}

                      {/* View Chat Transcript button */}
                      <button
                        onClick={() => setSelectedTranscriptSession(sess)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="shrink-0 p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                      selectedTranscriptSession.status === "PASSED" &&
                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                      selectedTranscriptSession.status === "FAILED" &&
                      "bg-rose-50 text-rose-700 border-rose-200",
                      selectedTranscriptSession.status === "ACTIVE" &&
                      "bg-blue-50 text-blue-700 border-blue-200",
                      selectedTranscriptSession.status === "ABANDONED" &&
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {selectedTranscriptSession.status}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Stage Reached: {selectedTranscriptSession.currentStage}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {selectedTranscriptSession.problem.title} — Chat History & Prompts
                </h3>
              </div>

              <button
                onClick={() => setSelectedTranscriptSession(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard quick stats bar if evaluated */}
            {selectedTranscriptSession.evaluation && (
              <div className="shrink-0 px-6 py-3 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-[#0070ad]" />
                  <span className="font-bold text-slate-900">
                    Score: {selectedTranscriptSession.evaluation.totalScore}/100
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">
                    AI Literacy: {selectedTranscriptSession.evaluation.aiLiteracy}/25
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">
                    Prompting: {selectedTranscriptSession.evaluation.promptQuality}/25
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">
                    Review: {selectedTranscriptSession.evaluation.reviewAndAdapt}/25
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedTranscriptSession.messages.filter((m) => m.role === "candidate").length} Candidate Prompts
                </span>
              </div>
            )}

            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
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
                        <span className="font-bold text-[#0070ad]">
                          Candidate Prompt
                        </span>
                      ) : (
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-[#0070ad]" />
                          AI Assessment Evaluator
                        </span>
                      )}
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 uppercase font-mono text-[9px]">
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
                            ? "bg-rose-50 text-rose-700 border border-rose-200 rounded-tl-xs"
                            : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                      )}
                    >
                      {msg.content}

                      {/* Missing requirements if any */}
                      {msg.missingRequirements && msg.missingRequirements.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500">
                            Required Focus Areas:
                          </span>
                          <ul className="space-y-0.5 text-xs text-rose-600">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden my-4 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-[#00a3e0]" />
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Final Generated Code
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedTranscriptSession.generatedCode || "")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="p-4 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed text-slate-100">
                    <pre>
                      <code>{selectedTranscriptSession.generatedCode}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Attempt ID: <code className="font-mono text-slate-600">{selectedTranscriptSession._id || selectedTranscriptSession.id}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTranscriptSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-slate-900">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Create Custom Assessment Problem
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your own problem statement to test the AI-assisted assessment state machine.
              </p>
            </div>

            <form onSubmit={handleCreateCustomProblem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Find Longest Substring Without Repeating Characters"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white border border-slate-300 outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Problem Statement
                </label>
                <textarea
                  required
                  rows={4}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe what the problem requires..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white border border-slate-300 outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad] text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                    Input Format
                  </label>
                  <input
                    type="text"
                    value={customInputFormat}
                    onChange={(e) => setCustomInputFormat(e.target.value)}
                    placeholder="e.g. string s"
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white border border-slate-300 outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                    Output Format
                  </label>
                  <input
                    type="text"
                    value={customOutputFormat}
                    onChange={(e) => setCustomOutputFormat(e.target.value)}
                    placeholder="e.g. integer length"
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white border border-slate-300 outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Constraints (one per line)
                </label>
                <textarea
                  rows={3}
                  value={customConstraints}
                  onChange={(e) => setCustomConstraints(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white border border-slate-300 outline-none focus:ring-2 focus:ring-[#0070ad]/20 focus:border-[#0070ad] text-slate-900 placeholder:text-slate-400 font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
