"use client"

import React, { useState, useCallback, useRef } from "react"
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
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  closestCenter,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Opportunity, OpportunityStatus, KANBAN_COLUMNS, normalizeStatus } from "@/types/opportunity"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { useToast } from "@/components/ui/toast"

interface KanbanBoardProps {
  opportunities: Opportunity[]
  onCardClick?: (opp: Opportunity) => void
  onEdit?: (opp: Opportunity) => void
  onAddJob?: (status?: OpportunityStatus) => void
}

export function KanbanBoard({ opportunities: initialOpps, onCardClick, onEdit, onAddJob }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [items, setItems] = useState<Opportunity[]>(() =>
    initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  // Keep synchronous refs for immediate access during drag event cycles
  const itemsRef = useRef<Opportunity[]>(items)
  itemsRef.current = items

  const startStatusRef = useRef<OpportunityStatus | null>(null)

  // Keep items in sync with external data changes (only when not actively dragging)
  React.useEffect(() => {
    if (!activeId) {
      setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
    }
  }, [initialOpps, activeId])

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update status")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
    },
    onError: (error: Error) => {
      // Rollback to original items
      setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({
        type: "error",
        title: "Could not update status",
        message: error.message || "Failed to update application status.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({ type: "success", title: "Job removed from pipeline" })
    },
    onError: (error: Error) => {
      setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({
        type: "error",
        title: "Failed to delete",
        message: error.message || "Could not delete application.",
      })
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

  /**
   * Resolve column status for any droppable identifier (column ID or card ID)
   */
  const getTargetColumn = useCallback((id: string, overData?: any): OpportunityStatus | undefined => {
    // 1. Direct column ID match (e.g. "SAVED", "APPLIED", "ASSESSMENT", etc.)
    if (KANBAN_COLUMNS.some((c) => c.status === id)) {
      return id as OpportunityStatus
    }

    // 2. Data payload attached to droppable / sortable
    if (overData?.type === "column" && overData?.status) {
      return normalizeStatus(overData.status) as OpportunityStatus
    }
    if (overData?.type === "card" && overData?.status) {
      return normalizeStatus(overData.status) as OpportunityStatus
    }

    // 3. Search in current items
    const item = itemsRef.current.find((i) => i.id === id)
    if (item) {
      return normalizeStatus(item.status) as OpportunityStatus
    }

    return undefined
  }, [])

  /**
   * Collision detection strategy:
   * Prioritize pointer coordinates directly inside droppables (columns or cards).
   * This is critical so empty columns (OA, Interview, Offer, Ghosted) are cleanly detected
   * when hovered, rather than closestCorners snapping to cards in adjacent columns.
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    // 1. Pointer inside container or card (highest priority)
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // 2. Rect intersection (fallback if pointer slightly out of bounds)
    const rectCollisions = rectIntersection(args)
    if (rectCollisions.length > 0) {
      return rectCollisions
    }

    // 3. Closest center fallback
    return closestCenter(args)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeOpportunityId = event.active.id as string
    setActiveId(activeOpportunityId)

    // Synchronously capture origin status before any movement
    const initialStatus =
      (event.active.data.current?.status as OpportunityStatus) ||
      getTargetColumn(activeOpportunityId) ||
      null

    startStatusRef.current = initialStatus
  }, [getTargetColumn])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeOpportunityId = active.id as string
    const overId = over.id as string

    if (activeOpportunityId === overId) return

    const activeContainer = getTargetColumn(activeOpportunityId, active.data.current)
    const overContainer = getTargetColumn(overId, over.data.current)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setItems((prev) => {
      const activeIndex = prev.findIndex((i) => i.id === activeOpportunityId)
      if (activeIndex === -1) return prev

      const overIndex = prev.findIndex((i) => i.id === overId)
      const newItems = [...prev]
      const [movedItem] = newItems.splice(activeIndex, 1)

      // If hovering over another card, insert at that card's index; if over column, append to end
      const insertIndex = overIndex >= 0 ? overIndex : newItems.length
      newItems.splice(insertIndex, 0, { ...movedItem, status: overContainer })

      return newItems
    })
  }, [getTargetColumn])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    const activeOpportunityId = active.id as string

    setActiveId(null)

    const originStatus = startStatusRef.current
    startStatusRef.current = null

    // If dropped outside any container, revert
    if (!over) {
      if (originStatus) {
        setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
      }
      return
    }

    const overId = over.id as string

    // Determine target column
    let destinationColumn: OpportunityStatus | undefined
    if (overId === activeOpportunityId) {
      const current = itemsRef.current.find((i) => i.id === activeOpportunityId)
      if (current) destinationColumn = normalizeStatus(current.status) as OpportunityStatus
    } else {
      destinationColumn = getTargetColumn(overId, over.data.current)
    }

    if (!destinationColumn) {
      const current = itemsRef.current.find((i) => i.id === activeOpportunityId)
      if (current) destinationColumn = normalizeStatus(current.status) as OpportunityStatus
    }

    if (!destinationColumn) {
      setItems(initialOpps.map((o) => ({ ...o, status: normalizeStatus(o.status) as OpportunityStatus })))
      return
    }

    // Persist to MongoDB if column changed from original status
    if (originStatus && destinationColumn !== originStatus) {
      setItems((prev) =>
        prev.map((i) => (i.id === activeOpportunityId ? { ...i, status: destinationColumn! } : i))
      )
      updateStatusMutation.mutate({ id: activeOpportunityId, status: destinationColumn })
    }

    // Reorder within column if dropped over another card
    if (overId !== activeOpportunityId) {
      const colItems = itemsRef.current.filter((o) => normalizeStatus(o.status) === destinationColumn)
      const oldIndex = colItems.findIndex((i) => i.id === activeOpportunityId)
      const newIndex = colItems.findIndex((i) => i.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(colItems, oldIndex, newIndex)
        setItems((prev) => {
          const others = prev.filter((i) => normalizeStatus(i.status) !== destinationColumn)
          return [...others, ...reordered]
        })
      }
    }
  }, [initialOpps, getTargetColumn, updateStatusMutation])

  const activeItem = items.find((i) => i.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
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
                prev.map((i) => (i.id === opp.id ? { ...i, status: "APPLIED" } : i))
              )
              updateStatusMutation.mutate({ id: opp.id, status: "APPLIED" })
            }}
            onAddJob={onAddJob}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="rotate-2 scale-105 opacity-90 shadow-2xl pointer-events-none select-none">
            <KanbanCard opportunity={activeItem} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
