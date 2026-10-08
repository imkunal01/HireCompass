"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BroadcastMessage } from "@/types/broadcast"
import { openBroadcastModal } from "@/components/layout/broadcast-banner-modal"
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Radio,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardBroadcastBanner() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { data } = useQuery<{ broadcast: BroadcastMessage | null }>({
    queryKey: ["broadcast-global-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/broadcasts/global")
      if (!res.ok) return { broadcast: null }
      return res.json()
    },
    refetchInterval: 30000,
  })

  const broadcast = data?.broadcast
  if (!broadcast) return null

  const typeConfig: Record<
    string,
    { icon: any; border: string; bg: string; badge: string; text: string; glow: string }
  > = {
    announcement: {
      icon: Bell,
      border: "border-indigo-200 dark:border-indigo-800/80",
      bg: "bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/5",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
      text: "System Announcement",
      glow: "from-indigo-500/20",
    },
    urgent: {
      icon: AlertTriangle,
      border: "border-rose-300 dark:border-rose-800/80",
      bg: "bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/5",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
      text: "Urgent Notification",
      glow: "from-rose-500/25",
    },
    update: {
      icon: CheckCircle2,
      border: "border-emerald-200 dark:border-emerald-800/80",
      bg: "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      text: "Platform Update",
      glow: "from-emerald-500/20",
    },
    maintenance: {
      icon: ShieldAlert,
      border: "border-amber-300 dark:border-amber-800/80",
      bg: "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      text: "Scheduled Notice",
      glow: "from-amber-500/20",
    },
  }

  const currentType = typeConfig[broadcast.type] || typeConfig.announcement
  const IconComponent = currentType.icon

  return (
    <div
      className={cn(
        "relative rounded-3xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 mb-6",
        currentType.border
      )}
    >
      {/* Aurora Ambient Underlay */}
      <div className={cn("absolute inset-0 pointer-events-none opacity-60", currentType.bg)} />

      {/* Top Banner Row */}
      <div className="relative p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
              currentType.badge
            )}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full",
                  currentType.badge
                )}
              >
                {currentType.text}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Broadcasted to Everyone
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                {new Date(broadcast.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate mt-1">
              {broadcast.title}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openBroadcastModal(broadcast)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            title="Open full dialog modal"
            aria-label="Open in modal dialog"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand announcement" : "Collapse announcement"}
            aria-label="Toggle expand"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Message Body */}
      {!isCollapsed && (
        <div className="relative px-5 pb-5 pt-0">
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line shadow-xs">
            {broadcast.message}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1">
            <span>
              Author: <strong className="text-slate-600 dark:text-slate-300">{broadcast.createdByName}</strong>
            </span>
            <button
              onClick={() => openBroadcastModal(broadcast)}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View in popup dialog</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
