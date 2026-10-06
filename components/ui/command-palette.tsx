"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  X,
  Briefcase,
  Calendar,
  BarChart3,
  Terminal,
  ListChecks,
  BrainCircuit,
  AlertOctagon,
  FolderGit2,
  FileText,
  Bell,
  CalendarCheck,
  Send,
  Download,
  Settings,
  ArrowRight,
  Flame,
  Home,
  Plus,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  name: string
  description: string
  category: "Navigation" | "Preparation & Testing" | "Career & Outreach" | "Actions"
  href?: string
  action?: () => void
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onAddJob?: () => void
}

export default function CommandPalette({ isOpen, onClose, onAddJob }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = useMemo(() => [
    // Core Navigation
    {
      id: "home",
      name: "Home Dashboard",
      description: "Mission Control, daily focus & priority checklist",
      category: "Navigation",
      href: "/dashboard",
      icon: Home,
    },
    {
      id: "jobs",
      name: "Job Applications & Kanban",
      description: "Manage active applications and pipeline stages",
      category: "Navigation",
      href: "/applications",
      icon: Briefcase,
    },
    {
      id: "opportunities",
      name: "Target Opportunities",
      description: "Browse and track prospective companies",
      category: "Navigation",
      href: "/opportunities",
      icon: Briefcase,
    },
    {
      id: "interviews",
      name: "Interviews Calendar",
      description: "View upcoming interview rounds and dates",
      category: "Navigation",
      href: "/interviews",
      icon: Calendar,
    },
    {
      id: "analytics",
      name: "Analytics & Funnel",
      description: "Application velocity and conversion rates",
      category: "Navigation",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      id: "admin",
      name: "Admin Control Center",
      description: "User management, inspect resumes & AI quota configuration",
      category: "Navigation",
      href: "/admin",
      icon: ShieldCheck,
      badge: "ADMIN",
    },

    // Prep & Testing
    {
      id: "assessment",
      name: "AI Coding Assessment",
      description: "Proctored 6-stage AI coding simulator",
      category: "Preparation & Testing",
      href: "/assessment",
      icon: Terminal,
      badge: "EXAM",
    },
    {
      id: "sheets",
      name: "Problem Solving Sheets",
      description: "Capgemini 150 DSA roadmap & problem sheets",
      category: "Preparation & Testing",
      href: "/prep/problem-solving",
      icon: ListChecks,
      badge: "SHEETS",
    },
    {
      id: "griller",
      name: "The Griller (Project Defense)",
      description: "Simulate intense live tech defense against Lead/Staff engineers",
      category: "Preparation & Testing",
      href: "/prep",
      icon: BrainCircuit,
      badge: "AI ARENA",
    },
    {
      id: "war-room",
      name: "Company War Room",
      description: "Tactical company dossiers and reverse interview questions",
      category: "Preparation & Testing",
      href: "/prep",
      icon: Flame,
    },
    {
      id: "primer",
      name: "15-Min Pre-Interview Primer",
      description: "Neuro-adrenaline sprint: Bug triage, Big-O reflex & Box Breathing",
      category: "Preparation & Testing",
      href: "/prep",
      icon: ShieldCheck,
      badge: "SPRINT",
    },
    {
      id: "rejected",
      name: "Rejection Remediation Drills",
      description: "Transform drop-off reasons into targeted coding recovery drills",
      category: "Preparation & Testing",
      href: "/rejected",
      icon: AlertOctagon,
    },

    // Career & Outreach
    {
      id: "planner",
      name: "AI Day Planner",
      description: "Timeboxed strategy cockpit and 45-min practice blocks",
      category: "Career & Outreach",
      href: "/planner",
      icon: CalendarCheck,
    },
    {
      id: "outreach",
      name: "Cold Outreach Studio",
      description: "AI tailored cold emails and networking CRM",
      category: "Career & Outreach",
      href: "/outreach",
      icon: Send,
    },
    {
      id: "import",
      name: "Smart JD Importer",
      description: "Parse job descriptions from URLs or text with zero errors",
      category: "Career & Outreach",
      href: "/import",
      icon: Download,
    },
    {
      id: "projects",
      name: "Project Vault",
      description: "Technical specifications, code snippets, and architecture notes",
      category: "Career & Outreach",
      href: "/projects",
      icon: FolderGit2,
    },
    {
      id: "resumes",
      name: "Resume Studio",
      description: "Targeted ATS optimization and resume versions",
      category: "Career & Outreach",
      href: "/resumes",
      icon: FileText,
    },
    {
      id: "reminders",
      name: "Reminders & Deadlines",
      description: "Follow-up schedule and urgency alerts",
      category: "Career & Outreach",
      href: "/reminders",
      icon: Bell,
    },
    {
      id: "settings",
      name: "Account Settings",
      description: "Profile, preferences, and AI quota overview",
      category: "Career & Outreach",
      href: "/settings",
      icon: Settings,
    },

    // Quick Actions
    {
      id: "action-add-job",
      name: "Track New Job Opportunity",
      description: "Open the quick job addition modal",
      category: "Actions",
      action: () => {
        onClose()
        if (onAddJob) onAddJob()
      },
      icon: Plus,
      badge: "ACTION",
    },
  ], [onClose, onAddJob])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [commands, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
    }
  }, [isOpen])

  const executeCommand = React.useCallback((cmd: CommandItem) => {
    if (cmd.action) {
      cmd.action()
    } else if (cmd.href) {
      onClose()
      router.push(cmd.href)
    }
  }, [onClose, router])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = filteredCommands[selectedIndex]
        if (selected) {
          executeCommand(selected)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose, executeCommand])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features, tools, sheets, or actions (e.g. Griller, Assessment, Planner)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-transparent">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              No features or tools matched &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{cmd.name}</span>
                        {cmd.badge && (
                          <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
                      {cmd.category}
                    </span>
                    <ArrowRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isSelected ? "text-indigo-600 dark:text-indigo-400 translate-x-0.5" : "text-transparent"
                      )}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-4 py-2 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            HireCompass Omnibar
          </span>
        </div>
      </div>
    </div>
  )
}
