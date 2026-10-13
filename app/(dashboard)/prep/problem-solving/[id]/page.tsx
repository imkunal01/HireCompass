"use client"

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Bookmark,
  Share2,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  FileSpreadsheet,
  Lock,
  LayoutGrid,
  ListFilter,
  Columns3,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Check,
  Code2,
  Zap,
  ArrowRight,
  ChevronLeft,
  SidebarClose,
  SidebarOpen,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Difficulty, Platform, MergedSheetTopic, MergedSheetItem } from "@/types/sheet"
import { useSheetStore } from "@/hooks/useSheetStore"
import { TopicAccordion } from "@/components/features/sheets/topic-accordion"
import { ItemRow } from "@/components/features/sheets/item-row"
import { CsvImportModal } from "@/components/features/sheets/csv-import-modal"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/components/features/auth/auth-modal"
import { saveSheetSessionSnapshot, clearSheetSessionSnapshot } from "@/lib/resume-session"

interface SheetDetailPageProps {
  params: { id: string }
}

export default function SheetDetailPage({ params }: SheetDetailPageProps) {
  const router = useRouter()
  const routeParams = useParams()
  const sheetId = params?.id || (routeParams?.id as string) || ""
  const { user, isAuthenticated, isLoading: isLoadingUser } = useUser()
  const { openAuthModal } = useAuthModal()

  const { current, loading, error, fetchSheet } = useSheetStore()

  // Viewport & layout controls
  const [viewMode, setViewMode] = useState<"focus" | "all" | "table" | "kanban">("focus")
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "All">("All")
  const [statusFilter, setStatusFilter] = useState<"all" | "unsolved" | "revisit">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [topicSearchQuery, setTopicSearchQuery] = useState("")
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [targetedItemId, setTargetedItemId] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const problemViewportRef = useRef<HTMLDivElement>(null)

  // Auto-prompt guest user to log in or register
  const hasPromptedRef = useRef(false)
  useEffect(() => {
    if (!isLoadingUser && !isAuthenticated && !hasPromptedRef.current) {
      hasPromptedRef.current = true
      openAuthModal({
        mode: "login",
        reason: "Sign in or create an account to view problems and track your progress in this roadmap.",
      })
    }
  }, [isLoadingUser, isAuthenticated, openAuthModal])

  useEffect(() => {
    if (sheetId && isAuthenticated) {
      fetchSheet(sheetId)
    }
  }, [sheetId, isAuthenticated, fetchSheet])

  // Save session snapshot for resume hub
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

  // Calculations for difficulty breakdown
  const stats = useMemo(() => {
    if (!current) return { easy: { done: 0, total: 0, percent: 0 }, med: { done: 0, total: 0, percent: 0 }, hard: { done: 0, total: 0, percent: 0 }, revisitCount: 0 }
    let easyDone = 0, easyTotal = 0
    let medDone = 0, medTotal = 0
    let hardDone = 0, hardTotal = 0
    let revisitCount = 0

    for (const topic of current.topics) {
      for (const item of topic.items) {
        if (item.status === "revisit") revisitCount++
        if (item.difficulty === "Easy") {
          easyTotal++
          if (item.status === "done") easyDone++
        } else if (item.difficulty === "Medium") {
          medTotal++
          if (item.status === "done") medDone++
        } else if (item.difficulty === "Hard") {
          hardTotal++
          if (item.status === "done") hardDone++
        }
      }
    }

    return {
      easy: { done: easyDone, total: easyTotal, percent: easyTotal > 0 ? Math.round((easyDone / easyTotal) * 100) : 0 },
      med: { done: medDone, total: medTotal, percent: medTotal > 0 ? Math.round((medDone / medTotal) * 100) : 0 },
      hard: { done: hardDone, total: hardTotal, percent: hardTotal > 0 ? Math.round((hardDone / hardTotal) * 100) : 0 },
      revisitCount,
    }
  }, [current])

  // Topics and active topic
  const topics = useMemo(() => current?.topics || [], [current])
  const activeTopic = useMemo(() => topics[activeTopicIndex] || topics[0], [topics, activeTopicIndex])

  // Filtered topics for sidebar search
  const filteredSidebarTopics = useMemo(() => {
    if (!topicSearchQuery.trim()) return topics
    const q = topicSearchQuery.toLowerCase().trim()
    return topics.filter((t) => t.name.toLowerCase().includes(q))
  }, [topics, topicSearchQuery])

  // Flattened all items for Table & Kanban views
  const allItems = useMemo(() => {
    if (!current) return []
    return current.topics.flatMap((t) => t.items)
  }, [current])

  // Filtered items in active topic (for Focus mode)
  const filteredActiveItems = useMemo(() => {
    if (!activeTopic) return []
    return activeTopic.items.filter((item) => {
      if (difficultyFilter !== "All" && item.difficulty !== difficultyFilter) return false
      if (statusFilter === "unsolved" && item.status === "done") return false
      if (statusFilter === "revisit" && item.status !== "revisit") return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q))
        const matchPlatform = item.platform?.toLowerCase().includes(q)
        return matchTitle || matchTag || matchPlatform
      }
      return true
    })
  }, [activeTopic, difficultyFilter, statusFilter, searchQuery])

  // Filtered all items for Table & Kanban views
  const filteredAllItems = useMemo(() => {
    return allItems.filter((item) => {
      if (difficultyFilter !== "All" && item.difficulty !== difficultyFilter) return false
      if (statusFilter === "unsolved" && item.status === "done") return false
      if (statusFilter === "revisit" && item.status !== "revisit") return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q))
        const matchTopic = item.topic.toLowerCase().includes(q)
        const matchPlatform = item.platform?.toLowerCase().includes(q)
        return matchTitle || matchTag || matchTopic || matchPlatform
      }
      return true
    })
  }, [allItems, difficultyFilter, statusFilter, searchQuery])

  // Fast Navigation Handlers
  const handleSelectTopic = useCallback((index: number) => {
    setActiveTopicIndex(index)
    if (viewMode !== "focus") {
      setViewMode("focus")
    }
    if (problemViewportRef.current) {
      problemViewportRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [viewMode])

  const handleNextTopic = useCallback(() => {
    if (activeTopicIndex < topics.length - 1) {
      handleSelectTopic(activeTopicIndex + 1)
    }
  }, [activeTopicIndex, topics.length, handleSelectTopic])

  const handlePrevTopic = useCallback(() => {
    if (activeTopicIndex > 0) {
      handleSelectTopic(activeTopicIndex - 1)
    }
  }, [activeTopicIndex, handleSelectTopic])

  // Jump to Next Unsolved Problem (Lightning Fast)
  const handleJumpToNextUnsolved = useCallback(() => {
    if (!current) return
    for (let tIdx = 0; tIdx < current.topics.length; tIdx++) {
      const topic = current.topics[tIdx]
      const nextItem = topic.items.find((i) => i.status !== "done")
      if (nextItem) {
        setActiveTopicIndex(tIdx)
        setViewMode("focus")
        setTargetedItemId(nextItem._id)
        setTimeout(() => {
          const el = document.getElementById(`problem-${nextItem._id}`)
          if (el && problemViewportRef.current) {
            el.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 120)
        setTimeout(() => setTargetedItemId(null), 3000)
        return
      }
    }
  }, [current])

  // Keyboard Shortcuts for Instant Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === "Escape") {
          ;(e.target as HTMLElement).blur()
        }
        return
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        handleJumpToNextUnsolved()
      } else if (e.key === "]" || (e.altKey && e.key === "ArrowRight")) {
        e.preventDefault()
        handleNextTopic()
      } else if (e.key === "[" || (e.altKey && e.key === "ArrowLeft")) {
        e.preventDefault()
        handlePrevTopic()
      } else if (e.key === "/") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleJumpToNextUnsolved, handleNextTopic, handlePrevTopic])

  // Copy Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  // Auth Guard
  if (!isLoadingUser && !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-8 text-center space-y-6 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Authentication Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Please sign in or create a free account to track your progress on this roadmap, mark problems as solved, and save notes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() =>
                openAuthModal({
                  mode: "login",
                  reason: "Sign in to access your problem roadmap and track your completion stats.",
                  onSuccess: () => {
                    fetchSheet(sheetId)
                  },
                })
              }
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-105 transition-all"
            >
              Log In / Sign Up
            </button>
            <Link
              href="/prep/problem-solving"
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Roadmaps
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading
  if (loading && !current) {
    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-pulse py-2">
        <div className="h-14 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200" />
        <div className="h-10 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200" />
        <div className="flex-1 flex gap-4">
          <div className="w-72 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200" />
          <div className="flex-1 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200" />
        </div>
      </div>
    )
  }

  // Error
  if (error || !current) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4 my-8">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {error || "Roadmap not found or unauthorized access"}
        </p>
        <Link
          href="/prep/problem-solving"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roadmaps</span>
        </Link>
      </div>
    )
  }

  const { sheet, summary } = current
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
    <div className="h-[calc(100vh-6.25rem)] max-h-[calc(100vh-6.25rem)] flex flex-col overflow-hidden select-none relative -my-3">
      {/* ── 1. PINNED COMPACT COMMAND BAR (Docked at Top, Never Scrolls) ── */}
      <header className="shrink-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 shadow-xs z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Sheet Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/prep/problem-solving"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              title="Back to All Roadmaps"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <span className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] shrink-0 border border-emerald-500/20">
              {sheet.category}
            </span>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white truncate">
                {sheet.title}
              </h1>
            </div>
          </div>

          {/* Center / Right: Difficulty Matrix, Quick Jumper & Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap md:flex-nowrap justify-between md:justify-end">
            {/* Overall & Difficulty Mini Counters */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-1.5 font-bold font-mono">
                <span className="text-slate-900 dark:text-white">{summary.done}/{summary.total}</span>
                <span className="text-emerald-600 dark:text-emerald-400">({summary.percent}%)</span>
              </div>
              <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                <span className="text-emerald-600" title="Easy Solved / Total">{stats.easy.done}/{stats.easy.total}E</span>
                <span className="text-amber-600" title="Medium Solved / Total">{stats.med.done}/{stats.med.total}M</span>
                <span className="text-rose-600" title="Hard Solved / Total">{stats.hard.done}/{stats.hard.total}H</span>
              </div>
            </div>

            {/* Smart Next Problem (Press 'N') */}
            <button
              onClick={handleJumpToNextUnsolved}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
              title="Jump to Next Unsolved Problem (Keyboard shortcut: Press 'N')"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Next Unsolved</span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 bg-white/20 text-[9px] font-mono rounded">N</kbd>
            </button>

            {/* Search Input */}
            <div className="relative w-36 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Find problem... [/]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Diff</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 shrink-0">
              <button
                onClick={() => setViewMode("focus")}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "focus"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Focus Topic View (Zero Scrolling)"
              >
                Focus
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "all"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="All Topics Accordions"
              >
                All
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "table"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Spreadsheet Table View"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "p-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "kanban"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Kanban Board View"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Import Excel / CSV */}
            <button
              onClick={() => setShowCsvModal(true)}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shrink-0"
              title="Import Excel or CSV into sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shrink-0"
              title="Copy shareable roadmap link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Delete (if owner) */}
            {isOwner && (
              <button
                onClick={handleDeleteSheet}
                disabled={isDeleting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                title="Delete Sheet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. INSTANT HORIZONTAL TOPIC NAVIGATION RIBBON (Pill Track) ── */}
      <div className="shrink-0 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 z-10">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-colors shrink-0 shadow-2xs mr-1"
          title={isSidebarOpen ? "Collapse Topic Rail" : "Expand Topic Rail"}
        >
          {isSidebarOpen ? <SidebarClose className="w-3.5 h-3.5" /> : <SidebarOpen className="w-3.5 h-3.5" />}
        </button>

        {topics.map((t, idx) => {
          const isActive = viewMode === "focus" && activeTopicIndex === idx
          const isComplete = t.total > 0 && t.done === t.total
          return (
            <button
              key={t.name}
              onClick={() => handleSelectTopic(idx)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border shadow-2xs",
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white scale-[1.02]"
                  : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200/80 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isComplete ? "bg-emerald-400" : isActive ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
                )}
              />
              <span>{t.name}</span>
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : isComplete
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {t.done}/{t.total}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 3. DUAL-PANE ZERO-SCROLL VIEWPORT ── */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* ── Left Topic Rail (Fast Click-To-Switch Sidebar) ── */}
        {isSidebarOpen && (
          <aside className="w-64 sm:w-72 shrink-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col overflow-hidden shadow-xs animate-in slide-in-from-left-2 duration-200">
            {/* Sidebar Search & Topic Count */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                  Topic Syllabus ({topics.length})
                </span>
                {isOwner && (
                  <button
                    onClick={() => setShowAddTopic(!showAddTopic)}
                    className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Topic</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter topics..."
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  className="w-full text-xs pl-7 pr-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Add Topic Inline Input */}
              {showAddTopic && isOwner && (
                <form onSubmit={handleAddTopic} className="flex gap-1 pt-1">
                  <input
                    type="text"
                    placeholder="New topic title..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800"
                    required
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>

            {/* Scrollable Topic Rail List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
              {filteredSidebarTopics.map((t, idx) => {
                const originalIndex = topics.findIndex((orig) => orig.name === t.name)
                const isActive = viewMode === "focus" && activeTopicIndex === originalIndex
                const isComplete = t.total > 0 && t.done === t.total

                return (
                  <button
                    key={t.name}
                    onClick={() => handleSelectTopic(originalIndex)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-xs scale-[1.01]"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          isComplete ? "bg-emerald-400" : isActive ? "bg-emerald-400" : "bg-slate-300"
                        )}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : isComplete
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {t.done}/{t.total}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* ── Right Content Viewport (Scrolls Internally, Outer Page Never Scrolls!) ── */}
        <main
          ref={problemViewportRef}
          className="flex-1 min-w-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-y-auto shadow-xs p-4 sm:p-5 flex flex-col"
        >
          {/* ── MODE 1: FOCUS TOPIC VIEW (Default & Fast UX) ── */}
          {viewMode === "focus" && activeTopic && (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Focus Topic Header Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-slate-400">
                      Topic #{activeTopicIndex + 1} of {topics.length}
                    </span>
                    {activeTopic.done === activeTopic.total && activeTopic.total > 0 && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                        Topic Mastered
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeTopic.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeTopic.done} of {activeTopic.total} solved ({activeTopic.percent}%)
                  </p>
                </div>

                {/* Progress Bar & Previous/Next Topic Quick Controls */}
                <div className="flex items-center gap-3">
                  <div className="w-32 hidden sm:block">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{activeTopic.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${activeTopic.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button
                      onClick={handlePrevTopic}
                      disabled={activeTopicIndex === 0}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Previous Topic (Alt + Left Arrow)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextTopic}
                      disabled={activeTopicIndex === topics.length - 1}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Next Topic (Alt + Right Arrow)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 flex-1 shadow-2xs">
                {filteredActiveItems.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">
                    No problems match your current filter in &quot;{activeTopic.name}&quot;.
                  </div>
                ) : (
                  filteredActiveItems.map((item, idx) => (
                    <ItemRow
                      key={item._id}
                      item={item}
                      index={idx}
                      isTargeted={targetedItemId === item._id}
                    />
                  ))
                )}
              </div>

              {/* Bottom Quick-Jump Footer to Next Topic */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <button
                  onClick={handlePrevTopic}
                  disabled={activeTopicIndex === 0}
                  className="hover:text-slate-900 disabled:opacity-0 flex items-center gap-1 font-bold transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous Topic</span>
                </button>
                <span className="font-mono text-[11px] text-slate-400">
                  Tip: Use [ and ] to switch topics instantly
                </span>
                <button
                  onClick={handleNextTopic}
                  disabled={activeTopicIndex === topics.length - 1}
                  className="hover:text-slate-900 disabled:opacity-0 flex items-center gap-1 font-bold transition-colors"
                >
                  <span>Next Topic</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── MODE 2: ALL TOPICS ACCORDIONS VIEW ── */}
          {viewMode === "all" && (
            <div className="space-y-4">
              {topics.map((topic, idx) => (
                <TopicAccordion
                  key={topic.name}
                  topic={topic}
                  difficultyFilter={difficultyFilter}
                  hideCompleted={statusFilter === "unsolved"}
                  searchQuery={searchQuery}
                  sheetId={sheet._id}
                  isOwner={isOwner}
                  targetedItemId={targetedItemId}
                />
              ))}
            </div>
          )}

          {/* ── MODE 3: LINEAR SPREADSHEET DATA TABLE ── */}
          {viewMode === "table" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 shadow-2xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Total {filteredAllItems.length} Problems</span>
                <span className="font-mono text-[11px] text-slate-400">Full Table View</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredAllItems.map((item, idx) => (
                  <ItemRow
                    key={item._id}
                    item={item}
                    index={idx}
                    showTopicBadge={true}
                    isTargeted={targetedItemId === item._id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 4: KANBAN BOARD VIEW ── */}
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* To-Do */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold">
                  <span>To-Do</span>
                  <span className="font-mono text-slate-400">
                    {filteredAllItems.filter((i) => i.status === "todo").length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1">
                  {filteredAllItems
                    .filter((i) => i.status === "todo")
                    .map((item) => (
                      <div key={item._id} className="p-2.5 rounded-xl border bg-white shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{item.topic}</span>
                          <span className="font-bold">{item.difficulty}</span>
                        </div>
                        <a href={item.problemLink || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold hover:text-emerald-600 line-clamp-2 block">
                          {item.title}
                        </a>
                      </div>
                    ))}
                </div>
              </div>

              {/* Revisit */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-50/30 p-3 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 text-xs font-bold text-amber-800">
                  <span>Revisit ⭐</span>
                  <span className="font-mono text-amber-600">
                    {filteredAllItems.filter((i) => i.status === "revisit").length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1">
                  {filteredAllItems
                    .filter((i) => i.status === "revisit")
                    .map((item) => (
                      <div key={item._id} className="p-2.5 rounded-xl border border-amber-500/30 bg-white shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-amber-600 font-mono">
                          <span>{item.topic}</span>
                          <span className="font-bold">{item.difficulty}</span>
                        </div>
                        <a href={item.problemLink || "#"} target="_blank" rel="noreferrer" className="text-xs font-bold hover:text-amber-600 line-clamp-2 block">
                          {item.title}
                        </a>
                      </div>
                    ))}
                </div>
              </div>

              {/* Mastered */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/30 p-3 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 text-xs font-bold text-emerald-800">
                  <span>Mastered ✓</span>
                  <span className="font-mono text-emerald-600">
                    {filteredAllItems.filter((i) => i.status === "done").length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1">
                  {filteredAllItems
                    .filter((i) => i.status === "done")
                    .map((item) => (
                      <div key={item._id} className="p-2.5 rounded-xl border border-emerald-500/20 bg-white shadow-2xs space-y-1.5 opacity-80">
                        <div className="flex items-center justify-between text-[10px] text-emerald-600 font-mono">
                          <span>{item.topic}</span>
                          <span className="font-bold">{item.difficulty}</span>
                        </div>
                        <a href={item.problemLink || "#"} target="_blank" rel="noreferrer" className="text-xs font-semibold line-through text-slate-500 line-clamp-2 block">
                          {item.title}
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </main>
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
