"use client"

import React, { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import {
  Sparkles, ChevronRight, Loader2, CheckCircle2, X, Send,
  SkipForward, RefreshCw, Edit3, Save, User, Mail, Building2,
  ChevronLeft, Play, AlertCircle, Clock, CheckCheck, BarChart3,
  Paperclip, ArrowLeft, Zap, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OutreachRecord, OutreachCampaign, OutreachStatus, OUTREACH_STATUS_CONFIG } from "@/types/outreach"
import { useQueryClient } from "@tanstack/react-query"

interface CampaignData {
  campaign: OutreachCampaign
  records: OutreachRecord[]
}

const EMAIL_TEMPLATES = [
  {
    name: "Backend Developer (MERN)",
    subject: "Backend Developer (MERN/Node.js) - Kunal Dhangar",
    body: `Hi {{Hiring Manager Name}},

I'm a final-year CSE student at LPU, currently working as a Web Development Intern at Orbosis Global, where I cut API latency by 30% using Redis caching and automated payment workflows via Razorpay webhooks (99.9% processing accuracy).

A couple of backend-focused projects that might be relevant to {{Company}}:

- Creolink: Built a real-time collaboration engine with WebSockets and PostgreSQL, achieving 100ms state sync latency, plus a custom metadata version-control system cutting bandwidth usage by 80%.
- KripaConnect: Architected JWT + Refresh Token + Google OAuth authentication with RBAC, and optimized MongoDB indexing/Redis caching to hit 800ms average API response under 1k+ concurrent requests.

I'd love to contribute to {{Company}}'s backend/API systems. Resume attached - happy to share more context on any of the above.

Best,
Kunal Dhangar
{{Phone}} | {{LinkedIn}} | {{GitHub}}`
  },
  {
    name: "Frontend Developer (React)",
    subject: "Frontend Developer (React/Next.js) - Kunal Dhangar",
    body: `Hi {{Hiring Manager Name}},

I'm a CSE student at LPU with hands-on experience building production-grade React/Next.js applications, including a PWA at Orbosis Global Pvt. Ltd. with 100% cross-platform code reusability and 35% lower development overhead.

Two projects that show my frontend depth:

- Creolink: A Next.js-based collaborative video management platform with real-time sync UI and a custom Adobe Premiere Pro plugin (CEP/UXP) for seamless metadata workflows.
- KripaConnect: A full-stack ecommerce platform with React.js frontend, secure auth flows, and optimized API integration supporting 5,000+ active sessions.

I care about performance and clean UX as much as functionality, and I'd welcome the chance to bring that to {{Company}}'s frontend team. Resume attached.

Best,
Kunal Dhangar
{{Phone}} | {{LinkedIn}} | {{GitHub}}`
  },
  {
    name: "Forward Deployed Engineer",
    subject: "Forward Deployed Engineer Role - Kunal Dhangar",
    body: `Hi {{Hiring Manager Name}},

I'm reaching out about Forward Deployed Engineer opportunities at {{Company}}. I enjoy sitting close to real customer problems and shipping working software fast - which is what drew me to build Creolink, a collaborative video project management platform where I engineered a real-time sync engine (100ms latency), a non-destructive version-control system across 50+ project sequences, and a custom Adobe Premiere Pro plugin to solve a very specific workflow pain point for video teams.

At Orbosis Global, I also worked directly on production features end-to-end - from PWA architecture to Redis-based performance tuning to automating Razorpay payment verification, which mirrors the kind of fast, client-facing problem solving an FDE role demands.

I'd love to bring that same hands-on, solution-first approach to {{Company}}'s customers. Resume attached.

Best,
Kunal Dhangar
{{Phone}} | {{LinkedIn}} | {{GitHub}}`
  },
  {
    name: "DevOps / Infrastructure",
    subject: "DevOps / Infrastructure Role - Kunal Dhangar",
    body: `Hi {{Hiring Manager Name}},

I'm a CSE student with practical experience across the deployment and reliability side of full-stack systems - Docker, Jenkins, CI/CD pipelines, and AWS (S3, EC2, Lambda).

At Orbosis Global, I helped cut API latency by 30% via Redis caching and reduced DB query load by 25% under peak traffic - the kind of performance/infrastructure work I enjoy most. On KripaConnect, I optimized MongoDB indexing and caching to sustain 800ms average response times under 1k+ concurrent simulated requests, and hardened the system against session hijacking and replay attacks (70% risk reduction).

I'm looking to go deeper into DevOps/infrastructure work, and {{Company}} stood out to me. Resume attached - glad to discuss further.

Best,
Kunal Dhangar
{{Phone}} | {{LinkedIn}} | {{GitHub}}`
  },
  {
    name: "Full Stack Developer (MERN)",
    subject: "Full Stack Developer (MERN) - Kunal Dhangar",
    body: `Hi {{Hiring Manager Name}},

I'm a CSE student at LPU with end-to-end MERN stack experience, from system design to deployment. At Orbosis Global Pvt. Ltd., I built a Progressive Web App with 100% cross-platform reusability, reduced API latency by 30% with Redis, and automated payment verification via Razorpay webhooks (99.9% accuracy).

Two projects that show range across the stack:

- Creolink: Real-time collaboration platform (Next.js, PostgreSQL, Socket.io) with a custom Adobe Premiere Pro plugin - 100ms sync latency, 80% bandwidth reduction.
- KripaConnect: Full-stack ecommerce app with JWT/OAuth-based auth, RBAC, and an ACID-compliant payment pipeline supporting 5,000+ active sessions.

I'd love to bring this full-stack experience to {{Company}}. Resume attached.

Best,
Kunal Dhangar
{{Phone}} | {{LinkedIn}} | {{GitHub}}`
  }
];

function StatusBadge({ status }: { status: OutreachStatus }) {
  const cfg = OUTREACH_STATUS_CONFIG[status] ?? OUTREACH_STATUS_CONFIG.PENDING
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.bgColor, cfg.textColor)}>
      {cfg.label}
    </span>
  )
}

function RecruiterListItem({
  record,
  isSelected,
  onClick,
  isChecked,
  onCheck,
}: {
  record: OutreachRecord
  isSelected: boolean
  onClick: () => void
  isChecked: boolean
  onCheck: (checked: boolean) => void
}) {
  const cfg = OUTREACH_STATUS_CONFIG[record.status] ?? OUTREACH_STATUS_CONFIG.PENDING
  return (
    <div className={cn(
      "w-full flex items-center gap-2 rounded-xl pr-3 pl-2 py-2.5 text-left transition-all duration-150 group",
      isSelected
        ? "bg-indigo-50 border border-indigo-200 shadow-sm"
        : "hover:bg-slate-50 border border-transparent"
    )}>
      <input 
        type="checkbox" 
        checked={isChecked} 
        onChange={(e) => onCheck(e.target.checked)} 
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer ml-1 shrink-0"
      />
      <button onClick={onClick} className="flex-1 flex items-center gap-3 min-w-0 text-left">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all",
          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        )}>
          {(record.companyName || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-bold truncate", isSelected ? "text-indigo-900" : "text-slate-800")}>
            {record.companyName}
          </p>
          <p className="text-[10px] text-slate-400 truncate">{record.recruiterEmail}</p>
        </div>
        <span className={cn("shrink-0 h-2 w-2 rounded-full", cfg.color)} style={{ backgroundColor: cfg.color }} />
      </button>
    </div>
  )
}

export default function CampaignPage({ params }: { params: { id: string } }) {
  const { id: campaignId } = params
  const qc = useQueryClient()

  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [generatedTexts, setGeneratedTexts] = useState<Record<string, string>>({})
  const [editMode, setEditMode] = useState(false)
  const [editedEmail, setEditedEmail] = useState("")
  const [editedSubject, setEditedSubject] = useState("")
  const [profile, setProfile] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState<any>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const [followingUp, setFollowingUp] = useState<string | null>(null)

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // Load campaign data
  useEffect(() => {
    const load = async () => {
      const [campaignRes, profileRes] = await Promise.all([
        fetch(`/api/outreach/campaigns/${campaignId}`),
        fetch("/api/outreach/profile"),
      ])
      if (campaignRes.ok) {
        const d = await campaignRes.json()
        setData(d)
      }
      if (profileRes.ok) {
        setProfile(await profileRes.json())
      }
      setLoading(false)
    }
    load()
  }, [campaignId])

  const currentRecord = data?.records[selectedIdx]

  // Get email text for a record
  const getEmailText = (record: OutreachRecord) => {
    if (generatedTexts[record.id]) return generatedTexts[record.id]
    return record.finalEmail || record.generatedEmail || ""
  }

  const getSubjectText = (record: OutreachRecord) => {
    return record.finalSubject || record.emailSubject || ""
  }

  // Generate email for current record
  const handleGenerate = useCallback(async (record: OutreachRecord) => {
    if (!profile) { showToast("error", "Please set up your outreach profile first"); return }
    setGenerating((prev) => ({ ...prev, [record.id]: true }))
    setEditMode(false)

    try {
      const res = await fetch("/api/outreach/generate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id, profile }),
      })

      if (!res.ok) throw new Error((await res.json()).error)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setGeneratedTexts((prev) => ({ ...prev, [record.id]: full }))
      }

      // Parse subject and body from format
      const subjectMatch = full.match(/<SUBJECT>\s*([\s\S]*?)\s*<\/SUBJECT>/)
      const emailMatch = full.match(/<EMAIL>\s*([\s\S]*?)\s*<\/EMAIL>/)
      const subject = subjectMatch?.[1]?.trim() || `Internship Inquiry – ${record.companyName}`
      const body = emailMatch?.[1]?.trim() || full

      // Save to DB
      await fetch(`/api/outreach/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedEmail: body, emailSubject: subject, status: "DRAFT" }),
      })

      // Update local state
      setData((prev) => prev ? {
        ...prev,
        records: prev.records.map((r) => r.id === record.id
          ? { ...r, generatedEmail: body, emailSubject: subject, status: "DRAFT" }
          : r
        )
      } : prev)

      setGeneratedTexts((prev) => ({ ...prev, [record.id]: body }))
      setEditedEmail(body)
      setEditedSubject(subject)

    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Generation failed")
    } finally {
      setGenerating((prev) => ({ ...prev, [record.id]: false }))
    }
  }, [profile])

  // Approve/skip record
  const handleApplyTemplate = (template: typeof EMAIL_TEMPLATES[0], record: OutreachRecord) => {
    if (!profile) { showToast("error", "Please set up your outreach profile first"); return }
    
    let body = template.body
      .replace(/\{\{Hiring Manager Name\}\}/g, record.recruiterName || "Hiring Manager")
      .replace(/\{\{Company\}\}/g, record.companyName || "your company")
      .replace(/\{\{Phone\}\}/g, profile.phone || "[Phone]")
      .replace(/\{\{LinkedIn\}\}/g, profile.linkedin || "[LinkedIn]")
      .replace(/\{\{GitHub\}\}/g, profile.github || "[GitHub]")
      
    let subject = template.subject
      .replace(/\{\{Hiring Manager Name\}\}/g, record.recruiterName || "Hiring Manager")
      .replace(/\{\{Company\}\}/g, record.companyName || "your company")
      
    setEditedEmail(body)
    setEditedSubject(subject)
    setEditMode(true)
    
    // Save draft state
    fetch(`/api/outreach/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedEmail: body, emailSubject: subject, status: "DRAFT" }),
    }).then(() => {
      setData((prev) => prev ? {
        ...prev,
        records: prev.records.map((r) => r.id === record.id
          ? { ...r, generatedEmail: body, emailSubject: subject, status: "DRAFT" }
          : r
        )
      } : prev)
      setGeneratedTexts((prev) => ({ ...prev, [record.id]: body }))
    })
  }

  // Approve/skip record
  const handleStatusChange = async (record: OutreachRecord, status: "APPROVED" | "SKIPPED") => {
    const emailToSave = editedEmail || getEmailText(record)
    const subjectToSave = editedSubject || getSubjectText(record)

    await fetch(`/api/outreach/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, finalEmail: emailToSave, finalSubject: subjectToSave }),
    })

    setData((prev) => prev ? {
      ...prev,
      records: prev.records.map((r) => r.id === record.id
        ? { ...r, status, finalEmail: emailToSave, finalSubject: subjectToSave }
        : r
      )
    } : prev)

    showToast("success", status === "APPROVED" ? "✓ Approved" : "Skipped")

    // Auto-advance
    if (selectedIdx < (data?.records.length ?? 0) - 1) {
      setSelectedIdx((i) => i + 1)
      setEditMode(false)
      setEditedEmail("")
      setEditedSubject("")
    }
  }

  // Bulk Status Update
  const handleBulkStatusChange = async (status: "APPROVED" | "SKIPPED") => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!confirm(`Mark ${ids.length} records as ${status}?`)) return
    
    setLoading(true)
    await Promise.all(ids.map(id => {
      const record = data?.records.find(r => r.id === id)
      if (!record) return Promise.resolve()
      const emailToSave = getEmailText(record)
      const subjectToSave = getSubjectText(record)
      return fetch(`/api/outreach/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, finalEmail: emailToSave, finalSubject: subjectToSave }),
      })
    }))
    
    // Refresh campaign
    const refreshed = await fetch(`/api/outreach/campaigns/${campaignId}`)
    if (refreshed.ok) setData(await refreshed.json())
    setSelectedIds(new Set())
    setLoading(false)
    showToast("success", `Marked ${ids.length} records as ${status}`)
  }

  // Bulk Generate
  const handleBulkGenerate = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const pendingRecords = data?.records.filter(r => ids.includes(r.id) && r.status === "PENDING") || []
    if (pendingRecords.length === 0) {
      showToast("error", "No pending records selected to generate")
      return
    }
    
    // generate sequentially to avoid rate limits
    for (const record of pendingRecords) {
      await handleGenerate(record)
    }
    setSelectedIds(new Set())
    showToast("success", `Generated emails for ${pendingRecords.length} records`)
  }

  // Send campaign
  const handleSendCampaign = async () => {
    const approvedCount = data?.records.filter((r) => r.status === "APPROVED").length ?? 0
    if (approvedCount === 0) { showToast("error", "No approved emails to send"); return }
    if (!confirm(`Send ${approvedCount} emails? This will actually deliver them to recruiters.`)) return

    setSending(true)
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setSendResults(result)
      showToast("success", `${result.sent} emails sent successfully!`)
      qc.invalidateQueries({ queryKey: ["outreach-campaigns"] })
      // Refresh data
      const refreshed = await fetch(`/api/outreach/campaigns/${campaignId}`)
      if (refreshed.ok) setData(await refreshed.json())
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  // Follow-up
  const handleFollowUp = async (record: OutreachRecord) => {
    setFollowingUp(record.id)
    try {
      const res = await fetch("/api/outreach/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      showToast("success", result.preview ? "Follow-up preview generated" : "Follow-up sent!")
      setData((prev) => prev ? {
        ...prev,
        records: prev.records.map((r) => r.id === record.id
          ? { ...r, status: "FOLLOW_UP_SENT" }
          : r
        )
      } : prev)
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Follow-up failed")
    } finally {
      setFollowingUp(null)
    }
  }

  // Status update (for marking replies)
  const handleMarkStatus = async (record: OutreachRecord, status: OutreachStatus) => {
    await fetch(`/api/outreach/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setData((prev) => prev ? {
      ...prev,
      records: prev.records.map((r) => r.id === record.id ? { ...r, status } : r)
    } : prev)
    showToast("success", `Status updated to ${status}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Campaign not found</p>
        <Link href="/outreach" className="text-indigo-600 font-semibold text-sm mt-2 inline-block hover:underline">← Back to Outreach</Link>
      </div>
    )
  }

  const { campaign, records } = data
  const approvedCount = records.filter((r) => r.status === "APPROVED").length
  const sentCount = records.filter((r) => ["SENT", "REPLIED", "INTERVIEW", "OFFER", "FOLLOW_UP_SENT"].includes(r.status)).length
  const draftCount = records.filter((r) => r.status === "DRAFT").length
  const pendingCount = records.filter((r) => r.status === "PENDING").length

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold animate-slide-up",
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-slate-200 shrink-0 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/outreach" className="flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-600 font-semibold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight">{campaign.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{records.length} recruiters</span>
              <span>·</span>
              <span className="text-emerald-600 font-semibold">{approvedCount} approved</span>
              <span>·</span>
              <span className="text-cyan-600 font-semibold">{sentCount} sent</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {campaign.attachedCvId && (
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs text-indigo-600 font-semibold">
              <Paperclip className="h-3 w-3" /> CV Attached
            </div>
          )}
          <Link
            href={`/outreach/campaign/${campaignId}/analytics`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-all shadow-sm"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </Link>
          <button
            onClick={handleSendCampaign}
            disabled={sending || approvedCount === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 hover:-translate-y-px transition-all duration-200"
          >
            {sending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              : <><Send className="h-4 w-4" /> Send {approvedCount > 0 ? `(${approvedCount})` : ""}</>}
          </button>
        </div>
      </div>

      {/* Send results banner */}
      {sendResults && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-700">
              {sendResults.sent} emails sent! {sendResults.failed > 0 && `${sendResults.failed} failed.`}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Application records automatically created in your Opportunities pipeline.
            </p>
          </div>
          <button onClick={() => setSendResults(null)}><X className="h-4 w-4 text-emerald-500" /></button>
        </div>
      )}

      {/* Main two-panel layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-y-auto lg:overflow-hidden pb-4">

        {/* LEFT: Recruiter list */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[45vh] lg:h-full min-h-[300px]">
          {/* List header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
            <div className="flex gap-2 text-[10px] font-bold">
              {[
                { label: "ALL", count: records.length, filter: null },
                { label: "PENDING", count: pendingCount, filter: "PENDING" },
                { label: "APPROVED", count: approvedCount, filter: "APPROVED" },
              ].map((f) => (
                <span key={f.label} className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
                  {f.label} {f.count}
                </span>
              ))}
            </div>

            {/* Bulk Selection Actions */}
            <div className="flex items-center justify-between text-xs min-h-[24px]">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === records.length && records.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(records.map(r => r.id)))
                    } else {
                      setSelectedIds(new Set())
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Select All
              </label>
              
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2.5">
                  <button onClick={() => handleBulkStatusChange("SKIPPED")} className="text-slate-400 hover:text-rose-500 transition-colors" title="Skip Selected"><SkipForward className="h-4 w-4" /></button>
                  <button onClick={handleBulkGenerate} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Generate Selected"><Sparkles className="h-4 w-4" /></button>
                  <button onClick={() => handleBulkStatusChange("APPROVED")} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Approve Selected"><CheckCircle2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
            {records.map((record, idx) => (
              <RecruiterListItem
                key={record.id}
                record={record}
                isSelected={selectedIdx === idx}
                onClick={() => {
                  setSelectedIdx(idx)
                  setEditMode(false)
                  setEditedEmail("")
                  setEditedSubject("")
                }}
                isChecked={selectedIds.has(record.id)}
                onCheck={(checked) => {
                  const newSet = new Set(selectedIds)
                  if (checked) newSet.add(record.id)
                  else newSet.delete(record.id)
                  setSelectedIds(newSet)
                }}
              />
            ))}
          </div>

          {/* Quick actions */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={async () => {
                // Generate all pending in sequence
                const pending = records.filter((r) => r.status === "PENDING")
                for (const r of pending) {
                  await handleGenerate(r)
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 text-xs font-semibold transition-all"
            >
              <Zap className="h-3.5 w-3.5" /> Generate All Pending ({pendingCount})
            </button>
          </div>
        </div>

        {/* RIGHT: Email editor */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {currentRecord ? (
            <>
              {/* Record header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-black text-lg">
                      {currentRecord.companyName[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{currentRecord.companyName}</h3>
                        <StatusBadge status={currentRecord.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {currentRecord.recruiterName && <span><User className="h-3 w-3 inline mr-0.5" />{currentRecord.recruiterName}</span>}
                        <span><Mail className="h-3 w-3 inline mr-0.5" />{currentRecord.recruiterEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {currentRecord.status === "PENDING" && (
                      <button
                        onClick={() => handleGenerate(currentRecord)}
                        disabled={generating[currentRecord.id]}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md shadow-indigo-500/20"
                      >
                        {generating[currentRecord.id]
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                          : <><Sparkles className="h-3.5 w-3.5" /> Generate Email</>}
                      </button>
                    )}

                    {(currentRecord.status === "DRAFT" || currentRecord.status === "APPROVED") && (
                      <>
                        <button
                          onClick={() => handleGenerate(currentRecord)}
                          disabled={generating[currentRecord.id]}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 transition-all"
                        >
                          {generating[currentRecord.id]
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />}
                          Regenerate
                        </button>
                        
                        <div className="relative group/dropdown">
                          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all">
                            Template <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-10 flex flex-col overflow-hidden text-left">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Default Templates
                            </div>
                            {EMAIL_TEMPLATES.map(t => (
                              <button
                                key={t.name}
                                onClick={() => handleApplyTemplate(t, currentRecord)}
                                className="text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition-colors"
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {!editMode ? (
                          <button
                            onClick={() => {
                              setEditMode(true)
                              setEditedEmail(getEmailText(currentRecord))
                              setEditedSubject(getSubjectText(currentRecord))
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditMode(false)}
                            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-2 text-xs font-semibold transition-all"
                          >
                            <Save className="h-3.5 w-3.5" /> Done
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(currentRecord, "SKIPPED")}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 px-3 py-2 text-xs font-semibold hover:border-rose-200 hover:text-rose-500 transition-all"
                        >
                          <SkipForward className="h-3.5 w-3.5" /> Skip
                        </button>

                        {currentRecord.status !== "APPROVED" && (
                          <button
                            onClick={() => handleStatusChange(currentRecord, "APPROVED")}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                        )}
                      </>
                    )}

                    {/* Post-send actions */}
                    {currentRecord.status === "SENT" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleFollowUp(currentRecord)}
                          disabled={!!followingUp}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 text-white px-3 py-2 text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all"
                        >
                          {followingUp === currentRecord.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Follow Up
                        </button>
                        {(["REPLIED", "INTERVIEW", "OFFER", "REJECTED"] as OutreachStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleMarkStatus(currentRecord, s)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                          >
                            {OUTREACH_STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Company context chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {currentRecord.industry && (
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-semibold">
                      {currentRecord.industry}
                    </span>
                  )}
                  {currentRecord.techStack?.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-indigo-50 text-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Email content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentRecord.status === "PENDING" && !generating[currentRecord.id] && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Ready to Generate</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs">
                        AI will write a personalized email referencing {currentRecord.companyName}'s products, tech stack, and your matching skills.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 relative">
                      <button
                        onClick={() => handleGenerate(currentRecord)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:-translate-y-px transition-all"
                      >
                        <Sparkles className="h-4 w-4" /> Generate Email
                      </button>
                      
                      <div className="relative group/dropdown">
                        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-600 px-6 py-3 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all">
                          Use Template <ChevronDown className="h-4 w-4" />
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-10 flex flex-col overflow-hidden text-left">
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Default Templates
                          </div>
                          {EMAIL_TEMPLATES.map(t => (
                            <button
                              key={t.name}
                              onClick={() => handleApplyTemplate(t, currentRecord)}
                              className="text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition-colors"
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {generating[currentRecord.id] && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is writing your email...
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono text-xs text-slate-600 min-h-32 whitespace-pre-wrap leading-relaxed">
                      {generatedTexts[currentRecord.id] || ""}
                    </div>
                  </div>
                )}

                {!generating[currentRecord.id] && currentRecord.status !== "PENDING" && (
                  <div className="space-y-4">
                    {/* Subject line */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject Line</label>
                      {editMode ? (
                        <input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="w-full h-10 rounded-xl border border-indigo-300 bg-indigo-50/30 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                          {getSubjectText(currentRecord) || "No subject"}
                        </div>
                      )}
                    </div>

                    {/* Email body */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Body</label>
                      {editMode ? (
                        <textarea
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          rows={16}
                          className="w-full rounded-xl border border-indigo-300 bg-indigo-50/30 px-4 py-3 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                        />
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-64">
                          {getEmailText(currentRecord) || "No email generated yet"}
                        </div>
                      )}
                    </div>

                    {/* Sent details */}
                    {currentRecord.sentAt && (
                      <div className="rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 text-xs text-cyan-700 flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 shrink-0" />
                        Sent on {new Date(currentRecord.sentAt).toLocaleString()}
                        {currentRecord.messageId && <span className="ml-auto text-[10px] text-cyan-500 font-mono">{currentRecord.messageId}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <button
                  onClick={() => { setSelectedIdx((i) => Math.max(0, i - 1)); setEditMode(false) }}
                  disabled={selectedIdx === 0}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-xs text-slate-400">
                  {selectedIdx + 1} of {records.length}
                </span>
                <button
                  onClick={() => { setSelectedIdx((i) => Math.min(records.length - 1, i + 1)); setEditMode(false) }}
                  disabled={selectedIdx === records.length - 1}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a recruiter from the list
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
