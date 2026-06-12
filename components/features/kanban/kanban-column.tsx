"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity, OpportunityStatus, STATUS_CONFIG } from "@/types/opportunity"
import { KanbanCard } from "./kanban-card"

interface KanbanColumnProps {
  status: OpportunityStatus
  label: string
  opportunities: Opportunity[]
  onCardClick?: (opp: Opportunity) => void
  onEdit?: (opp: Opportunity) => void
  onDelete?: (id: string) => void
  onApply?: (opp: Opportunity) => void
  onAddJob?: (status: OpportunityStatus) => void
}

export function KanbanColumn({
  status,
  label,
  opportunities,
  onCardClick,
  onEdit,
  onDelete,
  onApply,
  onAddJob,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
  const ids = opportunities.map((o) => o.id)

  return (
    <div className="flex flex-col min-w-[240px] max-w-[280px] flex-shrink-0">
      {/* Column Header */}
      <div
        className={cn(
          "rounded-t-xl border border-b-0 border-border/60 bg-card/40 backdrop-blur-md px-3.5 py-3",
          "border-t-4",
          config.borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <span
              className={cn(
                "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                config.bgColor,
                config.textColor
              )}
            >
              {opportunities.length}
            </span>
          </div>
          <button
            onClick={() => onAddJob?.(status)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title={`Add to ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-b-xl border border-t-0 border-border/60 bg-card/20 backdrop-blur-md p-2",
          "transition-colors duration-200 min-h-[400px]",
          isOver ? "bg-primary/5 border-primary/30" : ""
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {opportunities.map((opp) => (
              <KanbanCard
                key={opp.id}
                opportunity={opp}
                onClick={onCardClick}
                onEdit={onEdit}
                onDelete={onDelete}
                onApply={onApply}
              />
            ))}
            {opportunities.length === 0 && !isOver && (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border/40 text-center"
              >
                <p className="text-[11px] text-muted-foreground italic">Drop cards here</p>
              </div>
            )}
            {isOver && (
              <div className="h-16 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center">
                <p className="text-xs text-primary font-medium">Drop here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
