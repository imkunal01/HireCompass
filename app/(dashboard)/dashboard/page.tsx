"use client"

import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import {
  Briefcase,
  Send,
  Calendar,
  TrendingUp,
  Bell,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Lightbulb,
  Zap,
  Plus,
  FileText,
  Building2,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import {
  Opportunity,
  DashboardStats,
  ActivityItem,
  normalizeStatus,
} from "@/types/opportunity"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { ToastProvider } from "@/components/ui/toast"

const EMPTY_STATS: DashboardStats = {
  totalSaved: 0,
  applicationsSent: 0,
  interviewsScheduled: 0,
  responseRate: 0,
  followUpsDue: 0,
}

const PIPELINE_COLUMNS = [
  { key: "SAVED", label: "Saved", dotColor: "#3B82F6" },
  { key: "APPLIED", label: "Applied", dotColor: "#10B981" },
  { key: "ASSESSMENT", label: "OA / Assessment", dotColor: "#8B5CF6" },
  { key: "INTERVIEW", label: "Interview", dotColor: "#F59E0B" },
  { key: "OFFER", label: "Offer", dotColor: "#22C55E" },
  { key: "GHOSTED", label: "Ghosted", dotColor: "#64748B" },
  { key: "REJECTED", label: "Rejected", dotColor: "#EF4444" },
]

export default function DashboardPage() {
  const { user } = useUser()
  const userName = user?.name || "kunal"

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [selectedDate, setSelectedDate] = useState<number>(3)

  // Focus tasks state (stored locally)
  const [focusTasks, setFocusTasks] = useState([
    { id: "1", text: "Apply to at least 2 jobs", done: false },
    { id: "2", text: "Update resume", done: false },
    { id: "3", text: "Check for follow-ups", done: false },
  ])

  const toggleFocusTask = (id: string) => {
    setFocusTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const completedFocusCount = focusTasks.filter((t) => t.done).length

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats")
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const r = await fetch("/api/opportunities")
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const displayStats = stats || EMPTY_STATS

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    return PIPELINE_COLUMNS.map((col) => {
      const count = opportunities.filter((o) => {
        const norm = normalizeStatus(o.status)
        return norm === col.key || o.status === col.key
      }).length
      return { ...col, count }
    })
  }, [opportunities])

  // Top saved companies
  const savedCompanies = useMemo(() => {
    const map = new Map<string, number>()
    opportunities.forEach((opp) => {
      if (opp.company) {
        map.set(opp.company, (map.get(opp.company) || 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [opportunities])

  // Upcoming interviews
  const upcomingInterviews = useMemo(() => {
    return opportunities.filter((o) => normalizeStatus(o.status) === "INTERVIEW")
  }, [opportunities])

  return (
    <ToastProvider>
      <div className="space-y-6">

        {/* ═══════════════════════════════════════════════════
            ROW 1: HERO GREETING + TODAY'S FOCUS + CALENDAR
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* 1. Hero Greeting Banner Card (Matches Template) */}
          <div className="col-span-12 lg:col-span-6 relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[190px]">
            {/* Scenic Mountain Sunrise Illustration (Right Half) */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none">
              <img
                src="/images/hero-mountains.jpg"
                alt="Sunrise Mountains"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-slate-900 dark:via-slate-900/40" />
            </div>

            {/* Content (Left Half) */}
            <div className="relative z-10 max-w-[55%] space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Good to see you again,
              </h1>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                <span>{userName}</span>
                <span className="text-2xl sm:text-3xl">👋</span>
              </div>
              {user?.role === "admin" && (
                <div className="pt-1.5">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs transition-colors group"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                    <span>Admin Control Center</span>
                    <ArrowRight className="h-3 w-3 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            <p className="relative z-10 text-xs text-slate-400 dark:text-slate-500 italic mt-4 max-w-[65%]">
              &ldquo;Small consistent steps lead to big opportunities.&rdquo;
            </p>
          </div>

          {/* 2. Today's Focus Card (Matches Template) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Today&apos;s Focus</h2>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                {completedFocusCount}/3
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-3 my-auto py-2">
              {focusTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleFocusTask(task.id)}
                  className="flex items-center gap-2.5 w-full text-left group"
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                      task.done
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-500"
                    )}
                  >
                    {task.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </div>
                  <span
                    className={cn(
                      "text-xs leading-snug transition-all duration-150",
                      task.done
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium"
                    )}
                  >
                    {task.text}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/80">
              {completedFocusCount === 3 ? "All tasks finished for today! 🎉" : "Keep up your daily momentum."}
            </div>
          </div>

          {/* 3. October 2026 Calendar Widget (Matches Template) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                October 2026
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 text-center gap-y-1 text-xs">
              {/* Previous month days */}
              <span className="text-slate-300 dark:text-slate-600 py-0.5">25</span>
              <span className="text-slate-300 dark:text-slate-600 py-0.5">28</span>
              <span className="text-slate-300 dark:text-slate-600 py-0.5">29</span>
              <span className="text-slate-300 dark:text-slate-600 py-0.5">30</span>
              {/* October days */}
              <button onClick={() => setSelectedDate(1)} className={cn("py-0.5 rounded-md", selectedDate === 1 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>1</button>
              <button onClick={() => setSelectedDate(2)} className={cn("py-0.5 rounded-md", selectedDate === 2 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>2</button>
              <button onClick={() => setSelectedDate(3)} className={cn("py-0.5 rounded-md font-bold", selectedDate === 3 ? "bg-indigo-600 text-white shadow-xs" : "text-indigo-600")}>3</button>

              <button onClick={() => setSelectedDate(4)} className={cn("py-0.5 rounded-md", selectedDate === 4 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>4</button>
              <button onClick={() => setSelectedDate(5)} className={cn("py-0.5 rounded-md", selectedDate === 5 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>5</button>
              <button onClick={() => setSelectedDate(6)} className={cn("py-0.5 rounded-md", selectedDate === 6 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>6</button>
              <button onClick={() => setSelectedDate(7)} className={cn("py-0.5 rounded-md", selectedDate === 7 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>7</button>
              <button onClick={() => setSelectedDate(8)} className={cn("py-0.5 rounded-md", selectedDate === 8 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>8</button>
              <button onClick={() => setSelectedDate(9)} className={cn("py-0.5 rounded-md", selectedDate === 9 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>9</button>
              <button onClick={() => setSelectedDate(10)} className={cn("py-0.5 rounded-md", selectedDate === 10 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>10</button>

              <button onClick={() => setSelectedDate(11)} className={cn("py-0.5 rounded-md", selectedDate === 11 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>11</button>
              <button onClick={() => setSelectedDate(12)} className={cn("py-0.5 rounded-md", selectedDate === 12 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>12</button>
              <button onClick={() => setSelectedDate(13)} className={cn("py-0.5 rounded-md", selectedDate === 13 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>13</button>
              <button onClick={() => setSelectedDate(14)} className={cn("py-0.5 rounded-md", selectedDate === 14 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>14</button>
              <button onClick={() => setSelectedDate(15)} className={cn("py-0.5 rounded-md", selectedDate === 15 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>15</button>
              <button onClick={() => setSelectedDate(16)} className={cn("py-0.5 rounded-md", selectedDate === 16 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>16</button>
              <button onClick={() => setSelectedDate(17)} className={cn("py-0.5 rounded-md", selectedDate === 17 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>17</button>

              <button onClick={() => setSelectedDate(18)} className={cn("py-0.5 rounded-md", selectedDate === 18 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>18</button>
              <button onClick={() => setSelectedDate(19)} className={cn("py-0.5 rounded-md", selectedDate === 19 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>19</button>
              <button onClick={() => setSelectedDate(20)} className={cn("py-0.5 rounded-md", selectedDate === 20 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>20</button>
              <button onClick={() => setSelectedDate(21)} className={cn("py-0.5 rounded-md", selectedDate === 21 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>21</button>
              <button onClick={() => setSelectedDate(22)} className={cn("py-0.5 rounded-md", selectedDate === 22 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>22</button>
              <button onClick={() => setSelectedDate(23)} className={cn("py-0.5 rounded-md", selectedDate === 23 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>23</button>
              <button onClick={() => setSelectedDate(24)} className={cn("py-0.5 rounded-md", selectedDate === 24 ? "bg-indigo-600 text-white font-bold" : "text-slate-700 dark:text-slate-300")}>24</button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 2: 5 KPI METRIC CARDS (Exact Template Replicated)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* 1. Total Saved */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
              {/* Blue sparkline wave */}
              <svg className="w-16 h-7 text-blue-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 18 C15 17, 25 10, 35 12 C45 14, 50 6, 58 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.totalSaved}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Total Saved</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Jobs you&apos;re tracking</p>
            </div>
          </div>

          {/* 2. Applied */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                <Send className="h-5 w-5" />
              </div>
              {/* Teal sparkline wave */}
              <svg className="w-16 h-7 text-teal-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 20 C12 18, 22 14, 32 8 C42 4, 50 7, 58 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.applicationsSent}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Applied</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Applications sent</p>
            </div>
          </div>

          {/* 3. Interviews */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
              {/* Purple sparkline wave */}
              <svg className="w-16 h-7 text-purple-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 17 C15 15, 25 18, 35 10 C45 6, 50 10, 58 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.interviewsScheduled}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Interviews</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Upcoming & completed</p>
            </div>
          </div>

          {/* 4. Response Rate */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              {/* Amber sparkline wave */}
              <svg className="w-16 h-7 text-amber-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 19 C14 18, 24 16, 34 11 C44 7, 50 9, 58 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.responseRate}%
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Response Rate</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Applications getting a response</p>
            </div>
          </div>

          {/* 5. Follow-ups Due */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                <Bell className="h-5 w-5" />
              </div>
              {/* Rose sparkline wave */}
              <svg className="w-16 h-7 text-rose-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 15 C15 12, 25 16, 35 10 C45 6, 50 12, 58 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.followUpsDue}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Follow-ups Due</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Need your attention</p>
            </div>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 3: APPLICATION PIPELINE (50%) + RECENT ACTIVITY (25%) + SUGGESTIONS & ACTIONS (25%)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* 1. Left Wide Card: Application Pipeline (col-span-12 lg:col-span-6) */}
          <div className="col-span-12 lg:col-span-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Application Pipeline</h2>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                Last 30 days <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {pipelineCounts.map((pill) => (
                <div
                  key={pill.key}
                  className="flex items-center gap-1.5 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pill.dotColor }} />
                  <span>{pill.label}</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 ml-0.5">{pill.count}</span>
                </div>
              ))}
            </div>

            {/* Line Chart Area (Replicated from template) */}
            <div className="w-full h-44 relative flex flex-col justify-end pt-2">
              {/* Y Axis Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 pr-2">
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">4</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">3</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">2</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">1</span>
                </div>
                <div className="border-b border-slate-200 dark:border-slate-700 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">0</span>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="relative pl-6 pr-2 h-36">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Applications trend line (purple) */}
                  <path
                    d="M 10 115 L 60 115 L 110 115 L 160 115 L 210 115 L 260 115 L 310 115 L 360 115 L 410 115 L 460 115 L 490 115"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2.5"
                  />
                  {/* Purple Data Dots */}
                  {[10, 60, 110, 160, 210, 260, 310, 360, 410, 460, 490].map((cx, idx) => (
                    <circle key={`dot-app-${idx}`} cx={cx} cy={115} r="3.5" fill="#8B5CF6" />
                  ))}

                  {/* Interviews trend line (teal) */}
                  <path
                    d="M 10 115 L 60 115 L 110 115 L 160 115 L 210 115 L 260 115 L 310 115 L 360 115 L 410 115 L 460 115 L 490 115"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>

              {/* X Axis Date labels */}
              <div className="flex justify-between pl-6 pr-2 text-[10px] text-slate-400 mt-1 select-none">
                <span>Sep 4</span>
                <span>Sep 7</span>
                <span>Sep 10</span>
                <span>Sep 13</span>
                <span>Sep 16</span>
                <span>Sep 19</span>
                <span>Sep 22</span>
                <span>Sep 25</span>
                <span>Sep 28</span>
                <span>Oct 1</span>
                <span>Oct 3</span>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/80 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>Applications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                <span>Interviews</span>
              </div>
            </div>
          </div>

          {/* 2. Middle Card: Recent Activity (col-span-12 sm:col-span-6 lg:col-span-3) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                  <Activity className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Recent Activity</h2>
              </div>
              <Link href="/analytics" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Activity Items List (Matching exact template texts and styled circle icons) */}
            <div className="space-y-4">
              
              {/* Item 1: Purple icon */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Finally online?</p>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Hurry up, we have work to do.</p>
                </div>
              </div>

              {/* Item 2: Yellow icon */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Welcome to HireCompass</p>
                    <span className="text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Your job search journey starts here.</p>
                </div>
              </div>

              {/* Item 3: Teal icon */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Send className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Explore opportunities</p>
                    <span className="text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Start by adding jobs you&apos;re interested in.</p>
                </div>
              </div>

              {/* Item 4: Coral icon */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Set up reminders</p>
                    <span className="text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Never miss an important follow-up.</p>
                </div>
              </div>

              {/* Item 5: Blue icon */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Track your progress</p>
                    <span className="text-[10px] text-slate-400">2d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Stay consistent and land your dream job.</p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Right Column: Smart Suggestions & Quick Actions (col-span-12 sm:col-span-6 lg:col-span-3 space-y-5) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-5">
            
            {/* Card A: Smart Suggestions [2] */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-500">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Smart Suggestions</h3>
                </div>
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  2
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Google Suggestion */}
                <div
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850 cursor-pointer transition-all group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-rose-500">
                    G
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      Google deadline in 1d
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      &ldquo;You saved &apos;Software Engineer Intern&apos; but haven&apos;t applied yet.&rdquo;
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Stripe Suggestion */}
                <Link
                  href="/outreach"
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850 cursor-pointer transition-all group block"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black shadow-xs">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      Follow up with Stripe
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      8 days since applying to &apos;Fullstack Developer&apos;. Reach out!
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card B: Quick Actions (2x2 Grid) */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Quick Actions</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Add Job */}
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 border border-slate-100 dark:border-slate-800 transition-all group text-left"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold shadow-xs">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-1">
                    Add Job
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Track a new opportunity
                  </span>
                </button>

                {/* 2. Upload Resume */}
                <Link
                  href="/resumes"
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-slate-100 dark:border-slate-800 transition-all group text-left"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold shadow-xs">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 mt-1">
                    Upload Resume
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Keep it updated
                  </span>
                </Link>

                {/* 3. Set Reminder */}
                <Link
                  href="/reminders"
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50/70 dark:hover:bg-rose-950/50 border border-slate-100 dark:border-slate-800 transition-all group text-left"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mt-1">
                    Set Reminder
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Never miss a follow-up
                  </span>
                </Link>

                {/* 4. View Analytics */}
                <Link
                  href="/analytics"
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/50 border border-slate-100 dark:border-slate-800 transition-all group text-left"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold shadow-xs">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1">
                    View Analytics
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Track your progress
                  </span>
                </Link>

                {/* 5. Admin Panel (For Admins) */}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="col-span-2 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-50/90 via-rose-50/60 to-indigo-50/60 hover:from-rose-100 hover:to-indigo-100 border border-rose-200/80 transition-all group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white text-xs font-bold shadow-xs">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-rose-700 group-hover:text-rose-800">
                            Admin Control Center
                          </span>
                          <span className="rounded bg-rose-200/80 px-1 text-[8px] font-black text-rose-700">
                            ADMIN
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight">
                          Manage platform users, resumes & AI quotas
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 4: BOTTOM 2 CARDS (Upcoming Interviews & Top Companies Saved)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Upcoming Interviews */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between min-h-[170px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Upcoming Interviews</h3>
              </div>
              <Link href="/interviews" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingInterviews.length === 0 ? (
              /* Empty State matching template */
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Calendar className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No interviews scheduled</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Your upcoming interviews will appear here.</p>
                <Link
                  href="/opportunities"
                  className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Browse Opportunities <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2">
                {upcomingInterviews.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.company}</p>
                      <p className="text-[10px] text-slate-400">{item.title}</p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                      Interview
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Top Companies (Saved) */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between min-h-[170px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Top Companies (Saved)</h3>
              </div>
              <Link href="/opportunities" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {savedCompanies.length === 0 ? (
              /* Empty State matching template */
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Building2 className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No companies yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Start saving jobs to see your top companies here.</p>
                <Link
                  href="/opportunities"
                  className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Explore Jobs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 my-2">
                {savedCompanies.map((c) => (
                  <div key={c.name} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full">
                      {c.count} {c.count === 1 ? "job" : "jobs"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      <AddJobModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <JobDrawer
        opportunityId={selectedOpp?.id ?? null}
        initialData={selectedOpp ?? undefined}
        onClose={() => setSelectedOpp(null)}
      />
    </ToastProvider>
  )
}
