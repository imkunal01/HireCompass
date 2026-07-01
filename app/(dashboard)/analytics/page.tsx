"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, TrendingUp, Compass, Award, Loader2, Target, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  funnel: {
    total: number
    saved: number
    applied: number
    interviewed: number
    offers: number
    rejected: number
  }
  conversion: {
    savedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
    overallYield: number
  }
  weeklyVelocity: { week: string; count: number }[]
  channels: { channel: string; count: number; pct: number }[]
  suggestions: string[]
}

const CHANNEL_COLORS = [
  "bg-primary",
  "bg-purple-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-rose-500",
]

function ConversionCard({
  label,
  pct,
  sub,
  color,
}: {
  label: string
  pct: number
  sub: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 text-center space-y-2">
      <span className="text-xs text-muted-foreground font-medium block">{label}</span>
      <h3 className={cn("text-2xl font-bold", color)}>{pct}%</h3>
      <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
      {/* Mini progress bar */}
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 text-center space-y-3">
      <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
      <p className="text-sm font-semibold text-foreground">No data yet</p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Add opportunities to your pipeline to see analytics. Track applications, interviews,
        and offers to unlock insights.
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to load analytics")
      return res.json()
    },
    staleTime: 60 * 1000,
  })

  const isEmpty = !data || data.funnel.total === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading your analytics..."
              : isEmpty
              ? "Start tracking to unlock insights."
              : `Based on ${data.funnel.total} tracked opportunities`}
          </p>
        </div>
        {data && !isEmpty && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            {data.funnel.offers} offer{data.funnel.offers !== 1 ? "s" : ""} received
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Funnel pipeline */}
          <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Application Funnel</h3>
            </div>
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {[
                { label: "Saved", count: data.funnel.total, color: "bg-indigo-500" },
                { label: "Applied", count: data.funnel.applied, color: "bg-blue-500" },
                { label: "Interview", count: data.funnel.interviewed, color: "bg-violet-500" },
                { label: "Offer", count: data.funnel.offers, color: "bg-emerald-500" },
                { label: "Rejected", count: data.funnel.rejected, color: "bg-rose-500" },
              ].map((stage, i) => {
                const maxCount = data.funnel.total || 1
                const heightPct = Math.max(8, (stage.count / maxCount) * 100)
                return (
                  <div key={stage.label} className="flex-1 min-w-[60px] flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">{stage.count}</span>
                    <div
                      className={cn("w-full rounded-t-xl relative group transition-all duration-500", stage.color, "opacity-80 hover:opacity-100")}
                      style={{ height: `${heightPct * 1.2}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">{stage.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conversion metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ConversionCard
              label="Saved → Applied"
              pct={data.conversion.savedToApplied}
              sub={data.conversion.savedToApplied >= 70 ? "Strong conversion" : "Try applying to more saved jobs"}
              color="text-blue-400"
            />
            <ConversionCard
              label="Applied → Interview"
              pct={data.conversion.appliedToInterview}
              sub={data.conversion.appliedToInterview >= 20 ? "Above average" : "Consider tailoring your resume more"}
              color="text-purple-400"
            />
            <ConversionCard
              label="Interview → Offer"
              pct={data.conversion.interviewToOffer}
              sub={data.conversion.interviewToOffer >= 30 ? "Outstanding performance" : "Practice mock interviews"}
              color="text-emerald-400"
            />
            <ConversionCard
              label="Overall Yield"
              pct={data.conversion.overallYield}
              sub={`${data.funnel.offers} offer${data.funnel.offers !== 1 ? "s" : ""} out of ${data.funnel.total}`}
              color="text-amber-400"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Velocity */}
            <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-base">Weekly Application Velocity</h3>
              </div>
              {data.weeklyVelocity.length === 0 || data.weeklyVelocity.every((w) => w.count === 0) ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No application data yet</p>
              ) : (
                <div className="h-56 flex items-end gap-2 pt-6 px-2">
                  {data.weeklyVelocity.map((wk, i) => {
                    const maxCount = Math.max(...data.weeklyVelocity.map((w) => w.count), 1)
                    const heightPct = (wk.count / maxCount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-foreground">{wk.count || ""}</span>
                        <div className="w-full relative group" style={{ height: `${Math.max(heightPct, wk.count > 0 ? 6 : 0)}%` }}>
                          <div
                            className={cn(
                              "absolute inset-0 rounded-t-lg transition-all duration-300",
                              i === data.weeklyVelocity.length - 1
                                ? "bg-gradient-to-t from-primary to-indigo-400"
                                : "bg-primary/60 group-hover:bg-primary/80"
                            )}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{wk.week}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Channel Distribution */}
            <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-base">Channel Distribution</h3>
              </div>

              {data.channels.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">Add job URLs to detect channels</p>
              ) : (
                <div className="space-y-3 pt-1">
                  {data.channels.slice(0, 5).map((ch, i) => (
                    <div key={ch.channel}>
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-foreground">{ch.channel}</span>
                        <span className="text-muted-foreground">{ch.pct}% ({ch.count})</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", CHANNEL_COLORS[i % CHANNEL_COLORS.length])}
                          style={{ width: `${ch.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {data.suggestions.length > 0 && (
                <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 text-xs text-muted-foreground flex gap-3 mt-2">
                  <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground block">Optimization Insight:</span>
                    {data.suggestions[0]}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All suggestions */}
          {data.suggestions.length > 1 && (
            <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Personalized Tips</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.suggestions.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-secondary/10 border border-border/40 px-3 py-2.5 text-xs text-muted-foreground">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
