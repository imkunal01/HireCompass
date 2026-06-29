"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, X, Wand2, Copy, Check, ChevronDown, ChevronUp,
  Github, ExternalLink, Trash2, Edit2, Loader2, FolderGit2,
  Sparkles, Tag, Layers, BarChart2, BookOpen, Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Project, ProjectSnippet, SnippetLength,
  SNIPPET_LENGTH_CONFIG, ROLE_TAG_SUGGESTIONS
} from "@/types/project"
import { ToastProvider, useToast } from "@/components/ui/toast"

// ─────────────────────────────────────────────────────────────────────────────
// Role Tag Autocomplete Input
// ─────────────────────────────────────────────────────────────────────────────
function RoleTagInput({
  value,
  onChange,
  placeholder = "e.g. Backend SDE Intern",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= 2) {
      const q = value.toLowerCase()
      setFiltered(ROLE_TAG_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6))
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false) }}
              className="w-full text-left px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Input (for tech stack, metrics, role categories)
// ─────────────────────────────────────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState("")

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput("")
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs text-primary"
          >
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
              <X className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={placeholder || "Type and press Enter"}
          className="flex-1 rounded-xl border border-border bg-secondary/20 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy Button
// ─────────────────────────────────────────────────────────────────────────────
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        copied
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40",
        className
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Snippet Card
// ─────────────────────────────────────────────────────────────────────────────
function SnippetCard({
  snippet,
  projectId,
  onDelete,
  onEdit,
}: {
  snippet: ProjectSnippet
  projectId: string
  onDelete: (snippetId: string) => void
  onEdit: (snippet: ProjectSnippet) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = snippet.content.slice(0, 120) + (snippet.content.length > 120 ? "…" : "")

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/10 p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-400">
            {snippet.roleTag}
          </span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
            snippet.length === "short" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
            snippet.length === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          )}>
            {SNIPPET_LENGTH_CONFIG[snippet.length].label}
          </span>
          {snippet.isAiGenerated && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(snippet)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(snippet.id)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {expanded ? snippet.content : preview}
      </p>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
        <CopyButton text={snippet.content} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Snippet Editor Modal
// ─────────────────────────────────────────────────────────────────────────────
interface SnippetEditorProps {
  project: Project
  editingSnippet?: ProjectSnippet | null
  onClose: () => void
  onSaved: () => void
}

function SnippetEditor({ project, editingSnippet, onClose, onSaved }: SnippetEditorProps) {
  const { toast } = useToast()
  const [roleTag, setRoleTag] = useState(editingSnippet?.roleTag || "")
  const [length, setLength] = useState<SnippetLength>(editingSnippet?.length || "medium")
  const [content, setContent] = useState(editingSnippet?.content || "")
  const [generating, setGenerating] = useState(false)

  const isEditing = !!editingSnippet

  const generate = async () => {
    if (!roleTag.trim()) {
      toast({ type: "error", title: "Enter a role tag first" })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          description: project.description,
          techStack: project.techStack,
          roleCategories: project.roleCategories,
          metrics: project.metrics,
          links: project.links,
          roleTag,
          length,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setContent(data.snippet)
      toast({ type: "success", title: "Snippet generated! Review and save." })
    } catch (e: any) {
      toast({ type: "error", title: e.message || "Generation failed" })
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    if (!roleTag.trim() || !content.trim()) {
      toast({ type: "error", title: "Role tag and content are required" })
      return
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/projects/${project.id}/snippets`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snippetId: editingSnippet!.id, roleTag, length, content }),
        })
        if (!res.ok) throw new Error("Failed to update")
      } else {
        const res = await fetch(`/api/projects/${project.id}/snippets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleTag, length, content, isAiGenerated: generating }),
        })
        if (!res.ok) throw new Error("Failed to save")
      }
      toast({ type: "success", title: isEditing ? "Snippet updated!" : "Snippet saved!" })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ type: "error", title: e.message || "Save failed" })
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div>
            <h3 className="font-bold text-foreground">
              {isEditing ? "Edit Snippet" : "Add Snippet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Role Tag */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Target Role <span className="text-rose-400">*</span>
            </label>
            <RoleTagInput value={roleTag} onChange={setRoleTag} />
            <p className="text-[10px] text-muted-foreground mt-1">e.g. &quot;Backend SDE Intern&quot;, &quot;Fullstack Developer&quot;</p>
          </div>

          {/* Length selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Length</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(SNIPPET_LENGTH_CONFIG) as [SnippetLength, typeof SNIPPET_LENGTH_CONFIG[SnippetLength]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLength(key)}
                  className={cn(
                    "rounded-xl border p-2.5 text-center transition-all",
                    length === key
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary/10 text-muted-foreground hover:bg-secondary/20"
                  )}
                >
                  <p className="text-xs font-semibold">{cfg.label}</p>
                  <p className="text-[10px] opacity-70">{cfg.words}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Generate */}
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 text-primary hover:from-primary/20 hover:to-violet-500/20 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating with AI…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate with AI</>
            )}
          </button>

          {/* Content textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description <span className="text-rose-400">*</span>
              </label>
              <span className={cn(
                "text-[10px] font-medium",
                wordCount > SNIPPET_LENGTH_CONFIG[length].maxWords ? "text-rose-400" : "text-muted-foreground/60"
              )}>
                {wordCount} / {SNIPPET_LENGTH_CONFIG[length].maxWords} words
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Write your tailored project description here, or use AI to generate one above…"
              className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-primary/20 transition-all"
          >
            <Save className="h-4 w-4" />
            {isEditing ? "Update Snippet" : "Save Snippet"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Form Modal (Add / Edit Project)
// ─────────────────────────────────────────────────────────────────────────────
interface ProjectFormProps {
  editProject?: Project | null
  onClose: () => void
  onSaved: () => void
}

function ProjectForm({ editProject, onClose, onSaved }: ProjectFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState(editProject?.name || "")
  const [description, setDescription] = useState(editProject?.description || "")
  const [techStack, setTechStack] = useState<string[]>(editProject?.techStack || [])
  const [roleCategories, setRoleCategories] = useState<string[]>(editProject?.roleCategories || [])
  const [metrics, setMetrics] = useState<string[]>(editProject?.metrics || [])
  const [github, setGithub] = useState(editProject?.links?.github || "")
  const [live, setLive] = useState(editProject?.links?.live || "")
  const [saving, setSaving] = useState(false)

  const isEditing = !!editProject

  const save = async () => {
    if (!name.trim()) {
      toast({ type: "error", title: "Project name is required" })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name,
        description,
        techStack,
        roleCategories,
        metrics,
        links: { github: github || null, live: live || null },
      }

      const url = isEditing ? `/api/projects/${editProject!.id}` : "/api/projects"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      toast({ type: "success", title: isEditing ? "Project updated!" : "Project added!" })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ type: "error", title: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="font-bold text-foreground">{isEditing ? "Edit Project" : "Add Project"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HireCompass Tracker"
              className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Master Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Master Description
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">
              Write the most complete description of your project. AI will use this full context to generate tailored snippets.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              placeholder="Describe what the project does, your role, key technical decisions, architecture, challenges solved…"
              className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Tech Stack
            </label>
            <TagInput tags={techStack} onChange={setTechStack} placeholder="Next.js, MongoDB, Groq…" />
          </div>

          {/* Role Categories */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Role Categories
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">Broad categories this project fits (helps with smart matching)</p>
            <TagInput tags={roleCategories} onChange={setRoleCategories} placeholder="fullstack, backend, frontend, ml…" />
          </div>

          {/* Metrics / Impact */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1.5">
              <BarChart2 className="h-3 w-3" /> Impact & Metrics
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">Key achievements — AI will weave these into generated snippets</p>
            <TagInput tags={metrics} onChange={setMetrics} placeholder="10k users, reduced latency 40%…" />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <Github className="h-3 w-3" /> GitHub
              </label>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/…"
                className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Live URL
              </label>
              <input
                value={live}
                onChange={(e) => setLive(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border/60">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? "Update Project" : "Save Project"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdited }: { project: Project; onEdited: () => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [showSnippetEditor, setShowSnippetEditor] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<ProjectSnippet | null>(null)
  const [showProjectEdit, setShowProjectEdit] = useState(false)

  const deleteProject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ type: "success", title: "Project deleted" })
    },
    onError: () => toast({ type: "error", title: "Failed to delete" }),
  })

  const deleteSnippet = async (snippetId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/snippets?snippetId=${snippetId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ type: "success", title: "Snippet deleted" })
    } catch {
      toast({ type: "error", title: "Failed to delete snippet" })
    }
  }

  const snippetCount = project.snippets?.length || 0

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-md overflow-hidden hover:border-primary/20 transition-all">
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20">
                <FolderGit2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{project.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {project.description || "No description yet."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowProjectEdit(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { if (confirm("Delete this project and all its snippets?")) deleteProject.mutate() }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tech stack chips */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.techStack.slice(0, 6).map((t) => (
                <span key={t} className="rounded-full bg-secondary/40 border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {t}
                </span>
              ))}
              {project.techStack.length > 6 && (
                <span className="text-[10px] text-muted-foreground">+{project.techStack.length - 6} more</span>
              )}
            </div>
          )}

          {/* Metrics */}
          {project.metrics && project.metrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.metrics.map((m) => (
                <span key={m} className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                  <BarChart2 className="h-2.5 w-2.5" />{m}
                </span>
              ))}
            </div>
          )}

          {/* Links */}
          {(project.links?.github || project.links?.live) && (
            <div className="flex items-center gap-3 mt-3">
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-3 w-3" /> GitHub
                </a>
              )}
              {project.links.live && (
                <a href={project.links.live} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" /> Live
                </a>
              )}
            </div>
          )}
        </div>

        {/* Snippets Section */}
        <div className="border-t border-border/40">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              {snippetCount} Snippet{snippetCount !== 1 ? "s" : ""}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-3">
              {project.snippets && project.snippets.length > 0 ? (
                project.snippets.map((s) => (
                  <SnippetCard
                    key={s.id}
                    snippet={s}
                    projectId={project.id}
                    onDelete={deleteSnippet}
                    onEdit={(snippet) => { setEditingSnippet(snippet); setShowSnippetEditor(true) }}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No snippets yet. Add your first tailored description below.
                </p>
              )}
              <button
                type="button"
                onClick={() => { setEditingSnippet(null); setShowSnippetEditor(true) }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 py-2.5 text-sm font-medium transition-all"
              >
                <Plus className="h-4 w-4" /> Add Snippet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSnippetEditor && (
        <SnippetEditor
          project={project}
          editingSnippet={editingSnippet}
          onClose={() => { setShowSnippetEditor(false); setEditingSnippet(null) }}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["projects"] }); onEdited() }}
        />
      )}
      {showProjectEdit && (
        <ProjectForm
          editProject={project}
          onClose={() => setShowProjectEdit(false)}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["projects"] }); onEdited() }}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
function ProjectVaultContent() {
  const queryClient = useQueryClient()
  const [showAddProject, setShowAddProject] = useState(false)

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const totalSnippets = projects?.reduce((sum, p) => sum + (p.snippets?.length || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-violet-900/20 via-card/40 to-primary/10 p-6 backdrop-blur-md">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderGit2 className="h-5 w-5 text-violet-400" />
              <h1 className="text-2xl font-bold tracking-tight">Project Vault</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Store your projects with full context. Create role-tailored snippets manually or with AI — then use them instantly in the Form Kit on any job.
            </p>
            {projects && projects.length > 0 && (
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">{projects.length}</span> project{projects.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">{totalSnippets}</span> snippet{totalSnippets !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Project
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-card/20 border border-border/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!projects || projects.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/10 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-primary/10 border border-violet-500/20 mb-4">
            <FolderGit2 className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="font-bold text-foreground mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Add your first project to start building a library of tailored snippets for your applications.
          </p>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Your First Project
          </button>
        </div>
      )}

      {/* Project cards */}
      {!isLoading && projects && projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdited={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
            />
          ))}
        </div>
      )}

      {/* Tip */}
      {!isLoading && projects && projects.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Pro tip:</span> The more complete your master description and metrics, the better AI-generated snippets will be.
            Open any job&apos;s detail drawer and switch to the{" "}
            <span className="text-primary font-medium">Form Kit</span> tab to get ranked, ready-to-paste snippets for that specific role.
          </p>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <ProjectForm
          onClose={() => setShowAddProject(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
        />
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <ToastProvider>
      <ProjectVaultContent />
    </ToastProvider>
  )
}
