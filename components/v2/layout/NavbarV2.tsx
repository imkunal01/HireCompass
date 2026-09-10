"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useStore } from "@/hooks/useStore"
import { useUser } from "@/hooks/useUser"
import { Menu, Bell, Search, Plus } from "lucide-react"
import "@/styles/v2/variables.css"
import "@/styles/v2/layout.css"

// Map pathname → human-readable page title
const PAGE_TITLES: Record<string, string> = {
  "/v2/dashboard":     "Dashboard",
  "/v2/opportunities": "Opportunities",
  "/v2/applications":  "Applications",
  "/v2/interviews":    "Interviews",
  "/v2/rejected":      "Rejection Tracker",
  "/v2/analytics":     "Analytics",
  "/v2/reminders":     "Reminders",
  "/v2/import":        "Import Jobs",
  "/v2/outreach":      "Outreach",
  "/v2/assistant":     "AI Assistant",
  "/v2/projects":      "Projects",
  "/v2/resumes":       "Resumes",
  "/v2/settings":      "Settings",
}

function getPageTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Prefix match for nested routes (e.g. /v2/outreach/campaign/xyz)
  const match = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k + "/"))
  return match ? PAGE_TITLES[match] : "HireCompass"
}

export default function NavbarV2() {
  const pathname = usePathname()
  const { toggleSidebar } = useStore()
  const { user } = useUser()

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="v2-navbar" role="banner">
      {/* Mobile menu toggle */}
      <button
        className="v2-navbar__menu-btn"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      {/* Page title / breadcrumb */}
      <div className="v2-navbar__breadcrumb">
        <h1 className="v2-navbar__page-title">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="v2-navbar__actions">
        {/* Search trigger (future: open command palette) */}
        <button
          className="v2-navbar__icon-btn"
          aria-label="Search"
          title="Search (⌘K)"
        >
          <Search size={16} strokeWidth={2} />
        </button>

        {/* Notifications */}
        <button
          className="v2-navbar__icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
          {/* Dot shown only when there are unread reminders — wired up in Phase 3 */}
        </button>

        {/* Avatar */}
        {user && (
          <div
            className="v2-user-avatar"
            style={{ width: 32, height: 32, fontSize: "var(--text-sm)", cursor: "default" }}
            title={user.name}
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
      </div>
    </header>
  )
}
