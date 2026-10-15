"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles,
  CalendarCheck,
  RefreshCw,
  Loader2,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { GeneratePlannerRequest } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  onGenerate: (data: GeneratePlannerRequest) => Promise<void>
  isLoading: boolean
  initialPrompt?: string
}

interface PresetOption {
  label: string
  prompt: string
  icon?: string
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    icon: "⚡",
    label: "2h DSA + 2h System Design + 30m Break",
    prompt: "Free for 4.5 hours. Make DSA 2 hours, System Design 2 hours, with a 30m break in between.",
  },
  {
    icon: "🚀",
    label: "3h Deep Coding + Review Rejections",
    prompt: "3 hours of deep coding sprint on React Server Components, followed by reviewing rejection feedback.",
  },
  {
    icon: "🎯",
    label: "DSA Trees + Mock Interview + Resume",
    prompt: "2 hours of LeetCode Tree problems, 1 hour of mock interview drill, and 30 mins tailoring resume for Stripe.",
  },
  {
    icon: "☕",
    label: "4h Study Rhythm (1h sprints + 15m breaks)",
    prompt: "4 hours available. Split into 1-hour focused sprints with 15-minute intervals in between.",
  },
]

export default function PlannerIntake({ onGenerate, isLoading, initialPrompt }: Props) {
  const [rawInput, setRawInput] = useState(initialPrompt || "")
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncedData, setSyncedData] = useState<{
    interviews?: any[]
    reminders?: any[]
  } | null>(null)
  const [currentTimeStr, setCurrentTimeStr] = useState("")

  // Real-time local clock display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const displayH = now.getHours() % 12 || 12
      const ampm = now.getHours() >= 12 ? "PM" : "AM"
      const minStr = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes()
      setCurrentTimeStr(`${displayH}:${minStr} ${ampm}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  // Keep prompt in sync if initialPrompt changes
  useEffect(() => {
    if (initialPrompt && !rawInput) {
      setRawInput(initialPrompt)
    }
  }, [initialPrompt, rawInput])

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const res = await fetch("/api/planner/sync-context")
      if (res.ok) {
        const data = await res.json()
        setSyncedData(data)
        const details: string[] = []
        if (data.interviews?.length) {
          details.push(
            `Interviews: ${data.interviews.map((i: any) => `${i.company} (${i.time || "Scheduled"})`).join(", ")}`
          )
        }
        if (data.followUps?.length) {
          details.push(`Follow-ups: ${data.followUps.map((f: any) => f.company).join(", ")}`)
        }
        if (data.dsaGoal) {
          details.push(`DSA: ${data.dsaGoal}`)
        }
        if (data.reminders?.length) {
          details.push(`Reminders: ${data.reminders.map((r: any) => r.message).join(", ")}`)
        }
        if (details.length > 0) {
          setRawInput((prev) =>
            prev
              ? `${prev}\n\n[Synced Commitments & Goals]: ${details.join("; ")}`
              : `Today's priorities: ${details.join("; ")}`
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
    if (!rawInput.trim() && !syncedData) return

    // Pass accurate real-world local time
    const now = new Date()
    const clientCurrentMinutes = now.getHours() * 60 + now.getMinutes()
    const displayH = now.getHours() % 12 || 12
    const ampm = now.getHours() >= 12 ? "PM" : "AM"
    const minStr = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes()
    const clientTimeStr = `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`

    onGenerate({
      rawInput,
      clientCurrentMinutes,
      clientTimeStr,
      syncedEvents: syncedData || undefined,
    })
  }

  return (
    <div className="relative max-w-3xl mx-auto w-full pt-1 pb-6">
      {/* Ambient background glow aura */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[34rem] h-52 bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-purple-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 md:p-8 flex flex-col gap-6 transition-all"
      >
        {/* ─── Header & Local Time Status ─── */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              What do you want to accomplish today?
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Type your schedule naturally. AI structures sessions, breaks, and accurate time slots.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <Clock size={12} className="text-indigo-500 shrink-0" />
            <span>Anchored {currentTimeStr ? `(${currentTimeStr})` : "Live"}</span>
          </div>
        </div>

        {/* ─── Prompt Input Box ─── */}
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <textarea
              className="w-full min-h-[145px] bg-slate-50/90 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-4 md:p-5 text-sm md:text-base leading-relaxed focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none shadow-xs"
              placeholder="e.g. Free for 4 hours. Want to make each subject session 2 hours (DSA & System Design) with a 30m break in between..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              disabled={isLoading}
            />

            {/* Bottom corner stats / clear */}
            <div className="absolute bottom-3 right-4 flex items-center gap-2 text-xs text-slate-400 pointer-events-auto">
              {rawInput && (
                <>
                  <span className="font-mono text-[11px] text-slate-400">
                    {rawInput.length} chars
                  </span>
                  <button
                    type="button"
                    onClick={() => setRawInput("")}
                    className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Clear input"
                  >
                    <XCircle size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─── Concise Inspiration Chips ─── */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Quick Presets & Ideas:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_OPTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-xl border transition-all text-left flex items-center gap-1.5 shadow-xs",
                    rawInput === item.prompt
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30"
                  )}
                  onClick={() => setRawInput(item.prompt)}
                  disabled={isLoading}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Sync HireCompass Context Dock ─── */}
        <div className="flex items-center justify-between p-3.5 md:p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/90 dark:border-indigo-900/50 rounded-2xl text-xs text-slate-700 dark:text-slate-300 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CalendarCheck size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                HireCompass Context Sync
                {syncedData && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 size={12} /> Synced
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {syncedData?.interviews?.length || syncedData?.reminders?.length
                  ? `Connected: ${syncedData.interviews?.length || 0} interviews & ${syncedData.reminders?.length || 0} reminders synced into schedule.`
                  : "Automatically sync today's scheduled interviews, follow-ups, and reminders"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            {isSyncing ? (
              <Loader2 size={13} className="animate-spin text-indigo-500" />
            ) : (
              <RefreshCw size={13} />
            )}
            <span>{syncedData ? "Re-sync" : "Sync Commitments"}</span>
          </button>
        </div>

        {/* ─── Submit Action Bar ─── */}
        <div className="flex justify-between items-center flex-wrap gap-4 pt-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Next: Preview & confirm your exact time windows before starting.
          </p>

          <button
            type="submit"
            disabled={isLoading || (!rawInput.trim() && !syncedData)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Crafting Your Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Create Tasks & Time Windows</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
