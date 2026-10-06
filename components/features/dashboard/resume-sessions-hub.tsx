"use client"

import React from "react"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  X,
  Code2,
  Terminal,
  Flame,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Zap,
  Target,
  ListChecks,
  BrainCircuit,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ResumeSessionSnapshot } from "@/types/resume-session"

interface ResumeSessionsHubProps {
  sessions: ResumeSessionSnapshot[]
  onDismiss: (id: string) => void
  isLoaded: boolean
}

function timeAgo(dateInput: string | undefined): string {
  if (!dateInput) return "Recently"
  const diff = Date.now() - new Date(dateInput).getTime()
  if (diff < 60000) return "Just now"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function ResumeSessionsHub({
  sessions,
  onDismiss,
  isLoaded,
}: ResumeSessionsHubProps) {
  if (!isLoaded) return null

  // If no sessions are active, show a sleek, ultra-clean Jump-Start Bar
  if (sessions.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Resume & Fast Jump-In Hub
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick up active practice anytime. Start a new drill below:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/prep/problem-solving"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>DSA Roadmaps</span>
            </Link>

            <Link
              href="/assessment"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs shadow-indigo-500/20"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>AI Exam Sim</span>
            </Link>

            <Link
              href="/prep"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Project Defense</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs shadow-indigo-500/30">
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Resume Where You Left Off
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {sessions.length} In-Progress
            </span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:block">
          Click any card to continue directly from your exact state
        </div>
      </div>

      {/* ── Session Cards Grid ── */}
      <div
        className={cn(
          "grid gap-4",
          sessions.length === 1
            ? "grid-cols-1"
            : sessions.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {sessions.map((session) => {
          const isAssessment = session.toolType === "assessment"
          const isSheet = session.toolType === "sheet"
          const isPrep = session.toolType === "prep"

          // Theme variants
          const theme = isAssessment
            ? {
                border: "border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600",
                bg: "bg-gradient-to-br from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900",
                iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
                tagBg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 text-indigo-700 dark:text-indigo-300",
                barFill: "from-indigo-600 to-cyan-500",
                btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20",
                toolName: "AI Exam Simulator",
                icon: Terminal,
              }
            : isSheet
            ? {
                border: "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600",
                bg: "bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900",
                iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                tagBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-700 dark:text-emerald-300",
                barFill: "from-emerald-600 to-teal-500",
                btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
                toolName: "DSA Roadmap",
                icon: Code2,
              }
            : {
                border: "border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600",
                bg: "bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900",
                iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                tagBg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 text-amber-700 dark:text-amber-300",
                barFill: "from-amber-500 to-rose-500",
                btnBg: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/20",
                toolName: "Interview Intelligence",
                icon: Flame,
              }

          const IconComponent = theme.icon

          return (
            <div
              key={session.id}
              className={cn(
                "relative group overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between",
                theme.border,
                theme.bg
              )}
            >
              {/* Dismiss Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDismiss(session.id)
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-opacity z-10"
                title="Dismiss from resume list"
                aria-label="Dismiss session"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* ── Top Header ── */}
              <div>
                <div className="flex items-center gap-2.5 mb-3 pr-8">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-2xs",
                      theme.iconBg
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                        {theme.toolName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(session.lastActive)}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {session.title}
                    </h3>
                  </div>
                </div>

                {/* Subtitle / Current State */}
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-1 mb-3.5">
                  {session.subtitle}
                </p>

                {/* Progress Bar & Meter */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {session.progressLabel || session.badgeText}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold ml-2">
                      {session.progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                        theme.barFill
                      )}
                      style={{ width: `${Math.max(6, session.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Direct Action CTA ── */}
              <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between">
                <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full border", theme.tagBg)}>
                  {session.badgeText}
                </span>

                <Link
                  href={session.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs group-hover:scale-[1.02]",
                    theme.btnBg
                  )}
                >
                  <span>{session.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
