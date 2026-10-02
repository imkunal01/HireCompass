"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronRight, Plus, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MergedSheetTopic, Difficulty } from "@/types/sheet"
import { ItemRow } from "./item-row"

interface TopicAccordionProps {
  topic: MergedSheetTopic
  difficultyFilter: Difficulty | "All"
  hideCompleted: boolean
  searchQuery?: string
  sheetId: string
  isOwner: boolean
}

export function TopicAccordion({
  topic,
  difficultyFilter,
  hideCompleted,
  searchQuery = "",
  sheetId,
  isOwner,
}: TopicAccordionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("Medium")
  const [newLink, setNewLink] = useState("")
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
      return matchTitle || matchTag
    }
    return true
  })

  const isAllDone = topic.total > 0 && topic.done === topic.total

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/sheets/${sheetId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.name,
          title: newTitle.trim(),
          difficulty: newDifficulty,
          problemLink: newLink.trim(),
        }),
      })

      if (res.ok) {
        setNewTitle("")
        setNewLink("")
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden backdrop-blur-sm transition-all shadow-sm">
      {/* ── Topic Header Accordion Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
              isAllDone
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}
          >
            {isAllDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>

          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
              {topic.name}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {topic.done} of {topic.total} completed ({topic.percent}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Circular / Line Progress indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${topic.percent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-9 text-right">
              {topic.percent}%
            </span>
          </div>

          {isOwner && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                setShowAddModal(!showAddModal)
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              title="Add Problem to Topic"
            >
              <Plus className="w-4 h-4" />
            </div>
          )}
        </div>
      </button>

      {/* Inline Mini Progress Bar below header */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${topic.percent}%` }}
        />
      </div>

      {/* Inline Add Problem Form */}
      {showAddModal && isOwner && (
        <form
          onSubmit={handleAddItem}
          className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Add New Problem to &quot;{topic.name}&quot;
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Problem Title (e.g. Subarray Sum Equals K)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 sm:col-span-2 focus:ring-1 focus:ring-emerald-500"
              required
            />
            <select
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <input
            type="url"
            placeholder="Problem URL (e.g. https://leetcode.com/problems/...)"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Problem"}
            </button>
          </div>
        </form>
      )}

      {/* ── Problem Items List ── */}
      {isOpen && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No problems match your current filters in this topic.
            </div>
          ) : (
            filteredItems.map((item) => (
              <ItemRow key={item._id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
