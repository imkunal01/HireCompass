"use client"

import React, { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  FolderOpen,
  Layers,
  Sparkles,
  X,
  Code2,
  Globe,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MergedSheetTopic, Difficulty, Platform } from "@/types/sheet"
import { ItemRow } from "./item-row"

interface TopicAccordionProps {
  topic: MergedSheetTopic
  difficultyFilter: Difficulty | "All"
  hideCompleted: boolean
  searchQuery?: string
  sheetId: string
  isOwner: boolean
  isDefaultOpen?: boolean
  targetedItemId?: string | null
}

const PLATFORMS: Platform[] = [
  "LeetCode",
  "GFG",
  "CodeChef",
  "Codeforces",
  "HackerRank",
  "InterviewBit",
  "Other",
]

export function TopicAccordion({
  topic,
  difficultyFilter,
  hideCompleted,
  searchQuery = "",
  sheetId,
  isOwner,
  isDefaultOpen = true,
  targetedItemId = null,
}: TopicAccordionProps) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("Medium")
  const [newPlatform, setNewPlatform] = useState<Platform>("LeetCode")
  const [newLink, setNewLink] = useState("")
  const [newTags, setNewTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter items
  const filteredItems = topic.items.filter((item) => {
    if (difficultyFilter !== "All" && item.difficulty !== difficultyFilter) {
      return false
    }
    if (hideCompleted && item.status === "done") {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q))
      const matchPlatform = item.platform?.toLowerCase().includes(q)
      return matchTitle || matchTag || matchPlatform
    }
    return true
  })

  const isAllDone = topic.total > 0 && topic.done === topic.total

  // Topic difficulty breakdown
  const easyCount = topic.items.filter((i) => i.difficulty === "Easy").length
  const medCount = topic.items.filter((i) => i.difficulty === "Medium").length
  const hardCount = topic.items.filter((i) => i.difficulty === "Hard").length

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsSubmitting(true)
    try {
      const parsedTags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch(`/api/sheets/${sheetId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.name,
          title: newTitle.trim(),
          difficulty: newDifficulty,
          platform: newPlatform,
          problemLink: newLink.trim(),
          tags: parsedTags,
        }),
      })

      if (res.ok) {
        setNewTitle("")
        setNewLink("")
        setNewTags("")
        setShowAddModal(false)
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id={`topic-${topic.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      className={cn(
        "rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs",
        isAllDone
          ? "border-emerald-500/30 bg-white/90 dark:bg-slate-900/90 shadow-emerald-500/5"
          : "border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* ── Topic Header Accordion Bar ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none gap-3"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs",
              isAllDone
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                : isOpen
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {isAllDone ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : isOpen ? (
              <ChevronDown className="w-5 h-5 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 transition-transform" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white truncate">
                {topic.name}
              </h3>
              {isAllDone && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Mastered
                </span>
              )}
            </div>

            {/* Subtitle with topic stats & difficulty pill tags */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                {topic.done} of {topic.total} solved
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono">
                {easyCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">{easyCount}E</span>
                )}
                {medCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">{medCount}M</span>
                )}
                {hardCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">{hardCount}H</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Progress Ring / Bar & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Topic Progress Bar */}
          <div className="flex items-center gap-2.5">
            <div className="w-28 sm:w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isAllDone
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600"
                )}
                style={{ width: `${topic.percent}%` }}
              />
            </div>
            <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 w-10 text-right">
              {topic.percent}%
            </span>
          </div>

          {/* Add Problem Button (Owner Only) */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddModal(!showAddModal)
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800 dark:hover:border-emerald-500/30 transition-all hover:scale-105"
              title="Add Problem to this Topic"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Add Problem Form Drawer ── */}
      {showAddModal && isOwner && (
        <form
          onSubmit={handleAddItem}
          className="p-5 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t border-b border-emerald-500/20 space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Add Problem to &quot;{topic.name}&quot;
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Subarray Sum Equals K"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Difficulty
              </label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Platform
              </label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as Platform)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Problem Link (URL)
              </label>
              <input
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. prefix-sum, hash-map, sliding-window"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Problem"}
            </button>
          </div>
        </form>
      )}

      {/* ── Problem Items List ── */}
      {isOpen && (
        <div className="divide-y divide-slate-100/90 dark:divide-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                No problems match your current filters in this topic.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <ItemRow
                key={item._id}
                item={item}
                index={idx}
                isTargeted={targetedItemId === item._id}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
