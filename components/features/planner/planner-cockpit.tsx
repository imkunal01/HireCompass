"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Check,
  Clock,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Hourglass,
  Maximize2,
  PlusCircle,
  AlertCircle,
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

function parseTimeToToday(timeStr?: string): Date | null {
  if (!timeStr) return null
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hours < 12) hours += 12
  if (ampm === "AM" && hours === 12) hours = 0
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`
}

export default function PlannerCockpit({
  plan,
  onUpdatePlan,
  onResetPlan,
}: Props) {
  const [activeFocusModalTask, setActiveFocusModalTask] = useState<PlannerTask | null>(null)
  const [activeAssistTask, setActiveAssistTask] = useState<PlannerTask | null>(null)
  const [isReshuffleOpen, setIsReshuffleOpen] = useState(false)
  const [isReshuffling, setIsReshuffling] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDuration, setNewDuration] = useState(30)
  const [newCategory, setNewCategory] = useState<TaskCategory>("study")

  // Live real-world clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Inline active timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0)
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const tasks = plan.tasks || []
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllComplete = totalCount > 0 && completedCount === totalCount

  // Clock tick every 1s
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(clockInterval)
  }, [])

  // Timer countdown tick
  useEffect(() => {
    if (isTimerRunning && activeTimerTaskId) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!)
            setIsTimerRunning(false)
            audioSynthesizer?.playWindowAlert()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isTimerRunning, activeTimerTaskId])

  // Helper to check window status for each task
  const getWindowInfo = (task: PlannerTask) => {
    const start = parseTimeToToday(task.startTime)
    const end = parseTimeToToday(task.endTime)

    if (start && end) {
      const nowMs = currentTime.getTime()
      const startMs = start.getTime()
      const endMs = end.getTime()
      const isCurrentWindow = nowMs >= startMs && nowMs <= endMs
      const isPastWindow = nowMs > endMs
      const isUpcoming = nowMs < startMs
      const remainingSecondsInWindow = Math.max(0, Math.floor((endMs - nowMs) / 1000))
      const totalWindowSeconds = Math.max(60, Math.floor((endMs - startMs) / 1000))
      const elapsedPercent = Math.min(
        100,
        Math.max(0, Math.round(((nowMs - startMs) / (endMs - startMs)) * 100))
      )

      return {
        hasWindow: true,
        isCurrentWindow,
        isPastWindow,
        isUpcoming,
        remainingSecondsInWindow,
        totalWindowSeconds,
        elapsedPercent,
      }
    }

    return {
      hasWindow: false,
      isCurrentWindow: false,
      isPastWindow: false,
      isUpcoming: false,
      remainingSecondsInWindow: (task.durationMinutes || 30) * 60,
      totalWindowSeconds: (task.durationMinutes || 30) * 60,
      elapsedPercent: 0,
    }
  }

  // Find currently active task based on schedule
  const activeWindowTask = tasks.find((t) => {
    if (t.completed) return false
    const info = getWindowInfo(t)
    return info.isCurrentWindow
  })

  // Start or switch inline timer for a task
  const handleStartTaskTimer = (task: PlannerTask) => {
    if (activeTimerTaskId === task.id) {
      setIsTimerRunning(!isTimerRunning)
      return
    }

    // New task timer selected
    const info = getWindowInfo(task)
    let secondsToRun = (task.durationMinutes || 30) * 60
    if (info.isCurrentWindow && info.remainingSecondsInWindow > 0) {
      secondsToRun = info.remainingSecondsInWindow
    }

    setActiveTimerTaskId(task.id)
    setTimerSecondsLeft(secondsToRun)
    setInitialTimerSeconds(secondsToRun)
    setIsTimerRunning(true)
  }

  const handleAddMinutesToTimer = (minutes: number) => {
    setTimerSecondsLeft((prev) => prev + minutes * 60)
    setInitialTimerSeconds((prev) => prev + minutes * 60)
  }

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed
        if (nextCompleted) {
          audioSynthesizer?.playCelebrationChime()
          // Stop timer if this task was actively running
          if (activeTimerTaskId === taskId) {
            setIsTimerRunning(false)
            setActiveTimerTaskId(null)
          }
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

    if (activeTimerTaskId === taskId) {
      setIsTimerRunning(false)
      setActiveTimerTaskId(null)
    }

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
    if (activeTimerTaskId === taskId) {
      setIsTimerRunning(false)
      setActiveTimerTaskId(null)
    }
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

  const formattedClock = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="flex flex-col gap-5">
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

        {/* Progress, Clock & Actions */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300">
            <Clock size={13} className="text-indigo-500" />
            <span>{formattedClock}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {completedCount} / {totalCount} Done
              </span>
              <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
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

      {/* ─── Prominent Active Task Window Card (if in window or timer running) ─── */}
      {(activeTimerTaskId || activeWindowTask) && (
        (() => {
          const displayedTask = activeTimerTaskId
            ? tasks.find((t) => t.id === activeTimerTaskId)
            : activeWindowTask

          if (!displayedTask || displayedTask.completed) return null

          const isManualTimer = activeTimerTaskId === displayedTask.id
          const windowInfo = getWindowInfo(displayedTask)
          const secondsToDisplay = isManualTimer
            ? timerSecondsLeft
            : windowInfo.remainingSecondsInWindow

          const progressVal = isManualTimer
            ? initialTimerSeconds > 0
              ? Math.min(100, Math.max(0, Math.round(((initialTimerSeconds - timerSecondsLeft) / initialTimerSeconds) * 100)))
              : 0
            : windowInfo.elapsedPercent

          return (
            <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/5 border border-indigo-500/30 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {isManualTimer ? "Focus Timer Running" : "Scheduled Time Window Active"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({displayedTask.startTime} – {displayedTask.endTime || `${displayedTask.durationMinutes}m`})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddMinutesToTimer(5)}
                    className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMinutesToTimer(15)}
                    className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFocusModalTask(displayedTask)}
                    className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                    title="Open Fullscreen Zen Focus Mode"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>

              {/* Task Title & Large Countdown */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex flex-col">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {displayedTask.title}
                  </h3>
                  {displayedTask.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {displayedTask.description}
                    </p>
                  )}
                </div>

                {/* Big Live Digital Timer */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-indigo-500/40 shadow-sm">
                    <Hourglass size={18} className="text-indigo-500 animate-spin-slow" />
                    <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                      {formatDuration(secondsToDisplay)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans uppercase font-bold ml-1">
                      left
                    </span>
                  </div>

                  {/* Play / Pause */}
                  <button
                    type="button"
                    onClick={() => handleStartTaskTimer(displayedTask)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 transition-all"
                    title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                  >
                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  {/* Mark Complete */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(displayedTask.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Check size={14} strokeWidth={3} /> Complete
                  </button>
                </div>
              </div>

              {/* Progress Bar of Time Window */}
              <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${progressVal}%` }}
                />
              </div>
            </div>
          )
        })()
      )}

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
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const windowInfo = getWindowInfo(task)
          const isTimerActiveForTask = activeTimerTaskId === task.id
          const isTaskInActiveWindow = windowInfo.isCurrentWindow && !task.completed

          return (
            <div
              key={task.id}
              className={cn(
                "bg-white dark:bg-slate-900/90 rounded-2xl border p-4 shadow-sm flex flex-col gap-3 transition-all duration-150",
                isTaskInActiveWindow || isTimerActiveForTask
                  ? "border-indigo-500/60 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                  : "border-slate-200/80 dark:border-slate-800/90",
                task.completed && "opacity-55 bg-slate-50 dark:bg-slate-900/40"
              )}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
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

                  {/* Time slot badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                      {task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : `${task.durationMinutes}m`}
                    </span>
                    {isTaskInActiveWindow && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Window Active
                      </span>
                    )}
                  </div>

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

                {/* Actions & Timer Widget */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Inline Timer Widget */}
                  {!task.completed && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/70">
                      <Clock size={12} className={cn("text-slate-400", isTimerActiveForTask && isTimerRunning && "text-indigo-500 animate-pulse")} />
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[42px] text-center">
                        {isTimerActiveForTask
                          ? formatDuration(timerSecondsLeft)
                          : isTaskInActiveWindow
                          ? formatDuration(windowInfo.remainingSecondsInWindow)
                          : `${task.durationMinutes || 30}:00`}
                      </span>

                      {/* Play/Pause Button */}
                      <button
                        type="button"
                        onClick={() => handleStartTaskTimer(task)}
                        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={isTimerActiveForTask && isTimerRunning ? "Pause timer" : "Start timer for this task"}
                      >
                        {isTimerActiveForTask && isTimerRunning ? (
                          <Pause size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                      </button>

                      {isTimerActiveForTask && (
                        <button
                          type="button"
                          onClick={() => handleAddMinutesToTimer(5)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1"
                          title="Add 5 minutes"
                        >
                          +5m
                        </button>
                      )}
                    </div>
                  )}

                  {/* Focus Modal Button */}
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => setActiveFocusModalTask(task)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open Focus Zen Mode"
                    >
                      <Maximize2 size={12} />
                      <span className="hidden sm:inline">Zen</span>
                    </button>
                  )}

                  {/* Ask AI */}
                  <button
                    type="button"
                    onClick={() => setActiveAssistTask(task)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="AI Concept Drill & Questions"
                  >
                    <Sparkles size={11} className="text-indigo-500" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </button>

                  {/* Delete */}
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

              {/* Progress bar for time window if active or running */}
              {(isTaskInActiveWindow || isTimerActiveForTask) && (
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                    style={{
                      width: `${
                        isTimerActiveForTask && initialTimerSeconds > 0
                          ? Math.min(100, Math.max(0, Math.round(((initialTimerSeconds - timerSecondsLeft) / initialTimerSeconds) * 100)))
                          : windowInfo.elapsedPercent
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Add Quick Task Bar ─── */}
      <form
        onSubmit={handleAddTask}
        className="bg-white dark:bg-slate-900/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3 px-4 flex items-center gap-3 flex-wrap shadow-sm"
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
      {activeFocusModalTask && (
        <PlannerFocusModal
          task={activeFocusModalTask}
          onClose={() => setActiveFocusModalTask(null)}
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
