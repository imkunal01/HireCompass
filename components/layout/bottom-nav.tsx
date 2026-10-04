"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Briefcase,
  Calendar,
  BarChart3,
  LayoutGrid,
  X,
  Terminal,
  ListChecks,
  BrainCircuit,
  CalendarCheck,
  FolderGit2,
  FileText,
  Send,
  AlertOctagon,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav() {
  const pathname = usePathname()
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false)
  const [inExam, setInExam] = useState(false)

  // Listen to exam mode events to suppress bottom nav during tests
  useEffect(() => {
    const check = () => {
      const isExam =
        document.body.classList.contains("exam-mode-active") ||
        document.body.getAttribute("data-in-exam") === "true"
      setInExam(isExam)
    }
    check()

    const handler = (e: any) => {
      setInExam(e.detail?.inExam ?? document.body.classList.contains("exam-mode-active"))
    }

    window.addEventListener("exam-mode-change", handler)
    return () => window.removeEventListener("exam-mode-change", handler)
  }, [pathname])

  // Don't render bottom nav during exams
  if (inExam) return null

  const isHome = pathname === "/dashboard"
  const isJobs = pathname.startsWith("/applications") || pathname.startsWith("/opportunities")
  const isInterviews = pathname.startsWith("/interviews")
  const isAnalytics = pathname.startsWith("/analytics")
  const isTools =
    pathname.startsWith("/prep") ||
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/outreach") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/resumes") ||
    pathname.startsWith("/rejected") ||
    pathname.startsWith("/settings")

  return (
    <>
      {/* ── Floating Mobile Bottom Navigation Pill (md:hidden) ── */}
      <div className="fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <nav
          id="mobile-bottom-nav"
          className="pointer-events-auto rounded-full bg-white/35 dark:bg-slate-900/40 backdrop-blur-2xl backdrop-saturate-200 border border-white/60 dark:border-white/15 shadow-[0_8px_32px_0_rgba(31,38,135,0.12),inset_0_1px_2px_0_rgba(255,255,255,0.85)] px-2.5 py-1.5 transition-all duration-300"
        >
          <div className="flex items-center justify-around gap-1">
            
            {/* 1. Home */}
            <Link
              href="/dashboard"
              onClick={() => setToolsSheetOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all duration-150 relative",
                isHome
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/20"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", isHome ? "bg-white/60 dark:bg-white/10 shadow-sm border border-white/80" : "bg-transparent")}>
                <Home className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none font-medium">Home</span>
              {isHome && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              )}
            </Link>

            {/* 2. Jobs */}
            <Link
              href="/applications"
              onClick={() => setToolsSheetOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all duration-150 relative",
                isJobs
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/20"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", isJobs ? "bg-white/60 dark:bg-white/10 shadow-sm border border-white/80" : "bg-transparent")}>
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none font-medium">Jobs</span>
              {isJobs && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              )}
            </Link>

            {/* 3. Interviews */}
            <Link
              href="/interviews"
              onClick={() => setToolsSheetOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all duration-150 relative",
                isInterviews
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/20"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", isInterviews ? "bg-white/60 dark:bg-white/10 shadow-sm border border-white/80" : "bg-transparent")}>
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none font-medium">Interviews</span>
              {isInterviews && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              )}
            </Link>

            {/* 4. Analytics */}
            <Link
              href="/analytics"
              onClick={() => setToolsSheetOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all duration-150 relative",
                isAnalytics
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/20"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", isAnalytics ? "bg-white/60 dark:bg-white/10 shadow-sm border border-white/80" : "bg-transparent")}>
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none font-medium">Analytics</span>
              {isAnalytics && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              )}
            </Link>

            {/* 5. Tools (Drawer Trigger) */}
            <button
              onClick={() => setToolsSheetOpen((v) => !v)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all duration-150 relative",
                isTools || toolsSheetOpen
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/20"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", (isTools || toolsSheetOpen) ? "bg-white/60 dark:bg-white/10 shadow-sm border border-white/80" : "bg-transparent")}>
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none font-medium">Tools</span>
              {(isTools || toolsSheetOpen) && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              )}
            </button>

          </div>
        </nav>
      </div>

      {/* ── Mobile Tools Bottom Sheet / Drawer ── */}
      {toolsSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All Features & Tools</h3>
                  <p className="text-[10px] text-slate-400">Jump directly to any ecosystem tool</p>
                </div>
              </div>
              <button
                onClick={() => setToolsSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Group 1: Interview & Testing */}
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-1">
                Interview & Assessment Arena
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/assessment"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <Terminal className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">AI Exam</span>
                      <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 px-1 rounded">EXAM</span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">Capgemini console</p>
                  </div>
                </Link>

                <Link
                  href="/prep/problem-solving"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <ListChecks className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">DSA Sheets</span>
                    <p className="text-[9px] text-slate-400 truncate">Roadmaps & topics</p>
                  </div>
                </Link>

                <Link
                  href="/prep"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-purple-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <BrainCircuit className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">The Griller</span>
                    <p className="text-[9px] text-slate-400 truncate">Live project defense</p>
                  </div>
                </Link>

                <Link
                  href="/rejected"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-rose-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                    <AlertOctagon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Rejections</span>
                    <p className="text-[9px] text-slate-400 truncate">Autopsy drills</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Group 2: Execution & Vault */}
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Daily Execution & Career Vault
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/planner"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-amber-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <CalendarCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Day Planner</span>
                    <p className="text-[9px] text-slate-400 truncate">Timeboxed study</p>
                  </div>
                </Link>

                <Link
                  href="/projects"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-blue-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <FolderGit2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Project Vault</span>
                    <p className="text-[9px] text-slate-400 truncate">Specs & code notes</p>
                  </div>
                </Link>

                <Link
                  href="/resumes"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-cyan-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Resume Studio</span>
                    <p className="text-[9px] text-slate-400 truncate">ATS score & versions</p>
                  </div>
                </Link>

                <Link
                  href="/outreach"
                  onClick={() => setToolsSheetOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-violet-200 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Cold Outreach</span>
                    <p className="text-[9px] text-slate-400 truncate">AI email drafts</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setToolsSheetOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Account & AI Quota Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
