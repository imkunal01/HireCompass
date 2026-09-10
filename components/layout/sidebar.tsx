"use client"

import React, { useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FolderOpen,
  CalendarCheck,
  FolderGit2,
  Bell,
  Download,
  Send,
  AlertOctagon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: "ai" | "new"
  dividerBefore?: boolean
}

const sidebarItems: NavItem[] = [
  { name: "Dashboard",         href: "/dashboard",        icon: LayoutDashboard },
  { name: "Opportunities",     href: "/opportunities",    icon: Briefcase },
  { name: "Applications",      href: "/applications",     icon: FolderOpen },
  { name: "Interviews",        href: "/interviews",      icon: Calendar },
  { name: "Rejection Tracker", href: "/rejected",        icon: AlertOctagon },
  { name: "Analytics",         href: "/analytics",      icon: BarChart3 },
  { name: "Reminders",         href: "/reminders",      icon: Bell,       dividerBefore: true },
  { name: "Day Planner",       href: "/planner",         icon: CalendarCheck, badge: "AI", badgeVariant: "ai" },
  { name: "Import Job",        href: "/import",          icon: Download },
  { name: "Outreach",          href: "/outreach",        icon: Send,       badge: "NEW", badgeVariant: "new" },
  { name: "Projects",          href: "/projects",        icon: FolderGit2, dividerBefore: true },
  { name: "Resumes",           href: "/resumes",         icon: FileText },
  { name: "Settings",          href: "/settings",        icon: Settings },
]

export default function Sidebar() {
  const pathname    = usePathname()
  const { sidebarOpen, toggleSidebar } = useStore()
  const { user }    = useUser()
  const router      = useRouter()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }

  // Close sidebar on mobile when navigating
  const handleNavClick = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      useStore.getState().toggleSidebar()
    }
  }, [])

  return (
    <aside
      className={cn(
        "fixed z-40 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/60",
        "transition-all duration-300 ease-in-out",
        // Desktop floating layout
        "md:top-4 md:bottom-4 md:left-4 md:rounded-3xl md:shadow-xl md:shadow-slate-200/50 dark:md:shadow-2xl dark:md:shadow-black/50",
        // Mobile drawer layout
        "top-0 bottom-0 left-0 rounded-r-3xl md:rounded-3xl",
        !sidebarOpen ? "-translate-x-full md:translate-x-0 md:w-[72px]" : "translate-x-0 w-72 md:w-64"
      )}
    >
      {/* ── Brand Header ── */}
      <div className={cn(
        "relative flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/70 px-4",
        "overflow-hidden"
      )}>
        {/* Subtle gradient accent behind logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/60 dark:from-indigo-950/40 to-transparent pointer-events-none" />

        <Link href="/dashboard" className="relative flex items-center gap-3 min-w-0">
          {/* Logo icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 bg-slate-900 border border-indigo-500/20">
            <Image src="/logo.png" alt="HireCompass Logo" width={40} height={40} className="object-cover" />
          </div>

          {sidebarOpen && (
            <div className="flex flex-col min-w-0 animate-fade-in">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                HireCompass
              </span>
              <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 leading-tight">
                Job Tracker Pro
              </span>
            </div>
          )}
        </Link>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "relative hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300",
            "hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-slate-700",
            "transition-all duration-150 shadow-sm"
          )}
        >
          {sidebarOpen
            ? <ChevronLeft  className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {[
          ...sidebarItems,
          ...(user?.role === "admin"
            ? [
                {
                  name: "Admin Panel",
                  href: "/admin",
                  icon: ShieldCheck,
                  badge: "ADMIN",
                  badgeVariant: "ai" as const,
                  dividerBefore: true,
                },
              ]
            : []),
        ].map((item, idx) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <React.Fragment key={item.name}>
              {/* Section divider */}
              {item.dividerBefore && (
                <div className={cn(
                  "my-3",
                  sidebarOpen && "mx-1 border-t border-slate-100 dark:border-slate-800/80"
                )} />
              )}

              <Link
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/60 to-violet-50/50 dark:to-violet-950/30 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  !sidebarOpen && "justify-center px-2"
                )}
                style={isActive ? {
                  borderLeft: "3px solid #6366F1",
                  paddingLeft: sidebarOpen ? "calc(0.75rem - 3px)" : "calc(0.5rem - 3px)"
                } : {}}
              >
                {/* Icon */}
                <item.icon className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-all duration-150",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )} />

                {/* Label */}
                {(sidebarOpen || true) && (
                  <span className={cn(
                    "flex-1 truncate transition-opacity duration-200",
                    !sidebarOpen && "md:opacity-0 md:hidden"
                  )}>{item.name}</span>
                )}

                {/* Badge */}
                {(sidebarOpen || true) && item.badge && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-opacity",
                    !sidebarOpen && "md:opacity-0 md:hidden",
                    item.badgeVariant === "ai"
                      ? "bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300"
                      : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300"
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed tooltip */}
                <div className={cn(
                  "absolute left-16 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 hidden md:block",
                  "shadow-lg shadow-slate-900/10 dark:shadow-black/50 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap",
                  "pointer-events-none opacity-0 scale-95 transition-all duration-150",
                  !sidebarOpen && "group-hover:opacity-100 group-hover:scale-100"
                )}>
                  {item.name}
                  {item.badge && (
                    <span className={cn(
                      "ml-1.5 rounded-full px-1 py-0.5 text-[9px] font-bold",
                      item.badgeVariant === "ai" ? "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            </React.Fragment>
          )
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
        {/* User info card */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 transition-all",
            !sidebarOpen && "md:hidden"
          )}>
            {/* Avatar */}
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            {/* Online indicator */}
            <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
        )}

        {/* Collapsed avatar */}
        {user && !sidebarOpen && (
          <div className="flex justify-center py-1 mb-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
            "text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150",
            !sidebarOpen && "md:justify-center md:px-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
          <span className={cn(!sidebarOpen && "md:hidden")}>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
