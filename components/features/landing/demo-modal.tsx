"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { X, Play, ArrowRight, CheckCircle2, Terminal, LayoutDashboard, Kanban, CalendarCheck } from "lucide-react"

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pipeline" | "assessment" | "planner">("dashboard")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const tabs = [
    { id: "dashboard", label: "Dashboard Mission Control", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "pipeline", label: "Application Pipeline", icon: <Kanban className="h-4 w-4" /> },
    { id: "assessment", label: "AI Exam Simulator", icon: <Terminal className="h-4 w-4" /> },
    { id: "planner", label: "Daily Prep & Planner", icon: <CalendarCheck className="h-4 w-4" /> },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">HireCompass Interactive Tour</h3>
              <p className="text-[11px] text-slate-500">Explore how the focused workspace powers your career search</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-white overflow-x-auto gap-2 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Preview Area */}
        <div className="p-6 bg-slate-50/40 min-h-[340px]">
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Unified Mission Control</span>
                  <span className="text-[11px] text-slate-400">Real-time KPI Tracking</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Everything in one glance without mental clutter</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Track total opportunities saved, applications submitted, interviews scheduled, response rates, and due follow-ups with sparkline trends and daily motivational focus items.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[11px] text-indigo-600 font-semibold block">Saved Jobs</span>
                    <span className="text-xl font-black text-slate-900">36</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[11px] text-emerald-600 font-semibold block">Applied</span>
                    <span className="text-xl font-black text-slate-900">27</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[11px] text-purple-600 font-semibold block">Interviews</span>
                    <span className="text-xl font-black text-slate-900">8</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="text-[11px] text-amber-600 font-semibold block">Due Actions</span>
                    <span className="text-xl font-black text-slate-900">3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Visual Kanban & Table</span>
                  <span className="text-[11px] text-slate-400">Drag & Drop Simplicity</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Move applications smoothly across stages</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Effortlessly organize your job hunt across 6 intuitive stages: Saved, Applied, Online Assessment, Technical Interview, Offer, and Rejected.
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
                  <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">Saved (8)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">Applied (22)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">OA (0)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">Interview (8)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100">Offer (0)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assessment" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Capgemini AI Coding Arena</span>
                  <span className="text-[11px] text-slate-400">Proctored Simulation</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Master AI-assisted corporate recruitment</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Experience full 6-stage proctored simulations: Problem Understanding, Structured Prompting, Code Generation, Code Review against seeded bugs, and 100-pt post-assessment evaluation.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs">
                  <div className="text-indigo-400 font-bold mb-1">{"// Capgemini AI Coding Simulator"}</div>
                  <div>$ exam --session capgemini-dsa --mode strict</div>
                  <div className="text-emerald-400">✓ Evaluator active | Proctored console locked | 0-Cheat guardrails enabled</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "planner" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Daily Execution & Vault</span>
                  <span className="text-[11px] text-slate-400">Daily Consistency Engine</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Turn job searching into focused daily wins</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Schedule targeted 45-minute problem solving blocks, project defense drills, and resume tailoring without overwhelming your calendar.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 text-emerald-800 border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Apply to at least 2 roles before 12:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/70 text-blue-800 border border-blue-100">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Solve 2 Blind-75 Dynamic Programming problems</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/70 text-purple-800 border border-purple-100">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>15-Minute Pre-Interview Adrenaline Primer Drill</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
          <span className="text-xs text-slate-500">Free forever • No credit card required</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
            <Link
              href="/signup"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-2"
            >
              <span>Get started for free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
