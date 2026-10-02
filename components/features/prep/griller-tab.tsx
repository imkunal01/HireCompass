"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Flame,
  ShieldAlert,
  Send,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Loader2,
  FolderGit2,
  ArrowRight,
  User,
  Bot,
  Award,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { InterviewerPersona, Scorecard } from "@/types/prep"

interface Message {
  role: "interviewer" | "candidate"
  content: string
  scorecard?: Scorecard | null
}

const PERSONAS: Array<{
  id: InterviewerPersona
  title: string
  difficulty: string
  tagline: string
  avatar: string
  color: string
  accent: string
}> = [
  {
    id: "staff",
    title: "Staff Systems Engineer",
    difficulty: "High Contention (50k+ QPS)",
    tagline: "Probes distributed race conditions, cache-invalidation, partial failure modes, and P99 latency SLAs.",
    avatar: "🦁",
    color: "from-rose-500/20 via-orange-500/10 to-transparent border-rose-500/40 text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500 text-white",
  },
  {
    id: "lead",
    title: "Pragmatic Tech Lead",
    difficulty: "Production Resilience",
    tagline: "Tests test automation pyramids, rollback blueprints, database migration risks, and CI/CD safeguards.",
    avatar: "🛠️",
    color: "from-indigo-500/20 via-blue-500/10 to-transparent border-indigo-500/40 text-indigo-600 dark:text-indigo-400",
    accent: "bg-indigo-500 text-white",
  },
  {
    id: "em",
    title: "Engineering Manager",
    difficulty: "Cross-Functional Trade-Offs",
    tagline: "Probes deadline estimation accuracy, tech-debt prioritization vs product velocity, and post-mortems.",
    avatar: "👥",
    color: "from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/40 text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500 text-white",
  },
]

export function GrillerTab() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>("staff")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputAnswer, setInputAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({})

  // Fetch candidate's projects from Project Vault
  const { data: projects = [], isLoading: loadingProjects } = useQuery<any[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const selectedProject = projects.find((p) => p.id === selectedProjectId || p._id === selectedProjectId)

  const handleStartSession = async () => {
    if (!selectedProjectId) {
      setError("Please select a project from your Vault to defend")
      return
    }

    setIsLoading(true)
    setError(null)
    setSessionActive(true)
    setMessages([])
    setRevealedSolutions({})

    try {
      const res = await fetch("/api/prep/griller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          persona: selectedPersona,
          messages: [],
          userAnswer: "",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to start simulation")
      }

      setMessages([
        {
          role: "interviewer",
          content: data.question || "Let's dive into your architecture. Explain your system under peak scale.",
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to start simulation")
      setSessionActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputAnswer.trim() || isLoading) return

    const userText = inputAnswer.trim()
    setInputAnswer("")

    const updated = [...messages, { role: "candidate" as const, content: userText }]
    setMessages(updated)
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/prep/griller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          persona: selectedPersona,
          messages: updated,
          userAnswer: userText,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit defense answer")
      }

      setMessages([
        ...updated,
        {
          role: "interviewer",
          content: data.question,
          scorecard: data.scorecard,
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to submit response")
    } finally {
      setIsLoading(false)
    }
  }

  const personaMeta = PERSONAS.find((p) => p.id === selectedPersona)

  return (
    <div className="space-y-6">
      {!sessionActive ? (
        /* ── Setup Stage: Project & Persona Selection ── */
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                  Simulation Arena
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Zero Generic Questions</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                The Griller — Real Project Defense Simulator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                An AI Staff Engineer interrogates your actual Project Vault projects. Defend your concurrency decisions, data models, and trade-offs under pressure.
              </p>
            </div>

            <div className="flex items-center gap-2 text-rose-500 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold">Hardcore Mode</span>
            </div>
          </div>

          {/* 1. Project Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Select Project from Your Vault to Defend</span>
                <span className="text-rose-500">*</span>
              </label>

              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Manage Project Vault</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingProjects ? (
              <div className="h-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ) : projects.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No projects found in your Project Vault
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white"
                >
                  <span>Add Project to Vault First</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {projects.map((proj) => {
                  const id = proj.id || proj._id
                  const isSelected = selectedProjectId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedProjectId(id)}
                      className={cn(
                        "flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 group hover:scale-[1.02]",
                        isSelected
                          ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-md ring-2 ring-rose-500/20"
                          : "border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs truncate text-slate-900 dark:text-white">
                          {proj.title}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {Array.isArray(proj.techStack) ? proj.techStack.join(", ") : proj.techStack || "Full Stack Architecture"}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. Persona Picker */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              2. Choose Your Interrogator Persona
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PERSONAS.map((p) => {
                const isSelected = selectedPersona === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={cn(
                      "flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02]",
                      isSelected
                        ? "bg-gradient-to-br border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20"
                        : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-400",
                      p.color
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                        {p.avatar}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300/30">
                        {p.difficulty}
                      </span>
                    </div>

                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {p.title}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                      {p.tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-2 animate-in shake duration-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={handleStartSession}
              disabled={isLoading || !selectedProjectId}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-orange-600 to-rose-700 hover:from-rose-500 hover:to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring Interrogator Arena...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Enter The Arena & Begin Defense</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── Active Interrogation Arena ── */
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Active Session HUD Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xl shadow-inner">
                {personaMeta?.avatar || "🦁"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10">
                    Defending Live
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {personaMeta?.title}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedProject?.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset current defense session and pick a different project or persona?")) {
                    setSessionActive(false)
                    setMessages([])
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Arena</span>
              </button>
            </div>
          </div>

          {/* Dialogue Transcript Stream */}
          <div className="space-y-4">
            {messages.map((m, idx) => {
              const isInterviewer = m.role === "interviewer"
              const isSolutionRevealed = Boolean(revealedSolutions[idx])
              return (
                <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div
                    className={cn(
                      "flex gap-3 sm:gap-4 p-5 rounded-3xl border backdrop-blur-xl shadow-sm",
                      isInterviewer
                        ? "bg-slate-50/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white"
                        : "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/25 ml-4 sm:ml-12"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold shadow-xs",
                        isInterviewer
                          ? "bg-rose-500 text-white"
                          : "bg-indigo-600 text-white"
                      )}
                    >
                      {isInterviewer ? personaMeta?.avatar || "🦁" : "👤"}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          {isInterviewer ? personaMeta?.title : "Your Defense"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Turn #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                  </div>

                  {/* Interrogator Scorecard Feedback */}
                  {m.scorecard && (
                    <div className="p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent space-y-4 ml-4 sm:ml-12 backdrop-blur-xl shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Interviewer Defense Scorecard
                          </span>
                        </div>
                      </div>

                      {/* 3 Metric Score Meters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Technical Depth", val: m.scorecard.technicalDepth, max: 10 },
                          { label: "Trade-Off Awareness", val: m.scorecard.tradeOffAwareness, max: 10 },
                          { label: "Composure & Clarity", val: m.scorecard.composure, max: 10 },
                        ].map((metric, mIdx) => {
                          const isHigh = metric.val >= 8
                          const isMid = metric.val >= 5 && metric.val < 8
                          return (
                            <div key={mIdx} className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 space-y-1.5 shadow-xs">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span>{metric.label}</span>
                                <span className={cn("font-mono font-extrabold", isHigh ? "text-emerald-500" : isMid ? "text-amber-500" : "text-rose-500")}>
                                  {metric.val} / {metric.max}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-500", isHigh ? "bg-emerald-500" : isMid ? "bg-amber-500" : "bg-rose-500")}
                                  style={{ width: `${(metric.val / metric.max) * 100}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {m.scorecard.critique && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          <strong>Staff Feedback: </strong>
                          {m.scorecard.critique}
                        </p>
                      )}

                      {/* Collapsible Gold-Standard Counter Defense */}
                      {m.scorecard.goldStandardCounter && (
                        <div className="pt-1">
                          {!isSolutionRevealed ? (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedSolutions((prev) => ({ ...prev, [idx]: true }))
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Reveal Staff-Level Model Answer</span>
                            </button>
                          ) : (
                            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in">
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block text-xs uppercase tracking-wider">
                                Gold-Standard Defense Script:
                              </span>
                              <p className="leading-relaxed font-medium">
                                {m.scorecard.goldStandardCounter}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Waiting for Staff Response Pulse Equalizer */}
            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 animate-pulse">
                <span className="text-lg">{personaMeta?.avatar}</span>
                <span>{personaMeta?.title} is dissecting your architecture...</span>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" />
                  <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            )}
          </div>

          {/* User Defense Input Form */}
          <form onSubmit={handleSendAnswer} className="space-y-3 pt-2">
            <div className="relative">
              <textarea
                rows={3}
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="State your technical justification, state machines, failover strategies, or tradeoffs..."
                disabled={isLoading}
                className="w-full text-xs sm:text-sm p-4 pr-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none shadow-sm"
              />

              <button
                type="submit"
                disabled={!inputAnswer.trim() || isLoading}
                className="absolute right-3 bottom-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-40 transition-all hover:scale-[1.02]"
              >
                <span>Defend</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Tip: Explicitly acknowledge scale bottlenecks and mention fallback mechanisms (e.g. circuit breakers, Redis write-behind buffers).
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
