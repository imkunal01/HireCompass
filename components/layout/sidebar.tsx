"use client"

import React from "react"
import Link from "next/link"
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
  Wand2,
  Brain,
  Bell,
  Download
} from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  dividerBefore?: boolean
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { name: "Opportunities",href: "/opportunities", icon: Briefcase },
  { name: "Applications", href: "/applications",  icon: FolderOpen },
  { name: "Interviews",   href: "/interviews",    icon: Calendar },
  { name: "Analytics",    href: "/analytics",     icon: BarChart3 },
  { name: "Reminders",    href: "/reminders",     icon: Bell, dividerBefore: true },
  { name: "Import Job",   href: "/import",        icon: Download },
  { name: "AI Assistant", href: "/assistant",     icon: Brain, badge: "AI" },
  { name: "Projects",     href: "/projects",      icon: FolderGit2, dividerBefore: true, badge: "NEW" },
  { name: "Documents",    href: "/documents",     icon: FileText },
  { name: "Settings",     href: "/settings",      icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useStore()
  const { user } = useUser()
  const router = useRouter()
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
        "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 shadow-lg shadow-primary/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              JobsHunt
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <React.Fragment key={item.name}>
              {item.dividerBefore && sidebarOpen && (
                <div className="my-2 border-t border-border/40" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {sidebarOpen && (
                  <span className="flex-1">{item.name}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {item.badge}
                  </span>
                )}
                {!sidebarOpen && (
                  <span className="absolute left-16 scale-0 rounded bg-popover border border-border px-2 py-1 text-xs text-popover-foreground transition-all group-hover:scale-100 z-50 whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            </React.Fragment>
          )
        })}
      </nav>

      {/* Footer / User Session */}
      <div className="p-3 border-t border-border">
        {user && sidebarOpen && (
          <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl bg-secondary/20 border border-border/40">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200",
            !sidebarOpen && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
