"use client"

import React, { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Upload, Sparkles, Loader2, AlertCircle, CheckCircle2,
  X, Plus, Trash2, ChevronRight, FileSpreadsheet, FileText,
  FileUp, Users, Mail, Eye, EyeOff, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RecruiterRow } from "@/types/outreach"
import { CVDocument } from "@/types/outreach"

type Stage = "upload" | "extracting" | "preview" | "configuring" | "creating"

const FIELD_LABELS: Record<keyof Omit<RecruiterRow, "id" | "emailValid" | "isDuplicate">, string> = {
  recruiterName: "Recruiter Name",
  recruiterEmail: "Recruiter Email",
  recruiterRole: "Recruiter Role",
  companyName: "Company Name",
  companyDescription: "Company Description",
  industry: "Industry",
  productsServices: "Products / Services",
  techStack: "Tech Stack",
  hiringRequirements: "Hiring Requirements",
  additionalNotes: "Additional Notes",
}

export default function OutreachUploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>("upload")
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [records, setRecords] = useState<RecruiterRow[]>([])
  const [extractStats, setExtractStats] = useState<any>(null)
  const [error, setError] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [selectedCvId, setSelectedCvId] = useState<string>("")
  const [dailyLimit, setDailyLimit] = useState(20)
  const [showSkipped, setShowSkipped] = useState(false)
  const [creating, setCreating] = useState(false)

  // Load user CVs
  const { data: cvList = [] } = useQuery<CVDocument[]>({
    queryKey: ["documents"],
    queryFn: () => fetch("/api/documents").then((r) => r.json()),
  })

  const processFile = useCallback(async (f: File) => {
    setFile(f)
    setStage("extracting")
    setError("")

    try {
      let content: string
      let fileType: string

      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        fileType = "xlsx"
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve((e.target?.result as string).split(",")[1])
          reader.readAsDataURL(f)
        })
      } else if (f.name.endsWith(".csv")) {
        fileType = "csv"
        content = await f.text()
      } else {
        fileType = "text"
        content = await f.text()
      }

      const res = await fetch("/api/outreach/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileType }),
      })

      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || "Extraction failed")
      }

      const data = await res.json()
      setRecords(data.records)
      setExtractStats(data.stats)
      setCampaignName(f.name.replace(/\.[^.]+$/, "") + " Campaign")
      setStage("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed")
      setStage("upload")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  const handleRemoveRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) { setError("Please enter a campaign name"); return }
    const validRecords = records.filter((r) => r.emailValid && !r.isDuplicate)
    if (validRecords.length === 0) { setError("No valid records to send to"); return }

    setCreating(true)
    try {
      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          recruiters: validRecords,
          attachedCvId: selectedCvId || null,
          dailyLimit,
          delaySeconds: 30,
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error || "Failed")
      const campaign = await res.json()
      router.push(`/outreach/campaign/${campaign.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign")
      setCreating(false)
    }
  }

  const validCount = records.filter((r) => r.emailValid && !r.isDuplicate).length
  const skippedCount = records.filter((r) => !r.emailValid || r.isDuplicate).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Outreach</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-slate-700">Upload Recruiters</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Outreach Campaign</h2>
        <p className="text-sm text-slate-500">
          Upload a CSV, Excel, or text file with recruiter & company information. AI will extract and validate everything.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { key: "upload",      label: "Upload" },
          { key: "preview",     label: "Review Data" },
          { key: "configuring", label: "Configure" },
        ].map((s, i) => {
          const stageOrder: Record<string, number> = { upload: 0, extracting: 0, preview: 1, configuring: 2, creating: 2 }
          const current = stageOrder[stage] ?? 0
          const isDone = stageOrder[s.key] < current
          const isActive = stageOrder[s.key] === current
          return (
            <React.Fragment key={s.key}>
              <div className={cn(
                "flex items-center gap-1.5 font-semibold",
                isActive ? "text-indigo-600" : isDone ? "text-emerald-600" : "text-slate-400"
              )}>
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                  isActive ? "bg-indigo-600 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {isDone ? "✓" : i + 1}
                </div>
                {s.label}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Stage: Upload ── */}
      {(stage === "upload") && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "rounded-2xl border-2 border-dashed p-12 text-center flex flex-col items-center cursor-pointer transition-all duration-200 group",
              dragging
                ? "border-indigo-400 bg-indigo-50 scale-[1.01] shadow-lg"
                : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl mb-4 transition-all",
              dragging ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-indigo-100"
            )}>
              <FileUp className={cn("h-8 w-8 transition-colors", dragging ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">
              {dragging ? "Drop your file here" : "Upload Recruiter Data"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-4">
              Drag and drop a CSV, Excel (.xlsx), or plain text file. AI will extract and structure all recruiter information.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {[
                { icon: FileSpreadsheet, label: "CSV", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                { icon: FileSpreadsheet, label: "XLSX", color: "text-blue-600 bg-blue-50 border-blue-200" },
                { icon: FileText, label: "TXT", color: "text-slate-600 bg-slate-50 border-slate-200" },
              ].map((f) => (
                <span key={f.label} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold", f.color)}>
                  <f.icon className="h-3.5 w-3.5" /> {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Sample format hint */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-600 mb-2">Expected columns (any order, AI handles variations):</p>
            <div className="flex flex-wrap gap-1.5">
              {["Recruiter Name", "Recruiter Email", "Company", "Role", "Description", "Industry", "Tech Stack"].map((c) => (
                <span key={c} className="rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-[10px] font-semibold">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stage: Extracting ── */}
      {stage === "extracting" && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900">AI is processing your file...</h3>
          <p className="text-sm text-slate-500">
            Extracting recruiter information, validating emails, removing duplicates.
          </p>
          {file && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {file.name}
            </p>
          )}
        </div>
      )}

      {/* ── Stage: Preview ── */}
      {stage === "preview" && (
        <div className="space-y-4">
          {/* Extraction stats */}
          {extractStats && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Rows", value: extractStats.total, color: "text-slate-700" },
                { label: "Valid Emails", value: extractStats.valid, color: "text-emerald-600" },
                { label: "Duplicates", value: extractStats.duplicates, color: "text-amber-600" },
                { label: "Missing Email", value: extractStats.missingEmail, color: "text-slate-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Valid records table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-sm text-slate-800">
                  Ready to Send ({validCount})
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {records
                .filter((r) => r.emailValid && !r.isDuplicate)
                .map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 group transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold">
                      {(r.companyName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">{r.companyName}</span>
                        {r.industry && (
                          <span className="text-[10px] rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 font-medium shrink-0">{r.industry}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {r.recruiterName && <span>{r.recruiterName} · </span>}
                        <span className="font-medium text-slate-600">{r.recruiterEmail}</span>
                      </div>
                    </div>
                    {r.techStack && r.techStack.length > 0 && (
                      <div className="hidden md:flex gap-1 shrink-0">
                        {r.techStack.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5 font-medium">{t}</span>
                        ))}
                        {r.techStack.length > 2 && <span className="text-[10px] text-slate-400">+{r.techStack.length - 2}</span>}
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveRecord(r.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Skipped records */}
          {skippedCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <button
                onClick={() => setShowSkipped(!showSkipped)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm"
              >
                <span className="font-semibold text-amber-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {skippedCount} records skipped (invalid/duplicate emails)
                </span>
                <ChevronDown className={cn("h-4 w-4 text-amber-500 transition-transform", showSkipped && "rotate-180")} />
              </button>
              {showSkipped && (
                <div className="border-t border-amber-200 divide-y divide-amber-100">
                  {records.filter((r) => !r.emailValid || r.isDuplicate).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-xs text-amber-700">
                      <span className="font-medium truncate">{r.companyName}</span>
                      <span className="text-amber-500">{r.recruiterEmail || "(no email)"}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-bold">
                        {r.isDuplicate ? "Duplicate" : "Invalid Email"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => { setStage("upload"); setFile(null); setRecords([]) }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              ← Upload different file
            </button>
            <button
              onClick={() => setStage("configuring")}
              disabled={validCount === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 hover:-translate-y-px transition-all duration-200"
            >
              Configure Campaign <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Stage: Configure ── */}
      {stage === "configuring" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900">Campaign Settings</h3>

            {/* Campaign name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Campaign Name</label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* CV selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Attach Resume / CV <span className="font-normal text-slate-400">(recommended)</span>
              </label>
              {cvList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">No CVs uploaded yet.</p>
                  <a href="/documents" className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block">
                    Upload a CV in Documents →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCvId("")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      !selectedCvId
                        ? "border-indigo-300 bg-indigo-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <X className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">No Attachment</p>
                      <p className="text-[10px] text-slate-400">Send without CV</p>
                    </div>
                  </button>
                  {cvList.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => setSelectedCvId(cv.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        selectedCvId === cv.id
                          ? "border-indigo-300 bg-indigo-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{cv.name}</p>
                        <p className="text-[10px] text-slate-400">{cv.targetRole || cv.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Daily limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Daily Sending Limit <span className="font-normal text-slate-400">(min 20)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={20} max={100} step={5}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-sm font-bold text-indigo-600 w-16 text-right">{dailyLimit}/day</span>
              </div>
              <p className="text-[11px] text-slate-400">30 second delay between sends to avoid spam filters.</p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-black text-indigo-700">{validCount}</p>
                <p className="text-[10px] text-indigo-500 font-medium">Recruiters</p>
              </div>
              <div>
                <p className="text-lg font-black text-indigo-700">{selectedCvId ? "Yes" : "No"}</p>
                <p className="text-[10px] text-indigo-500 font-medium">CV Attached</p>
              </div>
              <div>
                <p className="text-lg font-black text-indigo-700">{dailyLimit}</p>
                <p className="text-[10px] text-indigo-500 font-medium">Per Day</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStage("preview")}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              ← Back to Preview
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={creating || !campaignName.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 hover:-translate-y-px transition-all duration-200"
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Create Campaign & Generate Emails</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
