"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Star,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Bookmark,
  Users,
  Briefcase,
  Shield,
  Loader2,
  FolderGit2,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Mic,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StarStory, StarAudience } from "@/types/prep"

const ARCHETYPES = [
  { id: "outage_crisis", label: "Production Outage / Crisis", icon: "🔥", desc: "Root cause, blast radius & recovery" },
  { id: "technical_disagreement", label: "Technical Disagreement", icon: "⚔️", desc: "Consensus building with data" },
  { id: "tight_deadlines", label: "Deadline & Scope Cut", icon: "⏳", desc: "Prioritizing MVP vs tech debt" },
  { id: "ambiguity_architecture", label: "Architecture Under Ambiguity", icon: "🧭", desc: "Vague specs to production SLA" },
  { id: "leadership_mentorship", label: "Mentorship & Influence", icon: "👥", desc: "Multiplying team velocity" },
]

export function StarMatrixTab() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedArchetype, setSelectedArchetype] = useState<string>("outage_crisis")
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audienceTabs, setAudienceTabs] = useState<Record<string, StarAudience>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch saved STAR stories
  const { data: storiesData, isLoading: loadingStories } = useQuery<{ stories: StarStory[] }>({
    queryKey: ["star-stories"],
    queryFn: async () => {
      const res = await fetch("/api/prep/star-matrix")
      if (!res.ok) return { stories: [] }
      return res.json()
    },
  })

  // Fetch candidate's projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const stories = storiesData?.stories || []

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) {
      setError("Please select a project from your Vault to synthesize from")
      return
    }

    setIsSynthesizing(true)
    setError(null)

    try {
      const res = await fetch("/api/prep/star-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "synthesize",
          projectId: selectedProjectId,
          archetype: selectedArchetype,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to synthesize behavioral story")
      }

      queryClient.invalidateQueries({ queryKey: ["star-stories"] })
    } catch (err: any) {
      setError(err.message || "Failed to synthesize story")
    } finally {
      setIsSynthesizing(false)
    }
  }

  const handleDeleteStory = async (id: string) => {
    try {
      await fetch(`/api/prep/star-matrix?id=${id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["star-stories"] })
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyStory = (pitch: string, id: string) => {
    navigator.clipboard.writeText(pitch)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-7">
      {/* ── Synthesis Control Cockpit ── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                Behavioral Intelligence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Dynamic STAR Story Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              Auto-extracts Situation, Task, Action, and Quantified Results from your Project Vault, with 1-click audience re-targeting for Engineering Managers, Staff Engineers, and PMs.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all shrink-0"
          >
            <span>Open Project Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSynthesize} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Source Project Vault
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="">-- Choose project from your vault --</option>
                {projects.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Behavioral Challenge Archetype
              </label>
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                {ARCHETYPES.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.icon} {arch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Archetype Quick-Select Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetype === arch.id
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => setSelectedArchetype(arch.id)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-2xl border transition-all duration-200 group hover:scale-[1.02]",
                    isSelected
                      ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/30"
                      : "border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                  )}
                >
                  <span className="text-xl mb-1">{arch.icon}</span>
                  <span className="font-bold text-xs truncate text-slate-900 dark:text-white">
                    {arch.label}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                    {arch.desc}
                  </span>
                </button>
              )
            })}
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSynthesizing || !selectedProjectId}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md hover:shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Quantified Story...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize STAR Behavioral Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Synthesized Stories Deck ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            <span>Your Behavioral Playbook ({stories.length} Stories)</span>
          </h3>
        </div>

        {loadingStories ? (
          <div className="h-32 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
        ) : stories.length === 0 ? (
          <div className="p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No STAR stories generated yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Select one of your projects above and click Synthesize to create an executive behavioral story with metrics and audience adaptations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {stories.map((story) => {
              const sId = (story._id || story.id) as string
              const currentAudience: StarAudience = audienceTabs[sId] || "em"
              const activePitch =
                story.audienceVersions?.[currentAudience] ||
                story.versions?.[currentAudience] ||
                story.audienceVersions?.em ||
                story.versions?.em ||
                story.situation
              const isCopied = copiedId === sId

              return (
                <div
                  key={sId}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-5 hover:border-purple-500/40 transition-all duration-300"
                >
                  {/* Story Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {story.archetype.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Project: {story.projectTitle}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {story.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleCopyStory(activePitch, sId)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs",
                          isCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Copied Pitch!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Spoken Script</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteStory(sId)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete Story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* S-T-A-R 4-Stage Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border-l-4 border-l-indigo-500 border-t border-r border-b border-indigo-500/20 space-y-1.5 shadow-xs">
                      <span className="font-extrabold text-[10px] uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                        Situation
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {story.situation}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-500/5 border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/20 space-y-1.5 shadow-xs">
                      <span className="font-extrabold text-[10px] uppercase text-purple-600 dark:text-purple-400 tracking-wider block">
                        Task
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {story.task}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-500/5 border-l-4 border-l-teal-500 border-t border-r border-b border-teal-500/20 space-y-1.5 shadow-xs">
                      <span className="font-extrabold text-[10px] uppercase text-teal-600 dark:text-teal-400 tracking-wider block">
                        Action
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {story.action}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/5 border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-500/20 space-y-1.5 shadow-xs">
                      <span className="font-extrabold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                        Result
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {story.result}
                      </p>
                    </div>
                  </div>

                  {/* Quantified Impact Metric Badges */}
                  {story.metrics && story.metrics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-400">Quantified Impact Metrics:</span>
                      {story.metrics.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{m}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Audience Re-Targeter Switcher Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>Audience Re-Targeter (Select Interviewer Role)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~90s Spoken Pitch</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "em", label: "Engineering Manager", icon: Users, sub: "Process & Conflict" },
                        { id: "pe", label: "Principal Engineer", icon: Shield, sub: "Deep Architecture" },
                        { id: "pm", label: "Product Leader", icon: Briefcase, sub: "User Value & Velocity" },
                      ].map((aud) => {
                        const Icon = aud.icon
                        const isSelected = currentAudience === aud.id
                        return (
                          <button
                            key={aud.id}
                            type="button"
                            onClick={() =>
                              setAudienceTabs((prev) => ({
                                ...prev,
                                [sId]: aud.id as StarAudience,
                              }))
                            }
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all duration-200 text-left",
                              isSelected
                                ? "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/30"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-xl", isSelected ? "bg-purple-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold">{aud.label}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{aud.sub}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Spoken Teleprompter Box */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 text-xs sm:text-sm font-medium leading-relaxed relative overflow-hidden shadow-inner">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-purple-400 mb-2">
                        <Mic className="w-3.5 h-3.5" />
                        <span>Ready-To-Speak Script for {currentAudience.toUpperCase()}:</span>
                      </div>
                      <p className="whitespace-pre-wrap">{activePitch}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
