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
  status, label, opportunities, onCardClick, onEdit, onDelete, onApply, onAddJob,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
  const ids = opportunities.map((o) => o.id)

  return (
    <div className="flex flex-col min-w-[248px] max-w-[280px] flex-shrink-0">
      {/* Column Header */}
      <div
        className={cn(
          "rounded-t-xl border border-b-0 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 px-4 py-3",
          "border-t-4", config.borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</span>
            <span className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
              config.bgColor, config.textColor
            )}>
              {opportunities.length}
            </span>
          </div>
          <button
            onClick={() => onAddJob?.(status)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all duration-150"
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
          "flex-1 rounded-b-xl border border-t-0 border-slate-200/80 dark:border-slate-800/80 p-2",
          "transition-colors duration-200 min-h-[420px]",
          isOver
            ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
            : "bg-slate-50/60 dark:bg-slate-950/40"
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
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Drop cards here</p>
                <button
                  onClick={() => onAddJob?.(status)}
                  className="mt-2 text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                >
                  + Add {label}
                </button>
              </div>
            )}
            {isOver && (
              <div className="h-16 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Drop here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
