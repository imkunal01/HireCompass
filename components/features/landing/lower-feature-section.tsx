"use client"

import React from "react"
import Link from "next/link"
import {
  Kanban,
  Bell,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Calendar,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react"

export default function LowerFeatureSection() {
  const features = [
    {
      title: "Application pipeline",
      description: "Keep track of every stage from saved to hired.",
      iconBg: "bg-[#EEECFC] text-[#6366F1] border border-indigo-100/60",
      icon: <Kanban className="h-5 w-5" />,
    },
    {
      title: "Smart reminders",
      description: "Never miss an important follow-up.",
      iconBg: "bg-[#FEF3C7] text-[#D97706] border border-amber-200/60",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: "Interview preparation",
      description: "Keep notes, resources and practice material.",
      iconBg: "bg-[#DCFCE7] text-[#16A34A] border border-emerald-200/60",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      description: "See what's working and improve over time.",
      iconBg: "bg-[#E0F2FE] text-[#0284C7] border border-sky-200/60",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#f5f6fe]/70 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200/25 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* ══════════════════════════════════════════
              LEFT COLUMN — Typography & Feature List
             ══════════════════════════════════════════ */}
          <div className="lg:col-span-5">
            {/* Eyebrow */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#E8E6FC] text-[#6366F1] border border-indigo-200/60 mb-5">
              BUILT FOR FOCUSED PROGRESS
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-900 leading-[1.15] mb-5">
              A clearer, calmer{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                job search
              </span>{" "}
              journey.
            </h2>

            {/* Supporting description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
              HireCompass helps you stay organized, prepared and consistent — so you can focus on what really matters, getting hired.
            </p>

            {/* 4 Feature Items */}
            <div className="space-y-4 mb-8">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3.5 group">
                  <div
                    className={`h-11 w-11 rounded-xl ${feat.iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}
                  >
                    {feat.icon}
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 leading-snug">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200/90 text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50/50 font-semibold text-xs sm:text-sm shadow-sm transition-all duration-200 hover:shadow"
            >
              <span>Explore all features</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN — Layered Product UI Cards
             ══════════════════════════════════════════ */}
          <div className="lg:col-span-7 relative pt-8 sm:pt-12 pb-16 sm:pb-20 lg:pb-16 pr-2 sm:pr-8">
            {/* Whimsical Handwritten Note 1: "Keep track of every opportunity" */}
            <div className="hidden sm:flex items-center gap-2 absolute -left-6 sm:-left-12 top-48 z-30 select-none pointer-events-none">
              <span className="font-handwriting text-lg sm:text-xl font-bold text-indigo-600 rotate-[-8deg] leading-tight text-right">
                Keep track of<br />every opportunity
              </span>
              <svg className="w-10 h-10 text-indigo-500 stroke-current -rotate-12" viewBox="0 0 40 40" fill="none">
                <path
                  d="M5 25 C15 30 25 25 32 10"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
                <polyline points="24,8 33,9 33,18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* ── CARD 1: Upcoming Interviews (Top Layered Card) ── */}
            <div className="w-[88%] sm:w-[75%] ml-auto mr-4 mb-[-36px] relative z-10 bg-white rounded-2xl shadow-[0_10px_35px_rgba(30,27,75,0.06)] border border-slate-200/80 p-4 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Upcoming Interviews</span>
              </div>

              <div className="py-5 px-3 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center mb-2.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">No interviews scheduled</p>
                <p className="text-[11px] text-slate-400 mb-3">Your upcoming interviews will appear here.</p>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Browse Opportunities <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* ── CARD 2: Main Application Pipeline Panel ── */}
            <div className="w-full relative z-20 bg-white rounded-3xl shadow-[0_20px_50px_rgba(30,27,75,0.09)] border border-slate-200/80 p-5 sm:p-6">
              {/* Header with Pipeline Title */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Kanban className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Application Pipeline</span>
                </div>

                {/* Floating Mint Paper Airplane */}
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shadow-sm -mr-1">
                  <Send className="h-4 w-4" />
                </div>
              </div>

              {/* Status Indicator Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-4 text-[11px] font-semibold text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Saved <strong className="text-slate-900">8</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Applied <strong className="text-slate-900">22</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> OA / Assessment <strong className="text-slate-900">0</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Interview <strong className="text-slate-900">8</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Offer <strong className="text-slate-900">0</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Rejected <strong className="text-slate-900">5</strong>
                </span>
              </div>

              {/* Sample Job Rows */}
              <div className="space-y-2.5">
                {/* 1. Google */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.99 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.57 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">Software Engineer Intern</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Google</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                      Saved
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">2 days ago</span>
                  </div>
                </div>

                {/* 2. Spotify */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1DB954">
                        <circle cx="12" cy="12" r="11" />
                        <path d="M6 9 C10 8 15 9 18 11" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M7 12 C10.5 11 14.5 12 17 13.5" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M8 15 C10.5 14.5 13.5 15 15.5 16" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">Frontend Developer</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Spotify</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Applied
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">5 days ago</span>
                  </div>
                </div>

                {/* 3. Amazon */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#FF9900"
                          d="M13.9 14.8c-2.3 1.7-5.7 2.6-8.7 2.6-4.1 0-7.8-1.5-10.6-4-.2-.2 0-.5.3-.3 3.1 1.7 6.9 2.7 10.7 2.7 2.6 0 5.6-.7 8-2.1.4-.2.7.2.3.6l-.01.5z"
                        />
                        <path
                          fill="#FF9900"
                          d="M14.9 13.4c-.3-.4-1.9-.2-2.7-.1-.2 0-.3-.2-.1-.3 1.1-.9 2.9-.6 3.2-.2.3.4-.1 2.2-1.2 3.1-.2.1-.3 0-.3-.2.2-.7.4-1.9.1-2.3z"
                        />
                        <text x="3" y="12" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#111827">a</text>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">SDE Intern</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Amazon</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                      Interview
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">1 week ago</span>
                  </div>
                </div>

                {/* 4. Microsoft */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                      <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                        <div className="bg-[#F25022] rounded-[1px]" />
                        <div className="bg-[#7FBA00] rounded-[1px]" />
                        <div className="bg-[#00A4EF] rounded-[1px]" />
                        <div className="bg-[#FFB900] rounded-[1px]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">Software Engineer</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Microsoft</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                      Rejected
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 3: Your Progress Card (Bottom Right Layered Card) ── */}
            <div className="w-[85%] sm:w-[68%] ml-auto mt-[-32px] mr-2 relative z-30 bg-white rounded-2xl shadow-[0_15px_40px_rgba(30,27,75,0.08)] border border-slate-200/80 p-4 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Your Progress</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* Donut Chart Gauge */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-18 h-18 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 80 80">
                    {/* Background circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#F1F5F9"
                      strokeWidth="7"
                      fill="none"
                    />
                    {/* Value circle (27%) */}
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="url(#progressGradient)"
                      strokeWidth="7"
                      strokeDasharray={201}
                      strokeDashoffset={201 * (1 - 0.27)}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">27%</span>
                  </div>
                </div>

                {/* Progress Metrics Legend */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      <span>Applied</span>
                    </div>
                    <span className="font-bold text-slate-900">27</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      <span>Interviews</span>
                    </div>
                    <span className="font-bold text-slate-900">8</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Offers</span>
                    </div>
                    <span className="font-bold text-slate-900">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Whimsical Handwritten Note 2: "Turn effort into progress" */}
            <div className="hidden sm:flex items-center gap-2 absolute right-0 sm:right-2 -bottom-2 sm:-bottom-4 z-30 select-none pointer-events-none">
              <svg className="w-10 h-10 text-indigo-500 stroke-current rotate-45" viewBox="0 0 40 40" fill="none">
                <path
                  d="M32 30 C20 32 12 24 10 10"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
                <polyline points="7,19 10,9 20,11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-handwriting text-lg sm:text-xl font-bold text-indigo-600 rotate-[4deg] leading-tight">
                Turn effort<br />into progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
