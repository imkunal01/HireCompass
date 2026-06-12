"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { Menu, Search, Bell, Sparkles } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { toggleSidebar, searchQuery, setSearchQuery } = useStore()

  // Fetch pending reminder count for bell badge
  const { data: pendingReminders } = useQuery<any[]>({
    queryKey: ["reminders", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?status=pending")
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 60000, // re-check every minute
  })
  const pendingCount = pendingReminders?.filter(
    (r) => new Date(r.dueAt) <= new Date(Date.now() + 86400000)
  ).length ?? 0

  // Format active path to neat titles: e.g. /opportunities -> Opportunities
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-background/50 backdrop-blur-md px-6">
      {/* Left side: Mobile menu toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-foreground transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            {getPageTitle()}
            <span className="hidden sm:inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              <Sparkles className="mr-1 h-3 w-3" /> Pro Tracker
            </span>
          </h1>
        </div>
      </div>

      {/* Right side: Global search & profile & actions */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-secondary/20 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* Notifications Bell */}
        <Link
          href="/reminders"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-foreground transition"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </Link>

        {/* User avatar display */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-primary/10">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium hidden sm:block text-muted-foreground max-w-[120px] truncate">
            {user?.name || "Guest User"}
          </span>
        </div>
      </div>
    </header>
  )
}
