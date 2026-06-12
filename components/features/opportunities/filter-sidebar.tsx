"use client"

import React from "react"
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSection {
  id: string
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  // Filter state
  selectedStatuses: string[]
  onToggleStatus: (s: string) => void
  selectedPriorities: string[]
  onTogglePriority: (p: string) => void
  locationSearch: string
  onLocationSearch: (v: string) => void
  isRemoteOnly: boolean
  onToggleRemote: () => void
  selectedEmploymentTypes: string[]
  onToggleEmploymentType: (t: string) => void
  selectedPlatforms: string[]
  onTogglePlatform: (p: string) => void
  salaryMin: number
  salaryMax: number
  onSalaryChange: (min: number, max: number) => void
  deadlineFilter: string
  onDeadlineFilter: (d: string) => void
  selectedTags: string[]
  onToggleTag: (t: string) => void
  skillsSearch: string
  onSkillsSearch: (v: string) => void
  onReset: () => void
  activeFilterCount: number
}

const STATUSES = [
  { value: "SAVED",      label: "Saved" },
  { value: "INTERESTED", label: "Interested" },
  { value: "APPLIED",    label: "Applied" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "INTERVIEW",  label: "Interview" },
  { value: "OFFER",      label: "Offer" },
  { value: "REJECTED",   label: "Rejected" },
]
const PRIORITIES = [
  { value: "HIGH",   label: "High",   color: "text-rose-400" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-400" },
  { value: "LOW",    label: "Low",    color: "text-green-400" },
]
const EMPLOYMENT_TYPES = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULL_TIME",  label: "Full-time" },
  { value: "CONTRACT",   label: "Contract" },
  { value: "PART_TIME",  label: "Part-time" },
]
const PLATFORMS = [
  { value: "LINKEDIN",     label: "LinkedIn" },
  { value: "INTERNSHALA",  label: "Internshala" },
  { value: "GLASSDOOR",    label: "Glassdoor" },
  { value: "ANGELLIST",    label: "AngelList" },
  { value: "COMPANY_SITE", label: "Company Site" },
  { value: "REFERRAL",     label: "Referral" },
  { value: "OTHER",        label: "Other" },
]
const DEADLINES = [
  { value: "3days", label: "Within 3 days" },
  { value: "week",  label: "This week" },
  { value: "month", label: "This month" },
]
const PRESET_TAGS = ["frontend", "backend", "remote", "urgent", "dream company", "startup", "big tech", "ai/ml"]

function SectionAccordion({ id, label, children, defaultOpen = true }: FilterSection) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="pt-1 pb-3">{children}</div>}
    </div>
  )
}

function CheckItem({ checked, onToggle, label, labelClassName }: { checked: boolean; onToggle: () => void; label: string; labelClassName?: string }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 py-1.5 text-sm hover:text-foreground transition-colors"
    >
      <div className={cn(
        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
      )}>
        {checked && <span className="text-white text-[9px] font-black">✓</span>}
      </div>
      <span className={cn("text-xs", checked ? "text-foreground font-medium" : "text-muted-foreground", labelClassName)}>
        {label}
      </span>
    </button>
  )
}

export function FilterSidebar({
  isOpen,
  onClose,
  selectedStatuses, onToggleStatus,
  selectedPriorities, onTogglePriority,
  locationSearch, onLocationSearch,
  isRemoteOnly, onToggleRemote,
  selectedEmploymentTypes, onToggleEmploymentType,
  selectedPlatforms, onTogglePlatform,
  salaryMin, salaryMax, onSalaryChange,
  deadlineFilter, onDeadlineFilter,
  selectedTags, onToggleTag,
  skillsSearch, onSkillsSearch,
  onReset,
  activeFilterCount,
}: FilterSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen lg:h-auto lg:max-h-[calc(100vh-6rem)] z-50 lg:z-auto",
          "flex flex-col w-[240px] shrink-0",
          "border-r lg:border lg:rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl lg:bg-card/40",
          "overflow-y-auto transition-transform duration-300",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40 sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold transition-colors"
              >
                Reset
              </button>
            )}
            <button onClick={onClose} className="lg:hidden ml-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 py-3 space-y-1 divide-y divide-border/30">
          {/* Status */}
          <SectionAccordion id="status" label="Status">
            {STATUSES.map((s) => (
              <CheckItem key={s.value} checked={selectedStatuses.includes(s.value)} onToggle={() => onToggleStatus(s.value)} label={s.label} />
            ))}
          </SectionAccordion>

          {/* Priority */}
          <SectionAccordion id="priority" label="Priority">
            {PRIORITIES.map((p) => (
              <CheckItem key={p.value} checked={selectedPriorities.includes(p.value)} onToggle={() => onTogglePriority(p.value)} label={p.label} labelClassName={p.color} />
            ))}
          </SectionAccordion>

          {/* Location */}
          <SectionAccordion id="location" label="Location">
            <input
              value={locationSearch}
              onChange={(e) => onLocationSearch(e.target.value)}
              placeholder="City or country..."
              className="w-full rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2"
            />
            <CheckItem checked={isRemoteOnly} onToggle={onToggleRemote} label="Remote only" />
          </SectionAccordion>

          {/* Employment Type */}
          <SectionAccordion id="type" label="Employment Type" defaultOpen={false}>
            {EMPLOYMENT_TYPES.map((t) => (
              <CheckItem key={t.value} checked={selectedEmploymentTypes.includes(t.value)} onToggle={() => onToggleEmploymentType(t.value)} label={t.label} />
            ))}
          </SectionAccordion>

          {/* Source Platform */}
          <SectionAccordion id="platform" label="Source Platform" defaultOpen={false}>
            {PLATFORMS.map((p) => (
              <CheckItem key={p.value} checked={selectedPlatforms.includes(p.value)} onToggle={() => onTogglePlatform(p.value)} label={p.label} />
            ))}
          </SectionAccordion>

          {/* Deadline */}
          <SectionAccordion id="deadline" label="Deadline" defaultOpen={false}>
            {DEADLINES.map((d) => (
              <button
                key={d.value}
                onClick={() => onDeadlineFilter(deadlineFilter === d.value ? "" : d.value)}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left transition-all mb-1",
                  deadlineFilter === d.value
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            ))}
          </SectionAccordion>

          {/* Tags */}
          <SectionAccordion id="tags" label="Tags" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] transition-all",
                    selectedTags.includes(tag)
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </SectionAccordion>

          {/* Skills */}
          <SectionAccordion id="skills" label="Skills Required" defaultOpen={false}>
            <input
              value={skillsSearch}
              onChange={(e) => onSkillsSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </SectionAccordion>
        </div>
      </aside>
    </>
  )
}
