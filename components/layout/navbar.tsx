"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { Search, Bell, Sparkles, ChevronDown, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { useStore } from "@/hooks/useStore"
import { useQuery } from "@tanstack/react-query"

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { sidebarOpen, toggleSidebar, searchQuery, setSearchQuery } = useStore()

  const { data: pendingReminders } = useQuery<any[]>({
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
      (r) => new Date(r.dueAt) <= new Date(Date.now() + 86400000)
    ).length ?? 0
  }, [pendingReminders])

  const getPageMeta = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (!segments.length || segments[0] === "dashboard") return { title: "Dashboard", emoji: "👋" }
    const main = segments[0]
    return {
      title: main.charAt(0).toUpperCase() + main.slice(1),
      emoji: main === "opportunities" ? "💼" : main === "outreach" ? "🚀" : main === "reminders" ? "🔔" : "✨",
    }
  }

  const meta = getPageMeta()

  return (
    <header 
      className={cn(
        "fixed top-4 right-4 z-30 flex h-16 items-center gap-x-4 rounded-3xl border border-white/40 bg-white/70 px-4 shadow-lg shadow-slate-200/50 backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out",
        "left-4",
        sidebarOpen ? "md:left-[280px]" : "md:left-[104px]"
      )}
    >
      <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Page Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{meta.emoji}</span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{meta.title}</h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-x-3 sm:gap-x-5">
          {/* Global Search */}
          <div className="relative hidden md:block w-64 lg:w-80 transition-all duration-300 focus-within:w-72 lg:focus-within:w-96">
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

          {/* Notifications */}
          <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-all">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* User Profile */}
          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm ring-2 ring-white">
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
