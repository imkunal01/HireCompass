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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MergedSheetItem, Difficulty, ItemStatus } from "@/types/sheet"
import { useSheetStore } from "@/hooks/useSheetStore"

const DIFFICULTY_STYLES: Record<Difficulty, { badge: string; text: string }> = {
  Easy: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-500",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-500",
  },
  Hard: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    text: "text-rose-500",
  },
  "N/A": {
    badge: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
    text: "text-slate-400",
  },
}

interface ItemRowProps {
  item: MergedSheetItem
}

export function ItemRow({ item }: ItemRowProps) {
  const { setStatus, setItemNotes } = useSheetStore()
  const [showNotes, setShowNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(item.notes || "")
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isAddingToPlanner, setIsAddingToPlanner] = useState(false)
  const [addedToPlanner, setAddedToPlanner] = useState(false)

  const isDone = item.status === "done"
  const isRevisit = item.status === "revisit"
  const diffStyle = DIFFICULTY_STYLES[item.difficulty] || DIFFICULTY_STYLES["N/A"]

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
      className={cn(
        "group flex flex-col p-3.5 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-b-0",
        isDone ? "bg-slate-50/50 dark:bg-slate-900/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
              : "border-slate-300 dark:border-slate-700 hover:border-emerald-500"
          )}
          aria-label={isDone ? "Mark as uncompleted" : "Mark as completed"}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Revisit / Flag button */}
        <button
          onClick={toggleRevisit}
          className={cn(
            "p-1 rounded-md transition-colors shrink-0",
            isRevisit
              ? "text-amber-500 bg-amber-500/10"
              : "text-slate-300 hover:text-amber-500 dark:text-slate-600"
          )}
          title="Flag for revision"
        >
          <Bookmark className={cn("w-3.5 h-3.5", isRevisit && "fill-current")} />
        </button>

        {/* Title & Link */}
        <div className="flex-1 min-w-0 pr-2">
          {item.problemLink ? (
            <a
              href={item.problemLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-sm font-medium transition-colors hover:underline flex items-center gap-1.5 truncate",
                isDone
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-800 dark:text-slate-200 hover:text-emerald-500 dark:hover:text-emerald-400"
              )}
            >
              <span className="truncate">{item.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100" />
            </a>
          ) : (
            <span
              className={cn(
                "text-sm font-medium truncate block",
                isDone ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
              )}
            >
              {item.title}
            </span>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Difficulty Badge */}
        <span
          className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
            diffStyle.badge
          )}
        >
          {item.difficulty}
        </span>

        {/* External Resources */}
        <div className="flex items-center gap-1 shrink-0">
          {item.articleLink ? (
            <a
              href={item.articleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
              title="Editorial / Article Solution"
            >
              <FileText className="w-3.5 h-3.5" />
            </a>
          ) : null}

          {item.youtubeLink ? (
            <a
              href={item.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Video Explanation"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
          ) : null}

          {/* Send to Day Planner */}
          <button
            onClick={handleAddToPlanner}
            disabled={isAddingToPlanner}
            className={cn(
              "p-1 rounded-md transition-colors",
              addedToPlanner
                ? "text-emerald-500 bg-emerald-500/10"
                : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            )}
            title={addedToPlanner ? "Added to Today's Planner!" : "Schedule in Today's Planner (45m)"}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
          </button>

          {/* Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              "p-1 rounded-md transition-colors",
              item.notes
                ? "text-indigo-500 bg-indigo-500/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={item.notes ? "Edit personal notes" : "Add personal notes"}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Notes Panel */}
      {showNotes && (
        <div className="mt-3 pl-8 pr-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Add key insights, edge cases, or complexity notes..."
              className="w-full text-xs bg-transparent border-0 focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none h-16"
            />
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400">Notes are saved automatically for your user account</span>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNote}
                className="px-2.5 py-1 rounded-lg font-medium text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
