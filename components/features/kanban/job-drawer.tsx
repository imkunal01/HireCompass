"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  X, ExternalLink, Edit2, Send, Calendar, Clock, MapPin, Tag,
  FileText, CheckSquare, Mail, Activity, ChevronRight, Loader2,
  ClipboardList, Copy, Check, Sparkles, FolderGit2, Zap, RefreshCw,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity, STATUS_CONFIG, PRIORITY_CONFIG, normalizeStatus } from "@/types/opportunity"
import { FormKitItem, ProjectSnippet, SnippetLength, SNIPPET_LENGTH_CONFIG } from "@/types/project"
import { CompanyAvatar, StatusBadge, PriorityBadge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

type Tab = "overview" | "notes" | "timeline" | "checklist" | "emails" | "formkit"

interface JobDrawerProps {
  opportunityId: string | null
  onClose: () => void
  initialData?: Opportunity
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",  label: "Overview",  icon: FileText },
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

        {/* Quick Actions */}
        {opportunity && (
          <div className="flex gap-2 p-4 border-b border-border/40 bg-secondary/10 overflow-x-auto">
            <button
              onClick={() => updateMutation.mutate({ status: "APPLIED" } as any)}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 py-2 text-xs font-semibold transition-all"
            >
              <Send className="h-3.5 w-3.5" /> Mark Applied
            </button>
            <button
              onClick={() => updateMutation.mutate({ status: "INTERVIEW" } as any)}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 py-2 text-xs font-semibold transition-all"
            >
              <Calendar className="h-3.5 w-3.5" /> Schedule Interview
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this job?")) {
                  deleteMutation.mutate()
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3 py-2 text-xs font-semibold transition-all shrink-0"
              title="Delete Job"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {opportunity.url && (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary/30 border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
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
