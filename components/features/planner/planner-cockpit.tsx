"use client"

import React, { useState } from "react"
import {
  Check,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Sparkles,
  Plus,
  Trash2,
  FileText,
} from "lucide-react"
import { DayPlan, PlannerTask, TaskCategory, ReshuffleRequest } from "@/types/planner"
import { audioSynthesizer } from "./audio-generator"
import PlannerFocusModal from "./planner-focus-modal"
import PlannerReshuffleModal from "./planner-reshuffle-modal"
import PlannerAiAssistModal from "./planner-ai-assist-modal"
import { cn } from "@/lib/utils"

interface Props {
  plan: DayPlan
  onUpdatePlan: (updatedPlan: DayPlan) => Promise<void>
  onResetPlan: () => Promise<void>
}

export default function PlannerCockpit({
  plan,
  onUpdatePlan,
  onResetPlan,
}: Props) {
  const [activeFocusTask, setActiveFocusTask] = useState<PlannerTask | null>(null)
  const [activeAssistTask, setActiveAssistTask] = useState<PlannerTask | null>(null)
  const [isReshuffleOpen, setIsReshuffleOpen] = useState(false)
  const [isReshuffling, setIsReshuffling] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDuration, setNewDuration] = useState(30)
  const [newCategory, setNewCategory] = useState<TaskCategory>("study")

  const tasks = plan.tasks || []
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllComplete = totalCount > 0 && completedCount === totalCount

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed
        if (nextCompleted) {
          audioSynthesizer?.playCelebrationChime()
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        }
      }
      return t
    })

    onUpdatePlan({
      ...plan,
      tasks: updatedTasks,
      status: updatedTasks.every((t) => t.completed) ? "completed" : "active",
    })
  }

  const handleCompleteFromFocus = (taskId: string, notes?: string, minutesLogged = 25) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: true,
          completedAt: new Date().toISOString(),
          notes: notes !== undefined ? notes : t.notes,
        }
      }
      return t
    })

    onUpdatePlan({
      ...plan,
      tasks: updatedTasks,
      focusMinutesLogged: (plan.focusMinutesLogged || 0) + minutesLogged,
      status: updatedTasks.every((t) => t.completed) ? "completed" : "active",
    })
  }

  const handleSaveNotes = (taskId: string, notes: string) => {
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, notes } : t))
    onUpdatePlan({ ...plan, tasks: updatedTasks })
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask: PlannerTask = {
      id: "task-" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      durationMinutes: Number(newDuration) || 30,
      priority: "medium",
      completed: false,
    }

    onUpdatePlan({
      ...plan,
      tasks: [...tasks, newTask],
    })

    setNewTitle("")
  }

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId)
    onUpdatePlan({ ...plan, tasks: updatedTasks })
  }

  const handleReshuffle = async (req: ReshuffleRequest) => {
    try {
      setIsReshuffling(true)
      const res = await fetch("/api/planner/reshuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.tasks) {
          await onUpdatePlan({
            ...plan,
            tasks: data.tasks,
          })
          setIsReshuffleOpen(false)
        }
      }
    } catch (err) {
      console.error("Reshuffle failed:", err)
    } finally {
      setIsReshuffling(false)
    }
  }

  const getCategoryTag = (cat: TaskCategory) => {
    switch (cat) {
      case "study":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
      case "coding":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "interview_prep":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      case "application":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      case "review":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20"
      case "break":
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Hero Cockpit Strip ─── */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/90 p-5 md:p-6 shadow-sm dark:shadow-xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Active Blueprint
            </span>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
              {plan.strategyName || "Today's Agenda"}
            </h2>
          </div>
          {plan.strategyTagline && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              {plan.strategyTagline}
            </p>
          )}
        </div>

        {/* Progress & Actions */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {completedCount} / {totalCount} Done
              </span>
              <div className="w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReshuffleOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Rebalance remaining tasks"
            >
              <RotateCw size={13} className="text-amber-500" />
              <span>Reshuffle</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Start fresh with a new plan for today?")) {
                  onResetPlan()
                }
              }}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ─── 100% Celebration Banner ─── */}
      {isAllComplete && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                All Commitments Completed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You logged {plan.focusMinutesLogged || totalCount * 30} minutes of focused deep work today. Great consistency!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetPlan}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Sparkles size={13} /> Plan Extra Goals
          </button>
        </div>
      )}

      {/* ─── Tasks Timeline Agenda ─── */}
      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "bg-white dark:bg-slate-900/90 rounded-xl md:rounded-2xl border border-slate-200/80 dark:border-slate-800/90 p-4 shadow-sm flex items-center justify-between gap-4 transition-all duration-150",
              task.completed && "opacity-60 bg-slate-50 dark:bg-slate-900/40"
            )}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggleTask(task.id)}
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center text-white transition-all shrink-0",
                  task.completed
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800"
                )}
                aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
              >
                {task.completed && <Check size={13} strokeWidth={3} />}
              </button>

              {/* Time slot */}
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                {task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : `${task.durationMinutes}m`}
              </span>

              {/* Content */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm font-bold text-slate-900 dark:text-slate-100", task.completed && "line-through text-slate-400")}>
                    {task.title}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", getCategoryTag(task.category))}>
                    {task.category.replace("_", " ")}
                  </span>
                  {task.notes && (
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                      <FileText size={11} /> notes
                    </span>
                  )}
                </div>
                {task.description && <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!task.completed && (
                <button
                  type="button"
                  onClick={() => setActiveFocusTask(task)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1 transition-all"
                >
                  <Play size={11} /> Focus
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveAssistTask(task)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="AI Concept Drill & Questions"
              >
                <Sparkles size={11} className="text-indigo-500" />
                <span>Ask AI</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                title="Remove task"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Add Quick Task Bar ─── */}
      <form
        onSubmit={handleAddTask}
        className="bg-white dark:bg-slate-900/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-2.5 px-4 flex items-center gap-3 flex-wrap"
      >
        <Plus size={15} className="text-indigo-500 shrink-0" />
        <input
          type="text"
          placeholder="Add extra topic or spontaneous sprint..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 min-w-[200px] bg-transparent text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
        />

        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1 outline-none"
        >
          <option value="study">Study</option>
          <option value="coding">Coding</option>
          <option value="interview_prep">Interview Prep</option>
          <option value="application">Application</option>
          <option value="break">Break</option>
          <option value="review">Review</option>
        </select>

        <select
          value={newDuration}
          onChange={(e) => setNewDuration(Number(e.target.value))}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1 outline-none"
        >
          <option value={15}>15m</option>
          <option value={30}>30m</option>
          <option value={45}>45m</option>
          <option value={60}>60m</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          Add Step
        </button>
      </form>

      {/* ─── Modals ─── */}
      {activeFocusTask && (
        <PlannerFocusModal
          task={activeFocusTask}
          onClose={() => setActiveFocusTask(null)}
          onCompleteTask={handleCompleteFromFocus}
          onSaveNotes={handleSaveNotes}
        />
      )}

      {activeAssistTask && (
        <PlannerAiAssistModal
          task={activeAssistTask}
          onClose={() => setActiveAssistTask(null)}
        />
      )}

      {isReshuffleOpen && (
        <PlannerReshuffleModal
          tasks={tasks}
          onClose={() => setIsReshuffleOpen(false)}
          onReshuffle={handleReshuffle}
          isLoading={isReshuffling}
        />
      )}
    </div>
  )
}
