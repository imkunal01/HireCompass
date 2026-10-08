"use client"

import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { BroadcastMessage } from "@/types/broadcast"
import { openBroadcastModal } from "@/components/layout/broadcast-banner-modal"
import { Radio, X, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react"

export default function PersonalBroadcastReminder() {
  const { user, isAuthenticated } = useUser()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExamActive, setIsExamActive] = useState(false)

  // 1. Fetch personal broadcast
  const { data } = useQuery<{
    personalBroadcast: BroadcastMessage | null
    isDismissed: boolean
  }>({
    queryKey: ["broadcast-personal"],
    queryFn: async () => {
      const res = await fetch("/api/broadcasts/personal")
      if (!res.ok) return { personalBroadcast: null, isDismissed: false }
      return res.json()
    },
    enabled: Boolean(isAuthenticated && user),
    refetchInterval: 25000,
  })

  const broadcast = data?.personalBroadcast

  // Suppress in exam mode
  useEffect(() => {
    const check = () => {
      const active =
        typeof document !== "undefined" &&
        (document.body.classList.contains("exam-mode-active") ||
          document.body.getAttribute("data-in-exam") === "true")
      setIsExamActive(Boolean(active))
    }
    check()
    window.addEventListener("exam-mode-change", check)
    return () => window.removeEventListener("exam-mode-change", check)
  }, [])

  // Check if reminder was closed in this session
  useEffect(() => {
    if (broadcast?.id && typeof window !== "undefined") {
      const closed = sessionStorage.getItem(`closed_rem_pbc_${broadcast.id}`)
      setIsDismissed(Boolean(closed))
    }
  }, [broadcast?.id])

  if (!broadcast || isDismissed || isExamActive) {
    return null
  }

  const handleOpenDialog = () => {
    openBroadcastModal(broadcast)
  }

  const handleCloseReminder = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissed(true)
    if (typeof window !== "undefined" && broadcast?.id) {
      sessionStorage.setItem(`closed_rem_pbc_${broadcast.id}`, "true")
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[99990] max-w-sm w-full p-2 sm:p-0 animate-in slide-in-from-bottom-5 duration-300">
      <div
        onClick={handleOpenDialog}
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800/60 p-4 shadow-xl hover:shadow-2xl hover:border-violet-400 transition-all"
      >
        {/* Glow Underlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative flex items-start gap-3">
          {/* Animated Icon */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 rounded-full">
                Personal Message
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(broadcast.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {broadcast.title}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              From: {broadcast.createdByName || "Administrator"}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400">
                <span>Open Message Dialog</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Close reminder button */}
          <button
            onClick={handleCloseReminder}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss reminder"
            aria-label="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
