"use client"

import React, { useState } from "react"
import {
  Sparkles,
  Sun,
  Sunrise,
  Moon,
  Scale,
  Zap,
  Coffee,
  Flame,
  CalendarCheck,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { EnergyLevel, IntensityMode, GeneratePlannerRequest } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  onGenerate: (data: GeneratePlannerRequest) => Promise<void>
  isLoading: boolean
}

const PRESET_CHIPS = [
  "React Server Components + 2 LeetCode Graph questions + 3 Job applications",
  "System Design: Microservices cache + LeetCode DP + Outreach to 5 founders",
  "Mock interview questions drill + DSA Trees + Resume tailoring for Stripe",
  "Quick 3h sprint: 1 Frontend portfolio feature + review rejections",
]

export default function PlannerIntake({ onGenerate, isLoading }: Props) {
  const [rawInput, setRawInput] = useState("")
  const [availableHours, setAvailableHours] = useState(4)
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("morning_peak")
  const [intensity, setIntensity] = useState<IntensityMode>("balanced")
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncedData, setSyncedData] = useState<{
    interviews?: any[]
    reminders?: any[]
  } | null>(null)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const res = await fetch("/api/planner/sync-context")
      if (res.ok) {
        const data = await res.json()
        setSyncedData(data)
        const details: string[] = []
        if (data.interviews?.length) {
          details.push(`Interviews: ${data.interviews.map((i: any) => `${i.company} (${i.time || "Scheduled"})`).join(", ")}`)
        }
        if (data.reminders?.length) {
          details.push(`Reminders: ${data.reminders.map((r: any) => r.message).join(", ")}`)
        }
        if (details.length > 0) {
          setRawInput((prev) =>
            prev ? `${prev}\n\n[Synced Commitments]: ${details.join("; ")}` : `Today: ${details.join("; ")}`
          )
        }
      }
    } catch (err) {
      console.error("Failed to sync context:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate({
      rawInput,
      availableHours,
      energyLevel,
      intensity,
      syncedEvents: syncedData || undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900/90 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/90 p-5 md:p-7 shadow-sm dark:shadow-xl flex flex-col gap-6"
    >
      {/* ─── Goal Input ─── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            What do you need to study & accomplish today?
          </label>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Mention specific subjects, problem types, or roles
          </span>
        </div>
        <textarea
          className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl p-3.5 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
          placeholder="e.g. Free from 10am to 3pm. Need to master React Server Components, solve 2 graph questions on LeetCode, and apply to 3 jobs..."
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          disabled={isLoading}
        />

        {/* Suggested chips */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles size={12} className="text-indigo-500" /> Ideas:
          </span>
          {PRESET_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors"
              onClick={() => setRawInput(chip)}
              disabled={isLoading}
            >
              {chip.length > 42 ? chip.slice(0, 40) + "..." : chip}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3 Controls in Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Focus Hours */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Available Time</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
              {availableHours} hrs
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={availableHours}
            onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 mt-2"
            disabled={isLoading}
          />
          <span className="text-[11px] text-slate-400 mt-1">
            Total {Math.round(availableHours * 60)} minutes allocated
          </span>
        </div>

        {/* Energy Peak Curve */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Peak Energy Window</span>
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-lg p-1 gap-1">
            {[
              { id: "morning_peak", label: "Morning", icon: Sunrise },
              { id: "afternoon_peak", label: "Midday", icon: Sun },
              { id: "night_owl", label: "Evening", icon: Moon },
              { id: "balanced", label: "Even", icon: Scale },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex-1 py-1 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all",
                  energyLevel === item.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setEnergyLevel(item.id as any)}
              >
                <item.icon size={12} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Schedules hardest topic during this window
          </span>
        </div>

        {/* Pace & Intensity */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pace & Rhythm</span>
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-lg p-1 gap-1">
            {[
              { id: "light", label: "Light", icon: Coffee },
              { id: "balanced", label: "Balanced", icon: Zap },
              { id: "crunch", label: "Crunch", icon: Flame },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex-1 py-1 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all",
                  intensity === item.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setIntensity(item.id as any)}
              >
                <item.icon size={12} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Controls interval length & breaks
          </span>
        </div>
      </div>

      {/* ─── Sync Bar ─── */}
      <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarCheck size={16} className="text-indigo-500 shrink-0" />
          <span>
            {syncedData?.interviews?.length || syncedData?.reminders?.length
              ? `Connected: ${syncedData.interviews?.length || 0} interviews & ${syncedData.reminders?.length || 0} reminders synced into schedule.`
              : "Sync today's scheduled interviews & reminders from HireCompass into the schedule"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing || isLoading}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {syncedData ? "Re-sync" : "Sync HireCompass"}
        </button>
      </div>

      {/* ─── Submit Action ─── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || (!rawInput.trim() && !syncedData)}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Crafting 3 Strategic Blueprints...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate 3 AI Blueprint Choices
            </>
          )}
        </button>
      </div>
    </form>
  )
}
