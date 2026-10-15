"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
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
  Coffee,
  Lock,
  Unlock,
  Minus,
  Sliders,
  Timer,
  ChevronDown,
  PauseCircle,
  CalendarCheck,
  BookOpen,
  MoreHorizontal,
} from "lucide-react"
import { DayPlan, PlannerTask, TaskCategory, ReshuffleRequest } from "@/types/planner"
import { audioSynthesizer } from "./audio-generator"
import PlannerFocusModal from "./planner-focus-modal"
import PlannerReshuffleModal from "./planner-reshuffle-modal"
import PlannerAiAssistModal from "./planner-ai-assist-modal"
import PlannerAiModifyModal from "./planner-ai-modify-modal"
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

function formatMinutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 || 12
  const minStr = m < 10 ? `0${m}` : m
  return `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`
}

/**
 * Sequentially recalculates startTime and endTime for all tasks,
 * ensuring continuous and gapless scheduling while respecting locked tasks.
 */
function recalculateTimeline(taskList: PlannerTask[], forcedStartMinutes?: number): PlannerTask[] {
  if (!taskList || taskList.length === 0) return []

  // Determine starting anchor minutes
  let currentPointerMinutes = forcedStartMinutes ?? 540 // default 9:00 AM

  if (forcedStartMinutes === undefined) {
    const firstUncompleted = taskList.find((t) => !t.completed && t.startTime)
    if (firstUncompleted?.startTime) {
      const parsed = parseTimeToMinutes(firstUncompleted.startTime)
      if (parsed !== null) currentPointerMinutes = parsed
    } else {
      const firstWithTime = taskList.find((t) => t.startTime)
      if (firstWithTime?.startTime) {
        const parsed = parseTimeToMinutes(firstWithTime.startTime)
        if (parsed !== null) currentPointerMinutes = parsed
      }
    }
  }

  return taskList.map((task) => {
    if (task.completed) return task

    // If task is locked with existing start & end, maintain its slot and advance pointer to its end
    if (task.isLocked && task.startTime && task.endTime) {
      const parsedEnd = parseTimeToMinutes(task.endTime)
      if (parsedEnd !== null && parsedEnd > currentPointerMinutes) {
        currentPointerMinutes = parsedEnd
      }
      return task
    }

    const duration = task.durationMinutes || 30
    const startStr = formatMinutesToTime(currentPointerMinutes)
    currentPointerMinutes += duration
    const endStr = formatMinutesToTime(currentPointerMinutes)

    return {
      ...task,
      startTime: startStr,
      endTime: endStr,
    }
  })
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
  const [isAiModifyOpen, setIsAiModifyOpen] = useState(false)
  const [aiModifyInstruction, setAiModifyInstruction] = useState<string>("")

  const handleApplyModifiedTasks = async (modifiedTasks: PlannerTask[]) => {
    await onUpdatePlan({
      ...plan,
      tasks: modifiedTasks,
    })
  }

  // Quick add task inputs
  const [newTitle, setNewTitle] = useState("")
  const [newDuration, setNewDuration] = useState(60)
  const [newCategory, setNewCategory] = useState<TaskCategory>("study")

  // Interactive duration editor popover state
  const [editingDurationTaskId, setEditingDurationTaskId] = useState<string | null>(null)
  const [customDurationInput, setCustomDurationInput] = useState<number>(60)

  // Task row action menu state
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".task-menu-container")) {
        setOpenMenuTaskId(null)
      }
    }
    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [])

  // Live real-world clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Inline active timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0)
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const tasks = useMemo(() => plan.tasks || [], [plan.tasks])
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllComplete = totalCount > 0 && completedCount === totalCount

  // Computed summary metrics
  const totalFocusMins = useMemo(
    () => tasks.filter((t) => t.category !== "break" && !t.isHeld).reduce((s, t) => s + (t.durationMinutes || 0), 0),
    [tasks]
  )
  const totalBreakMins = useMemo(
    () => tasks.filter((t) => t.category === "break" && !t.isHeld).reduce((s, t) => s + (t.durationMinutes || 0), 0),
    [tasks]
  )
  const totalDayScheduleSpan = useMemo(() => {
    const firstTask = tasks[0]
    const lastTask = tasks[tasks.length - 1]
    if (firstTask?.startTime && lastTask?.endTime) {
      return `${firstTask.startTime} – ${lastTask.endTime}`
    }
    return `${((totalFocusMins + totalBreakMins) / 60).toFixed(1)}h total`
  }, [tasks, totalFocusMins, totalBreakMins])

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
    if (t.completed || t.isHeld) return false
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

  // ─── Freedom of Selecting Duration ───
  const handleSelectDuration = (taskId: string, newMins: number) => {
    const targetMins = Math.max(5, newMins)
    const modified = tasks.map((t) => (t.id === taskId ? { ...t, durationMinutes: targetMins } : t))
    const rippled = recalculateTimeline(modified)

    if (activeTimerTaskId === taskId) {
      setTimerSecondsLeft(targetMins * 60)
      setInitialTimerSeconds(targetMins * 60)
    }

    onUpdatePlan({ ...plan, tasks: rippled })
    setEditingDurationTaskId(null)
  }

  // ─── Freedom of Appending Time ───
  const handleAppendTaskDuration = (taskId: string, minutes: number) => {
    const modified = tasks.map((t) => {
      if (t.id === taskId) {
        const nextMins = (t.durationMinutes || 30) + minutes
        return { ...t, durationMinutes: nextMins }
      }
      return t
    })
    const rippled = recalculateTimeline(modified)

    if (activeTimerTaskId === taskId) {
      setTimerSecondsLeft((prev) => prev + minutes * 60)
      setInitialTimerSeconds((prev) => prev + minutes * 60)
    }

    onUpdatePlan({ ...plan, tasks: rippled })
  }

  // ─── Freedom of Reducing Time ───
  const handleReduceTaskDuration = (taskId: string, minutes: number) => {
    const modified = tasks.map((t) => {
      if (t.id === taskId) {
        const currentMins = t.durationMinutes || 30
        const nextMins = Math.max(10, currentMins - minutes)
        return { ...t, durationMinutes: nextMins }
      }
      return t
    })
    const rippled = recalculateTimeline(modified)

    if (activeTimerTaskId === taskId) {
      setTimerSecondsLeft((prev) => Math.max(30, prev - minutes * 60))
    }

    onUpdatePlan({ ...plan, tasks: rippled })
  }

  // ─── Freedom of Holding Time: Lock Slot ───
  const handleToggleLock = (taskId: string) => {
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, isLocked: !t.isLocked } : t))
    onUpdatePlan({ ...plan, tasks: updatedTasks })
  }

  // ─── Freedom of Holding Time: Put on Hold / Pause ───
  const handleToggleHold = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextHeld = !t.isHeld
        if (nextHeld && activeTimerTaskId === taskId) {
          setIsTimerRunning(false)
          setActiveTimerTaskId(null)
        }
        return { ...t, isHeld: nextHeld }
      }
      return t
    })
    onUpdatePlan({ ...plan, tasks: updatedTasks })
  }

  // ─── Freedom of Holding Time: Insert Break In-Between Sessions ───
  const handleInsertBreakAt = (afterIndex: number, breakMinutes: number) => {
    const newBreakTask: PlannerTask = {
      id: "break-" + Date.now(),
      title: "Held Break & Cognitive Recharge",
      category: "break",
      durationMinutes: breakMinutes,
      priority: "low",
      completed: false,
      description: "Step away from screen, drink water, and let concepts consolidate.",
    }

    const updated = [...tasks]
    updated.splice(afterIndex + 1, 0, newBreakTask)
    const rippled = recalculateTimeline(updated)

    onUpdatePlan({ ...plan, tasks: rippled })
  }

  // ─── Append Extra Available Time to the Whole Day ───
  const handleAppendDayTime = (minutes: number) => {
    const newAvailableHours = (plan.availableHours || 4) + minutes / 60
    const updatedTasks = [...tasks]

    // Either append to last task or add an extra focus buffer block
    const bufferTask: PlannerTask = {
      id: "task-buffer-" + Date.now(),
      title: "Consolidation & Practice Buffer",
      category: "review",
      durationMinutes: minutes,
      priority: "medium",
      completed: false,
      description: "Appended focus window for extra practice and reflection.",
    }
    updatedTasks.push(bufferTask)
    const rippled = recalculateTimeline(updatedTasks)

    onUpdatePlan({
      ...plan,
      availableHours: Math.round(newAvailableHours * 10) / 10,
      tasks: rippled,
    })
  }

  // ─── Re-align Schedule Starting From Now ───
  const handleRealignFromNow = () => {
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const rippled = recalculateTimeline(tasks, nowMins)
    onUpdatePlan({ ...plan, tasks: rippled })
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask: PlannerTask = {
      id: "task-" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      durationMinutes: Number(newDuration) || 60,
      priority: "medium",
      completed: false,
    }

    const updated = [...tasks, newTask]
    const rippled = recalculateTimeline(updated)

    onUpdatePlan({
      ...plan,
      tasks: rippled,
    })

    setNewTitle("")
  }

  const handleDeleteTask = (taskId: string) => {
    if (activeTimerTaskId === taskId) {
      setIsTimerRunning(false)
      setActiveTimerTaskId(null)
    }
    const updatedTasks = tasks.filter((t) => t.id !== taskId)
    const rippled = recalculateTimeline(updatedTasks)
    onUpdatePlan({ ...plan, tasks: rippled })
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
            lastReshufflePrompt: req.customPrompt || plan.lastReshufflePrompt,
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
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold"
    }
  }

  const formattedClock = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="relative max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Ambient background glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-purple-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* ─── Unified Hero Command Cockpit ─── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 md:p-6 flex flex-col gap-4">
        {/* Top Tier: Title, Real-Time Clock, Progress & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Active Agenda
              </span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">
                {plan.strategyName || "Today's Agenda"}
              </h2>
            </div>
            {plan.strategyTagline && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {plan.strategyTagline}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Clock with Pulsing Dot */}
            <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formattedClock}</span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <div className="w-20 md:w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {completedCount}/{totalCount} ({progressPercent}%)
              </span>
            </div>

            {/* Actions: Ask AI, Reshuffle, Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiModifyInstruction("")
                  setIsAiModifyOpen(true)
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                title="Ask AI to modify tasks, adjust durations, or update your todo"
              >
                <Sparkles size={13} />
                <span>Ask AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReshuffleOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
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
                title="Reset plan"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Metrics & Quick Utilities */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <span className="flex items-center gap-1.5">
              <Timer size={13} className="text-indigo-500" />
              Focus:
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                {Math.floor(totalFocusMins / 60)}h {totalFocusMins % 60}m
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Coffee size={13} className="text-amber-500" />
              Breaks:
              <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                {totalBreakMins}m
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CalendarCheck size={13} className="text-emerald-500" />
              Span:
              <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">
                {totalDayScheduleSpan}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleAppendDayTime(30)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={11} className="text-indigo-500" /> +30m Focus
            </button>

            <button
              type="button"
              onClick={() => handleInsertBreakAt(tasks.length - 1, 15)}
              className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 flex items-center gap-1 transition-colors"
            >
              <Coffee size={11} /> +15m Break
            </button>

            <button
              type="button"
              onClick={handleRealignFromNow}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Re-cascade all times sequentially starting right now"
            >
              <RotateCw size={11} className="text-indigo-500" /> Realign from Now
            </button>
          </div>
        </div>
      </div>

      {/* ─── Prominent Active Task Window Card ─── */}
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
                    <Hourglass size={18} className="text-indigo-500" />
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

      {/* ─── Task Timeline Agenda (Clean Linear-Style Rows) ─── */}
      <div className="flex flex-col gap-2.5">
        {tasks.map((task, idx) => {
          const windowInfo = getWindowInfo(task)
          const isTimerActiveForTask = activeTimerTaskId === task.id
          const isTaskInActiveWindow = windowInfo.isCurrentWindow && !task.completed && !task.isHeld
          const isBreak = task.category === "break"
          const isMenuOpen = openMenuTaskId === task.id

          return (
            <React.Fragment key={task.id}>
              {/* Task Row Card */}
              <div
                className={cn(
                  "bg-white dark:bg-slate-900/90 rounded-2xl border p-3.5 md:p-4 shadow-xs flex items-center justify-between gap-4 transition-all relative",
                  isTaskInActiveWindow || isTimerActiveForTask
                    ? "border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30"
                    : isBreak
                    ? "border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
                    : "border-slate-200/90 dark:border-slate-800",
                  task.completed && "opacity-50 bg-slate-50 dark:bg-slate-900/40",
                  task.isHeld && "border-dashed border-amber-400/70"
                )}
              >
                {/* Left: Checkbox + Time Slot + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center text-white transition-all shrink-0",
                      task.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : isBreak
                        ? "border-amber-300 dark:border-amber-700 hover:border-amber-500 bg-amber-50 dark:bg-slate-800"
                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800"
                    )}
                    aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
                  >
                    {task.completed && <Check size={13} strokeWidth={3} />}
                  </button>

                  {/* Time Window Pill */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      {task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : `${task.durationMinutes}m`}
                    </span>
                    {isTaskInActiveWindow && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Window" />
                    )}
                    {task.isLocked && (
                      <span title="Locked Slot"><Lock size={11} className="text-purple-500" /></span>
                    )}
                    {task.isHeld && (
                      <span title="On Hold"><PauseCircle size={11} className="text-amber-500" /></span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold text-slate-900 dark:text-slate-100 truncate",
                          task.completed && "line-through text-slate-400"
                        )}
                      >
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                          getCategoryTag(task.category)
                        )}
                      >
                        {task.category.replace("_", " ")}
                      </span>
                      {task.notes && (
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                          <FileText size={11} /> notes
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Clean 3-Action Group (Duration Pill + Timer + Ask AI + Menu) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Clickable Duration Chip */}
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => {
                        if (editingDurationTaskId === task.id) {
                          setEditingDurationTaskId(null)
                        } else {
                          setEditingDurationTaskId(task.id)
                          setCustomDurationInput(task.durationMinutes || 60)
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition-all flex items-center gap-1",
                        editingDurationTaskId === task.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      )}
                      title="Adjust duration"
                    >
                      <Timer size={11} className="text-indigo-500" />
                      <span>{task.durationMinutes >= 60 ? `${(task.durationMinutes / 60).toFixed(1)}h` : `${task.durationMinutes}m`}</span>
                      <ChevronDown size={10} />
                    </button>
                  )}

                  {/* Play / Pause Timer */}
                  {!task.completed && !task.isHeld && (
                    <button
                      type="button"
                      onClick={() => handleStartTaskTimer(task)}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                        isTimerActiveForTask && isTimerRunning
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-indigo-600"
                      )}
                      title={isTimerActiveForTask && isTimerRunning ? "Pause timer" : "Start timer"}
                    >
                      {isTimerActiveForTask && isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                  )}

                  {/* Ask AI to modify task */}
                  <button
                    type="button"
                    onClick={() => {
                      setAiModifyInstruction(`Modify or adjust task "${task.title}": `)
                      setIsAiModifyOpen(true)
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Ask AI to modify or adjust this task"
                  >
                    <Sparkles size={11} className="text-indigo-500" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </button>

                  {/* More Menu Dropdown Toggle */}
                  <div className="relative task-menu-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuTaskId(isMenuOpen ? null : task.id)
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors"
                      title="More options"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* Dropdown Popover */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-10 z-30 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFocusModalTask(task)
                              setOpenMenuTaskId(null)
                            }}
                            className="w-full px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-2 text-left transition-colors"
                          >
                            <Maximize2 size={13} className="text-indigo-500" />
                            <span>Zen Focus Mode</span>
                          </button>
                        )}

                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleLock(task.id)
                              setOpenMenuTaskId(null)
                            }}
                            className="w-full px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-2 text-left transition-colors"
                          >
                            {task.isLocked ? (
                              <>
                                <Unlock size={13} className="text-purple-500" />
                                <span>Unlock Time Slot</span>
                              </>
                            ) : (
                              <>
                                <Lock size={13} className="text-purple-500" />
                                <span>Lock Time Slot</span>
                              </>
                            )}
                          </button>
                        )}

                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleHold(task.id)
                              setOpenMenuTaskId(null)
                            }}
                            className="w-full px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-2 text-left transition-colors"
                          >
                            <PauseCircle size={13} className="text-amber-500" />
                            <span>{task.isHeld ? "Resume Task" : "Put on Hold"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveAssistTask(task)
                            setOpenMenuTaskId(null)
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-2 text-left transition-colors"
                        >
                          <BookOpen size={13} className="text-blue-500" />
                          <span>Interview Drill</span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteTask(task.id)
                            setOpenMenuTaskId(null)
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 text-left transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Delete Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Duration Selector Popover */}
                {editingDurationTaskId === task.id && (
                  <div className="absolute right-0 top-14 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl flex flex-col gap-2 w-64 animate-in fade-in duration-100">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Sliders size={12} className="text-indigo-500" /> Select Duration:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[15, 30, 45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            handleSelectDuration(task.id, mins)
                            setEditingDurationTaskId(null)
                          }}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors",
                            task.durationMinutes === mins
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* In-Between Subtle Break Inserter */}
              {idx < tasks.length - 1 && (
                <div className="flex items-center justify-center -my-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleInsertBreakAt(idx, 15)}
                    className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-600 hover:border-amber-300 text-[10px] font-medium flex items-center gap-1 transition-all shadow-xs"
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

      {/* ─── Add Quick Task Bar ─── */}
      <form
        onSubmit={handleAddTask}
        className="bg-white dark:bg-slate-900/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3 px-4 flex items-center gap-3 flex-wrap shadow-sm"
      >
        <Plus size={15} className="text-indigo-500 shrink-0" />
        <input
          type="text"
          placeholder="Add extra topic or spontaneous sprint (e.g. System Design Cache, 2 LeetCode)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 min-w-[200px] bg-transparent text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
        />

        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1 outline-none font-medium"
        >
          <option value="study">Study</option>
          <option value="coding">Coding</option>
          <option value="interview_prep">Interview Prep</option>
          <option value="application">Application</option>
          <option value="break">Held Break</option>
          <option value="review">Review</option>
        </select>

        <select
          value={newDuration}
          onChange={(e) => setNewDuration(Number(e.target.value))}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1 outline-none font-mono"
        >
          <option value={15}>15m</option>
          <option value={30}>30m</option>
          <option value={45}>45m</option>
          <option value={60}>1 hour (60m)</option>
          <option value={90}>1.5 hours (90m)</option>
          <option value={120}>2 hours (120m)</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-xs"
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
          originalPrompt={plan.rawInput}
          lastReshufflePrompt={plan.lastReshufflePrompt}
        />
      )}

      {isAiModifyOpen && (
        <PlannerAiModifyModal
          tasks={tasks}
          onClose={() => setIsAiModifyOpen(false)}
          onApplyModifiedTasks={handleApplyModifiedTasks}
          originalPrompt={plan.rawInput}
          initialInstruction={aiModifyInstruction}
        />
      )}
    </div>
  )
}
