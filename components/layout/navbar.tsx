"use client"

import React, { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Search, Bell, Sparkles, ChevronDown, Menu, Calendar, Clock, CheckCircle, X, BellOff, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { useStore } from "@/hooks/useStore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

interface Reminder {
  id: string
  company: string | null
  jobTitle: string | null
  message: string
  type: "DEADLINE" | "FOLLOWUP" | "INTERVIEW"
  dueAt: string
  eventDate?: string | null
  registrationDeadline?: string | null
  done: boolean
}

function getUrgencyLevel(r: Reminder): "critical" | "high" | "medium" | "low" {
  const now = Date.now()
  const checkDate = r.eventDate || r.registrationDeadline || r.dueAt
  const diff = new Date(checkDate).getTime() - now
  if (diff < 0) return "critical"
  if (diff <= 5 * 3600000) return "critical"
  if (diff <= 24 * 3600000) return "high"
  if (diff <= 72 * 3600000) return "medium"
  return "low"
}

function getTimeLabel(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return "OVERDUE"
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `${minutes}m left`
  if (hours < 24) return `${hours}h left`
  return `${days}d left`
}

const URGENCY_STYLE = {
  critical: { dot: "bg-rose-500 animate-pulse", text: "text-rose-600", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  high:     { dot: "bg-orange-500",              text: "text-orange-600", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { dot: "bg-yellow-500",              text: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:      { dot: "bg-blue-400",                text: "text-blue-500",   badge: "bg-blue-50 text-blue-600 border-blue-200" },
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
    <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-slate-800 text-sm">Notifications</span>
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
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/50 px-2 py-1 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isClearing && <Loader2 className="h-3 w-3 animate-spin" />}
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notification permission banner */}
      {notifPermission === "default" && (
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <p className="text-xs text-indigo-700 font-medium">Enable push alerts for deadlines</p>
          </div>
          <button
            onClick={requestPermission}
            className="text-xs font-bold text-white bg-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            Enable
          </button>
        </div>
      )}
      {notifPermission === "granted" && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <p className="text-xs text-emerald-700 font-medium">Push notifications active</p>
        </div>
      )}
      {notifPermission === "denied" && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <BellOff className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-xs text-slate-500">Notifications blocked in browser settings</p>
        </div>
      )}

      {/* Reminders list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending reminders</p>
          </div>
        ) : (
          sorted.map((r) => {
            const urgency = getUrgencyLevel(r)
            const style = URGENCY_STYLE[urgency]
            const displayDate = r.eventDate || r.registrationDeadline || r.dueAt
            const label = r.eventDate ? "Event" : r.registrationDeadline ? "Registration" : "Due"
            return (
              <a
                key={r.id}
                href="/reminders"
                onClick={onClose}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                {/* Urgency dot */}
                <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", style.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {r.company ? `${r.company}` : r.message}
                  </p>
                  {r.company && (r.jobTitle || r.message) && (
                    <p className="text-xs text-slate-500 truncate">{r.jobTitle || r.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{label}:</span>
                    <span className={cn("text-[10px] font-bold", style.text)}>{getTimeLabel(displayDate)}</span>
                  </div>
                </div>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 mt-1", style.badge)}>
                  {urgency === "critical" ? "URGENT" : urgency === "high" ? "TODAY" : urgency === "medium" ? "SOON" : "UPCOMING"}
                </span>
              </a>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <a
          href="/reminders"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          View all reminders
        </a>
      </div>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { sidebarOpen, toggleSidebar, searchQuery, setSearchQuery } = useStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getPageMeta = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (!segments.length || segments[0] === "dashboard") return { title: "Dashboard", emoji: "👋" }
    const main = segments[0]
    const emojiMap: Record<string, string> = {
      opportunities: "💼",
      outreach: "🚀",
      reminders: "🔔",
      interviews: "📅",
      analytics: "📊",
      applications: "📁",
      resumes: "📄",
      projects: "🗂️",
      settings: "⚙️",
      import: "📥",
      assistant: "🤖",
    }
    return {
      title: main.charAt(0).toUpperCase() + main.slice(1),
      emoji: emojiMap[main] ?? "✨",
    }
  }

  const meta = getPageMeta()

  return (
    <header
      className={cn(
        "fixed top-4 right-4 z-30 flex h-14 md:h-16 items-center gap-x-3 rounded-2xl md:rounded-3xl border border-white/40 bg-white/70 px-3 md:px-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
        "left-4",
        sidebarOpen ? "md:left-[280px]" : "md:left-[104px]"
      )}
    >
      <div className="flex flex-1 items-center gap-x-3 self-stretch">

        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Page Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg md:text-xl leading-none">{meta.emoji}</span>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">{meta.title}</h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-x-2 sm:gap-x-3">
          {/* Global Search — hidden on small mobile */}
          <div className="relative hidden md:block w-56 lg:w-80 transition-all duration-300 focus-within:w-64 lg:focus-within:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search anything (⌘K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border-0 py-2 pl-10 pr-3 text-sm text-slate-900 bg-slate-100/80 shadow-inner ring-1 ring-inset ring-slate-200/60 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all sm:text-sm sm:leading-6"
            />
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationDropdown onClose={() => setNotifOpen(false)} />
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* User Profile */}
          <div className="flex items-center gap-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm ring-2 ring-white text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden lg:flex lg:flex-col lg:items-start lg:justify-center">
              <span className="text-sm font-bold leading-none text-slate-900">
                {user?.name || "Guest"}
              </span>
              <span className="mt-1 flex items-center gap-1 text-[10px] font-medium leading-none text-slate-500">
                <Sparkles className="h-3 w-3 text-amber-500" /> Pro Plan
              </span>
            </div>
            <ChevronDown className="hidden lg:block h-4 w-4 text-slate-400 ml-1" />
          </div>
        </div>
      </div>
    </header>
  )
}
