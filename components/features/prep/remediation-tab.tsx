"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  BookOpen,
  Sparkles,
  Loader2,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Layers,
  HeartCrack,
  Activity,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RemediationDrill {
  id: string
  historicalTrap: string
  challengeTitle: string
  challengePrompt: string
  solutionKey: string
  recommendedSheetTopic: string
  recommendedCategory: string
}

export function RemediationTab() {
  const [drills, setDrills] = useState<RemediationDrill[]>([])
  const [recoveryTip, setRecoveryTip] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({})
  const [plannedDrills, setPlannedDrills] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // Fetch rejection stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["remediation-stats"],
    queryFn: async () => {
      const res = await fetch("/api/prep/remediation")
      if (!res.ok) return null
      return res.json()
    },
  })

  const vulnerabilities = statsData?.topVulnerabilities || []
  const totalRejections = statsData?.totalRejections || 0

  const handleGenerateDrills = async (category?: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/prep/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCategory: category }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate drills")
      }

      setDrills(data.drills || [])
      setRecoveryTip(data.confidenceRecoveryTip || "")
      setRevealedSolutions({})
    } catch (err: any) {
      setError(err.message || "Failed to generate remediation drills")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleSendToPlanner = async (drill: RemediationDrill) => {
    try {
      const res = await fetch("/api/planner/link-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Remediate Gap: ${drill.challengeTitle}`,
          topic: drill.recommendedSheetTopic,
          difficulty: "Hard",
          durationMinutes: 45,
        }),
      })

      if (res.ok) {
        setPlannedDrills((prev) => ({ ...prev, [drill.id]: true }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-7">
      {/* ── Diagnostic Radar Overview ── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                Diagnostic & Recovery Lab
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Rejection Remediation & Anti-Pattern Drills
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              Turn past drop-off points from your Opportunities into targeted recovery drills so you never stumble on the same interview trap twice.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {totalRejections} Historical Data Points
            </span>
          </div>
        </div>

        {/* Top Historical Vulnerabilities Radar */}
        {vulnerabilities.length > 0 && (
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Historical Vulnerability Radar:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vulnerabilities.map((v: any, idx: number) => {
                const percent = Math.min(100, Math.round((v.count / totalRejections) * 100))
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white">{v.category}</span>
                      <span className="font-mono text-rose-500 font-extrabold">{percent}% drop-off</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-400 block font-normal">
                      {v.count} opportunities flagged this area
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => handleGenerateDrills()}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-md hover:shadow-rose-500/25 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Diagnosing Anti-Patterns...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Synthesize Anti-Pattern Recovery Drills</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Generated Recovery Drills ── */}
      {drills.length > 0 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {recoveryTip && (
            <div className="p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent flex items-start gap-3 backdrop-blur-md shadow-xs">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  Staff Mentor Recovery Mindset:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed font-medium">
                  {recoveryTip}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {drills.map((drill, idx) => {
              const isRevealed = Boolean(revealedSolutions[drill.id])
              const isPlanned = Boolean(plannedDrills[drill.id])

              return (
                <div
                  key={drill.id || idx}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-xl shadow-sm space-y-4 hover:border-rose-500/40 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Trap #{idx + 1}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {drill.recommendedCategory} — {drill.recommendedSheetTopic}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {drill.challengeTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendToPlanner(drill)}
                        disabled={isPlanned}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs",
                          isPlanned
                            ? "bg-emerald-500 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                        title="Add 45m block to Day Planner"
                      >
                        {isPlanned ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Scheduled in Planner!</span>
                          </>
                        ) : (
                          <>
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Schedule in Planner (45m)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Historical Trap Alert */}
                  <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    <strong className="text-rose-600 dark:text-rose-400 font-bold block mb-0.5">
                      Why Candidates Fail This:
                    </strong>
                    {drill.historicalTrap}
                  </div>

                  {/* Challenge Prompt */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                    <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-1">
                      Remediation Drill Prompt:
                    </span>
                    {drill.challengePrompt}
                  </div>

                  {/* Collapsible Solution / Best Practice */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSolution(drill.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{isRevealed ? "Hide Staff Solution" : "Reveal Staff Solution & Framework"}</span>
                      {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isRevealed && (
                      <div className="mt-2.5 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium animate-in fade-in">
                        <strong className="text-emerald-700 dark:text-emerald-400 block mb-1 font-bold">
                          Staff Best Practice & Defense:
                        </strong>
                        {drill.solutionKey}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
