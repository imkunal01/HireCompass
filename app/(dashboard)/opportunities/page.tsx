"use client"

import React, { useState, useMemo, useCallback, useEffect, useTransition } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  LayoutGrid, List, SlidersHorizontal, Plus, Clock, MapPin,
  ExternalLink, X, ArrowUpDown, Briefcase, Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity, STATUS_CONFIG, PRIORITY_CONFIG, normalizeStatus } from "@/types/opportunity"
import { CompanyAvatar, StatusBadge, PriorityBadge } from "@/components/ui/badge"
import { FilterSidebar } from "@/components/features/opportunities/filter-sidebar"
import { SearchBar, highlightText } from "@/components/features/opportunities/search-bar"
import { AddJobModal } from "@/components/features/kanban/add-job-modal"
import { JobDrawer } from "@/components/features/kanban/job-drawer"
import { ToastProvider } from "@/components/ui/toast"

// Mock data for initial display before API data loads
const MOCK_OPPS: Opportunity[] = [
  { id: "o1", userId: "", company: "Google",   title: "Software Engineer Intern", status: "INTERVIEW",  priority: "HIGH",   location: "Mountain View, CA", salary: "$8,000/mo",   skills: ["Python", "Algorithms"], tags: ["big tech", "dream company"], deadline: new Date(Date.now() + 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), sourcePlatform: "LINKEDIN", employmentType: "INTERNSHIP" },
  { id: "o2", userId: "", company: "Vercel",   title: "Frontend Engineer",        status: "SAVED",      priority: "HIGH",   location: "Remote",            salary: "$130k–$170k", skills: ["React", "TypeScript", "Next.js"], tags: ["remote", "frontend"], deadline: new Date(Date.now() + 10 * 86400000).toISOString(), createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), sourcePlatform: "COMPANY_SITE", employmentType: "FULL_TIME" },
  { id: "o3", userId: "", company: "Stripe",   title: "Fullstack Developer",      status: "APPLIED",    priority: "MEDIUM", location: "San Francisco, CA", salary: "$150k–$200k", skills: ["Node.js", "React"], tags: ["fintech"], deadline: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), sourcePlatform: "REFERRAL", employmentType: "FULL_TIME" },
  { id: "o4", userId: "", company: "Linear",   title: "Senior Product Engineer",  status: "OFFER",      priority: "HIGH",   location: "Remote (Global)",   salary: "$160k–$210k", skills: ["TypeScript", "Design Systems"], tags: ["dream company", "remote"], createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), sourcePlatform: "ANGELLIST", employmentType: "FULL_TIME" },
  { id: "o5", userId: "", company: "Notion",   title: "React Developer",          status: "INTERESTED", priority: "MEDIUM", location: "Remote",            salary: "$120k",       skills: ["React", "Electron"], tags: ["remote", "backend"], deadline: new Date(Date.now() + 14 * 86400000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), sourcePlatform: "LINKEDIN", employmentType: "FULL_TIME" },
  { id: "o6", userId: "", company: "Figma",    title: "Platform Engineer",        status: "ASSESSMENT", priority: "MEDIUM", location: "New York, NY",      salary: "$140k",       skills: ["C++", "WebAssembly"], tags: ["design-tech"], deadline: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), sourcePlatform: "GLASSDOOR", employmentType: "FULL_TIME" },
  { id: "o7", userId: "", company: "Meta",     title: "React Native Developer",   status: "REJECTED",   priority: "LOW",    location: "Seattle, WA",       salary: "$145k",       skills: ["React Native", "iOS"], tags: ["big tech"], createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), sourcePlatform: "LINKEDIN", employmentType: "FULL_TIME" },
  { id: "o8", userId: "", company: "Shopify",  title: "Backend Engineer",         status: "APPLIED",    priority: "MEDIUM", location: "Remote (Canada)",   salary: "₹45 LPA",     skills: ["Ruby", "Rails", "Golang"], tags: ["remote", "backend"], deadline: new Date(Date.now() + 5 * 86400000).toISOString(), createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), sourcePlatform: "INTERNSHALA", employmentType: "FULL_TIME" },
]

type SortField = "deadline" | "createdAt" | "priority" | "company" | "salary"
type ViewMode = "grid" | "list"

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function OpportunitiesPage() {
  const queryClient = useQueryClient()

  // View & UI state
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  // Filter state
  const [searchRaw, setSearchRaw] = useState("")
  const search = useDebounce(searchRaw, 300)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [locationSearch, setLocationSearch] = useState("")
  const [isRemoteOnly, setIsRemoteOnly] = useState(false)
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [salaryMin, setSalaryMin] = useState(0)
  const [salaryMax, setSalaryMax] = useState(500000)
  const [deadlineFilter, setDeadlineFilter] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [skillsSearch, setSkillsSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortField>("createdAt")

  // Fetch data
  const { data: apiOpps, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const allOpps = (apiOpps && apiOpps.length > 0) ? apiOpps : MOCK_OPPS

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = [...allOpps]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((o) =>
        o.company.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        (o.location || "").toLowerCase().includes(q) ||
        (o.notes || "").toLowerCase().includes(q) ||
        (o.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (o.skills || []).some((s) => s.toLowerCase().includes(q))
      )
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((o) => selectedStatuses.includes(normalizeStatus(o.status)))
    }

    if (selectedPriorities.length > 0) {
      result = result.filter((o) => o.priority && selectedPriorities.includes(o.priority))
    }

    if (locationSearch) {
      result = result.filter((o) => (o.location || "").toLowerCase().includes(locationSearch.toLowerCase()))
    }

    if (isRemoteOnly) {
      result = result.filter((o) => o.isRemote || (o.location || "").toLowerCase().includes("remote"))
    }

    if (selectedEmploymentTypes.length > 0) {
      result = result.filter((o) => o.employmentType && selectedEmploymentTypes.includes(o.employmentType))
    }

    if (selectedPlatforms.length > 0) {
      result = result.filter((o) => o.sourcePlatform && selectedPlatforms.includes(o.sourcePlatform))
    }

    if (deadlineFilter) {
      const now = Date.now()
      const limits: Record<string, number> = { "3days": 3 * 86400000, week: 7 * 86400000, month: 30 * 86400000 }
      result = result.filter((o) => {
        if (!o.deadline) return false
        const d = new Date(o.deadline).getTime()
        return d - now <= limits[deadlineFilter]
      })
    }

    if (selectedTags.length > 0) {
      result = result.filter((o) => selectedTags.some((t) => (o.tags || []).includes(t)))
    }

    if (skillsSearch) {
      result = result.filter((o) => (o.skills || []).some((s) => s.toLowerCase().includes(skillsSearch.toLowerCase())))
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (sortBy === "priority") {
        return (PRIORITY_ORDER[a.priority || "LOW"] || 2) - (PRIORITY_ORDER[b.priority || "LOW"] || 2)
      }
      if (sortBy === "company") {
        return a.company.localeCompare(b.company)
      }
      // default: createdAt desc
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [allOpps, search, selectedStatuses, selectedPriorities, locationSearch, isRemoteOnly,
      selectedEmploymentTypes, selectedPlatforms, deadlineFilter, selectedTags, skillsSearch, sortBy])

  // Active filter pills
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedStatuses.map((s) => ({ key: `status-${s}`, label: s, onRemove: () => setSelectedStatuses((p) => p.filter((x) => x !== s)) })),
    ...selectedPriorities.map((p) => ({ key: `pri-${p}`, label: p, onRemove: () => setSelectedPriorities((prev) => prev.filter((x) => x !== p)) })),
    ...(isRemoteOnly ? [{ key: "remote", label: "Remote only", onRemove: () => setIsRemoteOnly(false) }] : []),
    ...selectedEmploymentTypes.map((t) => ({ key: `et-${t}`, label: t.replace("_", " "), onRemove: () => setSelectedEmploymentTypes((p) => p.filter((x) => x !== t)) })),
    ...selectedPlatforms.map((p) => ({ key: `plat-${p}`, label: p.replace("_", " "), onRemove: () => setSelectedPlatforms((prev) => prev.filter((x) => x !== p)) })),
    ...(deadlineFilter ? [{ key: "deadline", label: `Due: ${deadlineFilter}`, onRemove: () => setDeadlineFilter("") }] : []),
    ...selectedTags.map((t) => ({ key: `tag-${t}`, label: t, onRemove: () => setSelectedTags((p) => p.filter((x) => x !== t)) })),
    ...(skillsSearch ? [{ key: "skills", label: `Skill: ${skillsSearch}`, onRemove: () => setSkillsSearch("") }] : []),
    ...(locationSearch ? [{ key: "loc", label: `📍 ${locationSearch}`, onRemove: () => setLocationSearch("") }] : []),
  ]

  const resetFilters = () => {
    setSelectedStatuses([])
    setSelectedPriorities([])
    setLocationSearch("")
    setIsRemoteOnly(false)
    setSelectedEmploymentTypes([])
    setSelectedPlatforms([])
    setDeadlineFilter("")
    setSelectedTags([])
    setSkillsSearch("")
    setSearchRaw("")
  }

  const toggleArr = <T,>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item])
  }

  return (
    <ToastProvider>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Opportunities</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
              {search && <span> for "<span className="text-foreground">{search}</span>"</span>}
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4" /> Add Job
          </button>
        </div>

        {/* Search + Controls Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all",
              sidebarOpen || activeFilters.length > 0
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>

          <SearchBar value={searchRaw} onChange={setSearchRaw} />

          {/* Sort */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/40 px-3 py-2 text-sm text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="createdAt">Date Added</option>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="company">Company</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card/40 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">Active:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {f.label}
                <button onClick={f.onRemove} className="hover:text-rose-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button onClick={resetFilters} className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors">
              Clear all
            </button>
          </div>
        )}

        {/* Main layout: sidebar + results */}
        <div className="flex gap-6 items-start">
          {/* Filter sidebar */}
          <FilterSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            selectedStatuses={selectedStatuses}
            onToggleStatus={(s) => toggleArr(selectedStatuses, s, setSelectedStatuses)}
            selectedPriorities={selectedPriorities}
            onTogglePriority={(p) => toggleArr(selectedPriorities, p, setSelectedPriorities)}
            locationSearch={locationSearch}
            onLocationSearch={setLocationSearch}
            isRemoteOnly={isRemoteOnly}
            onToggleRemote={() => setIsRemoteOnly(!isRemoteOnly)}
            selectedEmploymentTypes={selectedEmploymentTypes}
            onToggleEmploymentType={(t) => toggleArr(selectedEmploymentTypes, t, setSelectedEmploymentTypes)}
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={(p) => toggleArr(selectedPlatforms, p, setSelectedPlatforms)}
            salaryMin={salaryMin}
            salaryMax={salaryMax}
            onSalaryChange={(min, max) => { setSalaryMin(min); setSalaryMax(max) }}
            deadlineFilter={deadlineFilter}
            onDeadlineFilter={setDeadlineFilter}
            selectedTags={selectedTags}
            onToggleTag={(t) => toggleArr(selectedTags, t, setSelectedTags)}
            skillsSearch={skillsSearch}
            onSkillsSearch={setSkillsSearch}
            onReset={resetFilters}
            activeFilterCount={activeFilters.length}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {isLoading && (
              <div className={cn("gap-4", viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-card/20 border border-border/40 animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/30 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-5">
                  {search
                    ? `No jobs match "${search}". Try different keywords or clear your filters.`
                    : "No jobs match your current filters."}
                </p>
                <div className="flex gap-3">
                  <button onClick={resetFilters} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all">
                    Clear Filters
                  </button>
                  <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    <Plus className="h-4 w-4" /> Add Job
                  </button>
                </div>
              </div>
            )}

            {!isLoading && filtered.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((opp) => (
                  <OpportunityCard key={opp.id} opp={opp} searchQuery={search} onClick={() => setSelectedOpp(opp)} />
                ))}
              </div>
            )}

            {!isLoading && filtered.length > 0 && viewMode === "list" && (
              <div className="flex flex-col gap-2">
                {filtered.map((opp) => (
                  <OpportunityListRow key={opp.id} opp={opp} searchQuery={search} onClick={() => setSelectedOpp(opp)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddJobModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <JobDrawer opportunityId={selectedOpp?.id ?? null} initialData={selectedOpp ?? undefined} onClose={() => setSelectedOpp(null)} />
    </ToastProvider>
  )
}

// --- Card view item ---
function OpportunityCard({ opp, searchQuery, onClick }: { opp: Opportunity; searchQuery: string; onClick: () => void }) {
  const status = normalizeStatus(opp.status)
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
  const deadlineDiff = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null
  const isUrgent = deadlineDiff !== null && deadlineDiff <= 3

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left w-full"
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <CompanyAvatar company={opp.company} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                {highlightText(opp.company, searchQuery)}
              </p>
              <h3 className="font-semibold text-sm text-foreground leading-snug mt-0.5 group-hover:text-primary transition-colors">
                {highlightText(opp.title, searchQuery)}
              </h3>
            </div>
            <StatusBadge status={status} className="shrink-0 mt-0.5" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3.5 space-y-1.5">
        {opp.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{highlightText(opp.location, searchQuery)}</span>
          </div>
        )}
        {opp.salary && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{opp.salary}</span>
          </div>
        )}
        {opp.deadline && (
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", isUrgent ? "text-rose-400" : "text-muted-foreground")}>
            <Clock className="h-3 w-3" />
            <span>
              {isUrgent ? `Due in ${deadlineDiff}d` : new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* Skills */}
      {opp.skills && opp.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {opp.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
          ))}
          {opp.skills.length > 3 && (
            <span className="rounded-full bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">+{opp.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        {opp.priority && <PriorityBadge priority={opp.priority} />}
        <span className="text-[10px] text-muted-foreground">
          {new Date(opp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </button>
  )
}

// --- List view row ---
function OpportunityListRow({ opp, searchQuery, onClick }: { opp: Opportunity; searchQuery: string; onClick: () => void }) {
  const status = normalizeStatus(opp.status)
  const deadlineDiff = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null
  const isUrgent = deadlineDiff !== null && deadlineDiff <= 3

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border bg-card/40 backdrop-blur-md px-4 py-3.5 hover:bg-card/70 hover:border-primary/30 hover:shadow-md transition-all text-left w-full group"
    >
      <CompanyAvatar company={opp.company} size="sm" />
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary truncate">{highlightText(opp.company, searchQuery)}</p>
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{highlightText(opp.title, searchQuery)}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {opp.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {opp.location}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          {opp.priority && <PriorityBadge priority={opp.priority} />}
          <StatusBadge status={status} />
          {opp.deadline && (
            <span className={cn("text-[10px] font-medium flex items-center gap-1", isUrgent ? "text-rose-400" : "text-muted-foreground")}>
              <Clock className="h-2.5 w-2.5" />
              {isUrgent ? `${deadlineDiff}d` : new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {opp.url && (
            <a
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </button>
  )
}
