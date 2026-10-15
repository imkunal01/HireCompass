"use client"

import React, { useState } from "react"
import {
  Zap,
  Clock,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  Minus,
  Coffee,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react"
import { PlannerStrategyOption, PlannerTask } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  options: PlannerStrategyOption[]
  onSelectOption: (option: PlannerStrategyOption) => void
  onBack: () => void
  isActivating?: boolean
}

function formatMinutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 || 12
  const minStr = m < 10 ? `0${m}` : m
  return `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hours < 12) hours += 12
  if (ampm === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function recalculateTimeline(taskList: PlannerTask[]): PlannerTask[] {
  let pointer = 540
  if (taskList.length > 0 && taskList[0].startTime) {
    const p = parseTimeToMinutes(taskList[0].startTime)
    if (p !== null) pointer = p
  }

  return taskList.map((t) => {
    const dur = t.durationMinutes || 30
    const startStr = formatMinutesToTime(pointer)
    pointer += dur
    const endStr = formatMinutesToTime(pointer)
    return {
      ...t,
      startTime: startStr,
      endTime: endStr,
    }
  })
}

export default function PlannerStrategyCards({
  options,
  onSelectOption,
  onBack,
  isActivating,
}: Props) {
  // Currently chosen blueprint option for time window confirmation
  const [selectedOptId, setSelectedOptId] = useState<string>(options[0]?.id || "strat-1")
  // Editable tasks for the active option
  const [editableTasksMap, setEditableTasksMap] = useState<Record<string, PlannerTask[]>>(() => {
    const map: Record<string, PlannerTask[]> = {}
    options.forEach((opt) => {
      map[opt.id] = [...opt.tasks]
    })
    return map
  })

  const activeOption = options.find((o) => o.id === selectedOptId) || options[0]
  const activeTasks = editableTasksMap[selectedOptId] || activeOption.tasks

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

  // Tweak duration of a task in the active option
  const handleTweakDuration = (taskId: string, deltaMins: number) => {
    const current = editableTasksMap[selectedOptId] || activeOption.tasks
    const updated = current.map((t) => {
      if (t.id === taskId) {
        const nextDur = Math.max(10, (t.durationMinutes || 30) + deltaMins)
        return { ...t, durationMinutes: nextDur }
      }
      return t
    })
    const rippled = recalculateTimeline(updated)
    setEditableTasksMap((prev) => ({ ...prev, [selectedOptId]: rippled }))
  }

  const handleSetExactDuration = (taskId: string, mins: number) => {
    const current = editableTasksMap[selectedOptId] || activeOption.tasks
    const updated = current.map((t) => (t.id === taskId ? { ...t, durationMinutes: mins } : t))
    const rippled = recalculateTimeline(updated)
    setEditableTasksMap((prev) => ({ ...prev, [selectedOptId]: rippled }))
  }

  // Insert break between tasks
  const handleInsertBreakAt = (afterIndex: number, breakMins: number) => {
    const current = editableTasksMap[selectedOptId] || activeOption.tasks
    const newBreak: PlannerTask = {
      id: "confirm-break-" + Date.now(),
      title: "Held Break & Cognitive Recharge",
      category: "break",
      durationMinutes: breakMins,
      priority: "low",
      completed: false,
      description: "Step away from screen, hydrate, and stretch.",
    }
    const updated = [...current]
    updated.splice(afterIndex + 1, 0, newBreak)
    const rippled = recalculateTimeline(updated)
    setEditableTasksMap((prev) => ({ ...prev, [selectedOptId]: rippled }))
  }

  const handleRemoveTask = (taskId: string) => {
    const current = editableTasksMap[selectedOptId] || activeOption.tasks
    const updated = current.filter((t) => t.id !== taskId)
    const rippled = recalculateTimeline(updated)
    setEditableTasksMap((prev) => ({ ...prev, [selectedOptId]: rippled }))
  }

  const handleConfirmAndLaunch = () => {
    const finalOption: PlannerStrategyOption = {
      ...activeOption,
      tasks: activeTasks,
      totalFocusMinutes: activeTasks
        .filter((t) => t.category !== "break")
        .reduce((s, t) => s + (t.durationMinutes || 0), 0),
      totalBreakMinutes: activeTasks
        .filter((t) => t.category === "break")
        .reduce((s, t) => s + (t.durationMinutes || 0), 0),
    }
    onSelectOption(finalOption)
  }

  return (
    <div className="relative max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Ambient glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-indigo-500/15 via-teal-500/15 to-emerald-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* ─── Top Header & Pacing Switcher ─── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit">
              <Sparkles size={12} /> Step 2: Time Window Confirmation
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Confirm Your Schedule & Time Windows
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              AI extracted your tasks and cascaded time windows starting from right now. Review or tweak any duration before launching.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Edit Goals</span>
          </button>
        </div>

        {/* Pacing Style Switcher (Sleek Pills instead of bulky cards) */}
        {options.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cadence Variation:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {options.map((opt) => {
                const isSelected = selectedOptId === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptId(opt.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all shadow-xs",
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                    )}
                  >
                    {getIcon(opt.vibe)}
                    <span>{opt.strategyName}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({opt.tasks.length} tasks)
                    </span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Schedule Timeline Visualizer Ribbon ─── */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-500" />
              Schedule Span:
              <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">
                {activeTasks[0]?.startTime || "Now"} → {activeTasks[activeTasks.length - 1]?.endTime || ""}
              </strong>
            </span>
            <div className="flex items-center gap-3">
              <span>Focus: <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                {Math.floor(activeTasks.filter((t) => t.category !== "break").reduce((s, t) => s + (t.durationMinutes || 0), 0) / 60)}h{" "}
                {activeTasks.filter((t) => t.category !== "break").reduce((s, t) => s + (t.durationMinutes || 0), 0) % 60}m
              </strong></span>
              <span>•</span>
              <span>Breaks: <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                {activeTasks.filter((t) => t.category === "break").reduce((s, t) => s + (t.durationMinutes || 0), 0)}m
              </strong></span>
            </div>
          </div>

          {/* Timeline progress blocks */}
          <div className="w-full h-3 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {activeTasks.map((t, idx) => {
              const dur = t.durationMinutes || 30
              const isBreak = t.category === "break"
              return (
                <div
                  key={t.id || idx}
                  className={cn(
                    "h-full rounded-sm transition-all relative group",
                    isBreak
                      ? "bg-amber-400 dark:bg-amber-500"
                      : "bg-indigo-500 dark:bg-indigo-400"
                  )}
                  style={{ flexGrow: dur }}
                  title={`${t.title} (${dur}m)`}
                />
              )
            })}
          </div>
        </div>

        {/* ─── Task Confirmation Rows ─── */}
        <div className="flex flex-col gap-2.5 pt-1">
          {activeTasks.map((task, idx) => {
            const isBreak = task.category === "break"

            return (
              <React.Fragment key={task.id || idx}>
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border gap-4 transition-all hover:shadow-xs",
                    isBreak
                      ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40"
                      : "bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80"
                  )}
                >
                  {/* Left: Time badge & details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 font-mono text-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {task.startTime || "00:00"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        to {task.endTime || "00:00"}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isBreak ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                            isBreak
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          )}
                        >
                          {task.category.replace("_", " ")}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Clean Duration Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleTweakDuration(task.id, -15)}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        title="Reduce by 15 mins"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 min-w-[54px] text-center">
                        {task.durationMinutes >= 60
                          ? `${Math.floor(task.durationMinutes / 60)}h ${task.durationMinutes % 60 ? `${task.durationMinutes % 60}m` : ""}`.trim()
                          : `${task.durationMinutes}m`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleTweakDuration(task.id, 15)}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        title="Append 15 mins"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors text-xs"
                      title="Remove task"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Subtle break inserter */}
                {idx < activeTasks.length - 1 && (
                  <div className="flex items-center justify-center -my-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => handleInsertBreakAt(idx, 15)}
                      className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-semibold hover:border-amber-400 hover:text-amber-600 flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Coffee size={10} className="text-amber-500" />
                      <span>+ 15m Break Here</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* ─── Final Confirmation CTA Footer ─── */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Time windows are confirmed and will cascade sequentially.</span>
          </div>

          <button
            type="button"
            disabled={isActivating || activeTasks.length === 0}
            onClick={handleConfirmAndLaunch}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Confirm & Launch Cockpit</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
