"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  X,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Upload,
  Binary,
  Cpu,
  Globe,
  Database,
  BrainCircuit,
  Code2,
} from "lucide-react"
import { SheetCategory } from "@/types/sheet"
import { CsvImportModal } from "@/components/features/sheets/csv-import-modal"
import { cn } from "@/lib/utils"

const CATEGORIES: Array<{ id: SheetCategory; label: string; icon: any; color: string }> = [
  { id: "DSA", label: "DSA", icon: Binary, color: "emerald" },
  { id: "CP", label: "Competitive Programming", icon: BrainCircuit, color: "indigo" },
  { id: "DBMS", label: "DBMS & SQL", icon: Database, color: "purple" },
  { id: "OS", label: "Operating Systems", icon: Cpu, color: "amber" },
  { id: "CN", label: "Computer Networks", icon: Globe, color: "blue" },
  { id: "OOPS", label: "Object-Oriented Design", icon: Code2, color: "violet" },
  { id: "Development", label: "Development", icon: Code2, color: "teal" },
  { id: "Company", label: "Company Specific", icon: Sparkles, color: "rose" },
  { id: "Custom", label: "Custom Checklist", icon: Layers, color: "slate" },
]

const TOPIC_PRESETS = [
  { label: "DSA Core", topics: ["Arrays", "Strings", "Two Pointers", "Sliding Window", "Trees", "Dynamic Programming"] },
  { label: "Backend & Systems", topics: ["Concurrency", "Caching & Redis", "Database Indexing", "Message Queues", "API Rate Limiting"] },
  { label: "Core CS Fundamentals", topics: ["Process Synchronization", "Memory Management", "TCP/IP & UDP", "Transactions & ACID"] },
]

export default function NewSheetPage() {
  const router = useRouter()
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<SheetCategory>("DSA")
  const [topics, setTopics] = useState<string[]>(["Arrays", "Strings", "Dynamic Programming"])
  const [topicInput, setTopicInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddTopic = () => {
    const clean = topicInput.trim()
    if (clean && !topics.includes(clean)) {
      setTopics([...topics, clean])
      setTopicInput("")
    }
  }

  const handleRemoveTopic = (t: string) => {
    setTopics(topics.filter((x) => x !== t))
  }

  const handleAddPreset = (presetTopics: string[]) => {
    const combined = Array.from(new Set([...topics, ...presetTopics]))
    setTopics(combined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          topics,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create roadmap")
      }

      router.push(`/prep/problem-solving/${data.sheet._id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create sheet")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 pb-20 relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Breadcrumb */}
      <Link
        href="/prep/problem-solving"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Roadmaps</span>
      </Link>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-7">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Plus className="w-3.5 h-3.5" />
              Roadmap Architect
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Create Custom Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build your personal curriculum of coding patterns, system design concepts, or revision checklists.
          </p>
        </div>

        {/* CSV Import Shortcut Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Have an existing spreadsheet or problem list?
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bulk import 100+ problems from Striver, NeetCode, or company sheets instantly via Excel or CSV.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shrink-0 hover:scale-105"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sheet Title */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Roadmap Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Meta 30-Day LeetCode Sprint, Concurrency Deep Dive, or Blind 75 Redo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Category Selector Chips */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Curriculum Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id
                const IconComp = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition-all border text-left",
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm scale-[1.02]"
                        : "bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <IconComp className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Target goals, target companies, or personal study milestones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Topics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Initial Topics / Sections ({topics.length})
              </label>
            </div>

            {/* Topic Preset Shortcuts */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">Quick Presets:</span>
              {TOPIC_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAddPreset(preset.topics)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 hover:text-emerald-600 transition-colors border border-slate-200/60 dark:border-slate-700"
                >
                  +{preset.label}
                </button>
              ))}
            </div>

            {/* Input to add custom topic */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a custom topic (e.g. Monotonic Queue, Trie, Interval Scheduling)..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTopic()
                  }
                }}
                className="flex-1 text-xs px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Add Topic
              </button>
            </div>

            {/* Topic Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(t)}
                    className="hover:text-rose-500 transition-colors p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/prep/problem-solving"
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Roadmap"}
            </button>
          </div>
        </form>
      </div>

      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
      />
    </div>
  )
}
