"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  Share2,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  Upload,
  Copy,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Difficulty } from "@/types/sheet"
import { useSheetStore } from "@/hooks/useSheetStore"
import { TopicAccordion } from "@/components/features/sheets/topic-accordion"
import { CsvImportModal } from "@/components/features/sheets/csv-import-modal"
import { useUser } from "@/hooks/useUser"
import { saveSheetSessionSnapshot, clearSheetSessionSnapshot } from "@/lib/resume-session"

export default function SheetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sheetId = params.id as string
  const { user } = useUser()

  const { current, loading, error, fetchSheet } = useSheetStore()

  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "All">("All")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)

  useEffect(() => {
    if (sheetId) {
      fetchSheet(sheetId)
    }
  }, [sheetId, fetchSheet])

  // Track active sheet session snapshot for Home page resume hub
  useEffect(() => {
    if (current && sheetId) {
      const activeTopic = current.topics.find((t) => t.done < t.total)?.name || current.topics[0]?.name
      saveSheetSessionSnapshot({
        id: sheetId,
        toolType: "sheet",
        title: current.sheet.title || "DSA Roadmap",
        subtitle: `${current.sheet.category || "DSA"} • ${activeTopic ? `Topic: ${activeTopic}` : "Problem Solving"}`,
        badgeText: `${current.summary.done}/${current.summary.total} Solved`,
        badgeVariant: "emerald",
        progressPercent: current.summary.percent || 0,
        progressLabel: `${current.summary.done} of ${current.summary.total} solved (${current.summary.percent}%)`,
        lastActive: new Date().toISOString(),
        href: `/prep/problem-solving/${sheetId}`,
        actionLabel: "Continue Sheet",
        meta: {
          sheetId,
          doneCount: current.summary.done,
          totalCount: current.summary.total,
          category: current.sheet.category,
          lastTopic: activeTopic,
        },
      })
    }
  }, [current, sheetId])

  if (loading && !current) {
    return (
      <div className="space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-28 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !current) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4 my-8">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {error || "Roadmap not found or unauthorized access"}
        </p>
        <Link
          href="/prep/problem-solving"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roadmaps</span>
        </Link>
      </div>
    )
  }

  const { sheet, topics, summary } = current
  const isOwner = Boolean(user?.id && sheet.owner === user.id)

  const handleDeleteSheet = async () => {
    if (!confirm("Are you sure you want to delete this roadmap and all logged progress?")) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sheets/${sheetId}`, { method: "DELETE" })
      if (res.ok) {
        clearSheetSessionSnapshot()
        router.push("/prep/problem-solving")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicName.trim()) return

    try {
      const res = await fetch(`/api/sheets/${sheetId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopicName.trim() }),
      })
      if (res.ok) {
        setNewTopicName("")
        setShowAddTopic(false)
        fetchSheet(sheetId)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/prep/problem-solving"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Roadmaps</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all shadow-sm hover:scale-[1.02]"
            title="Import problems from Excel (.xlsx/.xls) or CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Import Excel / CSV</span>
          </button>

          {isOwner ? (
            <button
              onClick={handleDeleteSheet}
              disabled={isDeleting}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Delete Sheet"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : sheet.templateKey ? (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/sheets/from-template/${sheet.templateKey}`, { method: "POST" })
                  const data = await res.json()
                  if (res.ok && data.sheet?._id) {
                    router.push(`/prep/problem-solving/${data.sheet._id}`)
                  }
                } catch (e) {
                  console.error(e)
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              title="Clone this template to edit and track custom problems"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone Template</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Sheet Header Card ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {sheet.category}
              </span>
              {sheet.isTemplate && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Built-in Template
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5">
              {sheet.title}
            </h1>
            {sheet.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
                {sheet.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0">
            <div>
              <div className="text-xs text-slate-400 uppercase font-medium">Completed</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {summary.done} <span className="text-xs font-normal text-slate-400">/ {summary.total}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-medium">Mastery</div>
              <div className="text-xl font-bold text-emerald-500 mt-0.5">
                {summary.percent}%
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="pt-2">
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${summary.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems, topics, or #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto">
          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Hide Completed toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Hide done</span>
          </label>

          {/* Add Topic button */}
          {isOwner && (
            <button
              onClick={() => setShowAddTopic(!showAddTopic)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Topic Modal / Drawer */}
      {showAddTopic && isOwner && (
        <form
          onSubmit={handleAddTopic}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
        >
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Create New Topic
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Dynamic Programming (2D), Graph Traversals"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Create Topic
            </button>
            <button
              type="button"
              onClick={() => setShowAddTopic(false)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Topic Accordions List ── */}
      <div className="space-y-4">
        {topics.map((topic) => (
          <TopicAccordion
            key={topic.name}
            topic={topic}
            difficultyFilter={difficultyFilter}
            hideCompleted={hideCompleted}
            searchQuery={searchQuery}
            sheetId={sheet._id}
            isOwner={isOwner}
          />
        ))}
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        sheetId={isOwner ? sheet._id : undefined}
        sheetTitle={isOwner ? sheet.title : `${sheet.title} (Template Copy)`}
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={() => {
          fetchSheet(sheetId)
        }}
      />
    </div>
  )
}
