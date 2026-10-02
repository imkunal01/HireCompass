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
  Search,
  AlertTriangle,
  Flame,
  BrainCircuit,
  Lock,
  Zap,
  ChevronRight,
} from "lucide-react"
import {
  AssessmentProblem,
  AssessmentSession,
  AssessmentDifficulty,
} from "@/types/assessment"
import { CAPGEMINI_PROBLEMS } from "@/lib/assessment-problems"
import { cn } from "@/lib/utils"

interface AssessmentLobbyProps {
  onStartExam: (session: AssessmentSession) => void
}

export function AssessmentLobby({ onStartExam }: AssessmentLobbyProps) {
  const queryClient = useQueryClient()
  const [selectedDifficulty, setSelectedDifficulty] = useState<AssessmentDifficulty>("standard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("All")
  const [isStartingProblemId, setIsStartingProblemId] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)

  // Custom problem form state
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customInputFormat, setCustomInputFormat] = useState("")
  const [customOutputFormat, setCustomOutputFormat] = useState("")
  const [customConstraints, setCustomConstraints] = useState("0 <= n <= 10^5\nTime: O(n)\nSpace: O(n)")

  // Fetch assessment problems & history
  const { data, isLoading } = useQuery({
    queryKey: ["assessment-lobby-data"],
    queryFn: async () => {
      const res = await fetch("/api/prep/assessment?company=Capgemini")
      if (!res.ok) throw new Error("Failed to load assessment data")
      return res.json() as Promise<{
        company: string
        problems: AssessmentProblem[]
        recentSessions: AssessmentSession[]
      }>
    },
  })

  const problems = data?.problems || CAPGEMINI_PROBLEMS
  const pastSessions = data?.recentSessions || []

  // Mutation to launch exam
  const startExamMutation = useMutation({
    mutationFn: async ({
      problemId,
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
      setIsStartingProblemId(null)
      queryClient.invalidateQueries({ queryKey: ["assessment-lobby-data"] })
      onStartExam(data.session)
    },
    onError: (err: any) => {
      alert(err.message || "Failed to start assessment")
      setIsStartingProblemId(null)
    },
  })

  const handleLaunchProblem = (problem: AssessmentProblem) => {
    setIsStartingProblemId(problem.id)
    startExamMutation.mutate({
      problemId: problem.id,
      difficulty: selectedDifficulty,
    })
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

    startExamMutation.mutate({
      customProblem,
      difficulty: selectedDifficulty,
    })
    setShowCustomModal(false)
  }

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDifficulty =
      selectedDifficultyFilter === "All" || p.difficulty === selectedDifficultyFilter

    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[#0070ad]/30 bg-gradient-to-br from-[#0070ad]/15 via-[#00a3e0]/5 to-transparent dark:from-[#0070ad]/25 dark:via-slate-900/60 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0070ad] text-white shadow-xs">
                Capgemini
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Assisted Assessment Arena
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Proctored State Machine
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Capgemini AI Coding Assessment Simulator
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Experience the authentic Capgemini AI-collaborative coding evaluation. You are evaluated on how effectively you guide, direct, and critically review a restricted AI assistant — rather than asking an AI to solve the question for you.
            </p>

            {/* Stepper Flow Graphic */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                1. Understand
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-bold">
                2. Approach & Complexity
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
                6. Passed
              </span>
            </div>
          </div>

          {/* Quick Launch & Difficulty Selector */}
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
                  ? "Seeds realistic defects & aggressively tests edge cases."
                  : "Standard assessment rigor with targeted defect checks."}
              </p>
            </div>

            <button
              onClick={() => handleLaunchProblem(problems[0])}
              disabled={isStartingProblemId !== null}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-[#0070ad] to-[#00a3e0] hover:from-[#005a8c] hover:to-[#008cc0] text-white shadow-lg shadow-[#0070ad]/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Enter Exam Environment</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Pre-Flight Exam Protocol Checklist ── */}
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
            <span>Dedicated Exam Cockpit</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Zero outer scrolling: DOCKED prompt composer fixed at bottom, independent spec & message scrolls, and distraction-free proctor view.
          </p>
        </div>
      </div>

      {/* ── Problem Selection Library ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Assessment Problem Catalog
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a coding question to simulate the live Capgemini AI-assisted assessment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficultyFilter(diff)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs transition-all",
                    selectedDifficultyFilter === diff
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCustomModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Problem</span>
            </button>
          </div>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.map((prob) => {
            const isStarting = isStartingProblemId === prob.id

            return (
              <div
                key={prob.id}
                className="flex flex-col justify-between p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                        prob.difficulty === "Easy" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        prob.difficulty === "Medium" &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        prob.difficulty === "Hard" &&
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      {prob.difficulty}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {prob.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {prob.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prob.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                    Target: <span className="text-slate-700 dark:text-slate-300 font-bold">{prob.expectedComplexity.time}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Proctored Track
                  </span>

                  <button
                    onClick={() => handleLaunchProblem(prob)}
                    disabled={isStarting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0070ad] hover:bg-[#005a8c] text-white shadow-xs transition-all hover:scale-105"
                  >
                    {isStarting ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <span>Start Exam</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Past Practice Sessions & Scorecards History ── */}
      {pastSessions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Recent Assessment Exam Attempts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review your scores across AI Literacy, Prompt Quality, Problem Solving, and Review & Adapt.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 overflow-hidden">
            {pastSessions.map((sess) => (
              <div
                key={sess._id || sess.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                        sess.status === "PASSED" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        sess.status === "FAILED" &&
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                        sess.status === "ACTIVE" &&
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      )}
                    >
                      {sess.status}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono text-slate-500">
                      Stage: {sess.currentStage}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {sess.problem.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Started {new Date(sess.startedAt).toLocaleDateString()} at{" "}
                    {new Date(sess.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {sess.evaluation && (
                    <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/60 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-center">
                        <span className="text-[9px] font-bold uppercase text-slate-400">Total</span>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {sess.evaluation.totalScore}/100
                        </div>
                      </div>
                      <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>AI Lit: {sess.evaluation.aiLiteracy}/25</div>
                        <div>Review: {sess.evaluation.reviewAndAdapt}/25</div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => onStartExam(sess)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0070ad] text-white hover:bg-[#005a8c] transition-all hover:scale-105 shadow-xs"
                  >
                    <span>{sess.status === "ACTIVE" ? "Resume Exam" : "Inspect Exam"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Problem Modal ── */}
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
