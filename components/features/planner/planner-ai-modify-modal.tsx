"use client"

import React, { useState } from "react"
import {
  X,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  ArrowRight,
  Clock,
  Coffee,
  ListTodo,
} from "lucide-react"
import { PlannerTask } from "@/types/planner"
import { cn } from "@/lib/utils"

interface Props {
  tasks: PlannerTask[]
  onClose: () => void
  onApplyModifiedTasks: (modifiedTasks: PlannerTask[]) => Promise<void>
  originalPrompt?: string
  initialInstruction?: string
}

const INSPIRATION_CHIPS = [
  "Make each subject session 2-2 hours and add a 30m break in between",
  "Add a 45m resume tailoring task at the end",
  "Split my coding block into 1h DSA + 1h System Design",
  "Shorten all breaks to 15m and start next task earlier",
  "I only have 2 hours left today, keep only the most critical tasks",
]

export default function PlannerAiModifyModal({
  tasks,
  onClose,
  onApplyModifiedTasks,
  originalPrompt,
  initialInstruction,
}: Props) {
  const [instruction, setInstruction] = useState(initialInstruction || "")
  const [isLoading, setIsLoading] = useState(false)
  const [modifiedPreview, setModifiedPreview] = useState<PlannerTask[] | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  React.useEffect(() => {
    if (initialInstruction) {
      setInstruction(initialInstruction)
    }
  }, [initialInstruction])

  const handleModify = async () => {
    if (!instruction.trim()) return

    try {
      setIsLoading(true)
      const now = new Date()
      const clientMinutes = now.getHours() * 60 + now.getMinutes()

      const res = await fetch("/api/planner/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction.trim(),
          tasks,
          originalPrompt,
          clientCurrentMinutes: clientMinutes,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.tasks && Array.isArray(data.tasks)) {
          setModifiedPreview(data.tasks)
          setExplanation(data.explanation || null)
        }
      } else {
        const err = await res.json()
        alert(err.error || "Failed to modify tasks with AI")
      }
    } catch (err) {
      console.error("Modify error:", err)
      alert("Error requesting AI task modifications")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmApply = async () => {
    if (!modifiedPreview) return
    try {
      setIsApplying(true)
      await onApplyModifiedTasks(modifiedPreview)
      onClose()
    } catch (err) {
      console.error("Apply error:", err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 md:p-7 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} /> AI Todo Copilot
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Modify Tasks with AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tell AI how you want to restructure your day plan, change durations, or insert breaks.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Original Active Goal Badge */}
        {originalPrompt && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider shrink-0">
              Active Goal:
            </span>
            <span className="italic truncate">&quot;{originalPrompt}&quot;</span>
          </div>
        )}

        {/* Input prompt */}
        {!modifiedPreview ? (
          <div className="flex flex-col gap-3">
            <textarea
              className="w-full min-h-[95px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              placeholder="e.g. Change DSA to 2 hours, make System Design 2 hours, and insert a 30 min break between them..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isLoading}
            />

            {/* Inspiration Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INSPIRATION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInstruction(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading || !instruction.trim()}
              onClick={handleModify}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  AI is restructuring your tasks...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Ask AI to Modify Tasks
                </>
              )}
            </button>
          </div>
        ) : (
          /* Preview of modified tasks */
          <div className="flex flex-col gap-4">
            {explanation && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>{explanation}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListTodo size={14} className="text-indigo-500" />
                Proposed Tasks Preview ({modifiedPreview.length} items):
              </span>

              <div className="flex flex-col gap-1.5 max-h-[42vh] overflow-y-auto pr-1">
                {modifiedPreview.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs gap-2",
                      t.category === "break"
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {t.category === "break" ? (
                        <Coffee size={13} className="text-amber-500 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      )}
                      <span className="font-semibold truncate">{t.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {t.startTime && t.endTime ? `${t.startTime} – ${t.endTime}` : `${t.durationMinutes}m`}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.durationMinutes}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-3">
              <button
                type="button"
                onClick={() => setModifiedPreview(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} />
                Tweak Prompt
              </button>

              <button
                type="button"
                disabled={isApplying}
                onClick={handleConfirmApply}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                {isApplying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Apply Changes to Todo
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
