"use client"

import React from "react"
import { Calendar, MapPin, DollarSign, ExternalLink, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type OpportunityStatus = "WISHLIST" | "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED"

export interface OpportunityData {
  id: string
  title: string
  company: string
  location?: string | null
  url?: string | null
  salary?: string | null
  status: OpportunityStatus
  notes?: string | null
  createdAt: Date | string
  interviews?: any[]
}

interface OpportunityCardProps {
  opportunity: OpportunityData
  onStatusChange?: (id: string, newStatus: OpportunityStatus) => void
}

const statusThemes: Record<OpportunityStatus, { label: string; bg: string; text: string; dot: string }> = {
  WISHLIST: { label: "Wishlist", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  APPLIED: { label: "Applied", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  INTERVIEWING: { label: "Interviewing", bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500" },
  OFFER: { label: "Offer", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500" },
}

export default function OpportunityCard({ opportunity, onStatusChange }: OpportunityCardProps) {
  const theme = statusThemes[opportunity.status] || statusThemes.WISHLIST
  const formattedDate = new Date(opportunity.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      {/* Decorative colored glow on card hover */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header: Company, Title & Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {opportunity.company}
          </span>
          <h3 className="font-semibold text-base mt-0.5 text-foreground leading-snug group-hover:text-primary transition duration-200">
            {opportunity.title}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-transparent",
            theme.bg,
            theme.text
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
          {theme.label}
        </span>
      </div>

      {/* Body: Metadata (Location, Salary, Date) */}
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        {opportunity.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{opportunity.location}</span>
          </div>
        )}
        {opportunity.salary && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>{opportunity.salary}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>Added {formattedDate}</span>
        </div>
      </div>

      {/* Notes Snippet */}
      {opportunity.notes && (
        <p className="mt-4 text-xs text-muted-foreground line-clamp-2 border-t border-border/40 pt-3 italic">
          &quot;{opportunity.notes}&quot;
        </p>
      )}

      {/* Next scheduled interview highlight */}
      {opportunity.interviews && opportunity.interviews.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-500/5 border border-purple-500/10 p-2.5 text-xs text-purple-300">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">
            Interview: {new Date(opportunity.interviews[0].date).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Footer: Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
        {opportunity.url ? (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            Job Listing <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground italic">No external link</span>
        )}

        <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
