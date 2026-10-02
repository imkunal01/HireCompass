"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Target,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  HelpCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Flame,
  Clock,
  PlusCircle,
  Radar,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WarRoomDossier } from "@/types/prep"

interface WarRoomTabProps {
  initialCompany?: string
  initialRole?: string
  initialRoundType?: string
}

export function WarRoomTab({
  initialCompany = "",
  initialRole = "",
  initialRoundType = "Technical Phone Screen",
}: WarRoomTabProps) {
  const [company, setCompany] = useState(initialCompany)
  const [role, setRole] = useState(initialRole)
  const [roundType, setRoundType] = useState(initialRoundType)

  const [dossier, setDossier] = useState<WarRoomDossier | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>({})
  const [scheduledTopic, setScheduledTopic] = useState<string | null>(null)

  // Fetch upcoming interviews for quick-fill
  const { data: interviewsData } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await fetch("/api/interviews")
      if (!res.ok) return []
      return res.json()
    },
  })

  const upcomingInterviews = Array.isArray(interviewsData)
    ? interviewsData.filter((i: any) => i.status === "UPCOMING")
    : []

  const handleGenerate = async (forceRefresh = false) => {
    if (!company.trim()) {
      setError("Please enter a company name")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/prep/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          roundType,
          forceRefresh,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate tactical dossier")
      }

      setDossier(data.dossier)
      setCheckedTopics({})
    } catch (err: any) {
      setError(err.message || "Failed to generate dossier")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const toggleTopicCheck = (topic: string) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }))
  }

  const handleScheduleTopic = async (topicName: string) => {
    try {
      setScheduledTopic(topicName)
      await fetch("/api/planner/link-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Revise ${topicName} for ${company} Interview`,
          durationMinutes: 45,
          tag: "Interview Prep",
        }),
      })
      setTimeout(() => setScheduledTopic(null), 2500)
    } catch (e) {
      console.error(e)
      setScheduledTopic(null)
    }
  }

  const completedCount = Object.values(checkedTopics).filter(Boolean).length
  const totalTopics = dossier?.highYieldTopics?.length || 0
  const readinessPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0

  return (
    <div className="space-y-6">
      {/* ── Setup & Targeting Card ── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                Round Briefing & Dossier
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Company & Round Intelligence War Room
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate an interview battle plan with company culture insights, scoring criteria, and executive reverse questions.
            </p>
          </div>
        </div>

        {/* Quick selection chips for upcoming interviews */}
        {upcomingInterviews.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick-Fill from Scheduled Interviews:
            </span>
            <div className="flex flex-wrap gap-2">
              {upcomingInterviews.map((item: any, idx: number) => {
                const isSelected = company === item.company && role === item.role
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCompany(item.company)
                      setRole(item.role || "")
                      if (item.type) setRoundType(item.type)
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 group hover:scale-[1.02]",
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/30"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span>{item.company}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.type || item.role})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Company *
            </label>
            <input
              type="text"
              placeholder="e.g. Stripe, Meta, Uber, Snowflake"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Role (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Backend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Interview Round
            </label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Technical Phone Screen">Technical Phone Screen (DSA / Coding)</option>
              <option value="System Design Round">System Design Round (Architecture)</option>
              <option value="Behavioral / Leadership (STAR)">Behavioral / Leadership (STAR)</option>
              <option value="Take-Home Assignment Review">Take-Home Assignment Review</option>
              <option value="On-site / Final Round Loop">On-site / Final Round Loop</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-2.5 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {dossier && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
              <span>Regenerate Fresh Intel</span>
            </button>
          )}

          <button
            onClick={() => handleGenerate(false)}
            disabled={isGenerating || !company.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Synthesizing Dossier...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate War Room Dossier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Pulsing Scanner State during Generation ── */}
      {isGenerating && !dossier && (
        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-12 text-center space-y-4 backdrop-blur-sm animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Radar className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Synthesizing Tactical Briefing for {company}...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Scanning engineering culture, common round traps, grading criteria, and formulating high-signal reverse questions.
            </p>
          </div>
        </div>
      )}

      {/* ── Generated Tactical Dossier ── */}
      {dossier && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Company & Culture Profile Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent p-6 sm:p-7 space-y-3 shadow-md backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  {dossier.roundType}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {dossier.company} — Tactical Briefing
                </h3>
              </div>

              {dossier.suggestedSheetCategory && (
                <Link
                  href="/prep/problem-solving"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-emerald-500/10 hover:scale-[1.02] transition-all shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Practice {dossier.suggestedSheetCategory} Sheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {dossier.cultureNotes}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Round Expectations */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 space-y-4 backdrop-blur-xl shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>What Interviewers Are Evaluating</span>
              </div>
              <ul className="space-y-3">
                {dossier.roundExpectations.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* High-Yield Topics Checklist with Live Meter */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 space-y-4 backdrop-blur-xl shadow-sm">
              <div className="flex items-center justify-between text-slate-900 dark:text-white font-extrabold text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>High-Yield Revision Checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {completedCount} / {totalTopics} Reviewed
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {readinessPercent}%
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {dossier.highYieldTopics.map((topic, idx) => {
                  const isChecked = Boolean(checkedTopics[topic])
                  const isScheduled = scheduledTopic === topic
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200",
                        isChecked
                          ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTopicCheck(topic)}
                        className="flex items-center gap-3 text-left text-xs font-semibold flex-1"
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center transition-colors",
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={cn(isChecked && "line-through opacity-70")}>{topic}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScheduleTopic(topic)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors shrink-0"
                        title="Add 45m focused block to Day Planner"
                      >
                        {isScheduled ? (
                          <span className="text-emerald-500 font-bold">Scheduled ✓</span>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3" />
                            <span>Planner</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Dangerous Traps & Common Anti-Patterns */}
          {dossier.commonPitfalls && dossier.commonPitfalls.length > 0 && (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Dangerous Traps & Anti-Patterns to Avoid</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dossier.commonPitfalls.map((trap, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs">
                    <span className="font-bold text-rose-500 block mb-0.5">Trap #{idx + 1}</span>
                    {trap}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 Executive Reverse Interview Questions */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 space-y-4 backdrop-blur-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  Senior Turnabout
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  High-Signal Reverse Interview Questions
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                1-click to copy and ask at the end of the round.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dossier.reverseQuestions.map((q, idx) => {
                const isCopied = copiedIdx === idx
                return (
                  <div
                    key={idx}
                    className="relative group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                        Question #{idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        &quot;{q}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyQuestion(q, idx)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs",
                          isCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600"
                        )}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Question</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
