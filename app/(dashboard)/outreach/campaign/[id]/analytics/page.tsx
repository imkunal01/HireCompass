"use client"

import React, { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  BarChart3, ArrowLeft, Users, Send, MessageSquare,
  Calendar, Trophy, TrendingUp, CheckCircle2, X,
  Clock, AlertCircle, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OutreachRecord, OutreachCampaign, OUTREACH_STATUS_CONFIG, OutreachStatus } from "@/types/outreach"

interface CampaignData {
  campaign: OutreachCampaign
  records: OutreachRecord[]
}

function StatCard({
  icon: Icon, label, value, sub, color
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl mb-3", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-sm font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CampaignAnalyticsPage({ params }: { params: { id: string } }) {
  const { id: campaignId } = params
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/outreach/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [campaignId])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Campaign not found</p>
      </div>
    )
  }

  const { campaign, records } = data

  // Count by status
  const counts: Record<string, number> = {}
  for (const r of records) {
    counts[r.status] = (counts[r.status] || 0) + 1
  }

  const total = records.length
  const sent = records.filter((r) => ["SENT", "REPLIED", "INTERVIEW", "OFFER", "REJECTED", "FOLLOW_UP_SENT"].includes(r.status)).length
  const replied = records.filter((r) => ["REPLIED", "INTERVIEW", "OFFER"].includes(r.status)).length
  const interview = counts["INTERVIEW"] || 0
  const offer = counts["OFFER"] || 0
  const skipped = counts["SKIPPED"] || 0
  const responseRate = sent > 0 ? Math.round((replied / sent) * 100) : 0
  const interviewRate = sent > 0 ? Math.round((interview / sent) * 100) : 0

  const statusBreakdown = Object.entries(OUTREACH_STATUS_CONFIG)
    .map(([status, cfg]) => ({
      status: status as OutreachStatus,
      label: cfg.label,
      count: counts[status] || 0,
      color: cfg.color,
      bgColor: cfg.bgColor,
      textColor: cfg.textColor,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/outreach/campaign/${campaignId}`}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <Link href="/outreach" className="hover:text-indigo-600">Outreach</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/outreach/campaign/${campaignId}`} className="hover:text-indigo-600">{campaign.name}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-slate-700">Analytics</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.name} — Analytics</h2>
          </div>
        </div>

        <Link
          href={`/outreach/campaign/${campaignId}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
        >
          View Campaign <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Recruiters"
          value={total}
          sub={`${skipped} skipped`}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <StatCard
          icon={Send}
          label="Emails Sent"
          value={sent}
          sub={`${total > 0 ? Math.round((sent / total) * 100) : 0}% of total`}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
        />
        <StatCard
          icon={MessageSquare}
          label="Response Rate"
          value={`${responseRate}%`}
          sub={`${replied} replies`}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={Calendar}
          label="Interviews"
          value={interview}
          sub={`${interviewRate}% interview rate`}
          color="bg-gradient-to-br from-violet-500 to-violet-600"
        />
      </div>

      {/* Funnel + breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Funnel visualization */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Campaign Funnel
          </h3>
          <div className="space-y-3">
            {[
              { label: "Uploaded", count: total, pct: 100, color: "bg-slate-200" },
              { label: "Sent", count: sent, pct: total > 0 ? (sent / total) * 100 : 0, color: "bg-cyan-400" },
              { label: "Replied", count: replied, pct: sent > 0 ? (replied / sent) * 100 : 0, color: "bg-emerald-400" },
              { label: "Interviews", count: interview, pct: replied > 0 ? (interview / replied) * 100 : 0, color: "bg-violet-500" },
              { label: "Offers", count: offer, pct: interview > 0 ? (offer / interview) * 100 : 0, color: "bg-amber-400" },
            ].map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{stage.label}</span>
                  <span className="text-slate-500">{stage.count} <span className="text-slate-400">({Math.round(stage.pct)}%)</span></span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div
                    className={cn("h-2.5 rounded-full transition-all duration-500", stage.color)}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" /> Status Breakdown
          </h3>
          <div className="space-y-2">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", s.bgColor, s.textColor)}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-6 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-company table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <h3 className="font-bold text-slate-900">Recruiter-by-Recruiter Status</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {records.map((r) => {
            const cfg = OUTREACH_STATUS_CONFIG[r.status] ?? OUTREACH_STATUS_CONFIG.PENDING
            return (
              <div key={r.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {r.companyName[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{r.companyName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {r.recruiterName && <>{r.recruiterName} · </>}{r.recruiterEmail}
                  </p>
                </div>
                {r.sentAt && (
                  <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(r.sentAt).toLocaleDateString()}
                  </div>
                )}
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold", cfg.bgColor, cfg.textColor)}>
                  {cfg.label}
                </span>
                <Link
                  href={`/outreach/campaign/${campaignId}`}
                  className="shrink-0 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Offer banner */}
      {offer > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-6 text-white text-center shadow-xl">
          <Trophy className="h-12 w-12 mx-auto mb-3" />
          <h3 className="text-xl font-black mb-1">🏆 {offer} Offer{offer > 1 ? "s" : ""} Received!</h3>
          <p className="text-sm opacity-90">Outstanding results from this campaign. Keep it up!</p>
        </div>
      )}
    </div>
  )
}
