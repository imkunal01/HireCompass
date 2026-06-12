"use client"

import React from "react"
import { useStore } from "@/hooks/useStore"
import Sidebar from "./sidebar"
import Navbar from "./navbar"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen } = useStore()

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Sidebar - fixed-width panel */}
      <Sidebar />

      {/* Main container panel - fluid layout */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic page content area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
