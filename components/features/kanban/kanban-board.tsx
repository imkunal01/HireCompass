"use client"

import React, { useState, useCallback } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Opportunity, OpportunityStatus, KANBAN_COLUMNS, normalizeStatus } from "@/types/opportunity"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  opportunities: Opportunity[]
  onCardClick?: (opp: Opportunity) => void
  onEdit?: (opp: Opportunity) => void
  onAddJob?: (status?: OpportunityStatus) => void
}

export function KanbanBoard({ opportunities: initialOpps, onCardClick, onEdit, onAddJob }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<Opportunity[]>(() =>
    initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  // Keep items in sync with external data changes
  React.useEffect(() => {
    setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
  }, [initialOpps])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OpportunityStatus }) => {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
    },
  })

  const getColumnItems = useCallback(
    (status: OpportunityStatus) =>
      items.filter((o) => {
        const normalized = normalizeStatus(o.status)
        return normalized === status
      }),
    [items]
  )

  function findContainer(id: string): OpportunityStatus | undefined {
    // id can be an opportunity id or a column status string
    const item = items.find((i) => i.id === id)
    if (item) return normalizeStatus(item.status) as OpportunityStatus
    if (KANBAN_COLUMNS.some((c) => c.status === id)) return id as OpportunityStatus
    return undefined
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id as string)
    const overContainer = findContainer(over.id as string) ?? (over.id as OpportunityStatus)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setItems((prev) => {
      return prev.map((item) =>
        item.id === (active.id as string)
          ? { ...item, status: overContainer }
          : item
      )
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeContainer = findContainer(active.id as string)
    const overContainer = findContainer(over.id as string) ?? (over.id as OpportunityStatus)

    if (!activeContainer || !overContainer) return

    if (activeContainer !== overContainer) {
      // Status changed — persist to DB
      updateStatusMutation.mutate({ id: active.id as string, status: overContainer })
    } else {
      // Reorder within same column
      const colItems = getColumnItems(activeContainer)
      const oldIndex = colItems.findIndex((i) => i.id === active.id)
      const newIndex = colItems.findIndex((i) => i.id === over.id)
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(colItems, oldIndex, newIndex)
        setItems((prev) => {
          const others = prev.filter((i) => normalizeStatus(i.status) !== activeContainer)
          return [...others, ...reordered]
        })
      }
    }
  }

  const activeItem = items.find((i) => i.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 px-1">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            opportunities={getColumnItems(col.status)}
            onCardClick={onCardClick}
            onEdit={onEdit}
            onDelete={(id) => {
              setItems((prev) => prev.filter((i) => i.id !== id))
              deleteMutation.mutate(id)
            }}
            onApply={(opp) => {
              setItems((prev) =>
                prev.map((i) => i.id === opp.id ? { ...i, status: "APPLIED" } : i)
              )
              updateStatusMutation.mutate({ id: opp.id, status: "APPLIED" })
            }}
            onAddJob={onAddJob}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-2 scale-105 opacity-90 shadow-2xl">
            <KanbanCard opportunity={activeItem} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
