"use client"

import React from "react"
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
  FolderGit2,
  Brain,
  Bell,
  Download,
  Send,
} from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "ai" | "new"
  dividerBefore?: boolean
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities",  icon: Briefcase },
  { name: "Applications",  href: "/applications",   icon: FolderOpen },
  { name: "Interviews",    href: "/interviews",      icon: Calendar },
  { name: "Analytics",     href: "/analytics",      icon: BarChart3 },
  { name: "Reminders",     href: "/reminders",      icon: Bell,       dividerBefore: true },
  { name: "Import Job",    href: "/import",          icon: Download },
  { name: "Outreach",      href: "/outreach",        icon: Send,       badge: "NEW", badgeVariant: "new" },
  { name: "AI Assistant",  href: "/assistant",       icon: Brain,      badge: "AI",  badgeVariant: "ai" },
  { name: "Projects",      href: "/projects",        icon: FolderGit2, dividerBefore: true },
  { name: "Documents",     href: "/documents",       icon: FileText },
  { name: "Settings",      href: "/settings",        icon: Settings },
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

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-white border-r border-slate-200/80",
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
      style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
    >
      {/* ── Brand Header ── */}
      <div className={cn(
        "relative flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4",
        "overflow-hidden"
      )}>
        {/* Subtle gradient accent behind logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/60 to-transparent pointer-events-none" />

        <Link href="/dashboard" className="relative flex items-center gap-3 min-w-0">
          {/* Logo icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 bg-slate-900 border border-indigo-500/20">
            <Image src="/logo.png" alt="HireCompass Logo" width={40} height={40} className="object-cover" />
          </div>

          {sidebarOpen && (
            <div className="flex flex-col min-w-0 animate-fade-in">
              <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                HireCompass
              </span>
              <span className="text-[10px] font-medium text-indigo-500 leading-tight">
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
            "border border-slate-200 bg-white text-slate-400",
            "hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50",
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
        {sidebarItems.map((item, idx) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <React.Fragment key={item.name}>
              {/* Section divider */}
              {item.dividerBefore && (
                <div className={cn(
                  "my-3",
                  sidebarOpen && "mx-1 border-t border-slate-100"
                )} />
              )}

              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50/50 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
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
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )} />

                {/* Label */}
                {sidebarOpen && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}

                {/* Badge */}
                {sidebarOpen && item.badge && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    item.badgeVariant === "ai"
                      ? "bg-violet-100 text-violet-600"
                      : "bg-emerald-100 text-emerald-600"
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed tooltip */}
                {!sidebarOpen && (
                  <div className={cn(
                    "absolute left-16 z-50 rounded-xl border border-slate-200 bg-white px-3 py-2",
                    "shadow-lg shadow-slate-900/10 text-xs font-semibold text-slate-700 whitespace-nowrap",
                    "pointer-events-none opacity-0 scale-95 transition-all duration-150",
                    "group-hover:opacity-100 group-hover:scale-100"
                  )}>
                    {item.name}
                    {item.badge && (
                      <span className={cn(
                        "ml-1.5 rounded-full px-1 py-0.5 text-[9px] font-bold",
                        item.badgeVariant === "ai" ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </React.Fragment>
          )
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="shrink-0 p-3 border-t border-slate-100 space-y-1">
        {/* User info card */}
        {user && sidebarOpen && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-slate-50 border border-slate-100">
            {/* Avatar */}
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
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
            "text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150",
            !sidebarOpen && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
