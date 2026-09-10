"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  CalendarCheck,
  Flame,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react"

import {
  DayPlan,
  DayPlannerStats,
  PlannerStrategyOption,
  GeneratePlannerRequest,
} from "@/types/planner"
import PlannerIntake from "@/components/features/planner/planner-intake"
import PlannerStrategyCards from "@/components/features/planner/planner-strategy-cards"
import PlannerCockpit from "@/components/features/planner/planner-cockpit"

export default function PlannerPage() {
  const [activePlan, setActivePlan] = useState<DayPlan | null>(null)
  const [stats, setStats] = useState<DayPlannerStats | null>(null)
  const [strategyOptions, setStrategyOptions] = useState<PlannerStrategyOption[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentRequest, setCurrentRequest] = useState<GeneratePlannerRequest | null>(null)

  // Fetch today's plan on mount
  const fetchTodayPlan = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/planner/today")
      if (res.ok) {
        const data = await res.json()
        if (data.plan) {
          setActivePlan(data.plan)
        }
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.error("Failed to load today's plan:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayPlan()
  }, [fetchTodayPlan])

  // Handle generating the 3 strategies
  const handleGenerate = async (req: GeneratePlannerRequest) => {
    try {
      setIsGenerating(true)
      setCurrentRequest(req)
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.options && Array.isArray(data.options)) {
          setStrategyOptions(data.options)
        }
      } else {
        const err = await res.json()
        alert(err.error || "Failed to generate options.")
      }
    } catch (err) {
      console.error("Error generating options:", err)
      alert("Error generating day planner options. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle user selecting one of the 3 strategy cards
  const handleSelectStrategy = async (option: PlannerStrategyOption) => {
    try {
      setIsActivating(true)
      const todayStr = new Date().toISOString().split("T")[0]

      const newPlan: Partial<DayPlan> = {
        date: todayStr,
        rawInput: currentRequest?.rawInput || "",
        availableHours: currentRequest?.availableHours || 4,
        energyLevel: currentRequest?.energyLevel || "morning_peak",
        intensity: currentRequest?.intensity || "balanced",
        selectedStrategyId: option.id,
        strategyName: option.strategyName,
        strategyTagline: option.tagline,
        tasks: option.tasks,
        status: "active",
        focusMinutesLogged: 0,
      }

      const res = await fetch("/api/planner/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      })

      if (res.ok) {
        const data = await res.json()
        setActivePlan(data.plan)
        setStrategyOptions(null)
        if (stats) {
          setStats({
            ...stats,
            currentStreak: Math.max(1, stats.currentStreak),
          })
        }
      }
    } catch (err) {
      console.error("Failed to activate plan:", err)
    } finally {
      setIsActivating(false)
    }
  }

  // Handle update plan
  const handleUpdatePlan = async (updatedPlan: DayPlan) => {
    setActivePlan(updatedPlan)
    try {
      await fetch("/api/planner/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlan),
      })
    } catch (err) {
      console.error("Failed to sync plan update:", err)
    }
  }

  // Reset today's plan
  const handleResetPlan = async () => {
    try {
      await fetch("/api/planner/today", { method: "DELETE" })
      setActivePlan(null)
      setStrategyOptions(null)
    } catch (err) {
      console.error("Failed to reset plan:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Top Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit">
            <Sparkles size={12} /> AI Day Architect
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Day Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Tell AI your goals & available focus hours. Pick your blueprint strategy, then track tasks with built-in timers and smart reshuffling.
          </p>
        </div>

        {/* Stats Pills */}
        {stats && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-sm">
              <Flame size={14} />
              <span>{stats.currentStreak} Day Streak</span>
            </div>
            {stats.totalFocusHoursLogged > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm">
                <Clock size={13} className="text-indigo-500" />
                <span>{stats.totalFocusHoursLogged}h Focus Logged</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Main View ─── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 size={30} className="animate-spin text-indigo-500" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Loading your day plan...
          </span>
        </div>
      ) : activePlan ? (
        <PlannerCockpit
          plan={activePlan}
          onUpdatePlan={handleUpdatePlan}
          onResetPlan={handleResetPlan}
        />
      ) : strategyOptions ? (
        <PlannerStrategyCards
          options={strategyOptions}
          onSelectOption={handleSelectStrategy}
          onBack={() => setStrategyOptions(null)}
          isActivating={isActivating}
        />
      ) : (
        <PlannerIntake onGenerate={handleGenerate} isLoading={isGenerating} />
      )}
    </div>
  )
}
