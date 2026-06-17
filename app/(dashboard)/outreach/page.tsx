"use client"

import React from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Send, Plus, Users, Mail, TrendingUp, Award, Zap,
  ChevronRight, BarChart3, Loader2, Clock, CheckCircle2, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OutreachCampaign, OutreachStats } from "@/types/outreach"

function StatCard({
  icon: Icon, label, value, sub, gradient,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string; gradient: string
}) {
  return (
    <div className={cn("rounded-2xl p-5 text-white shadow-lg", gradient)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-black mb-0.5">{value}</p>
      <p className="text-sm font-semibold opacity-90">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function CampaignRow({ campaign, onDelete }: { campaign: OutreachCampaign, onDelete: (id: string) => void }) {
  const sentPct = campaign.totalRecords > 0
    ? Math.round((campaign.sentCount / campaign.totalRecords) * 100)
    : 0

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-500",
    GENERATING: "bg-amber-100 text-amber-600",
    READY: "bg-violet-100 text-violet-600",
    SENDING: "bg-cyan-100 text-cyan-600",
    SENT: "bg-emerald-100 text-emerald-600",
    ARCHIVED: "bg-slate-100 text-slate-400",
  }

  return (
    <Link
      href={`/outreach/campaign/${campaign.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 shadow-sm"
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100">
        <Mail className="h-5 w-5 text-indigo-600" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors max-w-[200px] sm:max-w-xs">
            {campaign.name}
          </h3>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusColors[campaign.status] || statusColors.DRAFT)}>
            {campaign.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.totalRecords} recruiters</span>
          <span className="flex items-center gap-1"><Send className="h-3 w-3" />{campaign.sentCount} sent</span>
          {campaign.repliedCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3 w-3" />{campaign.repliedCount} replied
            </span>
          )}
        </div>

        {/* Progress bar */}
        {campaign.sentCount > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${sentPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 z-10">
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(campaign.id)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>
    </Link>
  )
}

export default function OutreachHubPage() {
  const qc = useQueryClient()
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<OutreachCampaign[]>({
    queryKey: ["outreach-campaigns"],
    queryFn: () => fetch("/api/outreach/campaigns").then((r) => r.json()),
  })

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This will delete all associated emails and records.")) return
    
    try {
      const res = await fetch(`/api/outreach/campaigns/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      qc.invalidateQueries({ queryKey: ["outreach-campaigns"] })
      qc.invalidateQueries({ queryKey: ["outreach-stats"] })
    } catch (err) {
      alert("Failed to delete campaign.")
    }
  }

  const { data: stats } = useQuery<OutreachStats>({
    queryKey: ["outreach-stats"],
    queryFn: () => fetch("/api/outreach/stats").then((r) => r.json()),
  })

  return (
    <div className="space-y-6 max-w-5xl animate-slide-up">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
              <Send className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Outreach</h2>
          </div>
          <p className="text-sm text-slate-500">
            AI-powered internship outreach — upload recruiter data, generate personalized emails, track replies.
          </p>
        </div>

        <Link
          href="/outreach/upload"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Recruiters Saved"
          value={stats?.totalRecruitersSaved ?? 0}
          gradient="stat-indigo"
        />
        <StatCard
          icon={Send}
          label="Emails Sent"
          value={stats?.totalEmailsSent ?? 0}
          gradient="stat-violet"
        />
        <StatCard
          icon={TrendingUp}
          label="Response Rate"
          value={`${stats?.responseRate ?? 0}%`}
          sub={`${stats?.totalReplied ?? 0} replies`}
          gradient="stat-emerald"
        />
        <StatCard
          icon={Award}
          label="Interviews"
          value={stats?.totalInterviews ?? 0}
          sub={`${stats?.totalOffers ?? 0} offers`}
          gradient="stat-amber"
        />
      </div>

      {/* How it works (empty state guide) */}
      {campaigns.length === 0 && !campaignsLoading && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-8">
          <h3 className="font-bold text-slate-900 text-lg mb-5 text-center">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {[
              { num: "1", label: "Upload CSV/Excel", desc: "Recruiter + company data", icon: "📂" },
              { num: "2", label: "AI Extracts & Validates", desc: "Cleans & structures data", icon: "🤖" },
              { num: "3", label: "Generate Emails", desc: "Personalized per company", icon: "✉️" },
              { num: "4", label: "Review & Approve", desc: "Edit before sending", icon: "👀" },
              { num: "5", label: "Send & Track", desc: "Auto-create applications", icon: "🚀" },
            ].map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="text-center">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold mb-1.5">
                    {step.num}
                  </div>
                  <p className="text-xs font-bold text-slate-800">{step.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                </div>
                {i < 4 && (
                  <ChevronRight className="h-4 w-4 text-slate-300 mx-auto hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/outreach/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px transition-all duration-200"
            >
              <Zap className="h-4 w-4" /> Start Your First Campaign
            </Link>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {(campaigns.length > 0 || campaignsLoading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700">Your Campaigns ({campaigns.length})</h3>
            <Link href="/outreach/upload" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </Link>
          </div>

          {campaignsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => <CampaignRow key={c.id} campaign={c} onDelete={handleDeleteCampaign} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
