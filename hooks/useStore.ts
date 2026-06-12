import { create } from "zustand"

interface UiState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  opportunityFilter: string
  setOpportunityFilter: (filter: string) => void

  viewMode: "board" | "list"
  setViewMode: (mode: "board" | "list") => void

  searchQuery: string
  setSearchQuery: (query: string) => void

  selectedOpportunityId: string | null
  setSelectedOpportunityId: (id: string | null) => void
}

export const useStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  opportunityFilter: "ALL",
  setOpportunityFilter: (filter) => set({ opportunityFilter: filter }),

  viewMode: "board",
  setViewMode: (mode) => set({ viewMode: mode }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedOpportunityId: null,
  setSelectedOpportunityId: (id) => set({ selectedOpportunityId: id }),
}))

