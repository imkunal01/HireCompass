"use client"

import React, { useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { useUser } from "@/hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"
import {
  LayoutDashboard, Briefcase, FolderOpen, Calendar,
  AlertOctagon, BarChart3, Bell, Download, Send,
  Brain, FolderGit2, FileText, Settings,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react"
import "@/styles/v2/variables.css"
import "@/styles/v2/layout.css"
import "@/styles/v2/animations.css"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  badge?: string
  badgeVariant?: "ai" | "new"
  sectionLabel?: string
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",         href: "/v2/dashboard",     icon: LayoutDashboard },
  { name: "Opportunities",     href: "/v2/opportunities",  icon: Briefcase },
  { name: "Applications",      href: "/v2/applications",   icon: FolderOpen },
  { name: "Interviews",        href: "/v2/interviews",      icon: Calendar },
  { name: "Rejection Tracker", href: "/v2/rejected",        icon: AlertOctagon },
  { name: "Analytics",         href: "/v2/analytics",      icon: BarChart3 },
  { name: "Reminders",         href: "/v2/reminders",      icon: Bell,        sectionLabel: "Tools" },
  { name: "Import Job",        href: "/v2/import",          icon: Download },
  { name: "Outreach",          href: "/v2/outreach",        icon: Send,        badge: "NEW", badgeVariant: "new" },
  { name: "AI Assistant",      href: "/v2/assistant",       icon: Brain,       badge: "AI",  badgeVariant: "ai" },
  { name: "Projects",          href: "/v2/projects",        icon: FolderGit2,  sectionLabel: "Resources" },
  { name: "Resumes",           href: "/v2/resumes",         icon: FileText },
  { name: "Settings",          href: "/v2/settings",        icon: Settings },
]

export default function SidebarV2() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useStore()
  const { user } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    queryClient.clear()
    router.push("/v2/login")
    router.refresh()
  }

  const handleNavClick = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      useStore.getState().setSidebarOpen(false)
    }
  }, [])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="v2-sidebar-backdrop v2-sidebar-backdrop--visible"
          onClick={() => useStore.getState().setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          "v2-sidebar",
          !sidebarOpen ? "v2-sidebar--collapsed" : "",
          sidebarOpen ? "v2-sidebar--open" : "",
        ].filter(Boolean).join(" ")}
        aria-label="Main navigation"
      >
        {/* ── Brand Header ── */}
        <div className="v2-sidebar__header">
          <Link href="/v2/dashboard" className="v2-sidebar__brand" onClick={handleNavClick}>
            <div className="v2-sidebar__logo">
              <Image src="/logo.png" alt="HireCompass" width={36} height={36} />
            </div>
            {sidebarOpen && (
              <div className="v2-sidebar__brand-text anim-fade-in-left">
                <span className="v2-sidebar__brand-name">HireCompass</span>
                <span className="v2-sidebar__brand-sub">Job Tracker</span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            className="v2-sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen
              ? <ChevronLeft size={14} strokeWidth={2.5} />
              : <ChevronRight size={14} strokeWidth={2.5} />
            }
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="v2-sidebar__nav" aria-label="App navigation">
          {NAV_ITEMS.map((item) => (
            <React.Fragment key={item.name}>
              {item.sectionLabel && (
                <div className="v2-sidebar__divider" role="separator" aria-hidden="true" />
              )}
              {item.sectionLabel && sidebarOpen && (
                <div className="v2-sidebar__nav-label">{item.sectionLabel}</div>
              )}
              <Link
                href={item.href}
                onClick={handleNavClick}
                className={[
                  "v2-nav-item",
                  isActive(item.href) ? "v2-nav-item--active" : "",
                ].filter(Boolean).join(" ")}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive(item.href) ? 2.5 : 2}
                  className="v2-nav-item__icon"
                />
                <span className="v2-nav-item__label">{item.name}</span>
                {item.badge && (
                  <span className={`v2-nav-item__badge v2-nav-item__badge--${item.badgeVariant}`}>
                    {item.badge}
                  </span>
                )}
                {/* Tooltip shown when collapsed */}
                <span className="v2-nav-item__tooltip" aria-hidden="true">
                  {item.name}
                  {item.badge && (
                    <span className={`v2-nav-item__badge v2-nav-item__badge--${item.badgeVariant}`} style={{ marginLeft: "6px" }}>
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* ── User Footer ── */}
        <div className="v2-sidebar__footer">
          {user && (
            <div className="v2-user-card">
              <div className="v2-user-avatar v2-user-avatar--sm">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="v2-user-info">
                <p className="v2-user-name">{user.name}</p>
                <p className="v2-user-email">{user.email}</p>
              </div>
              <div className="v2-user-status" aria-label="Online" />
            </div>
          )}

          <button
            className="v2-sidebar__sign-out"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut size={16} strokeWidth={2} />
            <span className="v2-nav-item__label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
