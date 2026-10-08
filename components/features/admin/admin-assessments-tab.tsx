"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/toast"
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ChevronRight,
  ExternalLink,
  Code,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  Flame,
  Award,
  Sliders,
  ShieldCheck,
  Save,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AssessmentStats {
  totalSessions: number
  totalPassed: number
  totalFailed: number
  totalActive: number
  totalTokensUsed: number
  globalTokenLimit?: number
  defaultTimeLimitMinutes?: number
}

interface GlobalAssessmentSettings {
  globalTokenLimit: number
  defaultTimeLimitMinutes: number
  tokenAccountingMode?: "PROMPT_ONLY" | "COMBINED"
  updatedAt?: string
  updatedBy?: string
}

interface CandidateRow {
  id: string
  name: string
  email: string
  totalAttempts: number
  totalPassed: number
  totalFailed: number
  totalTokensUsed: number
  assessmentTokenLimit: number
  recentSessions: Array<{
    id: string
    problemId: string
    problemTitle: string
    difficulty: string
    status: string
    tokensUsed: number
    timeSpentSeconds: number
    timeLimitMinutes: number
    createdAt: string
  }>
}

export default function AdminAssessmentsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isEditingGlobalLimit, setIsEditingGlobalLimit] = useState(false)
  const [globalLimitInput, setGlobalLimitInput] = useState<string>("")

  // 1. Fetch Candidates List & Aggregated Stats
  const { data, isLoading, refetch } = useQuery<{
    stats?: AssessmentStats
    overview?: {
      totalAssessments?: number
      totalPassed?: number
      totalFailed?: number
      totalActive?: number
      totalTokensUsedAll?: number
      globalTokenLimit?: number
      defaultTimeLimitMinutes?: number
    }
    candidates?: CandidateRow[]
    globalSettings?: GlobalAssessmentSettings
  }>({
    queryKey: ["admin-assessments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/assessments")
      if (!res.ok) throw new Error("Failed to load assessments")
      return res.json()
    },
    refetchInterval: 30000,
  })

  // 2. Fetch User Detail Drilldown (when a user is selected)
  const { data: userDetail, isLoading: userDetailLoading } = useQuery<{
    user: { id: string; name: string; email: string; tokenLimit: number }
    summary: { totalAttempts: number; solvedCount: number; failedCount: number; totalTokensUsed: number; tokenLimit: number }
    sessions: any[]
  }>({
    queryKey: ["admin-user-assessments", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null
      const res = await fetch(`/api/admin/assessments?userId=${selectedUserId}`)
      if (!res.ok) throw new Error("Failed to load user assessment transcript")
      return res.json()
    },
    enabled: Boolean(selectedUserId),
  })

  const currentGlobalLimit =
    data?.globalSettings?.globalTokenLimit ??
    data?.overview?.globalTokenLimit ??
    data?.stats?.globalTokenLimit ??
    2000

  const currentTokenMode = data?.globalSettings?.tokenAccountingMode || "PROMPT_ONLY"

  // Keep input in sync with current server value when not actively editing
  useEffect(() => {
    if (!isEditingGlobalLimit) {
      setGlobalLimitInput(String(currentGlobalLimit))
    }
  }, [currentGlobalLimit, isEditingGlobalLimit])

  // Mutation to update global token limit
  const updateGlobalLimitMutation = useMutation({
    mutationFn: async (tokenLimit: number) => {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalTokenLimit: tokenLimit }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update global token limit")
      }
      return res.json()
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-assessments"] })
      queryClient.invalidateQueries({ queryKey: ["admin-assessment-settings"] })
      setIsEditingGlobalLimit(false)
      toast({
        type: "success",
        title: "Global Limit Saved",
        message: `Assessment token budget set to ${Number(res?.settings?.globalTokenLimit || globalLimitInput).toLocaleString()} tokens.`,
      })
    },
    onError: (err: any) => {
      toast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      })
    },
  })

  // Mutation to toggle token accounting mode (PROMPT_ONLY vs COMBINED)
  const updateTokenModeMutation = useMutation({
    mutationFn: async (mode: "PROMPT_ONLY" | "COMBINED") => {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAccountingMode: mode }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update accounting mode")
      }
      return res.json()
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-assessments"] })
      queryClient.invalidateQueries({ queryKey: ["admin-assessment-settings"] })
      const mode = res?.settings?.tokenAccountingMode
      toast({
        type: "success",
        title: "Token Accounting Mode Updated",
        message:
          mode === "PROMPT_ONLY"
            ? "Candidate Prompts Only enabled. Typing 'hi' now consumes exactly 1 token."
            : "Combined Mode enabled. Both prompts and AI replies are billed.",
      })
    },
    onError: (err: any) => {
      toast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      })
    },
  })

  const filteredCandidates = (data?.candidates || []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const activeSessionForModal = userDetail?.sessions?.find(
    (s) => s.id === selectedSessionId || s._id === selectedSessionId
  ) || (userDetail?.sessions && userDetail.sessions.length > 0 ? userDetail.sessions[0] : null)

  const formatTimer = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* ── Global Assessment Token Limit Control Center ── */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">
                  Global Assessment Token Budget
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {currentGlobalLimit.toLocaleString()} Tokens Default
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  currentTokenMode === "PROMPT_ONLY"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                )}>
                  {currentTokenMode === "PROMPT_ONLY" ? "Prompts Only (Capgemini)" : "Combined (In + Out)"}
                </span>
                {data?.globalSettings?.updatedAt && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Updated {new Date(data.globalSettings.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Baseline token allowance for all candidates starting an AI coding test. Individual user overrides in User Management take precedence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isEditingGlobalLimit ? (
              <button
                type="button"
                onClick={() => {
                  setGlobalLimitInput(String(currentGlobalLimit))
                  setIsEditingGlobalLimit(true)
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Configure Budget & Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingGlobalLimit(false)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Accounting Mode Toggle Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Token Accounting Mode:</span>
              <strong className={cn(
                "font-mono",
                currentTokenMode === "PROMPT_ONLY" ? "text-emerald-700" : "text-amber-700"
              )}>
                {currentTokenMode === "PROMPT_ONLY" ? "Candidate Prompts Only" : "Combined (Prompts + AI Replies)"}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentTokenMode === "PROMPT_ONLY"
                ? "Capgemini-aligned: only the candidate's typed words are charged against the budget. Typing 'hi' costs exactly 1 token."
                : "Both candidate prompts and visible AI assistant replies/code are charged against the budget."}
            </p>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => updateTokenModeMutation.mutate("PROMPT_ONLY")}
              disabled={updateTokenModeMutation.isPending || currentTokenMode === "PROMPT_ONLY"}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                currentTokenMode === "PROMPT_ONLY"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Candidate Prompts Only
            </button>
            <button
              type="button"
              onClick={() => updateTokenModeMutation.mutate("COMBINED")}
              disabled={updateTokenModeMutation.isPending || currentTokenMode === "COMBINED"}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                currentTokenMode === "COMBINED"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Combined (In + Out)
            </button>
          </div>
        </div>

        {/* Editing drawer / controls */}
        {isEditingGlobalLimit && (
          <div className="pt-3 border-t border-indigo-100/70 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Quick Presets:</span>
              {[1000, 1500, 2000, 3000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGlobalLimitInput(String(preset))}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer",
                    globalLimitInput === String(preset)
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                  )}
                >
                  {preset.toLocaleString()} tokens
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  min={500}
                  max={50000}
                  step={250}
                  value={globalLimitInput}
                  onChange={(e) => setGlobalLimitInput(e.target.value)}
                  placeholder="Enter token budget (e.g. 2000)..."
                  className="w-full h-10 pl-3.5 pr-14 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  tokens
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = parseInt(globalLimitInput, 10)
                  if (!isNaN(val) && val >= 500 && val <= 50000) {
                    updateGlobalLimitMutation.mutate(val)
                  } else {
                    toast({
                      type: "error",
                      title: "Invalid Input",
                      message: "Please enter a token limit between 500 and 50,000.",
                    })
                  }
                }}
                disabled={updateGlobalLimitMutation.isPending || !globalLimitInput}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updateGlobalLimitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Global Budget</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tests</span>
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{data?.stats?.totalSessions ?? 0}</div>
          <p className="text-[10px] text-slate-400">Total sessions initiated</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Problems Solved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{data?.stats?.totalPassed ?? 0}</div>
          <p className="text-[10px] text-slate-400">Successfully evaluated</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tests Failed</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600">{data?.stats?.totalFailed ?? 0}</div>
          <p className="text-[10px] text-slate-400">Exceeded time/token limit</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-indigo-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active In-Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{data?.stats?.totalActive ?? 0}</div>
          <p className="text-[10px] text-slate-400">Currently taking tests</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-amber-100 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tokens Consumed</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {(data?.stats?.totalTokensUsed ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400">Total evaluator inference</p>
        </div>
      </div>

      {/* ── Candidates Assessment Table ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Candidate Assessment Transcripts & Records</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {filteredCandidates.length} Candidates
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Inspect test completion rates, tokens used, and turn-by-turn prompts & AI replies per candidate.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-indigo-600")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Candidate</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Problems Solved</th>
                <th className="py-3 px-4">Token Consumption</th>
                <th className="py-3 px-4">Token Limit / Test</th>
                <th className="py-3 px-4">Recent Problems</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Loading candidate assessment records...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No candidates found with assessment activity.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {c.totalAttempts}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                          {c.totalPassed} Solved
                        </span>
                        {c.totalFailed > 0 && (
                          <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px]">
                            {c.totalFailed} Failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>{c.totalTokensUsed.toLocaleString()} tokens</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
                        {c.assessmentTokenLimit || 2000} tok
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.recentSessions.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[130px]",
                              s.status === "PASSED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : s.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            )}
                            title={s.problemTitle}
                          >
                            {s.problemTitle}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUserId(c.id)
                          setSelectedSessionId(null)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                      >
                        <span>Inspect Transcripts</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CANDIDATE DRILLDOWN & PROMPT INSPECTION MODAL ── */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{userDetail?.user?.name || "Candidate"}</span>
                    <span className="text-xs font-normal text-slate-400">({userDetail?.user?.email})</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Attempts: <strong>{userDetail?.summary?.totalAttempts ?? 0}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">Solved: {userDetail?.summary?.solvedCount ?? 0}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-semibold">Tokens: {(userDetail?.summary?.totalTokensUsed ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedUserId(null)
                  setSelectedSessionId(null)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {userDetailLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                  <span>Loading full candidate transcripts and interactions...</span>
                </div>
              ) : !userDetail?.sessions || userDetail.sessions.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  No assessment sessions recorded for this user yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Sessions List (Left Column) */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Assessment Sessions ({userDetail.sessions.length})
                    </h4>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {userDetail.sessions.map((s) => {
                        const isSelected =
                          (selectedSessionId && (s.id === selectedSessionId || s._id === selectedSessionId)) ||
                          (!selectedSessionId && s === activeSessionForModal)

                        return (
                          <div
                            key={s.id || s._id}
                            onClick={() => setSelectedSessionId(s.id || s._id)}
                            className={cn(
                              "p-3 rounded-2xl border text-left cursor-pointer transition-all",
                              isSelected
                                ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                                : "bg-white border-slate-200/80 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                  s.status === "PASSED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : s.status === "FAILED"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                )}
                              >
                                {s.status}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(s.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {s.problemTitle}
                            </h5>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatTimer(s.timeSpentSeconds)} / {s.timeLimitMinutes || 30}m
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 font-mono">
                                <Coins className="w-3 h-3 text-amber-500" />
                                {s.tokensUsed || 0} tok
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Transcript Viewer (Right Column) */}
                  <div className="lg:col-span-8 bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col">
                    {activeSessionForModal ? (
                      <div className="space-y-4">
                        {/* Session Banner */}
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Inspecting Session
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">
                              {activeSessionForModal.problemTitle}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                              Stage: {activeSessionForModal.stage}
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold",
                                activeSessionForModal.status === "PASSED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : activeSessionForModal.status === "FAILED"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-indigo-100 text-indigo-700"
                              )}
                            >
                              {activeSessionForModal.status}
                            </span>
                          </div>
                        </div>

                        {/* Turn-by-Turn Prompts & Evaluator Interactions */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {(!activeSessionForModal.conversationHistory ||
                            activeSessionForModal.conversationHistory.length === 0) ? (
                            <div className="py-12 text-center text-slate-400 text-xs">
                              No interaction prompt exchanges recorded yet for this session.
                            </div>
                          ) : (
                            activeSessionForModal.conversationHistory.map((turn: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs"
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="font-bold text-indigo-600 flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Turn #{turn.turn ?? idx + 1}</span>
                                    <span className="text-[10px] font-normal text-slate-400">
                                      ({turn.stage || "EVAL"})
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                      +{turn.tokensUsed || 0} tokens
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString() : ""}
                                    </span>
                                  </div>
                                </div>

                                {/* Candidate Prompt */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Candidate Prompt:
                                  </span>
                                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-800 font-medium">
                                    {turn.candidatePrompt || "(Initial assessment setup / problem load)"}
                                  </div>
                                </div>

                                {/* Code Snapshot if present */}
                                {turn.codeSnapshot && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                      <Code className="w-3 h-3" />
                                      Code Snapshot at this turn:
                                    </span>
                                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-36">
                                      <code>{turn.codeSnapshot}</code>
                                    </pre>
                                  </div>
                                )}

                                {/* Evaluator Response */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                    AI Evaluator Verdict ({turn.evaluatorVerdict || "REPLY"}):
                                  </span>
                                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-slate-800 whitespace-pre-line leading-relaxed">
                                    {turn.evaluatorReply}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-slate-400 text-xs">
                        Select an assessment session on the left to inspect its turn prompts and evaluator history.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => {
                  setSelectedUserId(null)
                  setSelectedSessionId(null)
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
