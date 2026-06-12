"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Sparkles, RefreshCw, Copy, CheckCircle2, Download, Send,
  ChevronDown, Loader2, Brain, Target, Zap, User2, Edit2,
  ClipboardList, X, Check, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Opportunity } from "@/types/opportunity"
import { CompanyAvatar } from "@/components/ui/badge"
import { MatchScoreRing } from "@/components/features/assistant/match-score-ring"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { RateLimitBanner } from "@/components/ui/rate-limit-banner"

// Default user profile — editable in the page
const DEFAULT_PROFILE = {
  name: "Job Hunter",
  skills: ["React", "TypeScript", "Next.js", "Node.js", "Python", "SQL"],
  projects: [
    { name: "Portfolio Website", tech: ["Next.js", "TypeScript"], description: "Personal portfolio with blog" },
    { name: "Task Manager App", tech: ["React", "Node.js", "MongoDB"], description: "Full-stack task management" },
  ],
  education: { degree: "B.Tech Computer Science", college: "IIT/NIT/BITS", year: "2025" },
  experience: "1 year internship experience in web development",
}

type Tone = "Professional" | "Casual" | "Enthusiastic"

const MOCK_JOBS: Opportunity[] = [
  { id: "m1", userId: "", company: "Stripe", title: "Software Engineering Intern", status: "SAVED", priority: "HIGH", skills: ["React", "TypeScript", "Node.js", "APIs"], createdAt: "" },
  { id: "m2", userId: "", company: "Google", title: "SWE Intern", status: "SAVED", priority: "HIGH", skills: ["Python", "Algorithms", "System Design"], createdAt: "" },
  { id: "m3", userId: "", company: "Vercel", title: "Frontend Engineer", status: "SAVED", priority: "MEDIUM", skills: ["React", "Next.js", "TypeScript", "CSS"], createdAt: "" },
]

function parseEmailTags(text: string) {
  const emailMatch = text.match(/<EMAIL>([\s\S]*?)<\/EMAIL>/i)
  const tipsMatch = text.match(/<TIPS>([\s\S]*?)<\/TIPS>/i)
  const coverMatch = text.match(/<COVER>([\s\S]*?)<\/COVER>/i)

  let subject = ""
  let body = ""
  if (emailMatch) {
    const content = emailMatch[1].trim()
    const subjectMatch = content.match(/^Subject:\s*(.+)$/mi)
    subject = subjectMatch ? subjectMatch[1].trim() : ""
    body = content.replace(/^Subject:.*$/mi, "").trim()
  }

  let tips: string[] = []
  if (tipsMatch) {
    try { tips = JSON.parse(tipsMatch[1].trim()) } catch {}
  }

  return { subject, body, tips, cover: coverMatch ? coverMatch[1].trim() : "" }
}

function AssistantInner() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null)
  const [showJobPicker, setShowJobPicker] = useState(false)
  const [tone, setTone] = useState<Tone>("Professional")
  const [emailBody, setEmailBody] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [tips, setTips] = useState<string[]>([])
  const [streamingEmail, setStreamingEmail] = useState(false)
  const [streamingCover, setStreamingCover] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedCover, setCopiedCover] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const [loadingMatch, setLoadingMatch] = useState(false)
  const [matchRateLimit, setMatchRateLimit] = useState<{ message: string; retryAfter: number | null } | null>(null)
  const [userProfile] = useState(DEFAULT_PROFILE)
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  // Fetch real opportunities
  const { data: apiJobs } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities")
      if (!res.ok) return []
      return res.json()
    },
  })
  const jobs = (apiJobs && apiJobs.length > 0) ? apiJobs : MOCK_JOBS

  // Auto-select first job
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) setSelectedJob(jobs[0])
  }, [jobs, selectedJob])

  const streamGeneration = async (type: "email" | "cover") => {
    if (!selectedJob) return
    if (type === "email") { setStreamingEmail(true); setEmailBody(""); setEmailSubject(""); setTips([]) }
    else { setStreamingCover(true); setCoverLetter("") }

    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: {
            company: selectedJob.company,
            title: selectedJob.title,
            skills: selectedJob.skills || [],
            description: selectedJob.notes || "",
          },
          userProfile,
          templateType: tone,
          type,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Generation failed")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })

        // Parse incrementally
        const parsed = parseEmailTags(full)
        if (type === "email") {
          if (parsed.subject) setEmailSubject(parsed.subject)
          setEmailBody(parsed.body || full.replace(/<[^>]*>/g, ""))
          if (parsed.tips.length > 0) setTips(parsed.tips)
        } else {
          setCoverLetter(parsed.cover || full.replace(/<[^>]*>/g, ""))
        }
      }
    } catch (err) {
      toast({
        type: "error",
        title: "Generation failed",
        message: err instanceof Error ? err.message : "Could not generate content.",
      })
    } finally {
      if (type === "email") setStreamingEmail(false)
      else setStreamingCover(false)
    }
  }

  const checkFit = async () => {
    if (!selectedJob) return
    setLoadingMatch(true)
    setMatchRateLimit(null)
    try {
      const res = await fetch("/api/ai/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { skills: selectedJob.skills || [], description: selectedJob.notes || "", title: selectedJob.title, company: selectedJob.company },
          user: userProfile,
          jobId: selectedJob.id,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setMatchRateLimit({ message: data.error, retryAfter: data.retryAfter ?? null })
        return
      }
      if (!res.ok) throw new Error(data.error || "Match score failed")
      setMatchResult(data)
    } catch (err) {
      toast({ type: "error", title: "Match check failed", message: err instanceof Error ? err.message : "Try again" })
    } finally {
      setLoadingMatch(false)
    }
  }

  const copyToClipboard = (text: string, type: "email" | "cover") => {
    navigator.clipboard.writeText(text)
    if (type === "email") { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000) }
    else { setCopiedCover(true); setTimeout(() => setCopiedCover(false), 2000) }
    toast({ type: "success", title: "Copied to clipboard!" })
  }

  const wordCount = emailBody.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">AI Application Assistant</h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
              Gemini AI
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Generate personalized emails, cover letters, and match analysis</p>
        </div>
      </div>

      {/* Context bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-border/60 bg-card/30 backdrop-blur-md px-5 py-3.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Applying to:</span>
        {selectedJob ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <CompanyAvatar company={selectedJob.company} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">{selectedJob.company}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedJob.title}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No job selected</span>
        )}
        <button
          onClick={() => setShowJobPicker(true)}
          className="shrink-0 rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
        >
          Change Job
        </button>
        <button
          onClick={checkFit}
          disabled={loadingMatch || !selectedJob}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loadingMatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
          Check Fit
        </button>
      </div>

      {/* Job picker modal */}
      {showJobPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJobPicker(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/95 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Select Job</h3>
              <button onClick={() => setShowJobPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJob(job); setShowJobPicker(false); setEmailBody(""); setCoverLetter(""); setMatchResult(null) }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    selectedJob?.id === job.id ? "border-primary/50 bg-primary/10" : "border-border hover:bg-secondary/20"
                  )}
                >
                  <CompanyAvatar company={job.company} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{job.company}</p>
                    <p className="text-xs text-muted-foreground">{job.title}</p>
                  </div>
                  {selectedJob?.id === job.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Email generator (2/3 width) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cold Email */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-foreground">Cold Email</h2>
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Tone selector */}
                <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/20 p-0.5">
                  {(["Professional", "Casual", "Enthusiastic"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                        tone === t ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => streamGeneration("email")}
                  disabled={streamingEmail || !selectedJob}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {streamingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {emailBody ? "Regenerate" : "Generate"}
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* To / Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">To</label>
                  <input placeholder="recruiter@company.com" className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Subject</label>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Application for [Role] at [Company]"
                    className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Email body */}
              <div className="relative">
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  placeholder={streamingEmail ? "✨ Generating email..." : "Click Generate to create a personalized cold email..."}
                  className={cn(
                    "w-full rounded-xl border bg-secondary/10 px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                    streamingEmail ? "border-primary/30 animate-pulse" : "border-border/60"
                  )}
                />
                {emailBody && (
                  <button
                    onClick={() => copyToClipboard(emailBody, "email")}
                    className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                  >
                    {copiedEmail ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedEmail ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-400" />
                <h2 className="font-semibold text-foreground">Cover Letter</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => streamGeneration("cover")}
                  disabled={streamingCover || !selectedJob}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 disabled:opacity-50 transition-all"
                >
                  {streamingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {coverLetter ? "Regenerate" : "Generate"}
                </button>
              </div>
            </div>
            <div className="p-5 relative">
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={10}
                placeholder={streamingCover ? "✨ Drafting cover letter..." : "Generate a personalized cover letter..."}
                className={cn(
                  "w-full rounded-xl border bg-secondary/10 px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20",
                  streamingCover ? "border-primary/30 animate-pulse" : "border-border/60"
                )}
              />
              {coverLetter && (
                <button
                  onClick={() => copyToClipboard(coverLetter, "cover")}
                  className="absolute top-8 right-8 flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                  {copiedCover ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCover ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar panels */}
        <div className="space-y-5">
          {/* AI Match Score */}
          {matchRateLimit ? (
            <RateLimitBanner
              message={matchRateLimit.message}
              retryAfter={matchRateLimit.retryAfter}
              onRetry={() => { setMatchRateLimit(null); checkFit() }}
              className="text-xs"
            />
          ) : matchResult ? (
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">AI Match Score</h3>
              </div>
              <div className="flex justify-center">
                <MatchScoreRing score={matchResult.score} size={110} />
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">{matchResult.summary}</p>

              {matchResult.matched?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400 mb-2">✓ Matched Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {matchResult.matched.map((m: any) => (
                      <span key={m.skill} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">{m.skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.missing?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-rose-400 mb-2">✗ Missing Skills</p>
                  <div className="space-y-1">
                    {matchResult.missing.map((m: any) => (
                      <div key={m.skill} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{m.skill}</span>
                        <span className={cn("text-[10px] font-medium", m.importance === "must-have" ? "text-rose-400" : "text-amber-400")}>
                          {m.learnTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-5 text-center space-y-3">
              <Target className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">AI Match Score</p>
              <p className="text-xs text-muted-foreground">Click "Check Fit" to see how well your profile matches this role.</p>
              <button
                onClick={checkFit}
                disabled={loadingMatch || !selectedJob}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {loadingMatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                {loadingMatch ? "Analyzing..." : "Check Fit"}
              </button>
            </div>
          )}

          {/* AI Tips */}
          {tips.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-foreground">AI Suggestions</h3>
              </div>
              <div className="space-y-2">
                {tips.map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => setEmailBody((prev) => prev + "\n\n" + tip)}
                    className="w-full text-left rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    💡 {tip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => emailBody && copyToClipboard(emailBody, "email")} className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/20 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <Copy className="h-3.5 w-3.5" /> Copy Email
              </button>
              <button onClick={() => coverLetter && copyToClipboard(coverLetter, "cover")} className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/20 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <ClipboardList className="h-3.5 w-3.5" /> Copy Cover
              </button>
              <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/20 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all col-span-2">
                <Send className="h-3.5 w-3.5" /> Mark as Applied
              </button>
            </div>
          </div>

          {/* Profile hint */}
          <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">Your Profile (AI uses this)</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {userProfile.skills.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{s}</span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{userProfile.education.degree} • {userProfile.education.year}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  return (
    <ToastProvider>
      <AssistantInner />
    </ToastProvider>
  )
}
