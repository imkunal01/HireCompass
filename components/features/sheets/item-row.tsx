"use client"

import React, { useState } from "react"
import {
  Check,
  Bookmark,
  ExternalLink,
  FileText,
  Youtube,
  StickyNote,
  CalendarPlus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  Code2,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MergedSheetItem, Difficulty, ItemStatus, Platform } from "@/types/sheet"
import { useSheetStore } from "@/hooks/useSheetStore"

const DIFFICULTY_STYLES: Record<Difficulty, { badge: string; text: string; dot: string }> = {
  Easy: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Hard: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  "N/A": {
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
}

const PLATFORM_STYLES: Record<Platform, { label: string; badge: string; dot: string }> = {
  LeetCode: {
    label: "LeetCode",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
    dot: "bg-orange-500",
  },
  GFG: {
    label: "GeeksforGeeks",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-600",
  },
  CodeChef: {
    label: "CodeChef",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-600",
  },
  Codeforces: {
    label: "Codeforces",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    dot: "bg-blue-600",
  },
  HackerRank: {
    label: "HackerRank",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    dot: "bg-teal-600",
  },
  InterviewBit: {
    label: "InterviewBit",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    dot: "bg-indigo-600",
  },
  Other: {
    label: "Platform",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
}

const QUICK_NOTE_TEMPLATES = [
  "Time: O(N) | Space: O(1)",
  "Two-Pointer approach",
  "Edge Case: Empty Array / 0 values",
  "Off-by-one boundary pitfall",
  "Use Hash Map for O(1) lookup",
  "Requires Monotonic Stack",
]

interface ItemRowProps {
  item: MergedSheetItem
  index?: number
  showTopicBadge?: boolean
  isTargeted?: boolean
}

export function ItemRow({ item, index, showTopicBadge = false, isTargeted = false }: ItemRowProps) {
  const { setStatus, setItemNotes } = useSheetStore()
  const [showNotes, setShowNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(item.notes || "")
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isAddingToPlanner, setIsAddingToPlanner] = useState(false)
  const [addedToPlanner, setAddedToPlanner] = useState(false)

  const isDone = item.status === "done"
  const isRevisit = item.status === "revisit"
  const diffStyle = DIFFICULTY_STYLES[item.difficulty] || DIFFICULTY_STYLES["N/A"]
  const platformStyle = PLATFORM_STYLES[item.platform] || PLATFORM_STYLES.Other

  const toggleDone = () => {
    setStatus(item._id, isDone ? "todo" : "done")
  }

  const toggleRevisit = () => {
    setStatus(item._id, isRevisit ? "todo" : "revisit")
  }

  const handleSaveNotes = async () => {
    setIsSavingNote(true)
    await setItemNotes(item._id, notesDraft)
    setIsSavingNote(false)
  }

  const handleAddTemplateText = (snippet: string) => {
    const current = notesDraft.trim()
    if (current) {
      setNotesDraft(`${current}\n• ${snippet}`)
    } else {
      setNotesDraft(`• ${snippet}`)
    }
  }

  const handleAddToPlanner = async () => {
    setIsAddingToPlanner(true)
    try {
      const res = await fetch("/api/planner/link-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          problemLink: item.problemLink,
          topic: item.topic,
          difficulty: item.difficulty,
          platform: item.platform,
          durationMinutes: 45,
        }),
      })
      if (res.ok) {
        setAddedToPlanner(true)
        setTimeout(() => setAddedToPlanner(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAddingToPlanner(false)
    }
  }

  return (
    <div
      id={`problem-${item._id}`}
      className={cn(
        "group relative flex flex-col transition-all duration-200 border-b border-slate-100/90 dark:border-slate-800/80 last:border-b-0",
        isDone
          ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]"
          : "bg-white/40 hover:bg-white/80 dark:bg-slate-900/30 dark:hover:bg-slate-900/60",
        isTargeted && "ring-2 ring-emerald-500 bg-emerald-500/10 animate-pulse"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3">
        {/* ── Left Column: Checkbox, Flag, Title, Platform & Tags ── */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Index Counter (Optional) */}
          {typeof index === "number" && (
            <span className="hidden md:inline-block w-6 text-[11px] font-mono font-medium text-slate-400 select-none">
              #{index + 1}
            </span>
          )}

          {/* Interactive Status Checkbox */}
          <button
            onClick={toggleDone}
            className={cn(
              "relative w-5 h-5 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 shadow-2xs group-hover:scale-105",
              isDone
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-emerald-500/25"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500"
            )}
            aria-label={isDone ? "Mark as uncompleted" : "Mark as completed"}
            title={isDone ? "Completed! Click to mark incomplete" : "Click to mark completed"}
          >
            {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5] animate-in zoom-in-75 duration-150" />}
          </button>

          {/* Star / Revisit Flag */}
          <button
            onClick={toggleRevisit}
            className={cn(
              "p-1 rounded-lg transition-all duration-150 shrink-0",
              isRevisit
                ? "text-amber-500 bg-amber-500/15 scale-110 shadow-2xs shadow-amber-500/20"
                : "text-slate-300 hover:text-amber-500 hover:bg-amber-500/10 dark:text-slate-600"
            )}
            title={isRevisit ? "Flagged for revision (Click to unflag)" : "Flag for revision"}
          >
            <Bookmark className={cn("w-3.5 h-3.5 transition-transform", isRevisit && "fill-current")} />
          </button>

          {/* Topic Tag (Shown in Flat Table Mode) */}
          {showTopicBadge && item.topic && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shrink-0">
              {item.topic}
            </span>
          )}

          {/* Title & Platform Tag */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              {item.problemLink ? (
                <a
                  href={item.problemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-xs sm:text-sm font-semibold tracking-tight transition-colors inline-flex items-center gap-1.5 group/link max-w-full truncate",
                    isDone
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                  title={`Open problem on ${item.platform || "external site"}`}
                >
                  <span className="truncate">{item.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-30 group-hover/link:opacity-100 transition-opacity shrink-0 text-emerald-600" />
                </a>
              ) : (
                <span
                  className={cn(
                    "text-xs sm:text-sm font-semibold tracking-tight truncate",
                    isDone
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-800 dark:text-slate-200"
                  )}
                >
                  {item.title}
                </span>
              )}

              {/* Platform Chip */}
              {item.platform && item.platform !== "Other" && (
                <span
                  className={cn(
                    "hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0",
                    platformStyle.badge
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", platformStyle.dot)} />
                  {item.platform}
                </span>
              )}
            </div>

            {/* Tags Cloud */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-medium border border-slate-200/50 dark:border-slate-700/50"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-[9px] text-slate-400 font-mono">
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Difficulty, Solution Links, Day Planner, Notes Toggle ── */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
          {/* Difficulty Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0",
              diffStyle.badge
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", diffStyle.dot)} />
            {item.difficulty}
          </span>

          {/* Resource Action Dock */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Article / Solution */}
            {item.articleLink ? (
              <a
                href={item.articleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20"
                title="View Solution Article / Editorial"
              >
                <FileText className="w-3.5 h-3.5" />
              </a>
            ) : null}

            {/* Video Solution */}
            {item.youtubeLink ? (
              <a
                href={item.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                title="Watch Video Explanation on YouTube"
              >
                <Youtube className="w-3.5 h-3.5 text-rose-500" />
              </a>
            ) : null}

            {/* Schedule into Day Planner */}
            <button
              onClick={handleAddToPlanner}
              disabled={isAddingToPlanner}
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200 border",
                addedToPlanner
                  ? "text-emerald-600 bg-emerald-500/15 border-emerald-500/30 scale-105"
                  : "text-slate-400 hover:text-teal-600 hover:bg-teal-500/10 border-transparent hover:border-teal-500/20"
              )}
              title={addedToPlanner ? "Added to Today's Planner!" : "Schedule in Day Planner (45-min practice block)"}
            >
              {addedToPlanner ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-75" />
              ) : (
                <CalendarPlus className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Notes Toggle with Indicator Dot */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200 border",
                item.notes
                  ? "text-indigo-600 bg-indigo-500/15 border-indigo-500/30 shadow-2xs shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent"
              )}
              title={item.notes ? "Edit personal notes" : "Add personal notes / key takeaway"}
            >
              <StickyNote className="w-3.5 h-3.5" />
              {item.notes && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide-Down Smart Scratchpad Panel ── */}
      {showNotes && (
        <div className="px-4 pb-3.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950 p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-indigo-500" />
                Personal Technical Notes & Gotchas
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Auto-synced with user account
              </span>
            </div>

            {/* Quick-Insert Tags Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Insert:</span>
              {QUICK_NOTE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleAddTemplateText(tmpl)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
                >
                  +{tmpl}
                </button>
              ))}
            </div>

            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Record time complexity, edge cases, pattern observations, or why your first attempt failed..."
              className="w-full text-xs font-mono bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Saved notes persist across all sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNote}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
