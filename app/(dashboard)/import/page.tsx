"use client"

import React, { useState, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Wand2, Link2, Loader2, Sparkles, AlertCircle,
  Save, ExternalLink, X, Info, FileText, ClipboardPaste
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import { RateLimitBanner } from "@/components/ui/rate-limit-banner"

const PLATFORM_BADGES = [
  { label: "LinkedIn",      color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { label: "Internshala",   color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { label: "Glassdoor",     color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { label: "AngelList",     color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { label: "Company Sites", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { label: "Any Text",      color: "bg-primary/10 text-primary border-primary/20" },
]

interface ExtractedJob {
  company: string; role: string; location: string; type: string; salary: string
  deadline: string; link: string; skills: string[]; description: string; confidence: number
}

const DEFAULT_EXTRACTED: ExtractedJob = {
  company: "", role: "", location: "", type: "", salary: "",
  deadline: "", link: "", skills: [], description: "", confidence: 0,
}

type InputMode = "url" | "paste"

function ImportPageInner() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Input state
  const [mode, setMode] = useState<InputMode>("url")
  const [url, setUrl] = useState("")
  const [pastedText, setPastedText] = useState("")
  const [urlFocused, setUrlFocused] = useState(false)
  const [textFocused, setTextFocused] = useState(false)

  // Processing state
  const [stage, setStage] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [rawContent, setRawContent] = useState("")
  const [streamedText, setStreamedText] = useState("")
  const [extracted, setExtracted] = useState<ExtractedJob>(DEFAULT_EXTRACTED)
  const [editedJob, setEditedJob] = useState<ExtractedJob>(DEFAULT_EXTRACTED)
  const [errorMessage, setErrorMessage] = useState("")
  const [rateLimitInfo, setRateLimitInfo] = useState<{ message: string; retryAfter: number | null } | null>(null)

  // Misc state
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [credits, setCredits] = useState(250)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
    setCredits(parseInt(localStorage.getItem("importCredits") || "250", 10))
  }, [])

  const abortRef = useRef<AbortController | null>(null)

  /** Shared stream handler — works for both URL and paste modes */
  const processStream = useCallback(async (apiPath: string, body: object) => {
    if (credits <= 0) {
      toast({ type: "error", title: "No credits left", message: "You've used all 250 free import credits." })
      return
    }

    setStage("loading")
    setRawContent("")
    setStreamedText("")
    setExtracted(DEFAULT_EXTRACTED)
    setEditedJob(DEFAULT_EXTRACTED)
    setErrorMessage("")
    setRateLimitInfo(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Import failed")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let gotRaw = false
      let aiBuffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        if (!gotRaw) {
          const splitIdx = buffer.indexOf("\n__AI_START__\n")
          if (splitIdx !== -1) {
            const rawJson = buffer.slice(0, splitIdx)
            buffer = buffer.slice(splitIdx + "\n__AI_START__\n".length)
            gotRaw = true
            try {
              const { rawContent: rc } = JSON.parse(rawJson)
              setRawContent(rc)
            } catch {}
          }
        }

        if (gotRaw) {
          aiBuffer += buffer
          buffer = ""
          setStreamedText(aiBuffer)

          // Check for error sentinel
          if (aiBuffer.startsWith("__ERROR__:")) {
            const errMsg = aiBuffer.replace("__ERROR__:", "")
            // Detect rate limit errors from the stream
            if (errMsg.toLowerCase().includes("rate limit") || errMsg.toLowerCase().includes("quota") || errMsg.includes("429")) {
              const retryMatch = errMsg.match(/(\d+)\s*second/i)
              setRateLimitInfo({ message: errMsg, retryAfter: retryMatch ? parseInt(retryMatch[1]) : null })
            }
            throw new Error(errMsg)
          }

          // Incrementally parse JSON
          if (aiBuffer.includes("{") && aiBuffer.includes("}")) {
            try {
              const cleaned = aiBuffer
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim()
              const firstBrace = cleaned.indexOf("{")
              const lastBrace = cleaned.lastIndexOf("}")
              if (firstBrace !== -1 && lastBrace !== -1) {
                const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as ExtractedJob
                setExtracted(parsed)
                setEditedJob(parsed)
              }
            } catch {}
          }
        }
      }

      setStage("done")
      const newCredits = Math.max(0, credits - 1)
      setCredits(newCredits)
      localStorage.setItem("importCredits", String(newCredits))
    } catch (err) {
      if ((err as any)?.name === "AbortError") return
      const msg = err instanceof Error ? err.message : "Could not process the job description."
      setErrorMessage(msg)
      setStage("error")
      toast({ type: "error", title: "Import failed", message: msg })
    }
  }, [credits, toast])

  const handleUrlImport = useCallback(() => {
    if (!url.trim()) return
    processStream("/api/import/url", { url: url.trim() })
  }, [url, processStream])

  const handlePasteImport = useCallback(() => {
    if (pastedText.trim().length < 50) {
      toast({ type: "error", title: "Too short", message: "Please paste at least a few sentences of the job description." })
      return
    }
    processStream("/api/import/text", { text: pastedText.trim() })
  }, [pastedText, processStream, toast])

  const handleSave = async () => {
    if (!editedJob.company || !editedJob.role) {
      toast({ type: "error", title: "Company and role are required" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: editedJob.company,
          title: editedJob.role,
          location: editedJob.location,
          employmentType: mapType(editedJob.type),
          salary: editedJob.salary,
          deadline: editedJob.deadline || undefined,
          url: editedJob.link || (mode === "url" ? url : undefined),
          skills: editedJob.skills,
          notes: editedJob.description,
          status: "SAVED",
          priority: "MEDIUM",
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({ type: "success", title: "Job saved!", message: `${editedJob.company} added to your pipeline.` })
      router.push("/applications")
    } catch {
      toast({ type: "error", title: "Save failed", message: "Could not save the job. Try again." })
    } finally {
      setSaving(false)
    }
  }

  const mapType = (t: string) => {
    if (!t) return "FULL_TIME"
    const l = t.toLowerCase()
    if (l.includes("intern")) return "INTERNSHIP"
    if (l.includes("contract")) return "CONTRACT"
    if (l.includes("part")) return "PART_TIME"
    return "FULL_TIME"
  }

    const newResetFn = mode === "url" ? handleUrlImport : handlePasteImport

  const resetAll = () => {
    setStage("idle")
    setUrl("")
    setPastedText("")
    setExtracted(DEFAULT_EXTRACTED)
    setEditedJob(DEFAULT_EXTRACTED)
    setErrorMessage("")
    setRateLimitInfo(null)
  }

  const confidenceColor =
    extracted.confidence >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : extracted.confidence >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20"

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Wand2 className="h-3.5 w-3.5" />
          Powered by Gemini 2.0 Flash
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Import Job Opportunity
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Paste a URL or the job description text — AI extracts all details for you instantly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Works with:</span>
          {PLATFORM_BADGES.map((p) => (
            <span key={p.label} className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", p.color)}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tab switcher + Input */}
      <div className="max-w-2xl mx-auto space-y-3">

        {/* Tabs */}
        <div className="flex items-center rounded-2xl border border-border bg-card/40 backdrop-blur-md p-1.5 gap-1.5">
          <button
            onClick={() => { setMode("url"); resetAll() }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              mode === "url"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2 className="h-4 w-4" />
            Import from URL
          </button>
          <button
            onClick={() => { setMode("paste"); resetAll() }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              mode === "paste"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste Job Description
          </button>
        </div>

        {/* URL mode */}
        {mode === "url" && (
          <div className={cn(
            "flex items-center gap-2 rounded-2xl border-2 bg-card/60 backdrop-blur-md p-2 transition-all duration-300",
            urlFocused ? "border-primary shadow-lg shadow-primary/10" : "border-border"
          )}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ml-1">
              <Link2 className="h-5 w-5" />
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
              placeholder="https://linkedin.com/jobs/view/... or any job posting URL"
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none px-2"
            />
            {url && (
              <button onClick={resetAll} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleUrlImport}
              disabled={!url.trim() || stage === "loading"}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {stage === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Extract</>
              )}
            </button>
          </div>
        )}

        {/* Paste mode */}
        {mode === "paste" && (
          <div className="space-y-2">
            <div className={cn(
              "rounded-2xl border-2 bg-card/60 backdrop-blur-md transition-all duration-300 overflow-hidden",
              textFocused ? "border-primary shadow-lg shadow-primary/10" : "border-border"
            )}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/10">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Paste the full job description below</span>
                {pastedText && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {pastedText.length} chars
                  </span>
                )}
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                onFocus={() => setTextFocused(true)}
                onBlur={() => setTextFocused(false)}
                rows={8}
                placeholder={`Paste the complete job description here...

Example:
  Company: Google
  Role: Software Engineering Intern
  Location: Mountain View, CA
  
  About the role:
  We are looking for a talented engineer who...
  
  Requirements:
  - Python, algorithms, data structures
  - ...`}
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none resize-none leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Works even if the job site blocks URL access. Paste the full text from the page.
              </p>
              <button
                onClick={handlePasteImport}
                disabled={pastedText.trim().length < 50 || stage === "loading"}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {stage === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Extract with AI</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Credits */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          AI Credits: <span className={cn("font-semibold", credits < 50 ? "text-rose-400" : "text-primary")}>{mounted ? credits : 250}</span> of 250 remaining
        </div>
      </div>

      {/* Loading animation */}
      {stage === "loading" && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "paste"
              ? "AI is reading your job description..."
              : rawContent ? "AI is extracting job details..." : "Fetching job page..."}
          </p>
          {streamedText && (
            <pre className="text-left text-xs text-muted-foreground bg-secondary/20 rounded-xl p-3 overflow-hidden max-h-28 font-mono">
              {streamedText.slice(-300)}
            </pre>
          )}
        </div>
      )}

      {/* Error state — rate limit vs. regular error */}
      {stage === "error" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {rateLimitInfo ? (
            /* Rate limit / quota exceeded — show countdown banner */
            <RateLimitBanner
              message={rateLimitInfo.message}
              retryAfter={rateLimitInfo.retryAfter}
              onRetry={() => {
                resetAll()
                // Re-trigger based on current mode input
                if (mode === "url" && url.trim()) setTimeout(handleUrlImport, 100)
                if (mode === "paste" && pastedText.trim().length >= 50) setTimeout(handlePasteImport, 100)
              }}
            />
          ) : (
            /* Generic error */
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Import Failed</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {errorMessage || "Something went wrong."}
              </p>
              {mode === "url" && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 text-left">
                  <p className="font-semibold mb-1">💡 Try Paste Mode instead</p>
                  <p>Many job sites (LinkedIn, Glassdoor) block automated fetching. Switch to the <strong>&quot;Paste Job Description&quot;</strong> tab, copy the text from the page, and paste it here — AI works the same way!</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetAll}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                  Try Again
                </button>
                {mode === "url" && (
                  <button
                    onClick={() => { setMode("paste"); resetAll() }}
                    className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
                  >
                    <ClipboardPaste className="h-4 w-4" /> Switch to Paste Mode
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Split panel result — shared by both modes */}
      {stage === "done" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Source content */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
              {mode === "url" ? (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <h2 className="font-semibold text-sm text-foreground">
                {mode === "url" ? "Fetched Job Content" : "Pasted Job Description"}
              </h2>
            </div>
            <div className="flex-1 p-5 overflow-y-auto max-h-[500px]">
              <pre className="text-xs text-muted-foreground font-sans whitespace-pre-wrap leading-relaxed">
                {rawContent || (mode === "paste" ? pastedText.slice(0, 2000) : "Content extracted from the job page.")}
              </pre>
            </div>
          </div>

          {/* RIGHT: AI Extracted Fields */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm text-foreground">AI Extracted Details</h2>
              </div>
              {extracted.confidence > 0 && (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold", confidenceColor)}>
                  {extracted.confidence}% confidence
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[
                { key: "company",  label: "Company Name",          placeholder: "e.g. Google" },
                { key: "role",     label: "Job Title",             placeholder: "e.g. Software Engineer" },
                { key: "location", label: "Location",              placeholder: "e.g. San Francisco, CA" },
                { key: "type",     label: "Employment Type",       placeholder: "Full-time / Internship" },
                { key: "salary",   label: "Salary / Stipend",      placeholder: "e.g. $120k or ₹30,000/mo" },
                { key: "deadline", label: "Application Deadline",  placeholder: "YYYY-MM-DD" },
                { key: "link",     label: "Application Link",      placeholder: "https://..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5 text-primary" />
                    {label}
                  </label>
                  <input
                    value={(editedJob as any)[key] || ""}
                    onChange={(e) => setEditedJob((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={cn(
                      "w-full rounded-xl border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
                      (editedJob as any)[key] ? "border-primary/30" : "border-border"
                    )}
                  />
                </div>
              ))}

              {/* Skills */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  Skills Required
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editedJob.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                      {s}
                      <button onClick={() => setEditedJob((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && skillInput.trim()) {
                        e.preventDefault()
                        setEditedJob((p) => ({ ...p, skills: [...p.skills, skillInput.trim()] }))
                        setSkillInput("")
                      }
                    }}
                    placeholder="Add skill..."
                    className="w-24 rounded-lg border border-dashed border-border bg-transparent px-2 py-0.5 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* AI Summary */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  AI Summary
                </label>
                <textarea
                  value={editedJob.description}
                  onChange={(e) => setEditedJob((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="px-5 py-4 border-t border-border/40 flex gap-3">
              <button
                onClick={resetAll}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editedJob.company || !editedJob.role}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Opportunity</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImportPage() {
  return (
    <ToastProvider>
      <ImportPageInner />
    </ToastProvider>
  )
}
