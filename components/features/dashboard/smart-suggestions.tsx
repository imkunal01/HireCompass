"use client"

import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Mail, Target, FileText, X, ChevronRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity, normalizeStatus } from "@/types/opportunity"
import Link from "next/link"

interface Suggestion {
  id: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  title: string
  description: string
  action?: { label: string; href: string }
}

const MOCK_OPPS: Opportunity[] = [
  { id: "m1", userId: "", company: "Google",  title: "Software Engineer Intern", status: "SAVED",    priority: "HIGH",   deadline: new Date(Date.now() + 1 * 86400000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "m2", userId: "", company: "Stripe",  title: "Fullstack Developer",      status: "APPLIED",  priority: "MEDIUM", deadline: new Date(Date.now() + 4 * 86400000).toISOString(), createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: "m3", userId: "", company: "Vercel",  title: "Frontend Engineer",        status: "SAVED",    priority: "HIGH",   deadline: new Date(Date.now() + 6 * 86400000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
]

function generateSuggestions(opps: Opportunity[], dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = []
  const now = Date.now()

  opps.forEach((opp) => {
    const status = normalizeStatus(opp.status)

    // Deadline approaching + not applied
    if (opp.deadline && status === "SAVED") {
      const daysLeft = Math.ceil((new Date(opp.deadline).getTime() - now) / 86400000)
      if (daysLeft >= 0 && daysLeft <= 3) {
        const id = `deadline-${opp.id}`
        if (!dismissed.has(id)) {
          suggestions.push({
            id,
            icon: AlertTriangle,
            iconColor: "text-rose-400",
            iconBg: "bg-rose-500/10",
            title: `${opp.company} deadline in ${daysLeft === 0 ? "today" : `${daysLeft}d`}`,
            description: `You saved "${opp.title}" but haven't applied yet.`,
            action: { label: "Apply now", href: "/applications" },
          })
        }
      }
    }

    // Follow-up due (applied 7+ days ago, no interview)
    if (status === "APPLIED" && opp.createdAt) {
      const daysSince = Math.floor((now - new Date(opp.createdAt).getTime()) / 86400000)
      if (daysSince >= 7) {
        const id = `followup-${opp.id}`
        if (!dismissed.has(id)) {
          suggestions.push({
            id,
            icon: Mail,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            title: `Follow up with ${opp.company}`,
            description: `${daysSince} days since applying to "${opp.title}". Reach out!`,
            action: { label: "Draft email", href: "/assistant" },
          })
        }
      }
    }
  })

  // Generic suggestions
  const frontendJobs = opps.filter((o) => (o.skills || []).some((s) => ["React", "TypeScript", "Next.js"].includes(s)))
  if (frontendJobs.length > 0) {
    const id = "frontend-resume"
    if (!dismissed.has(id)) {
      suggestions.push({
        id,
        icon: FileText,
        iconColor: "text-violet-400",
        iconBg: "bg-violet-500/10",
        title: "Use your Frontend resume",
        description: `${frontendJobs.length} of your saved jobs require React/TypeScript skills.`,
        action: { label: "Go to assistant", href: "/assistant" },
      })
    }
  }

  return suggestions.slice(0, 4)
}

export function SmartSuggestions() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try {
      return new Set(JSON.parse(localStorage.getItem("dismissedSuggestions") || "[]"))
    } catch { return new Set() }
  })

  const { data: apiOpps } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) return []
      return res.json()
    },
  })

  const opps = (apiOpps && apiOpps.length > 0) ? apiOpps : MOCK_OPPS
  const suggestions = generateSuggestions(opps, dismissed)

  const dismiss = (id: string) => {
    const next = new Set([...dismissed, id])
    setDismissed(next)
    localStorage.setItem("dismissedSuggestions", JSON.stringify([...next]))
  }

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
        <Zap className="h-4 w-4 text-amber-400" />
        <h2 className="font-bold text-foreground text-sm">Smart Suggestions</h2>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-bold text-amber-400">
          {suggestions.length}
        </span>
      </div>
      <div className="divide-y divide-border/30">
        {suggestions.map((s) => (
          <div key={s.id} className="group flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/5 transition-colors">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", s.iconBg)}>
              <s.icon className={cn("h-4 w-4", s.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              {s.action && (
                <Link
                  href={s.action.href}
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  {s.action.label} <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(s.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
