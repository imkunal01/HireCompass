"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bookmark, Send, Calendar, TrendingUp, Bell,
  Plus, ArrowRight, CheckSquare, Clock, Activity,
  Briefcase, User2, Mail, Star, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Opportunity, DashboardStats, ActivityItem, normalizeStatus, STATUS_CONFIG } from "@/types/opportunity"
import { CompanyAvatar, PriorityBadge, StatusBadge } from "@/components/ui/badge"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { ToastProvider } from "@/components/ui/toast"
import { SmartSuggestions } from "@/components/features/dashboard/smart-suggestions"

// --- Mock data shown before API populates ---
const MOCK_STATS: DashboardStats = {
  totalSaved: 18,
  applicationsSent: 11,
  interviewsScheduled: 4,
  responseRate: 36,
  followUpsDue: 3,
}

const MOCK_PIPELINE = [
  { status: "SAVED",      count: 5,  label: "Saved" },
  { status: "INTERESTED", count: 3,  label: "Interested" },
  { status: "APPLIED",    count: 6,  label: "Applied" },
  { status: "ASSESSMENT", count: 2,  label: "Assessment" },
  { status: "INTERVIEW",  count: 2,  label: "Interview" },
  { status: "OFFER",      count: 1,  label: "Offer" },
]

const MOCK_TASKS = [
  { id: "t1", done: false, label: "Follow up with Stripe (applied 7d ago)", dueLabel: "Today",   dueColor: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { id: "t2", done: false, label: "Prepare DS&A for Google interview",       dueLabel: "Today",   dueColor: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { id: "t3", done: false, label: "Submit Vercel application",               dueLabel: "Tomorrow", dueColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { id: "t4", done: true,  label: "Research Linear company culture",         dueLabel: "Jun 14",  dueColor: "text-muted-foreground bg-secondary/30 border-border" },
  { id: "t5", done: false, label: "Complete Figma take-home assessment",     dueLabel: "Jun 15",  dueColor: "text-muted-foreground bg-secondary/30 border-border" },
]

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "INTERVIEW_SCHEDULED", title: "Interview scheduled", description: "Google – Software Engineer Intern", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), company: "Google" },
  { id: "a2", type: "STATUS_CHANGED",      title: "Status changed",      description: "Linear moved to Offer 🎉",          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), company: "Linear" },
  { id: "a3", type: "JOB_ADDED",           title: "Job saved",           description: "Figma – Platform Engineer",          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), company: "Figma" },
  { id: "a4", type: "EMAIL_SENT",          title: "Follow-up sent",      description: "Emailed recruiter @ Notion",         timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), company: "Notion" },
  { id: "a5", type: "JOB_ADDED",           title: "Job saved",           description: "Stripe – Fullstack Developer",       timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), company: "Stripe" },
]

const MOCK_CARDS: Opportunity[] = [
  { id: "mc1", userId: "", company: "Google",  title: "Software Engineer Intern", status: "INTERVIEW", priority: "HIGH",   deadline: new Date(Date.now() + 2 * 86400000).toISOString(), createdAt: "" },
  { id: "mc2", userId: "", company: "Linear",  title: "Senior Product Engineer",  status: "OFFER",     priority: "HIGH",   createdAt: "" },
  { id: "mc3", userId: "", company: "Vercel",  title: "Frontend Engineer",        status: "SAVED",     priority: "HIGH",   deadline: new Date(Date.now() + 8 * 86400000).toISOString(), createdAt: "" },
  { id: "mc4", userId: "", company: "Stripe",  title: "Fullstack Developer",      status: "APPLIED",   priority: "MEDIUM", deadline: new Date(Date.now() + 5 * 86400000).toISOString(), createdAt: "" },
  { id: "mc5", userId: "", company: "Figma",   title: "Platform Engineer",        status: "ASSESSMENT",priority: "MEDIUM", deadline: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: "" },
  { id: "mc6", userId: "", company: "Notion",  title: "React Developer",          status: "INTERESTED",priority: "LOW",    createdAt: "" },
]

const STAT_CARDS = [
  {
    key: "totalSaved" as keyof DashboardStats,
    label: "Total Saved",
    icon: Bookmark,
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/20",
    suffix: "",
  },
  {
    key: "applicationsSent" as keyof DashboardStats,
    label: "Applications Sent",
    icon: Send,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    suffix: "",
  },
  {
    key: "interviewsScheduled" as keyof DashboardStats,
    label: "Interviews Scheduled",
    icon: Calendar,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    suffix: "",
  },
  {
    key: "responseRate" as keyof DashboardStats,
    label: "Response Rate",
    icon: TrendingUp,
    gradient: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/20",
    suffix: "%",
  },
  {
    key: "followUpsDue" as keyof DashboardStats,
    label: "Follow-ups Due",
    icon: Bell,
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-500/20",
    suffix: "",
  },
]

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  JOB_ADDED:            Briefcase,
  STATUS_CHANGED:       Activity,
  EMAIL_SENT:           Mail,
  INTERVIEW_SCHEDULED:  Calendar,
  NOTE_ADDED:           CheckSquare,
}

function formatRelativeTime(ts: string | Date) {
  const date = new Date(ts)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: activity } = useQuery<ActivityItem[]>({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/activity")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const displayStats = stats || MOCK_STATS
  const displayActivity = (activity && activity.length > 0) ? activity : MOCK_ACTIVITY
  const pipelineCards = (opportunities && opportunities.length > 0) ? opportunities : MOCK_CARDS

  // Build pipeline counts from real or mock data
  const pipelineCounts = MOCK_PIPELINE.map((col) => {
    if (opportunities && opportunities.length > 0) {
      const count = opportunities.filter(
        (o) => normalizeStatus(o.status) === col.status || o.status === col.status
      ).length
      return { ...col, count }
    }
    return col
  })

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <ToastProvider>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/40 to-violet-900/10 p-6 backdrop-blur-md">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                Here's your job search overview. You have{" "}
                <span className="text-rose-400 font-semibold">{displayStats.followUpsDue} follow-ups</span> due today and{" "}
                <span className="text-purple-400 font-semibold">{displayStats.interviewsScheduled} interviews</span> scheduled.
              </p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Job
            </button>
          </div>
        </div>

        {/* Stat Cards Row — 5 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-5 blur-2xl pointer-events-none group-hover:opacity-10 transition-opacity"
                style={{ backgroundImage: `linear-gradient(to br, ${card.gradient.replace("from-", "").replace(" to-", ", ")})` }}
              />
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                  card.gradient, card.glow
                )}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-foreground">
                {displayStats[card.key]}{card.suffix}
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Smart Suggestions */}
        <SmartSuggestions />

        {/* Main Grid: Pipeline Preview + Tasks | Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2/3: Pipeline Preview + Upcoming Tasks */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pipeline Kanban Preview */}
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="font-bold text-foreground">Application Pipeline</h2>
                <Link
                  href="/applications"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Manage Board <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Column stats bar */}
              <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-border/30">
                {pipelineCounts.map((col) => {
                  const config = STATUS_CONFIG[col.status]
                  return (
                    <div
                      key={col.status}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-1.5 shrink-0 text-xs font-semibold",
                        config?.bgColor || "bg-secondary/20",
                        config?.textColor || "text-muted-foreground",
                        "border-transparent"
                      )}
                    >
                      <span>{col.label}</span>
                      <span className="opacity-70">{col.count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Horizontal scrollable mini-cards */}
              <div className="flex gap-3 p-4 overflow-x-auto">
                {pipelineCards.slice(0, 8).map((opp) => {
                  const status = normalizeStatus(opp.status)
                  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
                  const hasUrgentDeadline = opp.deadline &&
                    (new Date(opp.deadline).getTime() - Date.now()) < 3 * 86400000

                  return (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="flex flex-col gap-2.5 min-w-[180px] max-w-[180px] rounded-xl border border-border/60 bg-card/40 p-3.5 hover:bg-card/80 hover:border-primary/30 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <CompanyAvatar company={opp.company} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{opp.company}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{opp.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", config.bgColor, config.textColor)}>
                          {config.label}
                        </span>
                        {opp.priority && <PriorityBadge priority={opp.priority} />}
                      </div>
                      {opp.deadline && (
                        <div className={cn("flex items-center gap-1 text-[10px] font-medium", hasUrgentDeadline ? "text-rose-400" : "text-muted-foreground")}>
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </button>
                  )
                })}
                <Link
                  href="/applications"
                  className="flex flex-col items-center justify-center min-w-[140px] rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all gap-2"
                >
                  <ArrowRight className="h-5 w-5" />
                  <span className="text-xs font-medium">View All</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="font-bold text-foreground">Upcoming Tasks</h2>
                <span className="text-xs text-muted-foreground">
                  {tasks.filter((t) => !t.done).length} remaining
                </span>
              </div>
              <div className="divide-y divide-border/30">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/10 transition-colors"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                        task.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {task.done && <span className="text-[10px] font-black">✓</span>}
                    </button>
                    <p className={cn("flex-1 text-sm", task.done && "line-through text-muted-foreground")}>
                      {task.label}
                    </p>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", task.dueColor)}>
                      {task.dueLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1/3: Recent Activity */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="font-bold text-foreground">Recent Activity</h2>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {displayActivity.map((item, i) => {
                const Icon = ACTIVITY_ICONS[item.type] || Briefcase
                const isLast = i === displayActivity.length - 1
                return (
                  <div key={item.id} className="flex gap-3 px-4 py-3.5 relative">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[28px] top-9 bottom-0 w-px bg-border/40" />
                    )}
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg z-10",
                      item.type === "INTERVIEW_SCHEDULED" ? "bg-purple-500/10 text-purple-400" :
                      item.type === "STATUS_CHANGED"      ? "bg-emerald-500/10 text-emerald-400" :
                      item.type === "EMAIL_SENT"          ? "bg-blue-500/10 text-blue-400" :
                      item.type === "JOB_ADDED"           ? "bg-primary/10 text-primary" :
                                                            "bg-secondary/30 text-muted-foreground"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      {/* Job Drawer */}
      <JobDrawer
        opportunityId={selectedOpp?.id ?? null}
        initialData={selectedOpp ?? undefined}
        onClose={() => setSelectedOpp(null)}
      />
    </ToastProvider>
  )
}
