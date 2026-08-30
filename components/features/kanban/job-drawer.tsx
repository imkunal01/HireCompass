import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  X, ExternalLink, Edit2, Send, Calendar, Clock, MapPin, Tag,
  FileText, CheckSquare, Mail, Activity, ChevronRight, Loader2,
  ClipboardList, Copy, Check, Sparkles, FolderGit2, Zap, RefreshCw,
  Trash2, Brain, Layers, AlertOctagon, DollarSign, CheckCircle2, XCircle, Plus, Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Opportunity, STATUS_CONFIG, PRIORITY_CONFIG, normalizeStatus,
  OA_PLATFORMS, REJECTION_STAGES, REJECTION_REASONS, InterviewRoundItem
} from "@/types/opportunity"
import { FormKitItem, ProjectSnippet, SnippetLength, SNIPPET_LENGTH_CONFIG } from "@/types/project"
import { CompanyAvatar, StatusBadge, PriorityBadge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

type Tab = "overview" | "rounds" | "offer" | "rejection" | "notes" | "timeline" | "checklist" | "emails" | "formkit"

interface JobDrawerProps {
  opportunityId: string | null
  onClose: () => void
  initialData?: Opportunity
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",  label: "Overview",  icon: FileText },
  { id: "rounds",    label: "OA & Rounds", icon: Layers },
  { id: "offer",     label: "Offer 🎉",  icon: DollarSign },
  { id: "rejection", label: "Rejection ❌", icon: AlertOctagon },
  { id: "notes",     label: "Notes",     icon: FileText },
  { id: "timeline",  label: "Timeline",  icon: Activity },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "emails",    label: "Emails",    icon: Mail },
  { id: "formkit",   label: "Form Kit",  icon: ClipboardList },
]

const DEFAULT_CHECKLIST = [
  "Tailor resume to job description",
  "Write cover letter",
  "Research company culture",
  "Prepare portfolio/work samples",
  "Submit application",
  "Send follow-up email",
]

export function JobDrawer({ opportunityId, onClose, initialData }: JobDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [checklist, setChecklist] = useState<{ label: string; done: boolean }[]>(
    DEFAULT_CHECKLIST.map((l) => ({ label: l, done: false }))
  )
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(initialData?.notes || "")

  // Rejection Post-Mortem Local Edit State
  const [rejectionForm, setRejectionForm] = useState<{
    stage: string
    reasonCategory: string
    whatWasAsked: string
    whyRejected: string
    whereFumbled: string
    lessonsLearned: string
  }>({
    stage: "Technical Round 1 (DSA / Coding)",
    reasonCategory: "DSA & Problem-Solving Speed Gaps",
    whatWasAsked: "",
    whyRejected: "",
    whereFumbled: "",
    lessonsLearned: "",
  })

  // OA & Rounds Local Edit State
  const [oaForm, setOaForm] = useState<{
    platform: string
    totalRounds: number
    currentRound: number
    status: "PENDING" | "CLEARED" | "FAILED"
    score: string
    topics: string
    notes: string
  }>({
    platform: "HackerRank",
    totalRounds: 1,
    currentRound: 1,
    status: "PENDING",
    score: "",
    topics: "",
    notes: "",
  })

  // Offer Local Edit State
  const [offerForm, setOfferForm] = useState<{
    totalAmount: string
    baseSalary: string
    bonus: string
    stocks: string
    deadline: string
    notes: string
  }>({
    totalAmount: "",
    baseSalary: "",
    bonus: "",
    stocks: "",
    deadline: "",
    notes: "",
  })

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${opportunityId}`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
    enabled: !!opportunityId,
    initialData: initialData,
  })

  // Sync loaded opportunity state to local form states
  useEffect(() => {
    if (opportunity) {
      if (opportunity.rejectionDetails) {
        setRejectionForm({
          stage: opportunity.rejectionDetails.stage || "Technical Round 1 (DSA / Coding)",
          reasonCategory: opportunity.rejectionDetails.reasonCategory || "DSA & Problem-Solving Speed Gaps",
          whatWasAsked: opportunity.rejectionDetails.whatWasAsked || "",
          whyRejected: opportunity.rejectionDetails.whyRejected || "",
          whereFumbled: opportunity.rejectionDetails.whereFumbled || "",
          lessonsLearned: opportunity.rejectionDetails.lessonsLearned || "",
        })
      }
      if (opportunity.oaDetails) {
        setOaForm({
          platform: opportunity.oaDetails.platform || "HackerRank",
          totalRounds: opportunity.oaDetails.totalRounds || 1,
          currentRound: opportunity.oaDetails.currentRound || 1,
          status: opportunity.oaDetails.status || "PENDING",
          score: opportunity.oaDetails.score || "",
          topics: opportunity.oaDetails.topics?.join(", ") || "",
          notes: opportunity.oaDetails.notes || "",
        })
      }
      if (opportunity.offerDetails) {
        setOfferForm({
          totalAmount: opportunity.offerDetails.totalAmount || "",
          baseSalary: opportunity.offerDetails.baseSalary || "",
          bonus: opportunity.offerDetails.bonus || "",
          stocks: opportunity.offerDetails.stocks || "",
          deadline: opportunity.offerDetails.deadline ? new Date(opportunity.offerDetails.deadline).toISOString().split("T")[0] : "",
          notes: opportunity.offerDetails.notes || "",
        })
      }
    }
  }, [opportunity])

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Opportunity>) => {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] })
      toast({ type: "success", title: "Updated!" })
    },
    onError: () => {
      toast({ type: "error", title: "Failed to update" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (opportunityId?.startsWith("m")) return; // Mock data bypass
      const res = await fetch(`/api/opportunities/${opportunityId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({ type: "success", title: "Job deleted" })
      onClose()
    },
    onError: () => {
      toast({ type: "error", title: "Failed to delete" })
    }
  })

  const saveNotes = () => {
    updateMutation.mutate({ notes: notesValue } as any)
    setEditingNotes(false)
  }

  const saveRejectionPostMortem = () => {
    updateMutation.mutate({
      status: "REJECTED",
      rejectionDetails: {
        stage: rejectionForm.stage,
        reasonCategory: rejectionForm.reasonCategory,
        whatWasAsked: rejectionForm.whatWasAsked || null,
        whyRejected: rejectionForm.whyRejected || null,
        whereFumbled: rejectionForm.whereFumbled || null,
        lessonsLearned: rejectionForm.lessonsLearned || null,
        rejectionDate: new Date().toISOString(),
      }
    } as any)
  }

  const saveOADetails = () => {
    updateMutation.mutate({
      status: opportunity?.status === "SAVED" || opportunity?.status === "APPLIED" ? "ASSESSMENT" : opportunity?.status,
      oaDetails: {
        platform: oaForm.platform,
        totalRounds: oaForm.totalRounds,
        currentRound: oaForm.currentRound,
        status: oaForm.status,
        score: oaForm.score || null,
        topics: oaForm.topics ? oaForm.topics.split(",").map(t => t.trim()) : [],
        notes: oaForm.notes || null,
      }
    } as any)
  }

  const saveOfferDetails = () => {
    updateMutation.mutate({
      status: "OFFER",
      offerDetails: {
        totalAmount: offerForm.totalAmount || null,
        baseSalary: offerForm.baseSalary || null,
        bonus: offerForm.bonus || null,
        stocks: offerForm.stocks || null,
        deadline: offerForm.deadline || null,
        notes: offerForm.notes || null,
      }
    } as any)
  }

  const addInterviewRound = () => {
    const existing = opportunity?.interviewRounds || []
    const nextNum = existing.length + 1
    const newRound: InterviewRoundItem = {
      id: `r-${Date.now()}`,
      roundNumber: nextNum,
      roundName: `Round ${nextNum} - Technical`,
      roundType: nextNum === 1 ? "TECHNICAL" : nextNum === 2 ? "SYSTEM_DESIGN" : "MANAGERIAL",
      status: "SCHEDULED",
      topicsCovered: "",
      notes: "",
    }
    updateMutation.mutate({
      status: "INTERVIEW",
      interviewRounds: [...existing, newRound],
    } as any)
  }

  const updateRoundStatus = (roundId: string, status: "PASSED" | "FAILED" | "PENDING" | "SCHEDULED") => {
    const existing = opportunity?.interviewRounds || []
    const updated = existing.map(r => r.id === roundId ? { ...r, status } : r)
    updateMutation.mutate({ interviewRounds: updated } as any)
  }

  if (!opportunityId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/60">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-secondary/40 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-secondary/40 animate-pulse" />
                <div className="h-3 w-24 rounded bg-secondary/40 animate-pulse" />
              </div>
            </div>
          ) : opportunity ? (
            <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
              <CompanyAvatar company={opportunity.company} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-foreground text-base leading-tight truncate">
                    {opportunity.company}
                  </h2>
                  <StatusBadge status={normalizeStatus(opportunity.status)} />
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{opportunity.title}</p>
                {opportunity.priority && (
                  <div className="mt-1">
                    <PriorityBadge priority={opportunity.priority} />
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        {opportunity && (
          <div className="flex gap-2 p-3 border-b border-border/40 bg-secondary/10 overflow-x-auto">
            <button
              onClick={() => updateMutation.mutate({ status: "APPLIED" } as any)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
            >
              <Send className="h-3 w-3" /> Applied
            </button>
            <button
              onClick={() => {
                updateMutation.mutate({ status: "ASSESSMENT" } as any)
                setActiveTab("rounds")
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
            >
              <Brain className="h-3 w-3" /> OA / Assessment
            </button>
            <button
              onClick={() => {
                updateMutation.mutate({ status: "INTERVIEW" } as any)
                setActiveTab("rounds")
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
            >
              <Calendar className="h-3 w-3" /> Interview
            </button>
            <button
              onClick={() => {
                updateMutation.mutate({ status: "OFFER" } as any)
                setActiveTab("offer")
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
            >
              <DollarSign className="h-3 w-3" /> Offer 🎉
            </button>
            <button
              onClick={() => {
                setActiveTab("rejection")
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all"
            >
              <AlertOctagon className="h-3 w-3" /> Log Rejection ❌
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this job?")) {
                  deleteMutation.mutate()
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary/30 border border-border text-muted-foreground hover:text-rose-400 px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 ml-auto"
              title="Delete Job"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border/40 px-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {opportunity && !isLoading && (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {opportunity.location && (
                      <InfoTile label="Location" icon={MapPin}>
                        {opportunity.location}
                        {opportunity.isRemote && (
                          <span className="ml-1 text-emerald-400 text-[10px] font-medium">• Remote</span>
                        )}
                      </InfoTile>
                    )}
                    {opportunity.salary && (
                      <InfoTile label="Salary/Stipend" icon={Tag}>{opportunity.salary}</InfoTile>
                    )}
                    {opportunity.employmentType && (
                      <InfoTile label="Type" icon={FileText}>
                        {opportunity.employmentType.replace("_", " ")}
                      </InfoTile>
                    )}
                    {opportunity.deadline && (
                      <InfoTile label="Deadline" icon={Clock}>
                        {new Date(opportunity.deadline).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </InfoTile>
                    )}
                    {opportunity.sourcePlatform && (
                      <InfoTile label="Source" icon={ExternalLink}>
                        {opportunity.sourcePlatform.replace("_", " ")}
                      </InfoTile>
                    )}
                    {opportunity.createdAt && (
                      <InfoTile label="Added" icon={Calendar}>
                        {new Date(opportunity.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </InfoTile>
                    )}
                  </div>

                  {opportunity.skills && opportunity.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills Required</p>
                      <div className="flex flex-wrap gap-1.5">
                        {opportunity.skills.map((s) => (
                          <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {opportunity.tags && opportunity.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {opportunity.tags.map((t) => (
                          <span key={t} className="rounded-full border border-border bg-secondary/30 px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {opportunity.url && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Application Link</p>
                      <a
                        href={opportunity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {opportunity.url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* OA & Rounds Tab */}
              {activeTab === "rounds" && (
                <div className="space-y-5">
                  {/* OA Section Card */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                        <Brain className="h-4 w-4" /> Online Assessment (OA)
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        oaForm.status === "CLEARED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        oaForm.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      )}>
                        {oaForm.status === "CLEARED" ? "Cleared ✅" : oaForm.status === "FAILED" ? "Failed ❌" : "Pending ⏳"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Platform</label>
                        <select
                          value={oaForm.platform}
                          onChange={(e) => setOaForm({ ...oaForm, platform: e.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        >
                          {OA_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Total Rounds</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={oaForm.totalRounds}
                          onChange={(e) => setOaForm({ ...oaForm, totalRounds: parseInt(e.target.value) || 1 })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">OA Status</label>
                        <select
                          value={oaForm.status}
                          onChange={(e) => setOaForm({ ...oaForm, status: e.target.value as any })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CLEARED">Cleared / Shortlisted ✅</option>
                          <option value="FAILED">Failed ❌</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Topics / Questions Asked</label>
                      <input
                        value={oaForm.topics}
                        onChange={(e) => setOaForm({ ...oaForm, topics: e.target.value })}
                        placeholder="e.g. DP on trees, Dijkstra, SQL queries, MCQs"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={saveOADetails}
                        className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all"
                      >
                        <Save className="h-3.5 w-3.5" /> Save OA Details
                      </button>
                    </div>
                  </div>

                  {/* Interview Rounds List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Rounds Pipeline</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Track each round outcome, questions asked, and feedback</p>
                      </div>
                      <button
                        type="button"
                        onClick={addInterviewRound}
                        className="flex items-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-semibold transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Next Round
                      </button>
                    </div>

                    {opportunity.interviewRounds && opportunity.interviewRounds.length > 0 ? (
                      <div className="space-y-2.5">
                        {opportunity.interviewRounds.map((round) => (
                          <div key={round.id} className="rounded-xl border border-border/80 bg-secondary/15 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                  {round.roundNumber}
                                </span>
                                <span className="text-xs font-bold text-foreground">{round.roundName}</span>
                                <span className="rounded bg-secondary/40 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase font-mono">
                                  {round.roundType}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateRoundStatus(round.id, "PASSED")}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                    round.status === "PASSED"
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                      : "border-border bg-secondary/20 text-muted-foreground hover:text-emerald-400"
                                  )}
                                >
                                  Passed ✅
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateRoundStatus(round.id, "FAILED")}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                    round.status === "FAILED"
                                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                      : "border-border bg-secondary/20 text-muted-foreground hover:text-rose-400"
                                  )}
                                >
                                  Failed ❌
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateRoundStatus(round.id, "SCHEDULED")}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                    round.status === "SCHEDULED"
                                      ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                      : "border-border bg-secondary/20 text-muted-foreground hover:text-purple-400"
                                  )}
                                >
                                  Scheduled ⏳
                                </button>
                              </div>
                            </div>
                            {round.topicsCovered && (
                              <p className="text-xs text-muted-foreground bg-background/60 rounded-lg p-2 border border-border/40">
                                💡 <span className="font-medium text-foreground">Topics Asked:</span> {round.topicsCovered}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-6 text-center space-y-2">
                        <Layers className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                        <p className="text-xs text-muted-foreground">No interview rounds added yet.</p>
                        <button
                          type="button"
                          onClick={addInterviewRound}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1.5 text-xs font-semibold hover:bg-purple-500/20 transition-all"
                        >
                          <Plus className="h-3 w-3" /> Add Round 1 (Technical)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offer Tab */}
              {activeTab === "offer" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <DollarSign className="h-4 w-4" /> Offer Breakdown & Compensation 🎉
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Total CTC / Compensation</label>
                        <input
                          value={offerForm.totalAmount}
                          onChange={(e) => setOfferForm({ ...offerForm, totalAmount: e.target.value })}
                          placeholder="e.g. ₹28 LPA or $160,000"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Base Salary</label>
                        <input
                          value={offerForm.baseSalary}
                          onChange={(e) => setOfferForm({ ...offerForm, baseSalary: e.target.value })}
                          placeholder="e.g. ₹22 LPA Base"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Bonus & Joining Perks</label>
                        <input
                          value={offerForm.bonus}
                          onChange={(e) => setOfferForm({ ...offerForm, bonus: e.target.value })}
                          placeholder="e.g. ₹2L Joining Bonus"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Stock Options (RSUs / ESOPs)</label>
                        <input
                          value={offerForm.stocks}
                          onChange={(e) => setOfferForm({ ...offerForm, stocks: e.target.value })}
                          placeholder="e.g. $40,000 RSUs over 4 yrs"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Offer Acceptance Deadline</label>
                        <input
                          type="date"
                          value={offerForm.deadline}
                          onChange={(e) => setOfferForm({ ...offerForm, deadline: e.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={saveOfferDetails}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Offer Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Post-Mortem Tab */}
              {activeTab === "rejection" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                        <AlertOctagon className="h-4 w-4" /> Rejection Post-Mortem & Fumble Tracker ❌
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {rejectionForm.stage}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Analyze why this application didn&apos;t convert and pinpoint exact questions, gaps, and areas to study.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Where Was It Rejected?</label>
                        <select
                          value={rejectionForm.stage}
                          onChange={(e) => setRejectionForm({ ...rejectionForm, stage: e.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                        >
                          {REJECTION_STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Primary Reason Category</label>
                        <select
                          value={rejectionForm.reasonCategory}
                          onChange={(e) => setRejectionForm({ ...rejectionForm, reasonCategory: e.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                        >
                          {REJECTION_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        📝 What Was Asked? (Problems / Concepts / Architecture Topics)
                      </label>
                      <textarea
                        value={rejectionForm.whatWasAsked}
                        onChange={(e) => setRejectionForm({ ...rejectionForm, whatWasAsked: e.target.value })}
                        rows={3}
                        placeholder="e.g. Implement an LRU Cache in O(1), Kafka partition rebalancing logic, behavioral leadership principle questions..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-rose-400">
                        🔍 Where Did I Fumble / Make Mistakes? (Self-Reflection)
                      </label>
                      <textarea
                        value={rejectionForm.whereFumbled}
                        onChange={(e) => setRejectionForm({ ...rejectionForm, whereFumbled: e.target.value })}
                        rows={3}
                        placeholder="e.g. Blanked out on pointer manipulation in doubly-linked list, struggled to calculate time complexity under pressure..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        ❌ Official Recruiter / Company Feedback (if provided)
                      </label>
                      <input
                        value={rejectionForm.whyRejected}
                        onChange={(e) => setRejectionForm({ ...rejectionForm, whyRejected: e.target.value })}
                        placeholder="e.g. Candidate lacked concurrency experience, better candidate selected"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-emerald-400">
                        💡 Lessons Learned & Action Plan for Next Time
                      </label>
                      <input
                        value={rejectionForm.lessonsLearned}
                        onChange={(e) => setRejectionForm({ ...rejectionForm, lessonsLearned: e.target.value })}
                        placeholder="e.g. Solve 10 more Medium-Hard linked list problems on LeetCode; revise OS concurrency primitives"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
                      <a
                        href={`/assistant?q=${encodeURIComponent(`I was rejected at ${opportunity.company} for ${opportunity.title} at stage: ${rejectionForm.stage}. Here is what was asked: "${rejectionForm.whatWasAsked}" and where I fumbled: "${rejectionForm.whereFumbled}". Give me a step-by-step study plan to fix these gaps.`)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Ask AI to create study plan for this rejection
                      </a>
                      <button
                        type="button"
                        onClick={saveRejectionPostMortem}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-all"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Post-Mortem
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Notes</p>
                    <button
                      onClick={() => {
                        if (editingNotes) saveNotes()
                        else { setNotesValue(opportunity.notes || ""); setEditingNotes(true) }
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {editingNotes ? "Save" : "Edit"}
                    </button>
                  </div>
                  {editingNotes ? (
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={10}
                      className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  ) : (
                    <div
                      className={cn(
                        "rounded-xl border border-border/40 bg-secondary/10 p-4 min-h-[120px] text-sm",
                        opportunity.notes ? "text-foreground" : "text-muted-foreground italic"
                      )}
                    >
                      {opportunity.notes || "No notes yet. Click Edit to add some."}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === "timeline" && (
                <div className="space-y-1">
                  {opportunity.timeline && opportunity.timeline.length > 0 ? (
                    opportunity.timeline
                      .slice()
                      .reverse()
                      .map((event, i) => (
                        <div key={i} className="flex gap-3 py-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            {i < (opportunity.timeline?.length ?? 0) - 1 && (
                              <div className="w-px flex-1 bg-border/40 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-3">
                            <p className="text-sm font-semibold text-foreground">{event.event}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(event.timestamp).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm text-muted-foreground">No timeline events yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist Tab */}
              {activeTab === "checklist" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Application Checklist</p>
                  {checklist.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChecklist((prev) =>
                        prev.map((c, j) => j === i ? { ...c, done: !c.done } : c)
                      )}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all",
                        item.done
                          ? "border-emerald-500/20 bg-emerald-500/5 text-muted-foreground line-through"
                          : "border-border bg-secondary/10 text-foreground hover:bg-secondary/20"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        item.done ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
                      )}>
                        {item.done && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Emails Tab */}
              {activeTab === "emails" && opportunity && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">AI Email Generator</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate a personalized outreach email or cover letter for{" "}
                    <span className="font-semibold text-foreground">{opportunity.company} — {opportunity.title}</span>{" "}
                    using the AI Assistant.
                  </p>
                  <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 space-y-2 text-xs">
                    <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">What you can generate:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary shrink-0" /> Cold outreach email to recruiter</li>
                      <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary shrink-0" /> Cover letter tailored to job requirements</li>
                      <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary shrink-0" /> Follow-up email after applying</li>
                    </ul>
                  </div>
                  <a
                    href={`/assistant?jobId=${opportunity.id}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Open AI Assistant for this Job
                  </a>
                  <p className="text-[10px] text-muted-foreground text-center">
                    The assistant will auto-select this job and generate content for you.
                  </p>
                </div>
              )}

              {/* Form Kit Tab */}
              {activeTab === "formkit" && opportunity && (
                <FormKitTab opportunity={opportunity} />
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

function InfoTile({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/10 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{children}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Kit Tab Component
// ─────────────────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className={cn(
        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all",
        copied
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function FormKitTab({ opportunity }: { opportunity: Opportunity }) {
  const { toast } = useToast()
  const [activeLength, setActiveLength] = useState<Record<string, SnippetLength>>({})
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({})
  const [generatedSnippets, setGeneratedSnippets] = useState<Record<string, string>>({})

  const { data: formKit, isLoading, refetch } = useQuery<FormKitItem[]>({
    queryKey: ["form-kit", opportunity.id],
    queryFn: async () => {
      const res = await fetch(`/api/form-kit?opportunityId=${opportunity.id}`)
      if (!res.ok) throw new Error("Failed to load Form Kit")
      return res.json()
    },
    enabled: !!opportunity.id && !opportunity.id.startsWith("m"),
    staleTime: 30000,
  })

  const isMockOpportunity = opportunity.id.startsWith("m")

  const getLengthForProject = (projectId: string): SnippetLength =>
    activeLength[projectId] || "medium"

  const getSnippetContent = (item: FormKitItem, len: SnippetLength): string | null => {
    const generated = generatedSnippets[`${item.projectId}-${len}`]
    if (generated) return generated
    const validKey = len as keyof typeof item.snippets
    const s = item.snippets[validKey]
    return s?.content || null
  }

  const regenerate = async (item: FormKitItem, len: SnippetLength) => {
    const key = `${item.projectId}-${len}`
    setRegenerating((prev) => ({ ...prev, [key]: true }))
    try {
      // Fetch project details for full context
      const projRes = await fetch(`/api/projects/${item.projectId}`)
      if (!projRes.ok) throw new Error("Could not load project")
      const project = await projRes.json()

      const res = await fetch("/api/ai/generate-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          description: project.description,
          techStack: project.techStack,
          roleCategories: project.roleCategories,
          metrics: project.metrics,
          links: project.links,
          roleTag: opportunity.title,
          length: len,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedSnippets((prev) => ({ ...prev, [key]: data.snippet }))
      toast({ type: "success", title: "Snippet generated!" })
    } catch (e: any) {
      toast({ type: "error", title: e.message || "Generation failed" })
    } finally {
      setRegenerating((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (isMockOpportunity) {
    return (
      <div className="py-10 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
          <ClipboardList className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Form Kit</p>
        <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
          Save this job to your pipeline first to generate a tailored Form Kit.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Ranking your projects…</p>
      </div>
    )
  }

  if (!formKit || formKit.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
          <FolderGit2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">No projects in vault</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Add your projects to the Project Vault to generate tailored snippets here.
          </p>
        </div>
        <a
          href="/projects"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary px-4 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <FolderGit2 className="h-3.5 w-3.5" /> Open Project Vault
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header context */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 flex items-start gap-2">
        <Zap className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-foreground">
            Tailored for: <span className="text-violet-400">{opportunity.title}</span> @ {opportunity.company}
          </p>
          {opportunity.skills && opportunity.skills.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Matched against: {opportunity.skills.slice(0, 5).join(", ")}
              {opportunity.skills.length > 5 ? ` +${opportunity.skills.length - 5} more` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Project cards ranked */}
      {formKit.map((item) => {
        const len = getLengthForProject(item.projectId)
        const snippetContent = getSnippetContent(item, len)
        const regenKey = `${item.projectId}-${len}`
        const isRegen = regenerating[regenKey]

        return (
          <div key={item.projectId} className="rounded-xl border border-border/60 bg-secondary/10 overflow-hidden">
            {/* Project header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/40">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">{item.projectName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Match score */}
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                  item.matchScore >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  item.matchScore >= 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-secondary/30 text-muted-foreground border-border"
                )}>
                  {item.matchScore}% match
                </span>
              </div>
            </div>

            {/* Matched skills */}
            {item.matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1 px-3.5 pt-2.5">
                {item.matchedSkills.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Length selector */}
            <div className="flex gap-1.5 px-3.5 pt-3">
              {(["short", "medium", "long"] as SnippetLength[]).map((l) => {
                const hasSnippet = !!(item.snippets[l as keyof typeof item.snippets] || generatedSnippets[`${item.projectId}-${l}`])
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveLength((prev) => ({ ...prev, [item.projectId]: l }))}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all relative",
                      len === l
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/30"
                    )}
                  >
                    {SNIPPET_LENGTH_CONFIG[l].label}
                    {!hasSnippet && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500/60" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Snippet content */}
            <div className="px-3.5 pt-2 pb-3">
              {snippetContent ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/20 rounded-lg p-3 border border-border/40">
                    {snippetContent}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => regenerate(item, len)}
                      disabled={isRegen}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {isRegen ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Regenerate with AI
                    </button>
                    <CopyBtn text={snippetContent} />
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    No {SNIPPET_LENGTH_CONFIG[len].label.toLowerCase()} snippet yet
                  </p>
                  <button
                    type="button"
                    onClick={() => regenerate(item, len)}
                    disabled={isRegen}
                    className="flex items-center gap-1.5 mx-auto rounded-xl bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 text-[11px] font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {isRegen ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generate with AI
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => refetch()}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border/40 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"
      >
        <RefreshCw className="h-3 w-3" /> Refresh Kit
      </button>
    </div>
  )
}
