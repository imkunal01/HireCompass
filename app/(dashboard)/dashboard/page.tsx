"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bookmark, Send, Calendar, TrendingUp, Bell,
  Plus, ArrowRight, CheckSquare, Clock, Activity,
  Briefcase, Mail, Star, Zap, ChevronRight,
  Target, Flame
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Opportunity, DashboardStats, ActivityItem,
  normalizeStatus, STATUS_CONFIG
} from "@/types/opportunity"
import { Project } from "@/types/project"
import { CompanyAvatar, PriorityBadge, StatusBadge } from "@/components/ui/badge"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { ToastProvider } from "@/components/ui/toast"
import { SmartSuggestions } from "@/components/features/dashboard/smart-suggestions"
import { GhostingRadar } from "@/components/features/dashboard/ghosting-radar"

const EMPTY_STATS: DashboardStats = {
  totalSaved: 0, applicationsSent: 0,
  interviewsScheduled: 0, responseRate: 0, followUpsDue: 0,
}

const EMPTY_PIPELINE = [
  { status: "SAVED",       count: 0,  label: "Saved"      },
  { status: "INTERESTED",  count: 0,  label: "Interested"  },
  { status: "APPLIED",     count: 0,  label: "Applied"     },
  { status: "ASSESSMENT",  count: 0,  label: "Assessment"  },
  { status: "INTERVIEW",   count: 0,  label: "Interview"   },
  { status: "OFFER",       count: 0,  label: "Offer"       },
]

const STAT_CARDS = [
  {
    key:      "totalSaved" as keyof DashboardStats,
    label:    "Total Saved",
    sub:      "opportunities",
    icon:     Bookmark,
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)",
    glow:     "rgba(99, 102, 241, 0.25)",
    bg:       "bg-indigo-50",
    text:     "text-indigo-600",
    suffix:   "",
  },
  {
    key:      "applicationsSent" as keyof DashboardStats,
    label:    "Applied",
    sub:      "applications sent",
    icon:     Send,
    gradient: "linear-gradient(135deg, #10B981, #34D399)",
    glow:     "rgba(16, 185, 129, 0.25)",
    bg:       "bg-emerald-50",
    text:     "text-emerald-600",
    suffix:   "",
  },
  {
    key:      "interviewsScheduled" as keyof DashboardStats,
    label:    "Interviews",
    sub:      "scheduled",
    icon:     Calendar,
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    glow:     "rgba(139, 92, 246, 0.25)",
    bg:       "bg-violet-50",
    text:     "text-violet-600",
    suffix:   "",
  },
  {
    key:      "responseRate" as keyof DashboardStats,
    label:    "Response Rate",
    sub:      "above industry avg",
    icon:     TrendingUp,
    gradient: "linear-gradient(135deg, #F59E0B, #FCD34D)",
    glow:     "rgba(245, 158, 11, 0.25)",
    bg:       "bg-amber-50",
    text:     "text-amber-600",
    suffix:   "%",
  },
  {
    key:      "followUpsDue" as keyof DashboardStats,
    label:    "Follow-ups Due",
    sub:      "need attention",
    icon:     Bell,
    gradient: "linear-gradient(135deg, #F43F5E, #FB7185)",
    glow:     "rgba(244, 63, 94, 0.25)",
    bg:       "bg-rose-50",
    text:     "text-rose-600",
    suffix:   "",
  },
]

const ACTIVITY_CONFIG: Record<string, { icon: React.ComponentType<{className?:string}>; bg: string; text: string }> = {
  JOB_ADDED:           { icon: Briefcase,  bg: "bg-indigo-100",  text: "text-indigo-600"  },
  STATUS_CHANGED:      { icon: Activity,   bg: "bg-emerald-100", text: "text-emerald-600" },
  EMAIL_SENT:          { icon: Mail,       bg: "bg-sky-100",     text: "text-sky-600"     },
  INTERVIEW_SCHEDULED: { icon: Calendar,   bg: "bg-violet-100",  text: "text-violet-600"  },
  NOTE_ADDED:          { icon: CheckSquare,bg: "bg-slate-100",   text: "text-slate-600"   },
}

const URGENCY_STYLES: Record<string, string> = {
  high:   "bg-rose-50 text-rose-600 border border-rose-200",
  medium: "bg-amber-50 text-amber-600 border border-amber-200",
  low:    "bg-slate-100 text-slate-500 border border-slate-200",
  done:   "bg-slate-50 text-slate-400 border border-slate-200",
}

function formatRelativeTime(ts: string | Date) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export default function DashboardPage() {
  const [localTaskDone, setLocalTaskDone] = useState<Record<string, boolean>>({})
  const [addModalOpen,setAddModalOpen] = useState(false)
  const [selectedOpp, setSelectedOpp]  = useState<Opportunity | null>(null)

  const { data: stats }        = useQuery<DashboardStats>({ queryKey: ["dashboard-stats"],    queryFn: async () => { const r = await fetch("/api/dashboard/stats");    if (!r.ok) throw new Error(); return r.json() } })
  const { data: activity }     = useQuery<ActivityItem[]>({ queryKey: ["dashboard-activity"], queryFn: async () => { const r = await fetch("/api/dashboard/activity"); if (!r.ok) throw new Error(); return r.json() } })
  const { data: opportunities } = useQuery<Opportunity[]>({ queryKey: ["opportunities"],      queryFn: async () => { const r = await fetch("/api/opportunities");       if (!r.ok) throw new Error(); return r.json() } })
  const { data: reminders }     = useQuery<any[]>({         queryKey: ["reminders"],           queryFn: async () => { const r = await fetch("/api/reminders");            if (!r.ok) return [];  return r.json() } })
  const { data: projects }      = useQuery<Project[]>({     queryKey: ["projects"],            queryFn: async () => { const r = await fetch("/api/projects");             if (!r.ok) return [];  return r.json() } })

  const displayStats    = stats    || EMPTY_STATS
  const displayActivity = activity || []
  const pipelineCards   = opportunities || []

  const pipelineCounts = EMPTY_PIPELINE.map((col) => {
    if (opportunities && opportunities.length > 0) {
      const count = opportunities.filter(
        (o) => normalizeStatus(o.status) === col.status || o.status === col.status
      ).length
      return { ...col, count }
    }
    return col
  })

  // Build tasks from real data sources
  const tasks = React.useMemo(() => {
    const items: { id: string; label: string; dueLabel: string; urgency: string; done: boolean }[] = []
    const now = Date.now()

    // Add due reminders as tasks
    if (reminders) {
      for (const rem of reminders) {
        const dueDate = rem.dueDate ? new Date(rem.dueDate) : null
        if (!dueDate) continue
        const daysUntil = Math.ceil((dueDate.getTime() - now) / 86400000)
        if (daysUntil > 7) continue
        const urgency = daysUntil < 0 ? "high" : daysUntil === 0 ? "high" : daysUntil <= 2 ? "medium" : "low"
        const dueLabel = daysUntil < 0 ? "Overdue" : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`
        items.push({
          id: `rem-${rem.id || rem._id}`,
          label: `${rem.company ? `[${rem.company}] ` : ""}${rem.message || rem.title || "Follow up"}`,
          dueLabel,
          urgency,
          done: localTaskDone[`rem-${rem.id || rem._id}`] || false,
        })
      }
    }

    // Add follow-up suggestions from applied opportunities > 7 days ago
    if (opportunities) {
      const followUps = opportunities.filter((o) => {
        if (normalizeStatus(o.status) !== "APPLIED") return false
        if (!o.createdAt) return false
        const daysSince = Math.floor((now - new Date(o.createdAt).getTime()) / 86400000)
        return daysSince >= 7 && daysSince <= 30
      })
      for (const opp of followUps.slice(0, 3)) {
        const id = `followup-${opp.id}`
        items.push({
          id,
          label: `Follow up with ${opp.company} (${opp.title})`,
          dueLabel: "Due",
          urgency: "medium",
          done: localTaskDone[id] || false,
        })
      }
    }

    return items.slice(0, 8)
  }, [reminders, opportunities, localTaskDone])

  const toggleTask = (id: string) =>
    setLocalTaskDone((prev) => ({ ...prev, [id]: !prev[id] }))

  const completedCount = tasks.filter((t) => t.done).length
  const progressPct    = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <ToastProvider>
      <div className="space-y-7">

        {/* ═══════════════════════════════════════════════
            WELCOME BANNER
        ═══════════════════════════════════════════════ */}
        <div className="animate-slide-up relative overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          {/* Accent strip */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-indigo-500 to-violet-600" />

          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-50 opacity-60 blur-3xl" />
            <div className="absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-violet-50 opacity-40 blur-2xl" />
          </div>

          <div className="relative pl-8 pr-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                  Active Search
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome back! 👋
              </h1>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                You have{" "}
                <span className="font-bold text-rose-500">{displayStats.followUpsDue} follow-ups</span>{" "}
                due today and{" "}
                <span className="font-bold text-indigo-600">{displayStats.interviewsScheduled} interviews</span>{" "}
                coming up. Keep pushing!
              </p>
            </div>

            <button
              onClick={() => setAddModalOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl text-white px-5 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
                boxShadow:  "0 4px 15px rgba(99, 102, 241, 0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.5)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = ""
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.35)"
              }}
            >
              <Plus className="h-4 w-4" /> Add Job
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            STAT CARDS — 5 columns
        ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card, idx) => (
            <div
              key={card.key}
              className={cn(
                "animate-slide-up group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5",
                "hover:shadow-card-hover hover:border-slate-300/60 transition-all duration-200 cursor-default"
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Top row: icon + mini trend */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105"
                  style={{ background: card.gradient, boxShadow: `0 4px 12px ${card.glow}` }}
                >
                  <card.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div className={cn("flex items-center gap-0.5 text-[10px] font-bold", card.text)}>
                  <TrendingUp className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>

              {/* Number */}
              <div className={cn("text-3xl font-black text-slate-900 tabular-nums leading-none animate-count-up")}
                style={{ animationDelay: `${idx * 80 + 200}ms` }}>
                {displayStats[card.key]}{card.suffix}
              </div>

              {/* Label + sub */}
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs font-semibold text-slate-600">{card.label}</p>
                <p className="text-[10px] text-slate-400">{card.sub}</p>
              </div>

              {/* Bottom accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: card.gradient }}
              />
            </div>
          ))}
        </div>

        {/* Smart Suggestions & Ghosting Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up delay-300">
          <SmartSuggestions />
          <GhostingRadar />
        </div>

        {/* ═══════════════════════════════════════════════
            MAIN GRID — Pipeline + Tasks | Activity
        ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-200">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pipeline Kanban Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <Target className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm">Application Pipeline</h2>
                </div>
                <Link
                  href="/applications"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                >
                  Manage Board <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Status pills */}
              <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-slate-50 bg-slate-50/50">
                {pipelineCounts.map((col) => {
                  const config = STATUS_CONFIG[col.status]
                  return (
                    <div
                      key={col.status}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shrink-0 shadow-inner-sm"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: config?.color ?? "#94A3B8" }}
                      />
                      <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                      <span className="text-xs font-black text-slate-900 tabular-nums">{col.count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Cards */}
              <div className="flex gap-3 p-5 overflow-x-auto">
                {pipelineCards.slice(0, 8).map((opp) => {
                  const status = normalizeStatus(opp.status)
                  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
                  const isUrgent = opp.deadline &&
                    (new Date(opp.deadline).getTime() - Date.now()) < 3 * 86400000

                  return (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className={cn(
                        "flex flex-col gap-3 min-w-[170px] max-w-[170px] rounded-xl border border-slate-200/80 bg-white p-3.5",
                        "hover:border-indigo-200 hover:shadow-card-hover transition-all duration-200 text-left group"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CompanyAvatar company={opp.company} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{opp.company}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{opp.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={status} />
                        {opp.priority && <PriorityBadge priority={opp.priority} />}
                      </div>
                      {opp.deadline && (
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-semibold",
                          isUrgent ? "text-rose-500" : "text-slate-400"
                        )}>
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* View All card */}
                <Link
                  href="/applications"
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[130px] rounded-xl",
                    "border-2 border-dashed border-slate-200 text-slate-400",
                    "hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-150 gap-2"
                  )}
                >
                  <ArrowRight className="h-4.5 w-4.5" />
                  <span className="text-xs font-semibold">View All</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm">Upcoming Tasks</h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{progressPct}%</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {tasks.filter((t) => !t.done).length} left
                  </span>
                </div>
              </div>

              {/* Task list */}
              <div className="divide-y divide-slate-50">
                {tasks.length === 0 ? (
                  <div className="px-5 py-8 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-500">All caught up! 🎉</p>
                    <p className="text-[11px] text-slate-400">
                      No pending tasks. Reminders due soon and follow-ups will appear here.
                    </p>
                  </div>
                ) : tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors duration-100"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
                        task.done
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300 hover:border-indigo-400"
                      )}
                    >
                      {task.done && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    {/* Label */}
                    <p className={cn(
                      "flex-1 text-sm leading-snug transition-all duration-200",
                      task.done ? "line-through text-slate-400" : "text-slate-700"
                    )}>
                      {task.label}
                    </p>

                    {/* Due badge */}
                    <span className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap",
                      URGENCY_STYLES[task.done ? "done" : task.urgency]
                    )}>
                      {task.dueLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1/3 — Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <Activity className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">Recent Activity</h2>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50/80">
              {displayActivity.map((item, i) => {
                const cfg    = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.NOTE_ADDED
                const Icon   = cfg.icon
                const isLast = i === displayActivity.length - 1

                return (
                  <div key={item.id} className="flex gap-3.5 px-5 py-4 relative hover:bg-slate-50/40 transition-colors">
                    {!isLast && (
                      <div className="absolute left-[36px] top-12 bottom-0 w-px bg-slate-100" />
                    )}
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl z-10 mt-0.5",
                      cfg.bg, cfg.text
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-slate-100 p-4">
              <Link
                href="/analytics"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-150"
              >
                <Star className="h-3.5 w-3.5" />
                View Full Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            PROJECTS PREVIEW
        ═══════════════════════════════════════════════ */}
        {projects && projects.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-slide-up delay-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <Star className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">My Projects</h2>
              </div>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
              >
                Manage Projects <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5">
              {projects.slice(0, 3).map((proj) => (
                <Link
                  key={proj.id}
                  href="/projects"
                  className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 hover:border-emerald-200 hover:shadow-card-hover transition-all duration-200 text-left group block"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 truncate">{proj.name}</h3>
                    {proj.snippets?.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {proj.snippets.length} summaries
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-auto pt-2">
                      {proj.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                      {proj.techStack.length > 3 && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          +{proj.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      <AddJobModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <JobDrawer opportunityId={selectedOpp?.id ?? null} initialData={selectedOpp ?? undefined} onClose={() => setSelectedOpp(null)} />
    </ToastProvider>
  )
}
