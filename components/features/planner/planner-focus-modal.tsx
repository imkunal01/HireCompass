"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Headphones,
  Edit3,
} from "lucide-react"
import { PlannerTask } from "@/types/planner"
import { audioSynthesizer } from "./audio-generator"
import { cn } from "@/lib/utils"

interface Props {
  task: PlannerTask
  onClose: () => void
  onCompleteTask: (taskId: string, notes?: string, minutesLogged?: number) => void
  onSaveNotes: (taskId: string, notes: string) => void
}

export default function PlannerFocusModal({
  task,
  onClose,
  onCompleteTask,
  onSaveNotes,
}: Props) {
  const initialSeconds = (task.durationMinutes || 25) * 60
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [notes, setNotes] = useState(task.notes || "")
  const [ambientSound, setAmbientSound] = useState<"off" | "brown" | "rain" | "drone">("off")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const minutesSpentRef = useRef(0)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            audioSynthesizer?.playCelebrationChime()
            return 0
          }
          minutesSpentRef.current += 1 / 60
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  useEffect(() => {
    return () => {
      audioSynthesizer?.stopAmbient()
    }
  }, [])

  const handleToggleSound = (mode: "off" | "brown" | "rain" | "drone") => {
    setAmbientSound(mode)
    if (mode === "off") {
      audioSynthesizer?.stopAmbient()
    } else {
      audioSynthesizer?.playAmbient(mode, 0.25)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(initialSeconds)
  }

  const handleFinish = () => {
    audioSynthesizer?.playCelebrationChime()
    audioSynthesizer?.stopAmbient()
    const loggedMins = Math.max(1, Math.round(minutesSpentRef.current || (initialSeconds - secondsLeft) / 60))
    onCompleteTask(task.id, notes, loggedMins)
    onClose()
  }

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`
  }

  const percentLeft = Math.round((secondsLeft / initialSeconds) * 100)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 md:p-8 flex flex-col items-center text-center gap-6 relative"
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

        {/* Task Header */}
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Deep Focus Mode
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 max-w-md">
            {task.title}
          </h2>
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        {/* Big Timer */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl md:text-6xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
            {formatTime(secondsLeft)}
          </div>
          <div className="w-56 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
              style={{ width: `${percentLeft}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Pause Focus
              </>
            ) : (
              <>
                <Play size={16} /> {secondsLeft === 0 ? "Restart" : "Start Focus"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Reset timer"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Ambient Sound Selector */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Headphones size={12} /> Ambient Focus Sound (Web Audio)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700/60">
            {[
              { id: "off", label: "Mute" },
              { id: "brown", label: "🌊 Brown Noise" },
              { id: "rain", label: "🌧️ Gentle Rain" },
              { id: "drone", label: "🧘 136Hz Drone" },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                  ambientSound === snd.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => handleToggleSound(snd.id as any)}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scratchpad */}
        <div className="w-full text-left flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Edit3 size={12} /> Notes & Takeaways
            </label>
            <span className="text-[10px] text-slate-400">Auto-saved</span>
          </div>
          <textarea
            className="w-full min-h-[70px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            placeholder="Jot down notes or code snippets..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              onSaveNotes(task.id, e.target.value)
            }}
          />
        </div>

        {/* Complete Task Button */}
        <div className="w-full flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="text-xs text-slate-400">
            Duration: {task.durationMinutes} mins
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 size={15} />
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  )
}
