"use client"

import React, { useState, useEffect, useCallback } from "react"
import { BroadcastMessage } from "@/types/broadcast"
import { Radio, X, Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert } from "lucide-react"

export function openBroadcastModal(broadcast: BroadcastMessage) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-broadcast-dialog", { detail: { broadcast } }))
  }
}

export default function BroadcastBannerModal() {
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastMessage | null>(null)
  const [isDismissing, setIsDismissing] = useState(false)
  const [visitorId, setVisitorId] = useState<string>("")

  // Generate / retrieve visitor ID for client dismissal persistence
  useEffect(() => {
    if (typeof window === "undefined") return
    let vid = localStorage.getItem("hirecompass_visitor_id")
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
      localStorage.setItem("hirecompass_visitor_id", vid)
    }
    setVisitorId(vid)
  }, [])

  const fetchActiveBroadcast = useCallback(async () => {
    try {
      let vid = visitorId
      if (!vid && typeof window !== "undefined") {
        vid = localStorage.getItem("hirecompass_visitor_id") || ""
      }
      const url = vid ? `/api/broadcasts/active?visitorId=${encodeURIComponent(vid)}` : "/api/broadcasts/active"
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data?.broadcast) {
        // Check if locally dismissed in current tab
        const dismissedLocal = sessionStorage.getItem(`dismissed_bc_${data.broadcast.id}`)
        if (!dismissedLocal) {
          setActiveBroadcast(data.broadcast)
        }
      } else {
        setActiveBroadcast(null)
      }
    } catch {
      // Quiet fail on network issues
    }
  }, [visitorId])

  useEffect(() => {
    fetchActiveBroadcast()

    // Poll every 25 seconds for new admin broadcasts
    const interval = setInterval(fetchActiveBroadcast, 25000)

    const handleFocus = () => fetchActiveBroadcast()
    window.addEventListener("focus", handleFocus)

    // Listen for manual trigger (e.g. from Notification bell or Reminder pill)
    const handleManualOpen = (e: any) => {
      if (e.detail?.broadcast) {
        setActiveBroadcast(e.detail.broadcast)
      }
    }
    window.addEventListener("open-broadcast-dialog", handleManualOpen)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("open-broadcast-dialog", handleManualOpen)
    }
  }, [fetchActiveBroadcast])

  const handleDismiss = async () => {
    if (!activeBroadcast) return
    setIsDismissing(true)
    const broadcastId = activeBroadcast.id

    // Optimistically hide & mark session dismissed
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`dismissed_bc_${broadcastId}`, "true")
    }

    try {
      await fetch("/api/broadcasts/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broadcastId,
          visitorId: visitorId || (typeof window !== "undefined" ? localStorage.getItem("hirecompass_visitor_id") : ""),
        }),
      })
    } catch {
      // Ignore network fail
    } finally {
      setIsDismissing(false)
      setActiveBroadcast(null)
    }
  }

  if (!activeBroadcast) return null

  // Type-based styling
  const typeConfig: Record<string, { icon: any; border: string; bg: string; badge: string; text: string }> = {
    announcement: {
      icon: Bell,
      border: "border-indigo-200 dark:border-indigo-800/60",
      bg: "from-indigo-50/90 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/30",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
      text: "System Announcement",
    },
    urgent: {
      icon: AlertTriangle,
      border: "border-rose-300 dark:border-rose-800/70",
      bg: "from-rose-50/95 to-amber-50/85 dark:from-rose-950/40 dark:to-amber-950/30",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
      text: "Urgent Notification",
    },
    update: {
      icon: CheckCircle2,
      border: "border-emerald-200 dark:border-emerald-800/60",
      bg: "from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      text: "Platform Update",
    },
    maintenance: {
      icon: ShieldAlert,
      border: "border-amber-300 dark:border-amber-800/60",
      bg: "from-amber-50/90 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      text: "Scheduled Notice",
    },
  }

  const currentType = typeConfig[activeBroadcast.type] || typeConfig.announcement
  const IconComponent = currentType.icon

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border ${currentType.border} p-6 sm:p-7 overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-200`}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${currentType.bg} -z-10 pointer-events-none opacity-80`} />

        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${currentType.badge}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${currentType.badge}`}>
                  {currentType.text}
                </span>
                {activeBroadcast.targetType === "USER" ? (
                  <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">
                    Direct Message
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    To Everyone
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                From: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeBroadcast.createdByName}</span>
              </p>
            </div>
          </div>

          {/* Quick Cancel Window Button */}
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cancel and continue working"
            aria-label="Close message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Content */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {activeBroadcast.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto pr-1">
            {activeBroadcast.message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 gap-3">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {activeBroadcast.createdAt ? new Date(activeBroadcast.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs tracking-tight shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>{isDismissing ? "Dismissing..." : "Dismiss & Continue Working"}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
