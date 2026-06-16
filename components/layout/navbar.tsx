"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { Menu, Search, Bell, Sparkles, ChevronDown } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { cn } from "@/lib/utils"

const PAGE_META: Record<string, { title: string; emoji: string }> = {
  dashboard:    { title: "Dashboard",    emoji: "📊" },
  opportunities:{ title: "Opportunities",emoji: "🔭" },
  applications: { title: "Applications", emoji: "📋" },
  interviews:   { title: "Interviews",   emoji: "🗓" },
  analytics:    { title: "Analytics",    emoji: "📈" },
  reminders:    { title: "Reminders",    emoji: "🔔" },
  import:       { title: "Import Job",   emoji: "⬇️" },
  assistant:    { title: "AI Assistant", emoji: "🤖" },
  projects:     { title: "Projects",     emoji: "🗂" },
  documents:    { title: "Documents",    emoji: "📄" },
  settings:     { title: "Settings",     emoji: "⚙️" },
}

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { toggleSidebar, searchQuery, setSearchQuery } = useStore()

  // Fetch pending reminder count
  const { data: pendingReminders } = useQuery<any[]>({
    queryKey: ["reminders", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?status=pending")
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 60000,
  })
  const pendingCount = pendingReminders?.filter(
    (r) => new Date(r.dueAt) <= new Date(Date.now() + 86400000)
  ).length ?? 0

  const getPageMeta = () => {
    const segments = pathname.split("/").filter(Boolean)
    const last = segments[segments.length - 1] ?? "dashboard"
    return PAGE_META[last] ?? { title: last.charAt(0).toUpperCase() + last.slice(1), emoji: "📌" }
  }
  const { title, emoji } = getPageMeta()

  return (
    <header className={cn(
      "sticky top-0 z-10 flex h-16 w-full items-center justify-between",
      "border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 lg:px-6",
    )}
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.05)" }}
    >
      {/* ── Left: Mobile toggle + Page title ── */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Page title */}
        <div className="flex items-center gap-2.5">
          <span className="text-base leading-none hidden sm:block">{emoji}</span>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">{title}</h1>
            <div className="hidden sm:flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
                Pro Tracker
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Search + Notifications + User ── */}
      <div className="flex items-center gap-3">

        {/* Search bar */}
        <div className="relative hidden md:block w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search opportunities…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-9 rounded-xl border border-slate-200 bg-slate-50 pl-8.5 pr-4 text-sm text-slate-900",
              "placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100",
              "transition-all duration-150"
            )}
          />
          {/* Keyboard shortcut hint */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5">
            <kbd className="text-[9px] text-slate-400 border border-slate-200 rounded px-1 py-0.5 bg-white font-mono">⌘K</kbd>
          </div>
        </div>

        {/* Notification Bell */}
        <Link
          href="/reminders"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-slate-200 bg-slate-50 text-slate-500",
            "hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200",
            "transition-all duration-150"
          )}
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User avatar */}
        <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-150 group">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
              {user?.name || "Guest"}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Pro Plan</span>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 hidden sm:block transition-transform duration-150" />
        </button>
      </div>
    </header>
  )
}
