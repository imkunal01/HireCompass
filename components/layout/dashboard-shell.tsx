"use client"

import React from "react"
import { useStore } from "@/hooks/useStore"
import Sidebar from "./sidebar"
import Navbar from "./navbar"
import { cn } from "@/lib/utils"
import NotificationInitializer from "@/components/ui/notification-initializer"

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen } = useStore()

  return (
    <div className="relative min-h-[100dvh] flex bg-slate-100/60 font-sans text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Floating Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative",
          sidebarOpen ? "md:pl-[280px]" : "md:pl-[104px]"
        )}
      >
        {/* Floating Navbar */}
        <Navbar />

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {/* Main Content Wrapper with top padding for navbar */}
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-6 md:pb-8 min-h-[calc(100dvh-1rem)]">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 p-4 md:p-7 min-h-[calc(100dvh-8rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => useStore.getState().toggleSidebar()}
        />
      )}

      {/* Notification background checker */}
      <NotificationInitializer />
    </div>
  )
}
