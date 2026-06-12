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
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Columns className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Application Pipeline</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Drag cards between columns to update your application status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAddJob()}
              className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Add Job
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[240px] h-64 rounded-xl bg-card/20 border border-border/40 animate-pulse" />
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
