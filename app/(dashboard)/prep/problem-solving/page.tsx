"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ListChecks,
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Filter,
  Layers,
  Code2,
  FolderOpen,
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Binary,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  Lock,
  Search,
  LayoutGrid,
  List,
  Target,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { SheetListItem, TemplateSummary, SheetCategory } from "@/types/sheet"
import { CsvImportModal } from "@/components/features/sheets/csv-import-modal"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/components/features/auth/auth-modal"

const CATEGORY_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: any }
> = {
  DSA: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: Binary,
  },
  OS: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: Cpu,
  },
  CN: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/20",
    icon: Globe,
  },
  DBMS: {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
    icon: Database,
  },
  "System Design": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/20",
    icon: BrainCircuit,
  },
  Development: {
    bg: "bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-500/20",
    icon: Code2,
  },
  Company: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/20",
    icon: Sparkles,
  },
  Custom: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-500/20",
    icon: Layers,
  },
}

export default function ProblemSolvingPrepPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isLoadingUser } = useUser()
  const { openAuthModal } = useAuthModal()

  const [activeTab, setActiveTab] = useState<"my-sheets" | "templates">("my-sheets")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid")
  const [showCsvModal, setShowCsvModal] = useState(false)

  // Handlers for guest authentication prompts
  const handleSheetClick = (e: React.MouseEvent, sheetId: string) => {
    if (!isAuthenticated && !isLoadingUser) {
      e.preventDefault()
      openAuthModal({
        mode: "login",
        reason: "Sign in or register to track your DSA problem progress and access your customized roadmap.",
        onSuccess: () => {
          router.push(`/prep/problem-solving/${sheetId}`)
        },
      })
    }
  }

  const handleCloneClick = async (e: React.MouseEvent, key: string) => {
    if (!isAuthenticated && !isLoadingUser) {
      e.preventDefault()
      openAuthModal({
        mode: "login",
        reason: "Sign in or register to clone this DSA roadmap into your personal account.",
        onSuccess: () => {
          window.location.reload()
        },
      })
      return
    }

    try {
      const res = await fetch(`/api/sheets/from-template/${key}`, { method: "POST" })
      if (res.ok) {
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleNewSheetClick = (e: React.MouseEvent) => {
    if (!isAuthenticated && !isLoadingUser) {
      e.preventDefault()
      openAuthModal({
        mode: "signup",
        reason: "Sign in or register to create custom problem-solving roadmaps.",
        onSuccess: () => {
          router.push("/prep/problem-solving/new")
        },
      })
    }
  }

  const handleImportCsvClick = () => {
    if (!isAuthenticated && !isLoadingUser) {
      openAuthModal({
        mode: "signup",
        reason: "Sign in or register to bulk import DSA problems from Excel / CSV.",
      })
      return
    }
    setShowCsvModal(true)
  }

  // Query user sheets
  const { data: sheetsData, isLoading: loadingSheets, refetch: refetchSheets } = useQuery<{ sheets: SheetListItem[] }>({
    queryKey: ["sheets"],
    queryFn: async () => {
      const res = await fetch("/api/sheets")
      if (!res.ok) throw new Error("Failed to load sheets")
      return res.json()
    },
  })

  // Query templates
  const { data: templatesData, isLoading: loadingTemplates } = useQuery<{ templates: TemplateSummary[] }>({
    queryKey: ["sheet-templates"],
    queryFn: async () => {
      const res = await fetch("/api/sheets/templates")
      if (!res.ok) throw new Error("Failed to load templates")
      return res.json()
    },
  })

  const templates = templatesData?.templates || []

  const mySheets = useMemo(() => {
    const list = sheetsData?.sheets || []
    const personal = list.filter((s) => !s.isTemplate)
    if (personal.length > 0) return personal
    // If no personal roadmaps created yet (e.g. guest mode or initial load), surface default template
    return list.filter((s) => s.isTemplate && s.templateKey === "capgemini-dsa")
  }, [sheetsData?.sheets])

  // Filter sheets by search and category
  const filteredMySheets = useMemo(() => {
    return mySheets.filter((s) => {
      if (selectedCategory !== "All" && s.category !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = s.title.toLowerCase().includes(q)
        const matchDesc = (s.description || "").toLowerCase().includes(q)
        const matchCat = s.category.toLowerCase().includes(q)
        const matchTopics = s.topics?.some((t) => t.name.toLowerCase().includes(q))
        return matchTitle || matchDesc || matchCat || matchTopics
      }
      return true
    })
  }, [mySheets, selectedCategory, searchQuery])

  const totalSolved = mySheets.reduce((acc, s) => acc + (s.done || 0), 0)
  const totalItems = mySheets.reduce((acc, s) => acc + (s.itemCount || 0), 0)
  const overallPercent = totalItems > 0 ? Math.round((totalSolved / totalItems) * 100) : 0

  // Most active sheet for Spotlight card
  const activeFocusSheet = mySheets[0]

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Decorative ambient background blooms */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-10 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Command Deck / Hero Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/95 via-slate-50/60 to-white/80 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                <ListChecks className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Problem Solving & Revision Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Engineering Revision Roadmaps
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Pattern-oriented syllabus roadmaps, real-time topic mastery tracking, and zero-loss bulk import from Excel or CSV spreadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/prep"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors shadow-2xs"
            >
              <BrainCircuit className="w-4 h-4 text-violet-500" />
              <span>Interview Cockpit</span>
            </Link>

            <button
              onClick={handleImportCsvClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all shadow-2xs hover:scale-[1.02]"
              title="Import problems from Excel or CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Import Excel / CSV</span>
            </button>

            <Link
              href="/prep/problem-solving/new"
              onClick={handleNewSheetClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Custom Sheet</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Connected Intelligence HUD (3 Power Panels) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Panel 1: Mastery Ring & Velocity */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-xs hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Overall Velocity</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalSolved}
            </span>
            <span className="text-xs font-bold text-slate-400">/ {totalItems} solved</span>
            <span className="ml-auto text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
              {overallPercent}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Across {mySheets.length} active roadmap{mySheets.length === 1 ? "" : "s"} in your workspace
          </p>
        </div>

        {/* Panel 2: Roadmap Capacity */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-xs hover:border-indigo-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Curriculum Coverage</span>
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {mySheets.length} <span className="text-xs font-bold text-slate-400">Active Sheets</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {Array.from(new Set(mySheets.map((s) => s.category))).map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Personal sheets, cloned syllabi & imported spreadsheets
          </p>
        </div>

        {/* Panel 3: Active Spotlight / Quick Jump */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 backdrop-blur-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              Focus Roadmap
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {activeFocusSheet ? `${activeFocusSheet.percent}% Done` : "Ready"}
            </span>
          </div>

          {activeFocusSheet ? (
            <div className="mt-2 space-y-2">
              <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                {activeFocusSheet.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                {activeFocusSheet.description || "Continue your problem solving streak today"}
              </p>
              <Link
                href={`/prep/problem-solving/${activeFocusSheet._id}`}
                onClick={(e) => handleSheetClick(e, activeFocusSheet._id)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 pt-1 transition-colors group"
              >
                <span>Continue Practice</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">
              Pick a curated template or import a sheet to begin.
            </div>
          )}
        </div>
      </div>

      {/* ── Guest Access Notification Banner ── */}
      {!isLoadingUser && !isAuthenticated && (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Guest Mode: Capgemini DSA Roadmap Preview
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Sign in or create a free account to track solved problems, bookmark items, and save personal notes.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openAuthModal({
                mode: "login",
                reason: "Sign in or register to track your DSA roadmap progress and save problem notes.",
              })
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-105 transition-all shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Log In / Sign Up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Toolbar: Search, Category Chips & View Controls ── */}
      <div className="space-y-3">
        {/* Top Tab Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Segmented Tabs */}
          <div className="flex items-center gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab("my-sheets")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200",
                activeTab === "my-sheets"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              <FolderOpen className="w-4 h-4" />
              <span>My Roadmaps</span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-mono",
                  activeTab === "my-sheets"
                    ? "bg-white/20 dark:bg-black/20"
                    : "bg-slate-200 dark:bg-slate-800"
                )}
              >
                {mySheets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200",
                activeTab === "templates"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Curated Templates Library</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                {templates.length > 0 ? templates.length : "1"}
              </span>
            </button>
          </div>

          {/* Search & Layout Toggles */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setLayoutMode("grid")}
                className={cn(
                  "p-1.5 rounded-xl text-xs font-bold transition-all",
                  layoutMode === "grid"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500"
                )}
                title="Grid Cards Layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode("list")}
                className={cn(
                  "p-1.5 rounded-xl text-xs font-bold transition-all",
                  layoutMode === "list"
                    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500"
                )}
                title="Compact List Layout"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Only in My Sheets) */}
        {activeTab === "my-sheets" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {["All", "DSA", "System Design", "OS", "CN", "DBMS", "Development", "Company", "Custom"].map(
              (cat) => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-2xs shadow-emerald-500/20 scale-[1.02]"
                        : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                )
              }
            )}
          </div>
        )}
      </div>

      {/* ── TAB 1: My Sheets ── */}
      {activeTab === "my-sheets" && (
        <div>
          {loadingSheets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-56 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMySheets.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <ListChecks className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No roadmaps match your criteria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Start from our curated engineering curriculum or bulk import 100+ problems from Excel or CSV.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedCategory("All")
                    setSearchQuery("")
                    setActiveTab("templates")
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-105 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Curated Templates</span>
                </button>

                <button
                  onClick={handleImportCsvClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all hover:scale-105"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Import Excel / CSV</span>
                </button>
              </div>
            </div>
          ) : layoutMode === "grid" ? (
            /* ── Grid View ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMySheets.map((sheet) => {
                const config = CATEGORY_CONFIG[sheet.category] || CATEGORY_CONFIG.Custom
                const IconComponent = config.icon || Layers
                const topicPreviews = sheet.topics?.slice(0, 3).map((t) => t.name) || []
                const remainingTopics = (sheet.topics?.length || 0) - topicPreviews.length

                return (
                  <Link
                    key={sheet._id}
                    href={`/prep/problem-solving/${sheet._id}`}
                    onClick={(e) => handleSheetClick(e, sheet._id)}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl"
                  >
                    <div>
                      {/* Top Meta Header */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border",
                            config.bg,
                            config.text,
                            config.border
                          )}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{sheet.category}</span>
                        </span>

                        <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                          {sheet.done || 0} / {sheet.itemCount} solved
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {sheet.title}
                      </h3>
                      {sheet.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                          {sheet.description}
                        </p>
                      )}

                      {/* Topic Preview Chips */}
                      {topicPreviews.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-3">
                          {topicPreviews.map((tName) => (
                            <span
                              key={tName}
                              className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                            >
                              {tName}
                            </span>
                          ))}
                          {remainingTopics > 0 && (
                            <span className="text-[10px] font-mono font-medium text-slate-400">
                              +{remainingTopics} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>Mastery Progress</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                          {sheet.percent || 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${sheet.percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* ── Compact List View ── */
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 overflow-hidden backdrop-blur-xl shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMySheets.map((sheet) => {
                const config = CATEGORY_CONFIG[sheet.category] || CATEGORY_CONFIG.Custom
                const IconComponent = config.icon || Layers
                return (
                  <Link
                    key={sheet._id}
                    href={`/prep/problem-solving/${sheet._id}`}
                    onClick={(e) => handleSheetClick(e, sheet._id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                          config.bg,
                          config.text,
                          config.border
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">
                            {sheet.title}
                          </h3>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.2 rounded-md border",
                              config.bg,
                              config.text,
                              config.border
                            )}
                          >
                            {sheet.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sheet.description || `${sheet.topics?.length || 0} topics · ${sheet.itemCount} problems`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                          {sheet.done || 0} / {sheet.itemCount}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sheet.percent || 0}% Complete
                        </div>
                      </div>

                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${sheet.percent || 0}%` }}
                        />
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Curated Templates Library ── */}
      {activeTab === "templates" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                <strong>Cloning a template</strong> creates an editable personal roadmap in your workspace. Progress is saved idempotently for your user account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(templates.length > 0
              ? templates
              : [
                  {
                    key: "capgemini-dsa",
                    title: "Capgemini DSA Problems",
                    category: "DSA" as const,
                    description: "Complete 150-problem Capgemini DSA assessment syllabus spanning Arrays, Strings, Sliding Window, DP, Trees, and Graphs.",
                    topicCount: 10,
                    itemCount: 150,
                  },
                ]
            ).map((tmpl) => {
              const config = CATEGORY_CONFIG[tmpl.category] || CATEGORY_CONFIG.Custom
              const IconComponent = config.icon || Binary
              return (
                <div
                  key={tmpl.key}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border",
                          config.bg,
                          config.text,
                          config.border
                        )}
                      >
                        {tmpl.category}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-3.5 group-hover:text-emerald-600 transition-colors">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {tmpl.topicCount || 10} topics · {tmpl.itemCount || 150} problems
                    </span>
                    <button
                      onClick={(e) => handleCloneClick(e, tmpl.key)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm hover:scale-105"
                    >
                      <span>Clone Roadmap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Universal Spreadsheet Importer Modal ── */}
      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        availableSheets={mySheets}
        onSuccess={() => {
          refetchSheets()
        }}
      />
    </div>
  )
}
