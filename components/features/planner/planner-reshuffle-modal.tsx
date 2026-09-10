"use client"

import React, { useState } from "react"
import {
  X,
  RotateCw,
  Clock,
  BatteryCharging,
  Scissors,
  Sparkles,
  Loader2,
} from "lucide-react"
import { ReshuffleRequest, PlannerTask } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  tasks: PlannerTask[]
  onClose: () => void
  onReshuffle: (req: ReshuffleRequest) => Promise<void>
  isLoading: boolean
}

export default function PlannerReshuffleModal({
  tasks,
  onClose,
  onReshuffle,
  isLoading,
}: Props) {
  const [reason, setReason] = useState<ReshuffleRequest["reason"]>("running_late_30")
  const [customPrompt, setCustomPrompt] = useState("")

  const completedCount = tasks.filter((t) => t.completed).length
  const remainingCount = tasks.length - completedCount

  const handleApply = async () => {
    await onReshuffle({
      reason,
      customPrompt: reason === "custom" ? customPrompt : undefined,
      tasks,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 md:p-8 flex flex-col gap-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center flex flex-col gap-1 items-center">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Adaptive Rebalancing
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Life Happens. Let's Adapt.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your {completedCount} completed tasks stay intact. The remaining {remainingCount} tasks will be
            recalculated intelligently by AI.
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {[
            {
              id: "running_late_30",
              title: "Running 30 mins behind",
              desc: "Shift start/end times and adjust intervals",
              icon: Clock,
              iconColor: "text-amber-500",
            },
            {
              id: "running_late_60",
              title: "Running 1 hour behind",
              desc: "Reschedule times and compress non-essential tasks",
              icon: RotateCw,
              iconColor: "text-rose-500",
            },
            {
              id: "fatigued_light",
              title: "Feeling drained / low energy",
              desc: "Lighten cognitive load and add breathing room",
              icon: BatteryCharging,
              iconColor: "text-cyan-500",
            },
            {
              id: "cut_short_2h",
              title: "Only have 1.5 – 2 hours left",
              desc: "Focus on the highest leverage tasks, defer rest",
              icon: Scissors,
              iconColor: "text-indigo-500",
            },
            {
              id: "custom",
              title: "Custom adjustment",
              desc: "Specify what changed in your own words",
              icon: Sparkles,
              iconColor: "text-violet-500",
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "p-3 rounded-xl border text-left flex items-start gap-3 transition-all",
                reason === item.id
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
              )}
              onClick={() => setReason(item.id as any)}
            >
              <item.icon size={18} className={cn("mt-0.5 shrink-0", item.iconColor)} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {reason === "custom" && (
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Call ran late by 45m, only need to study graphs..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Rebalancing day...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Rebalance & Update Day Plan
            </>
          )}
        </button>
      </div>
    </div>
  )
}
