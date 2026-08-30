"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, Edit2, Send, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity } from "@/types/opportunity"
import { PriorityBadge, CompanyAvatar } from "@/components/ui/badge"

interface KanbanCardProps {
  opportunity: Opportunity
  onEdit?: (opp: Opportunity) => void
  onDelete?: (id: string) => void
  onApply?: (opp: Opportunity) => void
  onClick?: (opp: Opportunity) => void
  isDragging?: boolean
}

function getDeadlineDisplay(deadline?: string | Date | null) {
  if (!deadline) return null
  const date = new Date(deadline)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const isUrgent = diffDays <= 3
  return { formatted, isUrgent, diffDays }
}

export function KanbanCard({
  opportunity,
  onEdit,
  onDelete,
  onApply,
  onClick,
  isDragging = false,
}: KanbanCardProps) {
  const [showActions, setShowActions] = useState(false)
  const deadlineInfo = getDeadlineDisplay(opportunity.deadline)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || isSortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border bg-white dark:bg-slate-800/90 p-3.5 cursor-pointer",
        "hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:shadow-card-hover",
        "transition-all duration-200",
        isBeingDragged
          ? "opacity-50 shadow-xl shadow-indigo-200/40 dark:shadow-black/60 rotate-1 border-indigo-300 dark:border-indigo-500 scale-105 z-50"
          : "opacity-100 border-slate-200/80 dark:border-slate-700/60"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(opportunity)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-2.5 pr-5">
        <CompanyAvatar company={opportunity.company} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {opportunity.company}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-snug">
            {opportunity.title}
          </p>
        </div>
      </div>

      {/* Lifecycle Badges & Details */}
      {(opportunity.oaDetails?.platform || opportunity.interviewRounds?.length || opportunity.offerDetails?.totalAmount || opportunity.rejectionDetails?.stage) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {opportunity.status === "ASSESSMENT" && opportunity.oaDetails?.platform && (
            <span className="inline-flex items-center rounded-md bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-500 dark:text-cyan-400">
              💻 {opportunity.oaDetails.platform}
            </span>
          )}
          {opportunity.status === "INTERVIEW" && (
            <span className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-500 dark:text-purple-400">
              🎯 {opportunity.interviewRounds?.length ? `Round ${opportunity.interviewRounds.length}` : "Interview"}
            </span>
          )}
          {opportunity.status === "OFFER" && opportunity.offerDetails?.totalAmount && (
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              🎉 {opportunity.offerDetails.totalAmount}
            </span>
          )}
          {opportunity.status === "REJECTED" && (
            <span className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[180px]">
              ❌ {opportunity.rejectionDetails?.stage || "Rejected"}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {opportunity.priority && (
            <PriorityBadge priority={opportunity.priority} />
          )}
        </div>
        {deadlineInfo && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-semibold",
              deadlineInfo.isUrgent ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{deadlineInfo.formatted}</span>
          </div>
        )}
      </div>

      {/* Hover quick actions */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 px-2.5 py-1.5 rounded-b-xl",
          "bg-gradient-to-t from-white/95 dark:from-slate-800/95 to-transparent",
          "transition-all duration-200",
          showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onApply?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
          title="Mark Applied"
        >
          <Send className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete?.(opportunity.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
