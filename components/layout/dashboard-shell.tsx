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
    <div className="relative min-h-screen flex bg-slate-50/80">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-[72px]"
        )}
      >
        {/* Sticky Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
