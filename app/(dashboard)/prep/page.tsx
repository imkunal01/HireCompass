"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  BrainCircuit,
  ShieldAlert,
  Flame,
  Star,
  RefreshCw,
  Zap,
  Calendar,
  ChevronRight,
  Sparkles,
  ListChecks,
  Target,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react"
import { PrepTab } from "@/types/prep"
import { cn } from "@/lib/utils"
import { WarRoomTab } from "@/components/features/prep/war-room-tab"
import { GrillerTab } from "@/components/features/prep/griller-tab"
import { StarMatrixTab } from "@/components/features/prep/star-matrix-tab"
import { RemediationTab } from "@/components/features/prep/remediation-tab"
import { PrimerTab } from "@/components/features/prep/primer-tab"

const TABS: Array<{
  id: PrepTab
  label: string
  icon: any
  badge: string
  color: string
  gradient: string
  description: string
}> = [
  {
    id: "war-room",
    label: "War Room",
    icon: Target,
    badge: "Tactical Dossier",
    color: "from-blue-500 to-indigo-500",
    gradient: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
    description: "Company intelligence, focus topics & reverse questions",
  },
  {
    id: "griller",
    label: "The Griller",
    icon: Flame,
    badge: "AI Simulator",
    color: "from-amber-500 to-rose-500",
    gradient: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    description: "Defend your actual Project Vault against Staff Engineers",
  },
  {
    id: "star-matrix",
    label: "STAR Matrix",
    icon: Star,
    badge: "Behavioral Synth",
    color: "from-purple-500 to-pink-500",
    gradient: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    description: "Auto-synthesized stories tailored for EM, Principal & PM",
  },
  {
    id: "remediation",
    label: "Remediation",
    icon: RefreshCw,
    badge: "Gap Recovery",
    color: "from-rose-500 to-orange-500",
    gradient: "hover:border-rose-500/50 hover:shadow-rose-500/10",
    description: "Anti-pattern recovery drills from historical rejections",
  },
  {
    id: "primer",
    label: "15-Min Primer",
    icon: Zap,
    badge: "Cognitive Sprint",
    color: "from-teal-500 to-emerald-500",
    gradient: "hover:border-teal-500/50 hover:shadow-teal-500/10",
    description: "Timed pre-interview bug triage, Big-O reflex & box breathing",
  },
]

export default function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState<PrepTab>("war-room")

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === "1") setActiveTab("war-room")
      if (e.key === "2") setActiveTab("griller")
      if (e.key === "3") setActiveTab("star-matrix")
      if (e.key === "4") setActiveTab("remediation")
      if (e.key === "5") setActiveTab("primer")
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch upcoming interviews for context banner
  const { data: interviewsData } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await fetch("/api/interviews")
      if (!res.ok) return []
      return res.json()
    },
  })

  const upcomingInterviews = Array.isArray(interviewsData)
    ? interviewsData.filter((i: any) => i.status === "UPCOMING")
    : []
  const nextInterview = upcomingInterviews[0]

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-60 left-0 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Top Hero Cockpit Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/90 via-slate-50/50 to-white/70 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-indigo-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 shadow-xs">
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-violet-500" />
                Interview Intelligence Hub
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Defense Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Tactical Interview Preparation
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Targeted company briefings, interactive project defense simulations, and behavioral synthesis directly grounded in your verified career portfolio.
            </p>
          </div>

          {/* Quick link button to Problem Solving Roadmaps */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/prep/problem-solving"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] group"
            >
              <ListChecks className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>Problem Solving Sheets</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Upcoming Interview Context Alert Banner ── */}
      {nextInterview && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 sm:p-6 backdrop-blur-md shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shrink-0 shadow-inner">
                <Calendar className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                    Next Up on Calendar
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {nextInterview.date} at {nextInterview.time}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {nextInterview.company} — <span className="font-semibold text-indigo-600 dark:text-indigo-400">{nextInterview.role}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Round Format: <span className="font-bold text-slate-800 dark:text-slate-200">{nextInterview.type}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("war-room")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-indigo-500/25 hover:scale-[1.02] shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Launch Tactical War Room</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Interactive Cyber-Navigation Pill Bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
          <span>SELECT PREPARATION MODULE</span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">1-5</kbd> on keyboard to switch tabs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex flex-col p-3.5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden",
                  isActive
                    ? "bg-white dark:bg-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20 scale-[1.02]"
                    : "bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-400/60 hover:scale-[1.01]"
                )}
              >
                {/* Active Indicator Top Light Bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500" />
                )}

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-500/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                      isActive
                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-extrabold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}
                  >
                    {idx + 1}
                  </span>
                </div>

                <div className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  {tab.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {tab.badge}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Active Module Interactive Stage ── */}
      <div className="min-h-[500px] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm transition-all duration-300">
        {activeTab === "war-room" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <WarRoomTab
              initialCompany={nextInterview?.company || ""}
              initialRole={nextInterview?.role || ""}
              initialRoundType={nextInterview?.type || "Technical Phone Screen"}
            />
          </div>
        )}

        {activeTab === "griller" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <GrillerTab />
          </div>
        )}

        {activeTab === "star-matrix" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <StarMatrixTab />
          </div>
        )}

        {activeTab === "remediation" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <RemediationTab />
          </div>
        )}

        {activeTab === "primer" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <PrimerTab />
          </div>
        )}
      </div>
    </div>
  )
}
