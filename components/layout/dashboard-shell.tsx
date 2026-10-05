"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Navbar from "./navbar"
import BottomNav from "./bottom-nav"
import NotificationInitializer from "@/components/ui/notification-initializer"
import AgentChat from "@/components/features/agent/agent-chat"

import Link from "next/link"
import ProductTourModal from "@/components/features/tour/product-tour"
import { useAuthModal } from "@/components/features/auth/auth-modal"

interface DashboardShellProps {
  children: React.ReactNode
  isGuest?: boolean
}

export default function DashboardShell({ children, isGuest = false }: DashboardShellProps) {
  const pathname = usePathname()
  const { openAuthModal } = useAuthModal()
  const isAssessmentRoute = pathname?.startsWith("/assessment")
  const [isExamActive, setIsExamActive] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  // Check tour status on initial guest load
  useEffect(() => {
    if (isGuest && typeof window !== "undefined") {
      const seen = localStorage.getItem("hirecompass_tour_seen")
      if (!seen) {
        const timer = setTimeout(() => {
          setTourOpen(true)
        }, 600)
        return () => clearTimeout(timer)
      }
    }
  }, [isGuest])

  // Listen to exam mode events to suppress website chrome during active tests
  useEffect(() => {
    const check = () => {
      const active =
        typeof document !== "undefined" &&
        (document.body.classList.contains("exam-mode-active") ||
          document.body.getAttribute("data-in-exam") === "true")
      setIsExamActive(Boolean(active))
    }
    check()

    const handler = (e: any) => {
      setIsExamActive(Boolean(e.detail?.inExam ?? document.body.classList.contains("exam-mode-active")))
    }

    window.addEventListener("exam-mode-change", handler)
    return () => window.removeEventListener("exam-mode-change", handler)
  }, [pathname])

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#F6F8FC] dark:bg-[#070B14] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-200">
      
      {/* ── Rich & Beautiful Multi-layered Aurora Glow Background Canvas ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        
        {/* Top-Left Radiant Indigo & Violet Aurora */}
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-500/18 to-transparent blur-3xl opacity-80 dark:opacity-40 animate-pulse-slow" />
        
        {/* Top-Right Glowing Rose, Pink & Peach Atmosphere */}
        <div className="absolute -top-24 -right-24 w-80 h-80 sm:w-[540px] sm:h-[540px] rounded-full bg-gradient-to-bl from-pink-500/22 via-rose-400/15 to-transparent blur-3xl opacity-80 dark:opacity-35" />
        
        {/* Center Radiant Sky Blue & Cyan Nebula */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-cyan-400/18 via-sky-300/12 to-transparent blur-3xl opacity-75 dark:opacity-30" />
        
        {/* Subtle Warm Amber / Gold Shimmer in Center-Right */}
        <div className="absolute top-1/2 right-1/4 w-72 h-72 sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-tl from-amber-400/15 via-purple-400/10 to-transparent blur-3xl opacity-65 dark:opacity-25" />

        {/* Bottom-Left Vibrant Electric Petal Bloom */}
        <div className="absolute bottom-0 left-0 h-56 w-64 sm:h-72 sm:w-80 opacity-70 dark:opacity-35">
          <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500">
            <defs>
              <linearGradient id="aurora-petal-1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#EC4899" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
              </linearGradient>
              <filter id="bloom-blur-rich" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
            </defs>
            <path
              d="M-20,220 C20,110 70,90 120,120 C170,150 180,190 210,220 Z"
              fill="url(#aurora-petal-1)"
              filter="url(#bloom-blur-rich)"
            />
            <path
              d="M-40,240 C10,130 100,100 140,160 C170,200 190,240 230,260 Z"
              fill="#A855F7"
              fillOpacity="0.45"
              filter="url(#bloom-blur-rich)"
            />
          </svg>
        </div>

        {/* Bottom-Right Sunset Rose & Electric Purple Bloom */}
        <div className="absolute bottom-0 right-0 h-56 w-64 sm:h-72 sm:w-80 opacity-70 dark:opacity-35">
          <svg viewBox="0 0 200 200" className="w-full h-full text-violet-500">
            <defs>
              <linearGradient id="aurora-petal-2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#A855F7" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M220,220 C180,110 130,90 80,120 C30,150 20,190 -10,220 Z"
              fill="url(#aurora-petal-2)"
              filter="url(#bloom-blur-rich)"
            />
            <path
              d="M240,240 C190,130 100,100 60,160 C30,200 10,240 -30,260 Z"
              fill="#F43F5E"
              fillOpacity="0.4"
              filter="url(#bloom-blur-rich)"
            />
          </svg>
        </div>

      </div>

      {/* ── Guest Exploration Announcement Banner (Hidden in Exam Mode) ── */}
      {isGuest && !isExamActive && (
        <div className="relative z-40 w-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white px-4 py-2 sm:py-2.5 text-xs font-medium shadow-sm transition-all flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="leading-snug">
              <strong className="font-extrabold tracking-wide">Guest Exploration Mode:</strong> You have full access to explore the platform & <strong>10 free AI copilot tokens</strong> without signing in.
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
            <button
              onClick={() => setTourOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold tracking-tight transition-colors border border-white/20"
            >
              <span>Take Tour</span>
              <span>🎯</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal({ mode: "signup", reason: "Create an account to save your applications permanently and access all features." })}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-[11px] tracking-tight transition-colors shadow-xs"
            >
              <span>Create Account</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Top Navigation Bar Header (Hidden in Exam Mode) ── */}
      {!isExamActive && <Navbar />}

      {/* ── Main Content Canvas (No stacking context trap for ExamEnvironment) ── */}
      <main className="flex-1 w-full relative">
        <div
          className={
            isExamActive
              ? "w-full p-0"
              : "w-full px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-16"
          }
        >
          {children}
        </div>
      </main>

      {/* ── Mobile Phone Bottom Navigation Bar (md:hidden, Hidden in Exam Mode) ── */}
      {!isExamActive && <BottomNav />}

      {/* Notification background checker */}
      <NotificationInitializer />

      {/* AI Agent Chatbot — strictly hidden on assessment routes & during exams */}
      {!isAssessmentRoute && !isExamActive && <AgentChat />}

      {/* Product Tour Modal */}
      <ProductTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  )
}
