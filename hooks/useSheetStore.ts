import { create } from "zustand"
import { ItemStatus, SheetDetailResponse, MergedSheetTopic, SheetSummary } from "@/types/sheet"

interface SheetState {
  current: SheetDetailResponse | null
  loading: boolean
  error: string | null

  fetchSheet: (id: string) => Promise<void>
  setStatus: (itemId: string, status: ItemStatus) => Promise<void>
  setItemNotes: (itemId: string, notes: string) => Promise<void>
  setCurrent: (data: SheetDetailResponse | null) => void
}

function recalculateSummary(data: SheetDetailResponse): SheetDetailResponse {
  let total = 0
  let done = 0

  const topics = data.topics.map((t) => {
    const d = t.items.filter((i) => i.status === "done").length
    total += t.items.length
    done += d
    return {
      ...t,
      total: t.items.length,
      done: d,
      percent: t.items.length > 0 ? Math.round((d / t.items.length) * 100) : 0,
    }
  })

  return {
    ...data,
    topics,
    summary: {
      total,
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    },
  }
}

export const useSheetStore = create<SheetState>((set, get) => ({
  current: null,
  loading: false,
  error: null,

  setCurrent: (data) => set({ current: data }),

  fetchSheet: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`/api/sheets/${id}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to load sheet")
      }
      const data: SheetDetailResponse = await res.json()
      set({ current: data, loading: false })
    } catch (e: any) {
      set({ error: e.message || "Failed to load sheet", loading: false })
    }
  },

  // Optimistic UI update: instantly update UI checkbox, recompute counts, revert on failure
  setStatus: async (itemId: string, status: ItemStatus) => {
    const prev = get().current
    if (!prev) return

    const sheetId = prev.sheet._id

    // Apply optimistic state
    const optimisticTopics = prev.topics.map((topic) => ({
      ...topic,
      items: topic.items.map((item) =>
        item._id === itemId
          ? {
              ...item,
              status,
              completedAt: status === "done" ? new Date().toISOString() : null,
            }
          : item
      ),
    }))

    const updated = recalculateSummary({
      ...prev,
      topics: optimisticTopics,
    })

    set({ current: updated })

    try {
      const res = await fetch(`/api/sheets/${sheetId}/items/${itemId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        throw new Error("Could not save progress")
      }
    } catch (error) {
      console.error("[useSheetStore.setStatus] Failed, reverting state:", error)
      set({ current: prev, error: "Network error saving progress. Reverted." })
    }
  },

  setItemNotes: async (itemId: string, notes: string) => {
    const prev = get().current
    if (!prev) return

    const sheetId = prev.sheet._id

    // Update note locally
    const optimisticTopics = prev.topics.map((topic) => ({
      ...topic,
      items: topic.items.map((item) =>
        item._id === itemId ? { ...item, notes } : item
      ),
    }))

    set({ current: { ...prev, topics: optimisticTopics } })

    try {
      await fetch(`/api/sheets/${sheetId}/items/${itemId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
    } catch (error) {
      console.error("[useSheetStore.setItemNotes] Failed:", error)
    }
  },
}))
