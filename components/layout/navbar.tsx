"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Bell,
  ChevronDown,
  Calendar,
  CheckCircle,
  X,
  BellOff,
  BellRing,
  Sun,
  Moon,
  Home,
  Briefcase,
  BarChart3,
  LayoutGrid,
  Sparkles,
  Terminal,
  ListChecks,
  BrainCircuit,
  CalendarCheck,
  Send,
  Download,
  FolderGit2,
  FileText,
  AlertOctagon,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { useStore } from "@/hooks/useStore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import CommandPalette from "@/components/ui/command-palette"
import type { Reminder } from "@/types/reminder"

function getUrgencyLevel(r: Reminder): "critical" | "high" | "medium" | "low" {
  const dateStr = r.eventDate || r.registrationDeadline || r.dueAt
  if (!dateStr) return "low"
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 3 * 3600000) return "critical"
  if (diff <= 24 * 3600000) return "high"
  if (diff <= 72 * 3600000) return "medium"
  return "low"
}

const URGENCY_STYLE: Record<
  "critical" | "high" | "medium" | "low",
  { dot: string; text: string; badge: string }
> = {
  critical: {
    dot: "bg-rose-500 animate-pulse",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
  },
  high: {
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  },
  medium: {
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
  },
  low: {
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
}

function getTimeLabel(dateStr?: string | null): string {
  if (!dateStr) return "Scheduled"
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return "Overdue"
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 1) return `in ${days}d`
  if (days === 1) return "Tomorrow"
  if (hours > 1) return `in ${hours}h`
  if (minutes > 0) return `in ${minutes}m`
  return "Due now"
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default")
  const [isClearing, setIsClearing] = useState(false)
  const queryClient = useQueryClient()
  
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["reminders", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?status=pending")
      return res.ok ? res.json() : []
    },
  })

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported")
    } else {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === "granted") {
      new Notification("🔔 HireCompass Notifications Enabled!", {
        body: "You'll now receive alerts for upcoming events and deadlines.",
        icon: "/logo.png",
      })
    }
  }

  const handleClearAll = async () => {
    if (reminders.length === 0) return
    setIsClearing(true)
    try {
      await Promise.all(
        reminders.map((r) =>
          fetch(`/api/reminders/${r.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: true }),
          })
        )
      )
      await queryClient.invalidateQueries({ queryKey: ["reminders"] })
    } finally {
      setIsClearing(false)
    }
  }

  const sorted = [...reminders]
    .sort((a, b) => {
      const aDate = a.eventDate || a.registrationDeadline || a.dueAt
      const bDate = b.eventDate || b.registrationDeadline || b.dueAt
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
    .slice(0, 6)

  return (
    <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notifications</span>
          {reminders.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {reminders.length > 9 ? "9+" : reminders.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reminders.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/80 px-2 py-1 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isClearing && <Loader2 className="h-3 w-3 animate-spin" />}
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notification permission banner */}
      {notifPermission === "default" && (
        <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Enable push alerts for deadlines</p>
          </div>
          <button
            onClick={requestPermission}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
          >
            Enable
          </button>
        </div>
      )}

      {/* Reminders list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All caught up!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No pending notifications</p>
          </div>
        ) : (
          sorted.map((r) => {
            const urgency = getUrgencyLevel(r)
            const style = URGENCY_STYLE[urgency]
            const displayDate = r.eventDate || r.registrationDeadline || r.dueAt
            const label = r.eventDate ? "Event" : r.registrationDeadline ? "Registration" : "Due"
            return (
              <Link
                key={r.id}
                href="/reminders"
                onClick={onClose}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", style.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {r.company ? `${r.company}` : r.message}
                  </p>
                  {r.company && (r.jobTitle || r.message) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.jobTitle || r.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{label}:</span>
                    <span className={cn("text-[10px] font-bold", style.text)}>{getTimeLabel(displayDate)}</span>
                  </div>
                </div>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 mt-1", style.badge)}>
                  {urgency === "critical" ? "URGENT" : urgency === "high" ? "TODAY" : urgency === "medium" ? "SOON" : "UPCOMING"}
                </span>
              </Link>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <Link
          href="/reminders"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          View all reminders
        </Link>
      </div>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [notifOpen, setNotifOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: pendingReminders } = useQuery<Reminder[]>({
    queryKey: ["reminders", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?status=pending")
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 60000,
  })

  const pendingCount = React.useMemo(() => {
    return pendingReminders?.filter(
      (r) => new Date(r.eventDate || r.registrationDeadline || r.dueAt) <= new Date(Date.now() + 86400000)
    ).length ?? 0
  }, [pendingReminders])

  // Global ⌘K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }

  // Navigation Items
  const isHomeActive = pathname === "/dashboard"
  const isJobsActive = pathname.startsWith("/applications") || pathname.startsWith("/opportunities")
  const isInterviewsActive = pathname.startsWith("/interviews")
  const isAnalyticsActive = pathname.startsWith("/analytics")
  const isToolsActive =
    pathname.startsWith("/prep") ||
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/outreach") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/resumes") ||
    pathname.startsWith("/rejected") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/settings")

  return (
    <>
      <header id="hirecompass-global-navbar" className="sticky top-0 z-30 w-full border-b border-white/50 dark:border-slate-800/80 bg-white/45 dark:bg-slate-900/60 backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-200 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          
          {/* ── Left: Brand Logo & Wordmark ── */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                HireCompass
              </span>
            </Link>

            {/* ── Center-Left Navigation Pills (Desktop) ── */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              
              {/* 1. Home */}
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isHomeActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
                )}
              >
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>

              {/* 2. Jobs */}
              <Link
                href="/applications"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isJobsActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
                )}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Jobs
              </Link>

              {/* 3. Interviews */}
              <Link
                href="/interviews"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isInterviewsActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Interviews
              </Link>

              {/* 4. Analytics */}
              <Link
                href="/analytics"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isAnalyticsActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </Link>

              {/* 5. Tools (Mega-Dropdown) */}
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                    isToolsActive || toolsOpen
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Tools
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", toolsOpen && "rotate-180")} />
                </button>

                {/* Tools Dropdown Menu */}
                {toolsOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Prep & Testing Hub */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2">
                          Interview & Testing
                        </p>
                        <Link
                          href="/assessment"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                            <Terminal className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                AI Assessment
                              </span>
                              <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1 text-[8px] font-bold text-indigo-600 dark:text-indigo-300">EXAM</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Capgemini proctored console</p>
                          </div>
                        </Link>

                        <Link
                          href="/prep/problem-solving"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                            <ListChecks className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              Coding Sheets
                            </span>
                            <p className="text-[10px] text-slate-400">DSA, OS, CN, DBMS roadmaps</p>
                          </div>
                        </Link>

                        <Link
                          href="/prep"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                            <BrainCircuit className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                              The Griller Arena
                            </span>
                            <p className="text-[10px] text-slate-400">Live project defense simulation</p>
                          </div>
                        </Link>

                        <Link
                          href="/rejected"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                            <AlertOctagon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                              Rejection Drills
                            </span>
                            <p className="text-[10px] text-slate-400">Autopsy into tactical practice</p>
                          </div>
                        </Link>
                      </div>

                      {/* Daily Execution & Vault */}
                      <div className="space-y-1.5 border-l border-slate-100 dark:border-slate-800 pl-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                          Execution & Vault
                        </p>
                        <Link
                          href="/planner"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                            <CalendarCheck className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                              AI Day Planner
                            </span>
                            <p className="text-[10px] text-slate-400">Timeboxed study cockpit</p>
                          </div>
                        </Link>

                        <Link
                          href="/projects"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                            <FolderGit2 className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              Project Vault
                            </span>
                            <p className="text-[10px] text-slate-400">Specs, code & architecture</p>
                          </div>
                        </Link>

                        <Link
                          href="/resumes"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                              Resume Studio
                            </span>
                            <p className="text-[10px] text-slate-400">Tailoring & ATS checks</p>
                          </div>
                        </Link>

                        <Link
                          href="/outreach"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400">
                            <Send className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                              Cold Outreach
                            </span>
                            <p className="text-[10px] text-slate-400">AI personalized messages</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* ── Center-Right: Search Input / ⌘K Trigger ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center justify-between w-64 lg:w-80 rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-inner-sm transition-all group"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="truncate">Search jobs, companies, notes...</span>
              </div>
              <kbd className="rounded bg-white dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-xs">
                ⌘ K
              </kbd>
            </button>

            {/* Mobile search icon trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>


            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
            </div>

            {/* User Capsule */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 font-bold text-white text-xs shadow-sm ring-2 ring-white dark:ring-slate-800">
                  {user?.name?.[0]?.toUpperCase() || "K"}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {user?.name || "kunal"}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Job Seeker
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name || "kunal"}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || "seeker@hirecompass.io"}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      Settings & Profile
                    </Link>
                    <Link
                      href="/planner"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                      Daily Schedule
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Slide-Out Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <Home className="h-4 w-4 text-indigo-500" /> Home
              </Link>
              <Link
                href="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <Briefcase className="h-4 w-4 text-teal-500" /> Jobs
              </Link>
              <Link
                href="/interviews"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <Calendar className="h-4 w-4 text-purple-500" /> Interviews
              </Link>
              <Link
                href="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <BarChart3 className="h-4 w-4 text-amber-500" /> Analytics
              </Link>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-[10px] font-bold uppercase text-slate-400 px-1 mb-2">Core Tools</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/assessment"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Terminal className="h-3.5 w-3.5 text-indigo-500" /> Assessment Exam
                </Link>
                <Link
                  href="/prep/problem-solving"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ListChecks className="h-3.5 w-3.5 text-emerald-500" /> DSA Sheets
                </Link>
                <Link
                  href="/prep"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <BrainCircuit className="h-3.5 w-3.5 text-purple-500" /> The Griller
                </Link>
                <Link
                  href="/planner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <CalendarCheck className="h-3.5 w-3.5 text-amber-500" /> Day Planner
                </Link>
                <Link
                  href="/resumes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-500" /> Resume Studio
                </Link>
                <Link
                  href="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FolderGit2 className="h-3.5 w-3.5 text-blue-500" /> Project Vault
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  )
}
