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
        "group relative rounded-xl border bg-white p-3.5 cursor-pointer",
        "hover:border-indigo-200 hover:shadow-card-hover",
        "transition-all duration-200",
        isBeingDragged
          ? "opacity-50 shadow-xl shadow-indigo-200/40 rotate-1 border-indigo-300 scale-105 z-50"
          : "opacity-100 border-slate-200/80"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(opportunity)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-2.5 pr-5">
        <CompanyAvatar company={opportunity.company} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate leading-tight">
            {opportunity.company}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
            {opportunity.title}
          </p>
        </div>
      </div>

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
              deadlineInfo.isUrgent ? "text-rose-500" : "text-slate-400"
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
          "bg-gradient-to-t from-white/95 to-transparent",
          "transition-all duration-200",
          showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onApply?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
          title="Mark Applied"
        >
          <Send className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete?.(opportunity.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
