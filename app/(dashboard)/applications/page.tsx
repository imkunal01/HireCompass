"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Columns, RefreshCw } from "lucide-react"
import { Opportunity, OpportunityStatus } from "@/types/opportunity"
import { KanbanBoard } from "@/components/features/kanban/kanban-board"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { ToastProvider } from "@/components/ui/toast"

// Rich mock data shown before API is populated
const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "m1", userId: "", company: "Google", title: "Software Engineer Intern",
    status: "INTERVIEW", priority: "HIGH",
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    skills: ["Python", "Algorithms"], tags: ["big tech", "dream company"],
    notes: "Prep DS&A",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "m2", userId: "", company: "Vercel", title: "Frontend Engineer",
    status: "SAVED", priority: "HIGH",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    skills: ["React", "TypeScript", "Next.js"], tags: ["remote", "frontend"],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "m3", userId: "", company: "Stripe", title: "Fullstack Developer",
    status: "APPLIED", priority: "MEDIUM",
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    skills: ["Node.js", "React"], tags: ["fintech"],
    notes: "Applied via referral",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "m4", userId: "", company: "Linear", title: "Senior Product Engineer",
    status: "OFFER", priority: "HIGH",
    skills: ["TypeScript", "Design Systems"], tags: ["dream company", "remote"],
    notes: "Negotiating base salary",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "m5", userId: "", company: "Notion", title: "React Developer",
    status: "INTERESTED", priority: "MEDIUM",
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    skills: ["React", "Electron"], tags: ["productivity"],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "m6", userId: "", company: "Figma", title: "Platform Engineer",
    status: "ASSESSMENT", priority: "MEDIUM",
    skills: ["C++", "WebAssembly"], tags: ["design-tech"],
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    oaDetails: { platform: "HackerRank", totalRounds: 1, currentRound: 1, status: "PENDING", topics: ["Algorithms", "Data Structures"] },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "m7", userId: "", company: "Amazon", title: "SDE-1 (Backend)",
    status: "REJECTED", priority: "HIGH",
    skills: ["Java", "Distributed Systems", "AWS"], tags: ["big tech"],
    rejectionDetails: {
      stage: "Technical Round 1 (DSA / Coding)",
      reasonCategory: "DSA & Problem-Solving Speed Gaps",
      whatWasAsked: "LRU Cache in O(1) time + Subarray sum equals K",
      whyRejected: "Struggled with doubly linked list edge cases under time pressure",
      whereFumbled: "Forgot null check on head/tail deletion in the LRU eviction method",
      lessonsLearned: "Practice 15 more linked list & sliding window questions with 20min timers",
      rejectionDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
]

export default function ApplicationsPage() {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addDefaultStatus, setAddDefaultStatus] = useState<OpportunityStatus>("SAVED")

  const { data: apiOpportunities, isLoading, refetch } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const opportunities = (apiOpportunities && apiOpportunities.length > 0)
    ? apiOpportunities
    : MOCK_OPPORTUNITIES

  const handleAddJob = (status?: OpportunityStatus) => {
    setAddDefaultStatus(status || "SAVED")
    setAddModalOpen(true)
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/80">
                <Columns className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Application Pipeline</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 ml-10.5">
              Drag cards between columns to update your application status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/40 shadow-sm transition-all duration-150"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAddJob()}
              className="flex items-center gap-2 rounded-xl text-white px-4 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
            >
              <Plus className="h-4 w-4" /> Add Job
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[240px] h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 skeleton" />
            ))}
          </div>
        )}

        {/* Kanban Board */}
        {!isLoading && (
          <KanbanBoard
            opportunities={opportunities}
            onCardClick={setSelectedOpp}
            onEdit={setSelectedOpp}
            onAddJob={handleAddJob}
          />
        )}
      </div>

      {/* Job Detail Drawer */}
      <JobDrawer
        opportunityId={selectedOpp?.id ?? null}
        initialData={selectedOpp ?? undefined}
        onClose={() => setSelectedOpp(null)}
      />

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultStatus={addDefaultStatus}
      />
    </ToastProvider>
  )
}
