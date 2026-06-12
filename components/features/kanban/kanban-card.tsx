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
        "group relative rounded-xl border bg-card/60 backdrop-blur-md p-3.5 cursor-pointer",
        "hover:bg-card/90 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-200",
        isBeingDragged
          ? "opacity-50 shadow-2xl shadow-primary/20 rotate-1 border-primary/50 scale-105 z-50"
          : "opacity-100 border-border"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(opportunity)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-2.5 pr-5">
        <CompanyAvatar company={opportunity.company} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">
            {opportunity.company}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-snug">
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
              "flex items-center gap-1 text-[10px] font-medium",
              deadlineInfo.isUrgent ? "text-rose-400" : "text-muted-foreground"
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
          "bg-gradient-to-t from-card/95 to-transparent",
          "transition-all duration-200",
          showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onApply?.(opportunity)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          title="Mark Applied"
        >
          <Send className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete?.(opportunity.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
