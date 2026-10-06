"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
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
  Flame,
  BrainCircuit,
  Terminal,
  Compass,
  Award,
  ExternalLink,
} from "lucide-react"
import { cn, formatShortDate } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import {
  Opportunity,
  DashboardStats,
  normalizeStatus,
} from "@/types/opportunity"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { ToastProvider } from "@/components/ui/toast"
import { useResumeSessions } from "@/hooks/useResumeSessions"
import { ResumeSessionsHub } from "@/components/features/dashboard/resume-sessions-hub"

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function timeAgo(dateInput: string | Date | undefined): string {
  if (!dateInput) return "Recently"
  const diff = Date.now() - new Date(dateInput).getTime()
  if (diff < 60000) return "Just now"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function DashboardPage() {
  const { user } = useUser()
  const userName = user?.name || "Job Seeker"
  const queryClient = useQueryClient()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)

  // ── Dynamic Calendar State ──
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    today.toISOString().split("T")[0]
  )

  // ── Local Focus Fallback Tasks ──
  const [localFocusTasks, setLocalFocusTasks] = useState([
    { id: "focus-1", text: "Apply to 2 targeted opportunities", done: false, link: "/applications" },
    { id: "focus-2", text: "AI-Assisted OA Simulator drill", done: false, link: "/assessment" },
    { id: "focus-3", text: "Solve 2 Blind 75 DSA problems", done: false, link: "/prep/problem-solving" },
  ])

  // ── Queries ──
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats")
      if (!r.ok) return EMPTY_STATS
      return r.json()
    },
  })

  const { data: rawOpportunities = [] } = useQuery<any>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const r = await fetch("/api/opportunities")
      if (!r.ok) return []
      const res = await r.json()
      return Array.isArray(res) ? res : []
    },
  })
  const opportunities: Opportunity[] = useMemo(() => {
    return Array.isArray(rawOpportunities) ? rawOpportunities : []
  }, [rawOpportunities])

  const { data: rawInterviews = [] } = useQuery<any>({
    queryKey: ["interviews"],
    queryFn: async () => {
      const r = await fetch("/api/interviews")
      if (!r.ok) return []
      const res = await r.json()
      return Array.isArray(res) ? res : []
    },
  })
  const interviews: any[] = useMemo(() => {
    return Array.isArray(rawInterviews) ? rawInterviews : []
  }, [rawInterviews])

  const { data: rawReminders = [] } = useQuery<any>({
    queryKey: ["reminders", "pending"],
    queryFn: async () => {
      const r = await fetch("/api/reminders?status=pending")
      if (!r.ok) return []
      const res = await r.json()
      return Array.isArray(res) ? res : []
    },
  })
  const reminders: any[] = useMemo(() => {
    return Array.isArray(rawReminders) ? rawReminders : []
  }, [rawReminders])

  const { data: activitiesData } = useQuery<{ activities: any[] }>({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/activities")
      if (!r.ok) return { activities: [] }
      const res = await r.json()
      return res && typeof res === "object" ? res : { activities: [] }
    },
  })

  const { data: plannerTodayData } = useQuery<{ plan: any; stats: any }>({
    queryKey: ["planner-today"],
    queryFn: async () => {
      const r = await fetch("/api/planner/today")
      if (!r.ok) return { plan: null, stats: null }
      const res = await r.json()
      return res && typeof res === "object" ? res : { plan: null, stats: null }
    },
  })

  const { data: rawSheets } = useQuery<any>({
    queryKey: ["sheets"],
    queryFn: async () => {
      const r = await fetch("/api/sheets")
      if (!r.ok) return []
      const res = await r.json()
      return Array.isArray(res) ? res : (Array.isArray(res?.sheets) ? res.sheets : [])
    },
  })
  const sheetsData: any[] = useMemo(() => {
    if (Array.isArray(rawSheets)) return rawSheets
    if (Array.isArray(rawSheets?.sheets)) return rawSheets.sheets
    return []
  }, [rawSheets])

  const { data: assessmentData } = useQuery<any>({
    queryKey: ["prep-assessment"],
    queryFn: async () => {
      const r = await fetch("/api/prep/assessment")
      if (!r.ok) return null
      const res = await r.json()
      return res && typeof res === "object" ? res : null
    },
  })

  // ── In-Progress Session Continuation Hub ──
  const {
    sessions: resumeSessions,
    dismissSession: dismissResumeSession,
    isLoaded: resumeSessionsLoaded,
  } = useResumeSessions({
    serverActiveAssessment: assessmentData?.activeSession,
    serverSheets: sheetsData,
  })

  const displayStats = stats || EMPTY_STATS

  // ── Focus Checklist Integration ──
  interface FocusTaskItem {
    id: string
    text: string
    done: boolean
    link?: string
  }

  const activePlan = plannerTodayData?.plan
  const focusTasks: FocusTaskItem[] = useMemo(() => {
    if (activePlan?.tasks && activePlan.tasks.length > 0) {
      return activePlan.tasks.slice(0, 3).map((t: any): FocusTaskItem => ({
        id: String(t.id),
        text: String(t.title),
        done: Boolean(t.completed),
        link: "/planner",
      }))
    }
    return localFocusTasks
  }, [activePlan, localFocusTasks])

  const toggleFocusTask = async (id: string) => {
    if (activePlan && activePlan.tasks) {
      const updatedTasks = activePlan.tasks.map((t: any) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
      const updatedPlan = { ...activePlan, tasks: updatedTasks }
      try {
        await fetch("/api/planner/today", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPlan),
        })
        queryClient.invalidateQueries({ queryKey: ["planner-today"] })
      } catch (e) {
        console.error("Failed to toggle plan task:", e)
      }
    } else {
      setLocalFocusTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      )
    }
  }

  const completedFocusCount = focusTasks.filter((t: FocusTaskItem) => t.done).length

  // ── Dynamic Calendar Calculations ──
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = []

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevM = currentMonth === 0 ? 12 : currentMonth
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear
      const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      days.push({ day: d, dateStr, isCurrentMonth: false })
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      days.push({ day: d, dateStr, isCurrentMonth: true })
    }

    // Trailing days for remaining grid slots (to reach multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      days.push({ day: d, dateStr, isCurrentMonth: false })
    }

    return days
  }, [currentYear, currentMonth])

  // Calendar Event Dots Lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { interviews: any[]; reminders: any[] }>()

    interviews.forEach((inv) => {
      if (inv.date) {
        const dStr = inv.date.includes("T") ? inv.date.split("T")[0] : inv.date
        if (!map.has(dStr)) map.set(dStr, { interviews: [], reminders: [] })
        map.get(dStr)!.interviews.push(inv)
      }
    })

    reminders.forEach((r) => {
      const d = r.eventDate || r.registrationDeadline || r.dueAt
      if (d) {
        const dStr = d.includes("T") ? d.split("T")[0] : d
        if (!map.has(dStr)) map.set(dStr, { interviews: [], reminders: [] })
        map.get(dStr)!.reminders.push(r)
      }
    })

    opportunities.forEach((o) => {
      if (normalizeStatus(o.status) === "INTERVIEW" && o.deadline) {
        const dStr = String(o.deadline).includes("T") ? String(o.deadline).split("T")[0] : String(o.deadline)
        if (!map.has(dStr)) map.set(dStr, { interviews: [], reminders: [] })
        map.get(dStr)!.interviews.push({ company: o.company, role: o.title, time: "Scheduled" })
      }
    })

    return map
  }, [interviews, reminders, opportunities])

  const selectedDateEvents = eventsByDate.get(selectedCalendarDate)

  // ── Pipeline counts ──
  const pipelineCounts = useMemo(() => {
    return PIPELINE_COLUMNS.map((col) => {
      const count = opportunities.filter((o) => {
        const norm = normalizeStatus(o.status)
        return norm === col.key || o.status === col.key
      }).length
      return { ...col, count }
    })
  }, [opportunities])

  // ── Top saved companies ──
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

  // ── Upcoming interviews ──
  const upcomingInterviews = useMemo(() => {
    const oppInterviews = opportunities
      .filter((o) => normalizeStatus(o.status) === "INTERVIEW")
      .map((o) => ({
        id: o.id,
        company: o.company,
        role: o.title,
        date: o.deadline ? String(o.deadline) : "Upcoming",
        type: "Interview Round",
      }))

    const explicitInterviews = interviews.map((i) => ({
      id: i.id,
      company: i.company,
      role: i.role,
      date: i.date,
      type: i.type || "Technical Round",
    }))

    const combined = [...explicitInterviews, ...oppInterviews]
    const seen = new Set<string>()
    return combined.filter((item) => {
      const key = `${item.company}-${item.role}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [opportunities, interviews])

  // ── Real 30-Day Pipeline Chart Generation ──
  const chartData = useMemo(() => {
    const now = Date.now()
    const points = 10
    const dayInterval = 3 // 30 days divided into 10 step intervals
    const result: { dateLabel: string; appCount: number; interviewCount: number }[] = []

    for (let i = points - 1; i >= 0; i--) {
      const stepDate = new Date(now - i * dayInterval * 86400000)
      const dateLabel = formatShortDate(stepDate)

      // Cumulative applications up to this step
      const appCount = opportunities.filter((o) => {
        if (!o.createdAt) return false
        return new Date(o.createdAt) <= stepDate && normalizeStatus(o.status) !== "SAVED"
      }).length

      // Cumulative interviews up to this step
      const interviewCount = opportunities.filter((o) => {
        if (!o.createdAt) return false
        return new Date(o.createdAt) <= stepDate && normalizeStatus(o.status) === "INTERVIEW"
      }).length

      result.push({ dateLabel, appCount, interviewCount })
    }

    const maxVal = Math.max(
      4,
      ...result.map((r) => Math.max(r.appCount, r.interviewCount))
    )

    // Build SVG paths (canvas 500w x 120h)
    const appPoints = result.map((r, idx) => {
      const x = 15 + (idx / (points - 1)) * 470
      const y = 115 - (r.appCount / maxVal) * 95
      return { x, y }
    })

    const interviewPoints = result.map((r, idx) => {
      const x = 15 + (idx / (points - 1)) * 470
      const y = 115 - (r.interviewCount / maxVal) * 95
      return { x, y }
    })

    const appPath = appPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")
    const appArea = `${appPath} L 485 115 L 15 115 Z`

    const interviewPath = interviewPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")

    return {
      points: result,
      maxVal,
      appPath,
      appArea,
      appPoints,
      interviewPath,
      interviewPoints,
    }
  }, [opportunities])

  // ── Dynamic Heuristic Smart Suggestions ──
  const smartSuggestions = useMemo(() => {
    const list: {
      id: string
      companyInitial: string
      title: string
      description: string
      link: string
      color: string
    }[] = []

    // 1. Check for applied jobs with no update for > 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const overdueOpp = opportunities.find((o) => {
      return (
        normalizeStatus(o.status) === "APPLIED" &&
        new Date(o.updatedAt || o.createdAt) <= sevenDaysAgo
      )
    })
    if (overdueOpp) {
      list.push({
        id: "sug-followup",
        companyInitial: overdueOpp.company.charAt(0).toUpperCase(),
        title: `Follow up with ${overdueOpp.company}`,
        description: `Applied over 7 days ago to "${overdueOpp.title}". Send an AI cold outreach follow-up.`,
        link: "/outreach",
        color: "bg-indigo-600 text-white",
      })
    }

    // 2. Check for upcoming interviews in next 48 hours
    const soonInterview = upcomingInterviews[0]
    if (soonInterview) {
      list.push({
        id: "sug-interview",
        companyInitial: soonInterview.company.charAt(0).toUpperCase(),
        title: `${soonInterview.company} Interview Prep`,
        description: `Technical round coming up. Practice live defense in The Griller.`,
        link: "/prep",
        color: "bg-amber-500 text-white",
      })
    }

    // 3. Check for saved opportunities waiting to be submitted
    const savedOpp = opportunities.find((o) => normalizeStatus(o.status) === "SAVED")
    if (savedOpp && list.length < 2) {
      list.push({
        id: "sug-saved",
        companyInitial: savedOpp.company.charAt(0).toUpperCase(),
        title: `Submit ${savedOpp.company} Application`,
        description: `Saved "${savedOpp.title}". Tailor your resume before deadline closes.`,
        link: "/resumes",
        color: "bg-teal-600 text-white",
      })
    }

    // 4. Default high-signal prep suggestion
    if (list.length < 2) {
      list.push({
        id: "sug-assessment",
        companyInitial: "A",
        title: "AI Assessment Simulator Drill",
        description: "Simulate proctored technical exam and defect review with instant 100-pt scorecard.",
        link: "/assessment",
        color: "bg-sky-600 text-white",
      })
    }

    if (list.length < 2) {
      list.push({
        id: "sug-dsa",
        companyInitial: "D",
        title: "Daily DSA Problem Set",
        description: "Sharpen arrays and graphs from Blind 75 roadmap to maintain daily streak.",
        link: "/prep/problem-solving",
        color: "bg-purple-600 text-white",
      })
    }

    return list.slice(0, 2)
  }, [opportunities, upcomingInterviews])

  // ── Career & Prep Modules Calculations ──
  // 1. Weekly Velocity Goal
  const weeklyApplications = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000)
    return opportunities.filter(
      (o) =>
        normalizeStatus(o.status) !== "SAVED" &&
        new Date(o.createdAt || o.updatedAt || Date.now()) >= oneWeekAgo
    ).length
  }, [opportunities])
  const weeklyTarget = 10
  const weeklyVelocityPct = Math.min(100, Math.round((weeklyApplications / weeklyTarget) * 100))

  // 2. DSA Progress
  const dsaProgress = useMemo(() => {
    let totalItems = 0
    let doneItems = 0
    const list = Array.isArray(sheetsData) ? sheetsData : []
    list.forEach((s) => {
      totalItems += s.itemCount || 0
      doneItems += (s.done ?? s.doneCount ?? 0)
    })
    const streak = plannerTodayData?.stats?.currentStreak || 1
    return {
      streak,
      done: doneItems,
      total: Math.max(75, totalItems),
    }
  }, [sheetsData, plannerTodayData])

  // 3. AI Assessment Readiness Score
  const readinessScore = useMemo(() => {
    const past = assessmentData?.recentSessions || []
    if (past.length === 0) return { score: 85, label: "Ready to Test", completed: 0 }
    const validScores = past.filter((s: any) => typeof s.score === "number" || typeof s.totalScore === "number")
    if (validScores.length === 0) return { score: 85, label: "Ready to Test", completed: past.length }
    const avg = Math.round(
      validScores.reduce((acc: number, s: any) => acc + (s.score || s.totalScore || 80), 0) / validScores.length
    )
    return { score: avg, label: avg >= 80 ? "Exceeds Bar" : "Needs Practice", completed: past.length }
  }, [assessmentData])

  return (
    <ToastProvider>
      <div className="space-y-6">

        {/* ═══════════════════════════════════════════════════
            ROW 1: HERO GREETING + TODAY'S FOCUS + DYNAMIC CALENDAR
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* 1. Hero Greeting Banner Card */}
          <div className="col-span-12 lg:col-span-6 relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[200px]">
            {/* Scenic Mountain Sunrise Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none">
              <img
                src="/images/hero-mountains.jpg"
                alt="Sunrise Mountains"
                className="h-full w-full object-cover object-center opacity-90 dark:opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent dark:from-slate-900 dark:via-slate-900/50" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-[55%] space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Good to see you again,
              </h1>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                <span>{userName}</span>
                <span className="text-2xl sm:text-3xl">👋</span>
              </div>
              {user?.role === "admin" && (
                <div className="pt-2">
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

            <div className="relative z-10 flex items-center gap-3 mt-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Data Mode</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <p className="text-xs text-slate-400 dark:text-slate-500 italic truncate">
                &ldquo;Small consistent steps lead to big opportunities.&rdquo;
              </p>
            </div>
          </div>

          {/* 2. Today's Focus Card (Two-Way Synced with Day Planner) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Today&apos;s Focus</h2>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                {completedFocusCount}/{focusTasks.length}
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-3 my-auto py-2">
              {focusTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 group">
                  <button
                    onClick={() => toggleFocusTask(task.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
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
                        "text-xs leading-snug transition-all duration-150 truncate",
                        task.done
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium"
                      )}
                    >
                      {task.text}
                    </span>
                  </button>
                  {task.link && (
                    <Link
                      href={task.link}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                    >
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-800/80">
              <span>{completedFocusCount === focusTasks.length ? "All done for today! 🎉" : "Maintain daily streak"}</span>
              <Link
                href="/planner"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Day Planner →
              </Link>
            </div>
          </div>

          {/* 3. Dynamic Interactive Calendar Widget */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 text-center gap-y-1 text-xs">
              {calendarGrid.slice(0, 28).map((item, idx) => {
                const isSelected = selectedCalendarDate === item.dateStr
                const hasEvents = eventsByDate.has(item.dateStr)
                const dayEvents = eventsByDate.get(item.dateStr)
                const hasInterview = (dayEvents?.interviews?.length || 0) > 0
                const hasReminder = (dayEvents?.reminders?.length || 0) > 0

                return (
                  <button
                    key={`${item.dateStr}-${idx}`}
                    onClick={() => setSelectedCalendarDate(item.dateStr)}
                    className={cn(
                      "py-0.5 rounded-md relative flex flex-col items-center justify-center transition-colors",
                      !item.isCurrentMonth
                        ? "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850"
                        : isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{item.day}</span>
                    {hasEvents && (
                      <span
                        className={cn(
                          "absolute bottom-0 h-1 w-1 rounded-full",
                          isSelected
                            ? "bg-white"
                            : hasInterview
                            ? "bg-purple-500"
                            : "bg-amber-500"
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected Date Agenda Status */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800/80 truncate">
              {selectedDateEvents && (selectedDateEvents.interviews.length > 0 || selectedDateEvents.reminders.length > 0) ? (
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedDateEvents.interviews.length} interview(s), {selectedDateEvents.reminders.length} reminder(s)
                </span>
              ) : (
                <span>No events on {selectedCalendarDate}</span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 1.5: RESUME WHERE YOU LEFT OFF (IN-PROGRESS SESSIONS HUB)
        ═══════════════════════════════════════════════════ */}
        <ResumeSessionsHub
          sessions={resumeSessions}
          onDismiss={dismissResumeSession}
          isLoaded={resumeSessionsLoaded}
        />

        {/* ═══════════════════════════════════════════════════
            ROW 2: 5 KPI METRIC CARDS
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* 1. Total Saved */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
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
              <svg className="w-16 h-7 text-amber-500" viewBox="0 0 60 25" fill="none">
                <path d="M2 19 C14 18, 24 16, 34 11 C44 7, 50 9, 58 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayStats.responseRate}%
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Response Rate</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Applications getting response</p>
            </div>
          </div>

          {/* 5. Follow-ups Due */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                <Bell className="h-5 w-5" />
              </div>
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
            ROW 3: EXPANDED CAREER ACCELERATION & PREP COCKPIT (Phase 5)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Daily DSA & Blind 75 Streak */}
          <Link
            href="/prep/problem-solving"
            className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:border-amber-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Flame className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">DSA & Coding Streak</span>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-700 text-[10px] font-black">
                🔥 {dsaProgress.streak} DAY{dsaProgress.streak !== 1 ? "S" : ""}
              </span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Blind 75 & Curated DSA</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{dsaProgress.done}/{dsaProgress.total}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.max(5, (dsaProgress.done / dsaProgress.total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
              <span>Solve Today&apos;s Challenge</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Card 2: AI Assessment Readiness Score */}
          <Link
            href="/assessment"
            className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Assessment Readiness</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 text-[10px] font-black">
                {readinessScore.score}/100
              </span>
            </div>
            <div className="my-3 space-y-1">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{readinessScore.label}</span>
                <span className="text-xs font-normal text-slate-400">({readinessScore.completed} tests)</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                Simulates proctored prompt & defect review testing
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              <span>Launch Practice Exam</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Card 3: Weekly Application Velocity */}
          <Link
            href="/applications"
            className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:border-teal-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Weekly Velocity</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-700 text-[10px] font-black">
                {weeklyApplications}/{weeklyTarget} APPS
              </span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>7-Day Goal Target</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{weeklyVelocityPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.max(5, weeklyVelocityPct)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
              <span>Track New Application</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Card 4: The Griller Project Defense */}
          <Link
            href="/prep"
            className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col justify-between hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">The Griller Defense</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 text-purple-700 text-[10px] font-black uppercase">
                Mock Sim
              </span>
            </div>
            <div className="my-3 space-y-1">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                Project Drill
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                Defend schema choices & scale tradeoffs against AI leads
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
              <span>Enter Arena</span>
              <ArrowRight size={13} />
            </div>
          </Link>

        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 4: APPLICATION PIPELINE (50%) + RECENT ACTIVITY (25%) + SUGGESTIONS & ACTIONS (25%)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* 1. Left Wide Card: Real Application Pipeline Chart */}
          <div className="col-span-12 lg:col-span-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Application Pipeline</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>Last 30 days</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
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

            {/* Dynamic Real Line Chart Canvas */}
            <div className="w-full h-44 relative flex flex-col justify-end pt-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 pr-2">
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">{chartData.maxVal}</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">{Math.round(chartData.maxVal * 0.75)}</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">{Math.round(chartData.maxVal * 0.5)}</span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">{Math.round(chartData.maxVal * 0.25)}</span>
                </div>
                <div className="border-b border-slate-200 dark:border-slate-700 w-full flex items-center justify-start pb-0.5">
                  <span className="w-4">0</span>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="relative pl-6 pr-2 h-36">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path d={chartData.appArea} fill="url(#appGradient)" />

                  {/* Applications trend line (purple) */}
                  <path
                    d={chartData.appPath}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.appPoints.map((p, idx) => (
                    <circle key={`dot-app-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#8B5CF6" />
                  ))}

                  {/* Interviews trend line (teal) */}
                  <path
                    d={chartData.interviewPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.interviewPoints.map((p, idx) => (
                    <circle key={`dot-inv-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#10B981" />
                  ))}
                </svg>
              </div>

              {/* X Axis Date labels */}
              <div className="flex justify-between pl-6 pr-2 text-[10px] text-slate-400 mt-1 select-none">
                {chartData.points
                  .filter((_, idx) => idx % 2 === 0 || idx === chartData.points.length - 1)
                  .map((p, i) => (
                    <span key={i} suppressHydrationWarning>{p.dateLabel}</span>
                  ))}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/80 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>Applications Sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                <span>Interviews Scheduled</span>
              </div>
            </div>
          </div>

          {/* 2. Middle Card: Real Recent Activity Feed */}
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

            {/* Real Activity Items List */}
            <div className="space-y-3.5 my-auto">
              {(activitiesData?.activities || []).slice(0, 5).map((act: any) => {
                const isInterview = act.iconType === "calendar" || act.type === "interview"
                const isAssessment = act.iconType === "chart" || act.type === "assessment"
                const isJob = act.iconType === "send" || act.type === "job"

                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                        isInterview
                          ? "bg-purple-500/10 text-purple-600"
                          : isAssessment
                          ? "bg-indigo-500/10 text-indigo-600"
                          : isJob
                          ? "bg-teal-500/10 text-teal-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {isInterview ? (
                        <Calendar className="h-4 w-4" />
                      ) : isAssessment ? (
                        <Zap className="h-4 w-4" />
                      ) : isJob ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {act.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {timeAgo(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {act.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 text-center border-t border-slate-50 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400">Live candidate activity feed</span>
            </div>
          </div>

          {/* 3. Right Column: Real Smart Suggestions & Quick Actions */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-5">
            
            {/* Card A: Real Smart Suggestions */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-500">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Smart Suggestions</h3>
                </div>
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {smartSuggestions.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {smartSuggestions.map((sug) => (
                  <Link
                    key={sug.id}
                    href={sug.link}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850 cursor-pointer transition-all group block"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-xs",
                        sug.color
                      )}
                    >
                      {sug.companyInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {sug.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {sug.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Card B: Quick Actions */}
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
                    Track opportunity
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
                    Resume Studio
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Tailor & score ATS
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
                    Follow-up alert
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
                    Analytics
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Funnel & yield
                  </span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ROW 5: UPCOMING INTERVIEWS & TOP COMPANIES SAVED
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Real Upcoming Interviews */}
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
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Calendar className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No interviews scheduled</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Schedule interviews or advance pipeline stages to see them here.</p>
                <Link
                  href="/applications"
                  className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Manage Applications <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2">
                {upcomingInterviews.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.company}</p>
                      <p className="text-[10px] text-slate-400">{item.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold">{item.date}</span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                    </div>
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
              <Link href="/applications" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {savedCompanies.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Building2 className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No companies yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Save jobs to automatically rank your top target employers.</p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Track First Job <ArrowRight className="h-3 w-3" />
                </button>
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
