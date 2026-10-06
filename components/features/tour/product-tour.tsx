"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Compass,
  Briefcase,
  Bot,
  BrainCircuit,
  CalendarCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface TourStep {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  color: string
  bgLight: string
  content: string
  bullets: string[]
  routePreview?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to HireCompass",
    subtitle: "Your complete job search & interview operating system",
    icon: Compass,
    badge: "PLATFORM OVERVIEW",
    color: "#4F46E5",
    bgLight: "bg-indigo-50 text-indigo-600 border-indigo-200",
    content:
      "HireCompass eliminates application chaos. Instead of messy spreadsheets, track every stage of your job hunt, simulate technical interviews, and execute high-yield daily study plans.",
    bullets: [
      "Zero dummy data: every metric, calendar dot, and suggestion is real",
      "Full guest exploration: test tools before signing up",
      "Built-in AI copilot with 10 free tokens to test right now",
    ],
  },
  {
    title: "Application Pipeline (Kanban)",
    subtitle: "Real-time visual tracking from Saved to Offer",
    icon: Briefcase,
    badge: "WORKFLOW ENGINE",
    color: "#10B981",
    bgLight: "bg-emerald-50 text-emerald-600 border-emerald-200",
    content:
      "A fluid, pointer-accurate drag-and-drop board tracking your applications through 7 canonical stages: Saved, Applied, Online Assessment, Interview, Offer, Ghosted, and Rejected.",
    bullets: [
      "No lost applications: track follow-up dates and response rates",
      "Integrated job drawer with interview notes and contact logs",
      "Chrome extension sync: save jobs directly from LinkedIn and Indeed",
    ],
    routePreview: "/applications",
  },
  {
    title: "AI Coding Assessment Arena",
    subtitle: "Enterprise Proctored Exam Simulators",
    icon: BrainCircuit,
    badge: "TESTING SUITE",
    color: "#0284C7",
    bgLight: "bg-sky-50 text-sky-600 border-sky-200",
    content:
      "Practice 6-stage AI-assisted technical assessments simulating real hiring formats (Understanding -> Approach -> Prompting -> Code Generation -> Defect Review -> 100-Point Scorecard).",
    bullets: [
      "150 Capgemini DSA practice problems across 10 tracks",
      "Zero-bypass backend evaluation: prompts are tested for technical rigor",
      "Review past session transcripts and full line-by-line diffs",
    ],
    routePreview: "/assessment",
  },
  {
    title: "Interview Prep Hub & The Griller",
    subtitle: "Staff Engineer & Tech Lead Mock Defenses",
    icon: Zap,
    badge: "INTERVIEW READINESS",
    color: "#D97706",
    bgLight: "bg-amber-50 text-amber-600 border-amber-200",
    content:
      "Turn your resume projects into unshakeable interview answers. 'The Griller' probes your real architecture choices, schema design, and failure modes with constructive persona critiques.",
    bullets: [
      "Company War Room: round expectations and high-signal reverse questions",
      "15-Minute Pre-Interview Adrenaline Primer with Box Breathing timer",
      "Dynamic STAR Story Matrix tailored for EMs and Tech Leads",
    ],
    routePreview: "/prep",
  },
  {
    title: "AI Day Architect & Sweety Copilot",
    subtitle: "Synthesize your daily study plan from real deadlines",
    icon: CalendarCheck,
    badge: "DAILY EXECUTION",
    color: "#8B5CF6",
    bgLight: "bg-purple-50 text-purple-600 border-purple-200",
    content:
      "Never wonder 'why not just write this on paper?'. The AI Day Planner auto-imports your upcoming interviews and uncompleted DSA topics, adapts dynamically when you run behind schedule, and keeps your focus sharp.",
    bullets: [
      "One-click pipeline sync: schedules prep for tomorrow's interviews",
      "'Behind Schedule' button: reshuffles remaining tasks automatically",
      "Chat with Sweety AI copilot anytime using your 10 free tokens",
    ],
    routePreview: "/planner",
  },
]

export function ProductTourModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]
  const isLast = currentStep === TOUR_STEPS.length - 1
  const Icon = step.icon

  const handleNext = () => {
    if (isLast) {
      try {
        localStorage.setItem("hirecompass_tour_seen", "true")
      } catch {}
      onClose()
    } else {
      setCurrentStep((p) => p + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(0, p - 1))
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: step.color }}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                step.bgLight
              )}
            >
              <Sparkles size={11} />
              {step.badge}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={() => {
              try {
                localStorage.setItem("hirecompass_tour_seen", "true")
              } catch {}
              onClose()
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-sm"
              style={{
                backgroundColor: `${step.color}15`,
                color: step.color,
              }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {step.content}
          </p>

          {/* Highlight Bullets */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5">
            {step.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <div className="flex h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center shrink-0 mt-0.5">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Progress Dots & Navigation Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentStep === i ? "w-6 bg-indigo-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                )}
                aria-label={`Go to tour step ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all"
            >
              <span>{isLast ? "Start Exploring" : "Continue"}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTourModal
