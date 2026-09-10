"use client"

import React from "react"
import { useStore } from "@/hooks/useStore"
import SidebarV2 from "./SidebarV2"
import NavbarV2 from "./NavbarV2"
import "@/styles/v2/variables.css"
import "@/styles/v2/reset.css"
import "@/styles/v2/animations.css"
import "@/styles/v2/layout.css"
import "@/styles/v2/components.css"

interface Props {
  children: React.ReactNode
}

export default function DashboardShellV2({ children }: Props) {
  const { sidebarOpen } = useStore()

  return (
    <div className="v2-shell">
      {/* Sidebar */}
      <SidebarV2 />

      {/* Main content — shifts with sidebar width */}
      <div className={`v2-main ${!sidebarOpen ? "v2-main--collapsed" : ""}`}>
        {/* Sticky navbar */}
        <NavbarV2 />

        {/* Page content */}
        <main className="v2-page" id="main-content" tabIndex={-1}>
          <div className="v2-page__inner anim-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
