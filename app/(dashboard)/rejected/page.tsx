"use client"

import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertOctagon, Search, Filter, Plus, Sparkles, Brain, Layers,
  ChevronRight, ExternalLink, Edit3, ArrowUpRight, BookOpen,
  CheckCircle2, XCircle, Clock, ShieldAlert, BarChart2, RefreshCw,
  HelpCircle, Lightbulb, Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Opportunity, REJECTION_STAGES, REJECTION_REASONS,
  STATUS_CONFIG, normalizeStatus
} from "@/types/opportunity"
import { CompanyAvatar } from "@/components/ui/badge"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { ToastProvider } from "@/components/ui/toast"

export default function RejectedTrackerPage() {
  const [search, setSearch] = useState("")
  const [selectedStage, setSelectedStage] = useState<string>("ALL")
  const [selectedReason, setSelectedReason] = useState<string>("ALL")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Fetch opportunities
  const { data: opps = [], isLoading, refetch } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) throw new Error("Failed to load opportunities")
      return res.json()
    },
  })

  // Filter only REJECTED opportunities
  const rejectedOpps = useMemo(() => {
    return opps.filter((o) => normalizeStatus(o.status) === "REJECTED")
  }, [opps])

  // Compute Stage Breakdown
  const stageStats = useMemo(() => {
    const counts: Record<string, number> = {}
    REJECTION_STAGES.forEach((s) => (counts[s] = 0))

    rejectedOpps.forEach((o) => {
      const stage = o.rejectionDetails?.stage || "Resume Screen / No Shortlist"
      counts[stage] = (counts[stage] || 0) + 1
    })

    return counts
  }, [rejectedOpps])

  // Find top drop-off stage
  const topStage = useMemo(() => {
    let max = 0
    let top = "None"
    Object.entries(stageStats).forEach(([stage, count]) => {
      if (count > max) {
        max = count
        top = stage
      }
    })
    return { stage: top, count: max }
  }, [stageStats])

  // Count with post-mortems logged
  const postMortemLoggedCount = useMemo(() => {
    return rejectedOpps.filter(
      (o) => o.rejectionDetails?.whatWasAsked || o.rejectionDetails?.whereFumbled
    ).length
  }, [rejectedOpps])

  // Filtered List
  const filteredList = useMemo(() => {
    return rejectedOpps.filter((o) => {
      const stage = o.rejectionDetails?.stage || "Resume Screen / No Shortlist"
      const reason = o.rejectionDetails?.reasonCategory || ""
      const whatWasAsked = o.rejectionDetails?.whatWasAsked || ""
      const whereFumbled = o.rejectionDetails?.whereFumbled || ""
      const lessons = o.rejectionDetails?.lessonsLearned || ""

      // Stage Filter
      if (selectedStage !== "ALL" && stage !== selectedStage) return false

      // Reason Filter
      if (selectedReason !== "ALL" && reason !== selectedReason) return false

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchCompany = o.company.toLowerCase().includes(q)
        const matchTitle = o.title.toLowerCase().includes(q)
        const matchAsked = whatWasAsked.toLowerCase().includes(q)
        const matchFumbled = whereFumbled.toLowerCase().includes(q)
        const matchLessons = lessons.toLowerCase().includes(q)
        return matchCompany || matchTitle || matchAsked || matchFumbled || matchLessons
      }

      return true
    })
  }, [rejectedOpps, selectedStage, selectedReason, search])

  return (
    <ToastProvider>
      <div className="space-y-8 pb-16 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Rejection Tracker & Post-Mortem
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Turn setbacks into unfair advantages. Analyze drop-off stages, log where you fumbled, and generate AI revision plans.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/assistant?q=Can%20you%20analyze%20all%20my%20recent%20interview%20rejections%20and%20give%20me%20a%20master%20preparation%20plan%20for%20my%20weakest%20topics%3F"
              className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 px-3.5 py-2 text-xs font-semibold transition-all"
            >
              <Sparkles className="h-4 w-4" />
              AI Rejection Analysis
            </a>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 px-4 py-2 text-xs font-semibold transition-all"
            >
              <Plus className="h-4 w-4" />
              Log Rejection
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Rejections */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Logged Rejections
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-black text-foreground">{rejectedOpps.length}</span>
              <span className="text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {opps.length > 0 ? `${Math.round((rejectedOpps.length / opps.length) * 100)}% pipeline` : "0%"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Applications that didn&apos;t convert</p>
          </div>

          {/* Primary Drop-off Stage */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Main Drop-off Stage
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-base font-bold text-rose-400 truncate max-w-[170px]" title={topStage.stage}>
                {topStage.count > 0 ? topStage.stage.split("(")[0].trim() : "None"}
              </span>
              <span className="text-xs font-bold text-foreground">
                {topStage.count > 0 ? `${topStage.count} jobs` : "0"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Highest elimination rate point</p>
          </div>

          {/* Post-Mortem Completion */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Post-Mortems Logged
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-black text-primary">{postMortemLoggedCount}</span>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {rejectedOpps.length > 0 ? `${Math.round((postMortemLoggedCount / rejectedOpps.length) * 100)}% rate` : "0%"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">With questions & mistakes logged</p>
          </div>

          {/* Action Items / Lessons */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Key Focus Action
            </span>
            <div className="flex items-center gap-2 pt-1 text-emerald-400 font-bold text-xs">
              <Target className="h-4 w-4 shrink-0" />
              <span>Practice DSA & Speed</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">Focus on timed mock OA & interviews</p>
          </div>
        </div>

        {/* Stage Drop-off Breakdown Bar */}
        <div className="rounded-2xl border border-border/80 bg-card/50 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <BarChart2 className="h-4 w-4 text-rose-400" />
              Drop-off Stage Distribution
            </div>
            <span className="text-xs text-muted-foreground">Click a stage pill below to filter</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
            {REJECTION_STAGES.slice(0, 5).map((stage) => {
              const count = stageStats[stage] || 0
              const pct = rejectedOpps.length > 0 ? Math.round((count / rejectedOpps.length) * 100) : 0
              const isSelected = selectedStage === stage

              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(isSelected ? "ALL" : stage)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all relative overflow-hidden",
                    isSelected
                      ? "border-rose-500/80 bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                      : "border-border/60 bg-secondary/15 hover:bg-secondary/30 hover:border-border"
                  )}
                >
                  <p className="text-[11px] font-semibold text-muted-foreground truncate" title={stage}>
                    {stage.split("(")[0].trim()}
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-foreground">{count}</span>
                    <span className="text-[10px] font-bold text-rose-400">{pct}%</span>
                  </div>
                  {/* Mini bottom progress line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/30">
                    <div
                      className="h-full bg-rose-500/70 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, role, questions asked, or fumble mistakes..."
              className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[200px]"
            >
              <option value="ALL">All Stages ({rejectedOpps.length})</option>
              {REJECTION_STAGES.map((s) => (
                <option key={s} value={s}>{s} ({stageStats[s] || 0})</option>
              ))}
            </select>

            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[220px]"
            >
              <option value="ALL">All Reason Categories</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {(selectedStage !== "ALL" || selectedReason !== "ALL" || search) && (
              <button
                onClick={() => {
                  setSelectedStage("ALL")
                  setSelectedReason("ALL")
                  setSearch("")
                }}
                className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Rejection List / Fumble Cards */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading your rejection tracker...</p>
          </div>
        ) : filteredList.length > 0 ? (
          <div className="space-y-4">
            {filteredList.map((opp) => {
              const details = opp.rejectionDetails
              const stage = details?.stage || "Resume Screen / No Shortlist"
              const reason = details?.reasonCategory || "No specific reason logged"
              const whatWasAsked = details?.whatWasAsked
              const whereFumbled = details?.whereFumbled
              const lessons = details?.lessonsLearned
              const whyRejected = details?.whyRejected

              return (
                <div
                  key={opp.id}
                  className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 space-y-4 hover:border-rose-500/40 hover:shadow-lg transition-all"
                >
                  {/* Card Top */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/40 pb-4">
                    <div className="flex items-start gap-3.5">
                      <CompanyAvatar company={opp.company} size="lg" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground text-base leading-tight">
                            {opp.company}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                            ❌ {stage}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opp.title} {opp.location ? `• ${opp.location}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJobId(opp.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        Edit Post-Mortem
                      </button>
                      <a
                        href={`/assistant?q=${encodeURIComponent(`I was rejected by ${opp.company} for ${opp.title} at stage "${stage}". What was asked: "${whatWasAsked || "N/A"}", where I fumbled: "${whereFumbled || "N/A"}". Help me create a targeted study and practice plan so I crack this next time.`)}`}
                        className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold transition-all"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Coach
                      </a>
                    </div>
                  </div>

                  {/* Post-Mortem Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* What Was Asked */}
                    <div className="rounded-xl border border-border/60 bg-secondary/10 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                        <span>What Was Asked?</span>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        whatWasAsked ? "text-muted-foreground" : "text-muted-foreground/60 italic"
                      )}>
                        {whatWasAsked || "No questions logged yet. Click 'Edit Post-Mortem' to log problems and concepts asked."}
                      </p>
                    </div>

                    {/* Where I Fumbled / Mistakes */}
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                        <span>Where Did I Fumble? (Self-Reflection)</span>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        whereFumbled ? "text-foreground font-medium" : "text-muted-foreground/60 italic"
                      )}>
                        {whereFumbled || "No fumble notes logged yet. Log the exact point you got stuck to avoid repeating it."}
                      </p>
                    </div>

                    {/* Official Feedback */}
                    {whyRejected && (
                      <div className="rounded-xl border border-border/60 bg-secondary/10 p-3.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                          <span>Official Recruiter Feedback</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {whyRejected}
                        </p>
                      </div>
                    )}

                    {/* Lessons Learned */}
                    <div className={cn(
                      "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5",
                      !whyRejected ? "md:col-span-2" : ""
                    )}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Lessons Learned & Action Plan</span>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        lessons ? "text-foreground" : "text-muted-foreground/60 italic"
                      )}>
                        {lessons || "Practice relevant DSA questions and revise concepts before the next interview round."}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <AlertOctagon className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-foreground text-base">
                {search || selectedStage !== "ALL" ? "No matching rejections found" : "No rejections logged yet"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {search || selectedStage !== "ALL"
                  ? "Try adjusting your search query or stage filters."
                  : "When an application doesn't convert, log the questions and mistakes here so you can master your gaps and ace future interviews."}
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="h-4 w-4" /> Log Past Rejection
            </button>
          </div>
        )}

        {/* Modals & Drawers */}
        <JobDrawer
          opportunityId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />

        <AddJobModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultStatus="REJECTED"
        />
      </div>
    </ToastProvider>
  )
}
