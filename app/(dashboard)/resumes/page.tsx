"use client"

import React, { useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileText, Upload, Plus, Download, Trash2, Link as LinkIcon,
  Loader2, X, CheckCircle2, AlertCircle, Edit2, Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CVDocument, DocumentType } from "@/types/outreach"

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string; color: string }[] = [
  { value: "RESUME",       label: "Resume",       color: "bg-indigo-100 text-indigo-700" },
  { value: "COVER_LETTER", label: "Cover Letter", color: "bg-violet-100 text-violet-700" },
  { value: "PORTFOLIO",    label: "Portfolio",    color: "bg-cyan-100 text-cyan-700" },
  { value: "TRANSCRIPT",   label: "Transcript",   color: "bg-amber-100 text-amber-700" },
  { value: "OTHER",        label: "Other",        color: "bg-slate-100 text-slate-600" },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function typeConfig(type: DocumentType) {
  return DOC_TYPE_OPTIONS.find((t) => t.value === type) ?? DOC_TYPE_OPTIONS[4]
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }, [onUpload])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center",
        "cursor-pointer transition-all duration-200 group",
        dragging
          ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
          : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
      />
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-all duration-200",
        dragging ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500"
      )}>
        <Upload className="h-6 w-6" />
      </div>
      <h4 className="font-semibold text-sm text-slate-800 mb-1">
        {dragging ? "Drop to upload" : "Upload resume"}
      </h4>
      <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
        Drag and drop a PDF or DOCX file here, or click to browse. Max 10MB.
      </p>
    </div>
  )
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({
  file,
  onClose,
  onConfirm,
  uploading,
}: {
  file: File
  onClose: () => void
  onConfirm: (type: DocumentType, targetRole: string) => void
  uploading: boolean
}) {
  const [docType, setDocType] = useState<DocumentType>("RESUME")
  const [targetRole, setTargetRole] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Upload Resume</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File info */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
        </div>

        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Resume Type</label>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setDocType(t.value)}
                className={cn(
                  "rounded-xl border py-2 text-xs font-semibold transition-all",
                  docType === t.value
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target role */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Target Role <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. SWE Intern, Product Manager"
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(docType, targetRole)}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all hover:shadow-indigo-500/40 hover:-translate-y-px"
          >
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Document Card ─────────────────────────────────────────────────────────────
function DocumentCard({
  doc,
  onDelete,
}: {
  doc: CVDocument
  onDelete: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const cfg = typeConfig(doc.type)

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      const data = await res.json()
      if (!data.data) return

      const byteChars = atob(data.data)
      const byteArr = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArr], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = doc.name; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Download failed", e)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.name}"?`)) return
    setDeleting(true)
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
    onDelete()
  }

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
            {cfg.label}
          </span>
        </div>

        <h4 className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors mb-1">
          {doc.name}
        </h4>

        {doc.targetRole && (
          <p className="text-xs text-indigo-600 font-medium mb-1">
            🎯 {doc.targetRole}
          </p>
        )}

        <p className="text-[10px] text-slate-400">
          {formatBytes(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResumesPage() {
  const qc = useQueryClient()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const { data: docs = [], isLoading } = useQuery<CVDocument[]>({
    queryKey: ["documents"],
    queryFn: () => fetch("/api/documents").then((r) => r.json()),
  })

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File too large. Max 10MB.")
      return
    }
    setPendingFile(file)
  }

  const handleUploadConfirm = async (type: DocumentType, targetRole: string) => {
    if (!pendingFile) return
    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1]
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingFile.name,
            type,
            targetRole: targetRole || null,
            mimeType: pendingFile.type || "application/pdf",
            data: base64,
            sizeBytes: pendingFile.size,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          showToast("error", err.error || "Upload failed")
        } else {
          showToast("success", `"${pendingFile.name}" uploaded successfully!`)
          qc.invalidateQueries({ queryKey: ["documents"] })
        }
        setUploading(false)
        setPendingFile(null)
      }
      reader.readAsDataURL(pendingFile)
    } catch (e) {
      showToast("error", "Upload failed. Please try again.")
      setUploading(false)
    }
  }

  const resumes = docs.filter((d) => d.type === "RESUME")
  const others = docs.filter((d) => d.type !== "RESUME")

  return (
    <div className="space-y-6 max-w-6xl animate-slide-up">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold animate-slide-up",
          toast.type === "success"
            ? "bg-emerald-500 text-white"
            : "bg-rose-500 text-white"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Upload modal */}
      {pendingFile && (
        <UploadModal
          file={pendingFile}
          onClose={() => setPendingFile(null)}
          onConfirm={handleUploadConfirm}
          uploading={uploading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Resumes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Store multiple resume variants. Attach them to outreach campaigns.
          </p>
        </div>
        <button
          onClick={() => document.getElementById("doc-upload-input")?.click()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Add Resume
        </button>
        <input
          id="doc-upload-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
        />
      </div>

      {/* Upload Zone */}
      <UploadZone onUpload={handleFileSelect} />

      {/* Stats */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Resumes", value: docs.length, color: "stat-indigo" },
            { label: "Resumes", value: resumes.length, color: "stat-violet" },
            { label: "Other Files", value: others.length, color: "stat-emerald" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl text-white p-4 shadow-md", s.color)}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-semibold opacity-90 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl skeleton" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && docs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No resumes yet</h3>
          <p className="text-sm text-slate-500">Upload your first resume to get started with outreach campaigns.</p>
        </div>
      )}

      {/* Documents grid */}
      {docs.length > 0 && (
        <div className="space-y-6">
          {resumes.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Resumes ({resumes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onDelete={() => qc.invalidateQueries({ queryKey: ["documents"] })}
                  />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Other Resumes ({others.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onDelete={() => qc.invalidateQueries({ queryKey: ["documents"] })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
