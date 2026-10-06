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
  GraduationCap,
  Briefcase,
  Code2,
  Terminal,
  Cpu,
  Smartphone,
  Database,
  Cloud,
  Copy,
  Check,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { InterviewerPersona, Scorecard, CandidateRole, ExperienceLevel } from "@/types/prep"
import {
  CANDIDATE_ROLES,
  EXPERIENCE_LEVELS,
  FRESHER_STARTER_PROJECTS,
  FresherStarterProject,
} from "@/lib/fresher-projects"
import { savePrepSessionSnapshot, clearPrepSessionSnapshot } from "@/lib/resume-session"

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
  fresherRecommended?: boolean
}> = [
  {
    id: "mentor",
    title: "Supportive Senior Mentor",
    difficulty: "Fresher Friendly & Foundational",
    tagline: "Encouraging and constructive. Probes whether you genuinely understand your code, tech choices, and debugging logic.",
    avatar: "🧑‍🏫",
    color: "from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-500 text-white",
    fresherRecommended: true,
  },
  {
    id: "lead",
    title: "Pragmatic Tech Lead",
    difficulty: "Production Resilience & Code Health",
    tagline: "Tests test automation, edge cases, error handling, database choices, and code maintainability.",
    avatar: "🛠️",
    color: "from-indigo-500/20 via-blue-500/10 to-transparent border-indigo-500/40 text-indigo-600 dark:text-indigo-400",
    accent: "bg-indigo-500 text-white",
    fresherRecommended: true,
  },
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
    id: "em",
    title: "Engineering Manager",
    difficulty: "Cross-Functional Trade-Offs",
    tagline: "Probes deadline estimation accuracy, tech-debt prioritization vs product velocity, and team collaboration.",
    avatar: "👥",
    color: "from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/40 text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500 text-white",
  },
]

export function GrillerTab() {
  // Setup configuration state
  const [selectedRole, setSelectedRole] = useState<CandidateRole>("fullstack")
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("fresher")
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>("mentor")
  const [projectSource, setProjectSource] = useState<"starter" | "vault">("starter")
  const [selectedStarterProjectId, setSelectedStarterProjectId] = useState<string>("starter-ecommerce")
  const [selectedVaultProjectId, setSelectedVaultProjectId] = useState<string>("")

  // Simulation arena state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputAnswer, setInputAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({})
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Fetch candidate's projects from Project Vault
  const { data: vaultProjects = [], isLoading: loadingVault } = useQuery<any[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  // Auto-select first vault project if user switches to vault
  React.useEffect(() => {
    if (projectSource === "vault" && !selectedVaultProjectId && vaultProjects.length > 0) {
      const firstId = vaultProjects[0].id || vaultProjects[0]._id
      if (firstId) setSelectedVaultProjectId(firstId)
    }
  }, [projectSource, selectedVaultProjectId, vaultProjects])

  // Selected project object resolution
  const activeStarterProject = FRESHER_STARTER_PROJECTS.find(
    (p) => p.id === selectedStarterProjectId
  )
  const activeVaultProject = vaultProjects.find(
    (p) => p.id === selectedVaultProjectId || p._id === selectedVaultProjectId
  )
  const effectiveProject =
    projectSource === "starter" ? activeStarterProject : activeVaultProject

  const activeProjectTitle =
    effectiveProject?.name || effectiveProject?.title || "Selected Project"

  const normalizedProject = effectiveProject
    ? {
        ...effectiveProject,
        id:
          effectiveProject.id ||
          effectiveProject._id ||
          (projectSource === "vault" ? selectedVaultProjectId : selectedStarterProjectId),
        title: activeProjectTitle,
        name: activeProjectTitle,
        description: effectiveProject.description || "",
        techStack: effectiveProject.techStack || [],
        responsibilities:
          effectiveProject.responsibilities || effectiveProject.documentationText || "",
        documentationText:
          effectiveProject.documentationText || effectiveProject.responsibilities || "",
        challenges: effectiveProject.challenges || "",
        metrics: effectiveProject.metrics || "",
      }
    : null

  const currentRoleMeta = CANDIDATE_ROLES.find((r) => r.id === selectedRole) || CANDIDATE_ROLES[0]
  const currentLevelMeta =
    EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel) || EXPERIENCE_LEVELS[0]

  // Track active Griller session snapshot for Home page resume hub
  React.useEffect(() => {
    if (sessionActive && normalizedProject) {
      const activePersonaMeta = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0]
      const candidateTurns = messages.filter((m) => m.role === "candidate").length
      const progressPct = Math.min(100, Math.round(((candidateTurns + 1) / 5) * 100))

      savePrepSessionSnapshot({
        id: "prep_griller_active",
        toolType: "prep",
        title: "The Griller: Project Defense",
        subtitle: `${activePersonaMeta.title} • ${activeProjectTitle}`,
        badgeText: `Turn ${candidateTurns}/5 Defended`,
        badgeVariant: "amber",
        progressPercent: Math.max(20, progressPct),
        progressLabel: `Turn ${candidateTurns} of 5 completed`,
        lastActive: new Date().toISOString(),
        href: "/prep?tab=griller",
        actionLabel: "Resume Defense",
        meta: {
          tab: "griller",
          persona: activePersonaMeta.title,
          projectName: activeProjectTitle,
          turnCount: candidateTurns,
          totalTurns: 5,
        },
      })
    }
  }, [sessionActive, normalizedProject, messages, selectedPersona, activeProjectTitle])

  const handleStartSession = async () => {
    if (projectSource === "vault" && !selectedVaultProjectId) {
      setError("Please select a project from your Vault or choose a Fresher Starter Project.")
      return
    }

    if (!normalizedProject) {
      setError("Please select a valid project to defend.")
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
          projectId:
            projectSource === "vault"
              ? selectedVaultProjectId || normalizedProject.id
              : normalizedProject.id,
          projectData: normalizedProject,
          persona: selectedPersona,
          candidateRole: selectedRole,
          experienceLevel,
          messages: [],
          userAnswer: "",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to start defense round")
      }

      setMessages([
        {
          role: "interviewer",
          content: data.reply,
          scorecard: null,
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to launch simulation")
      setSessionActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnswer = async (suggestedText?: string) => {
    const text = (suggestedText || inputAnswer).trim()
    if (!text || isLoading || !normalizedProject) return

    const newMessages: Message[] = [...messages, { role: "candidate", content: text }]
    setMessages(newMessages)
    setInputAnswer("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/prep/griller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:
            projectSource === "vault"
              ? selectedVaultProjectId || normalizedProject.id
              : normalizedProject.id,
          projectData: normalizedProject,
          persona: selectedPersona,
          candidateRole: selectedRole,
          experienceLevel,
          messages: newMessages.slice(0, -1),
          userAnswer: text,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit defense answer")
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          content: data.reply,
          scorecard: data.scorecard || null,
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to process answer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (isLoading || !normalizedProject) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/prep/griller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "next_question",
          projectId:
            projectSource === "vault"
              ? selectedVaultProjectId || normalizedProject.id
              : normalizedProject.id,
          projectData: normalizedProject,
          persona: selectedPersona,
          candidateRole: selectedRole,
          experienceLevel,
          messages,
          userAnswer: "",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load next question")
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          content: data.reply,
          scorecard: null,
        },
      ])
      setInputAnswer("")
    } catch (err: any) {
      setError(err.message || "Failed to load next question")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRewriteAnswer = (candidateIdx: number) => {
    if (candidateIdx < 0 || candidateIdx >= messages.length) return
    const candidateMsg = messages[candidateIdx]
    if (!candidateMsg) return

    // Put previous answer into input for easy editing
    setInputAnswer(candidateMsg.content)

    // Remove candidate message and subsequent scorecard messages
    setMessages((prev) => prev.slice(0, candidateIdx))

    // Scroll to and focus composer
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea")
      textarea?.focus()
    }, 150)
  }

  const handleCopyGoldStandard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Role-tailored suggestion starters
  const getRoleAnswerStarters = () => {
    switch (selectedRole) {
      case "frontend":
        return [
          "In my React components, I managed state using...",
          "To avoid redundant re-renders, I memoized...",
          "When the API request fails, my error boundary...",
        ]
      case "backend":
        return [
          "For database modeling, I separated collections into...",
          "Authentication is handled via JWT tokens where...",
          "To optimize query response times, I indexed...",
        ]
      case "data_ml":
        return [
          "During data preprocessing, I handled outliers by...",
          "I chose this algorithm over the baseline because...",
          "To prevent data leakage during train-test split, I...",
        ]
      case "devops":
        return [
          "My Dockerfile uses multi-stage builds to reduce image size by...",
          "In GitHub Actions, the automated test workflow triggers on...",
          "Production secrets are injected securely via...",
        ]
      case "mobile":
        return [
          "For offline support, I cached responses in local storage...",
          "To keep screen scroll 60fps, I virtualized the list...",
          "Network status changes are monitored using...",
        ]
      default:
        return [
          "The core architecture is structured around...",
          "A major trade-off I evaluated was choosing...",
          "The trickiest bug I encountered was when...",
        ]
    }
  }

  // ── 1. ACTIVE DEFENSE ARENA VIEW ──
  if (sessionActive && effectiveProject) {
    const activePersonaMeta = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0]

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Arena Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3.5 z-10">
            <div className="text-3xl p-2.5 rounded-2xl bg-slate-800 border border-slate-700/80 shrink-0">
              {activePersonaMeta.avatar}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Defending as:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                  {currentRoleMeta.emoji} {currentRoleMeta.title}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md font-bold text-xs border",
                    experienceLevel === "fresher"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                  )}
                >
                  {currentLevelMeta.title}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                {activeProjectTitle}
              </h2>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Array.isArray(effectiveProject.techStack)
                  ? effectiveProject.techStack.map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {tech}
                      </span>
                    ))
                  : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto z-10">
            <button
              onClick={() => {
                if (confirm("Reset current defense round and reconfigure settings?")) {
                  setSessionActive(false)
                  setMessages([])
                  clearPrepSessionSnapshot()
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Settings / Exit</span>
            </button>
          </div>
        </div>

        {/* Conversation Stream & Scorecards */}
        <div className="space-y-5">
          {messages.map((msg, idx) => {
            const isInterviewer = msg.role === "interviewer"
            const isCandidate = msg.role === "candidate"
            const scorecard = msg.scorecard

            return (
              <div key={idx} className="space-y-4">
                {/* Dialogue Bubble */}
                <div
                  className={cn(
                    "flex gap-3.5 max-w-3xl",
                    isCandidate ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs shadow-md",
                      isCandidate
                        ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                        : "bg-slate-800 border border-slate-700 text-slate-200 text-base"
                    )}
                  >
                    {isCandidate ? <User className="w-4 h-4" /> : activePersonaMeta.avatar}
                  </div>

                  <div
                    className={cn(
                      "p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm",
                      isCandidate
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                    )}
                  >
                    <div className="font-bold text-[10px] uppercase tracking-wider mb-1.5 opacity-80">
                      {isCandidate ? "Your Defense Response" : activePersonaMeta.title}
                    </div>
                    <div className="whitespace-pre-line font-sans">{msg.content}</div>
                  </div>
                </div>

                {/* Scorecard for Candidate's Answer */}
                {scorecard && (
                  <div className="max-w-3xl mr-auto ml-12 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Interviewer Evaluation
                        </span>
                        {experienceLevel === "fresher" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Fresher Rubric
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Response Critique
                      </span>
                    </div>

                    {/* Metric Gauges */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block truncate">
                          {experienceLevel === "fresher" ? "Fundamentals" : "Technical Depth"}
                        </span>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {scorecard.technicalDepth}{" "}
                          <span className="text-[10px] text-slate-400">/ 10</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block truncate">
                          Trade-Offs
                        </span>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {scorecard.tradeOffAwareness}{" "}
                          <span className="text-[10px] text-slate-400">/ 10</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block truncate">
                          Clarity
                        </span>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {scorecard.communicationComposure || scorecard.composure || 8}{" "}
                          <span className="text-[10px] text-slate-400">/ 10</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {scorecard.strengths && scorecard.strengths.length > 0 && (
                        <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            What You Explained Well
                          </span>
                          <ul className="space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            {scorecard.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scorecard.gaps && scorecard.gaps.length > 0 && (
                        <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1">
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px] uppercase">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            What You Missed / Clarification
                          </span>
                          <ul className="space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            {scorecard.gaps.map((g, i) => (
                              <li key={i}>• {g}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Constructive Feedback Note */}
                    {scorecard.feedback && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-500 pl-3">
                        &quot;{scorecard.feedback}&quot;
                      </p>
                    )}

                    {/* Gold Standard Model Answer Reveal */}
                    {(scorecard.goldStandardAnswer || scorecard.goldStandardCounter) && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          onClick={() =>
                            setRevealedSolutions((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {revealedSolutions[idx]
                              ? "Hide Gold-Standard Answer"
                              : "Reveal Gold-Standard Model Answer (Learn how to answer like a Senior)"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform",
                              revealedSolutions[idx] && "rotate-180"
                            )}
                          />
                        </button>

                        {revealedSolutions[idx] && (
                          <div className="mt-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-800 dark:text-slate-200 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Model Senior/Lead Response:
                              </span>
                              <button
                                onClick={() =>
                                  handleCopyGoldStandard(
                                    scorecard.goldStandardAnswer ||
                                      scorecard.goldStandardCounter ||
                                      "",
                                    idx
                                  )
                                }
                                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Answer</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="leading-relaxed">
                              {scorecard.goldStandardAnswer || scorecard.goldStandardCounter}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scorecard Action Buttons: Rewrite or Proceed to Next Question */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => handleRewriteAnswer(idx - 1)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Rewrite / Improve Answer</span>
                      </button>

                      {idx === messages.length - 1 && (
                        <button
                          onClick={handleNextQuestion}
                          disabled={isLoading}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          <span>Proceed to Next Question</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Interviewer is evaluating your defense response...</span>
            </div>
          )}
        </div>

        {/* Next Question / Rewrite Call-To-Action Banner (prominently displayed when latest turn was evaluated) */}
        {messages.length > 0 && messages[messages.length - 1]?.scorecard && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Evaluation Complete! Ready for the next challenge?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rewrite your previous response to boost your score, or proceed to the next technical question.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleRewriteAnswer(messages.length - 2)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rewrite Answer</span>
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Response Composer with Quick Role Starters */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
              Answer Starters (click to insert):
            </span>
            {getRoleAnswerStarters().map((starter, i) => (
              <button
                key={i}
                onClick={() => setInputAnswer((prev) => (prev ? `${prev} ${starter}` : starter))}
                disabled={isLoading}
                className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSendAnswer()
                }
              }}
              disabled={isLoading}
              rows={3}
              placeholder={`Defend your implementation in "${activeProjectTitle}" as a ${currentRoleMeta.title}... (e.g. explain the architecture, data flow, how you handled edge cases or trade-offs)`}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400">
                Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px]">Ctrl+Enter</kbd> to submit
              </span>

              <button
                onClick={() => handleSendAnswer()}
                disabled={!inputAnswer.trim() || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Submit Defense</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 2. INITIAL SETUP & CONFIGURATION COCKPIT ──
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Top Hero Cockpit Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent dark:from-amber-500/20 dark:via-slate-900/60 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                The Griller
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                Fresher & Role-Tailored Mode
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Live Gold-Standard Solutions
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Project Defense Arena
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Defend your actual implementation choices, schema architecture, and technical trade-offs. Tailored to test what interviewers actually ask for your target role and seniority level.
            </p>
          </div>

          <button
            onClick={handleStartSession}
            disabled={isLoading || (projectSource === "vault" && !selectedVaultProjectId)}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-xl shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] shrink-0"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Launch Defense Round</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: EXPERIENCE LEVEL SELECTOR (Fresher-Oriented) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span>Step 1: Choose Your Experience Level</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interviewers evaluate freshers on core fundamentals and debugging, while seniors are probed on distributed scale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = experienceLevel === level.id

            return (
              <button
                key={level.id}
                onClick={() => {
                  setExperienceLevel(level.id)
                  if (level.id === "fresher") setSelectedPersona("mentor")
                }}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                      level.id === "fresher"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {level.badge}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {level.years}
                  </span>
                </div>

                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {level.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {level.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── STEP 2: ROLE SELECTION ("Which role are you defending from?") ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span>Step 2: Which Role Are You Defending As?</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The AI interviewer will direct its questions specifically to the technical domain of your target role.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CANDIDATE_ROLES.map((role) => {
            const isSelected = selectedRole === role.id

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] group",
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20 scale-[1.02]"
                    : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]"
                )}
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {role.emoji}
                </div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {role.shortTitle}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1 mt-0.5">
                  {role.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected Role Probing Brief */}
        <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Focus Areas for {currentRoleMeta.title} ({currentLevelMeta.title}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {currentRoleMeta.fresherProbingFocus.map((focus, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium"
              >
                ✓ {focus}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 3: PROJECT SELECTOR (Vault vs Starter Projects) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-500" />
              <span>Step 3: Select Project to Defend</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Freshers can practice with popular starter projects or link their verified Project Vault.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setProjectSource("starter")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all",
                projectSource === "starter"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
              )}
            >
              Fresher Starter Projects
            </button>
            <button
              onClick={() => setProjectSource("vault")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all",
                projectSource === "vault"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
              )}
            >
              My Project Vault ({vaultProjects.length})
            </button>
          </div>
        </div>

        {/* Option A: Starter Projects (Ideal for Freshers) */}
        {projectSource === "starter" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FRESHER_STARTER_PROJECTS.map((starter) => {
              const isSelected = selectedStarterProjectId === starter.id
              const isRecommendedForRole = starter.roleRelevance.includes(selectedRole)

              return (
                <div
                  key={starter.id}
                  onClick={() => setSelectedStarterProjectId(starter.id)}
                  className={cn(
                    "p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group",
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {starter.category}
                      </span>
                      {isRecommendedForRole && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Recommended
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {starter.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {starter.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {starter.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Option B: Vault Projects */}
        {projectSource === "vault" && (
          <div>
            {vaultProjects.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-white/40 dark:bg-slate-900/30">
                <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No Projects Found in Project Vault
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your college projects or hackathons in the Projects section, or switch to the{" "}
                  <button
                    onClick={() => setProjectSource("starter")}
                    className="font-bold text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Fresher Starter Projects
                  </button>{" "}
                  tab to practice immediately.
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <span>Go to Project Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {vaultProjects.map((p) => {
                  const id = p.id || p._id
                  const isSelected = selectedVaultProjectId === id
                  const pName = p.name || p.title || "Untitled Vault Project"

                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedVaultProjectId(id)}
                      className={cn(
                        "p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group",
                        isSelected
                          ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                          : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Vault Project
                        </span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                      </div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        {pName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {p.description || "No description provided."}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {Array.isArray(p.techStack)
                          ? p.techStack.map((t: string, i: number) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                {t}
                              </span>
                            ))
                          : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 4: INTERVIEWER PERSONA SELECTOR ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            <span>Step 4: Select Interviewer Persona</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For Freshers, the Supportive Senior Mentor is highly recommended to build interview confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERSONAS.map((p) => {
            const isSelected = selectedPersona === p.id

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group",
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{p.avatar}</span>
                    {p.fresherRecommended && experienceLevel === "fresher" && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Fresher Pick
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                    {p.difficulty}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {p.tagline}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
