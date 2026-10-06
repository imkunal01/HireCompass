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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { SheetListItem, TemplateSummary } from "@/types/sheet"
import { CsvImportModal } from "@/components/features/sheets/csv-import-modal"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/components/features/auth/auth-modal"

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DSA: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  OS: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  CN: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  DBMS: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  "System Design": { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  Development: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" },
  Custom: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
}

export default function ProblemSolvingPrepPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isLoadingUser } = useUser()
  const { openAuthModal } = useAuthModal()

  const [activeView, setActiveView] = useState<"my-sheets" | "templates">("my-sheets")
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

  const sheets = sheetsData?.sheets || []
  const templates = templatesData?.templates || []

  const mySheets = useMemo(() => {
    const personal = sheets.filter((s) => !s.isTemplate)
    if (personal.length > 0) return personal
    // If no personal roadmaps created yet (e.g. guest mode or initial load), surface the default Capgemini DSA roadmap
    return sheets.filter((s) => s.isTemplate && s.templateKey === "capgemini-dsa")
  }, [sheets])

  const totalSolved = mySheets.reduce((acc, s) => acc + (s.done || 0), 0)
  const totalItems = mySheets.reduce((acc, s) => acc + (s.itemCount || 0), 0)
  const overallPercent = totalItems > 0 ? Math.round((totalSolved / totalItems) * 100) : 0

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/90 via-slate-50/50 to-white/70 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
                <ListChecks className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Problem Solving & Topic Roadmaps
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Engineering Revision Roadmaps
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Curated sheets, topic mastery progress meters, and bulk import from Excel or CSV with zero AI waste.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/prep"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
            >
              <BrainCircuit className="w-4 h-4 text-violet-500" />
              <span>Interview Cockpit</span>
            </Link>

            <button
              onClick={handleImportCsvClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-all shadow-sm hover:scale-[1.02]"
              title="Import problems from Excel or CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Import Excel / CSV</span>
            </button>

            <Link
              href="/prep/problem-solving/new"
              onClick={handleNewSheetClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-emerald-500/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Custom Sheet</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Summary Stats Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:border-indigo-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Active Roadmaps</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {mySheets.length}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Personal & cloned sheets in your workspace</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Problems Mastered</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalSolved} <span className="text-sm font-semibold text-slate-400">/ {totalItems}</span>
          </p>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:border-amber-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Overall Completion</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {overallPercent}%
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Weighted progress across all topics</p>
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

      {/* ── View Switch Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveView("my-sheets")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200",
            activeView === "my-sheets"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <FolderOpen className="w-4 h-4" />
          <span>My Roadmaps</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-mono", activeView === "my-sheets" ? "bg-white/20 dark:bg-black/20" : "bg-slate-200 dark:bg-slate-800")}>
            {mySheets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveView("templates")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200",
            activeView === "templates"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curated Templates Library</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            {templates.length > 0 ? templates.length : "1"}
          </span>
        </button>
      </div>

      {/* ── View 1: My Sheets ── */}
      {activeView === "my-sheets" && (
        <div>
          {loadingSheets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 animate-pulse" />
              ))}
            </div>
          ) : mySheets.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <ListChecks className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No active roadmaps in your workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Start from one of our curated engineering templates or bulk import problems from your Excel / CSV file.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveView("templates")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-500/20 transition-all hover:scale-105"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mySheets.map((sheet) => {
                const colors = CATEGORY_COLORS[sheet.category] || CATEGORY_COLORS.Custom
                return (
                  <Link
                    key={sheet._id}
                    href={`/prep/problem-solving/${sheet._id}`}
                    onClick={(e) => handleSheetClick(e, sheet._id)}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={cn("text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border", colors.bg, colors.text, colors.border)}>
                          {sheet.category}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                          {sheet.done || 0} / {sheet.itemCount} done
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {sheet.title}
                      </h3>
                      {sheet.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-normal">
                          {sheet.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>Mastery Progress</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                          {sheet.percent || 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
          )}
        </div>
      )}

      {/* ── View 2: Curated Templates Library ── */}
      {activeView === "templates" && (
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
              const colors = CATEGORY_COLORS[tmpl.category] || CATEGORY_COLORS.Custom
              return (
                <div
                  key={tmpl.key}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                        <Binary className="w-5 h-5" />
                      </div>
                      <span className={cn("text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border", colors.bg, colors.text, colors.border)}>
                        {tmpl.category}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3.5 group-hover:text-emerald-500 transition-colors">
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
