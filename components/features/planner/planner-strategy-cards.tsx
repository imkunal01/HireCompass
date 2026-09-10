"use client"

import React from "react"
import {
  Zap,
  Clock,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { PlannerStrategyOption } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  options: PlannerStrategyOption[]
  onSelectOption: (option: PlannerStrategyOption) => void
  onBack: () => void
  isActivating?: boolean
}

export default function PlannerStrategyCards({
  options,
  onSelectOption,
  onBack,
  isActivating,
}: Props) {
  const getBadgeStyle = (vibe: string) => {
    switch (vibe) {
      case "deep_work":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
      case "balanced_flow":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
      case "momentum_velocity":
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    }
  }

  const getIcon = (vibe: string) => {
    switch (vibe) {
      case "deep_work":
        return <Zap size={13} />
      case "balanced_flow":
        return <Clock size={13} />
      case "momentum_velocity":
      default:
        return <Flame size={13} />
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500" />
            Choose Your Execution Blueprint
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            3 personalized schedules based on your exact goals. Select one to launch your live day cockpit.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw size={13} />
          Adjust Goals
        </button>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {options.map((opt) => (
          <div
            key={opt.id}
            className="bg-white dark:bg-slate-900/90 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/90 p-5 md:p-6 shadow-sm dark:shadow-xl flex flex-col gap-4 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all duration-200 group"
          >
            {/* Tag */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border w-fit",
                getBadgeStyle(opt.vibe)
              )}
            >
              {getIcon(opt.vibe)}
              <span>{opt.strategyName}</span>
            </div>

            {/* Title & Tagline */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {opt.strategyName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {opt.tagline}
              </p>
            </div>

            {/* Metrics Strip */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {Math.round((opt.totalFocusMinutes / 60) * 10) / 10}h
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breaks</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.totalBreakMinutes}m</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Load</span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    opt.cognitiveLoad === "High"
                      ? "text-rose-500"
                      : opt.cognitiveLoad === "Medium"
                      ? "text-amber-500"
                      : "text-emerald-500"
                  )}
                >
                  {opt.cognitiveLoad}
                </span>
              </div>
            </div>

            {/* Timeline Preview */}
            <div className="flex flex-col gap-2 flex-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Target Tasks ({opt.tasks.length})
              </span>
              {opt.tasks.slice(0, 5).map((task, idx) => (
                <div
                  key={task.id || idx}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs"
                >
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[190px]">
                    {task.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {task.startTime || `${task.durationMinutes}m`}
                  </span>
                </div>
              ))}
              {opt.tasks.length > 5 && (
                <span className="text-[11px] text-slate-400 text-center">
                  +{opt.tasks.length - 5} more steps
                </span>
              )}
            </div>

            {/* Why this works */}
            {opt.whyThisWorks && (
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 leading-relaxed">
                💡 <strong className="text-slate-700 dark:text-slate-200 font-semibold">Why this works:</strong> {opt.whyThisWorks}
              </div>
            )}

            {/* Activate Button */}
            <button
              type="button"
              disabled={isActivating}
              onClick={() => onSelectOption(opt)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 mt-auto transition-all"
            >
              <span>Activate Blueprint</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
