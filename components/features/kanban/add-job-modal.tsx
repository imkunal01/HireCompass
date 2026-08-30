import React, { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  X, Plus, Loader2, Building2, Brain, AlertOctagon,
  Sparkles, CheckCircle2, DollarSign, Calendar, Layers, ShieldAlert, FileQuestion
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  OpportunityStatus, Priority, STATUS_CONFIG,
  OA_PLATFORMS, REJECTION_STAGES, REJECTION_REASONS
} from "@/types/opportunity"
import { useToast } from "@/components/ui/toast"

const schema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Role title is required"),
  location: z.string().optional(),
  isRemote: z.boolean(),
  employmentType: z.enum(["INTERNSHIP", "FULL_TIME", "CONTRACT", "PART_TIME"]),
  salary: z.string().optional(),
  deadline: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sourcePlatform: z.enum(["LINKEDIN", "INTERNSHALA", "GLASSDOOR", "ANGELLIST", "COMPANY_SITE", "REFERRAL", "OTHER", ""]).optional(),
  skills: z.array(z.string()),
  tags: z.array(z.string()),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  notes: z.string().optional(),
  status: z.string(),
  // Lifecycle fields
  oaPlatform: z.string().optional(),
  oaTotalRounds: z.coerce.number().optional(),
  oaCurrentRound: z.coerce.number().optional(),
  oaStatus: z.enum(["PENDING", "CLEARED", "FAILED"]).optional(),
  oaTopics: z.string().optional(),
  interviewTotalRounds: z.coerce.number().optional(),
  interviewCurrentRound: z.coerce.number().optional(),
  isHrRound: z.boolean().optional(),
  hrRecruiterName: z.string().optional(),
  hrExpectedSalary: z.string().optional(),
  hrCultureFitNotes: z.string().optional(),
  offerAmount: z.string().optional(),
  offerBaseSalary: z.string().optional(),
  offerBonus: z.string().optional(),
  offerStocks: z.string().optional(),
  offerDeadline: z.string().optional(),
  rejectionStage: z.string().optional(),
  rejectionReasonCategory: z.string().optional(),
  rejectionWhatWasAsked: z.string().optional(),
  rejectionWhyRejected: z.string().optional(),
  rejectionWhereFumbled: z.string().optional(),
  rejectionLessonsLearned: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AddJobModalProps {
  isOpen: boolean
  onClose: () => void
  defaultStatus?: OpportunityStatus
}

const SOURCE_PLATFORMS = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INTERNSHALA", label: "Internshala" },
  { value: "GLASSDOOR", label: "Glassdoor" },
  { value: "ANGELLIST", label: "AngelList" },
  { value: "COMPANY_SITE", label: "Company Site" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
]

const PRESET_TAGS = ["frontend", "backend", "remote", "urgent", "dream company", "startup", "big tech", "ai/ml"]

const PIPELINE_STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "ASSESSMENT", label: "OA / Assessment" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer 🎉" },
  { value: "REJECTED", label: "Rejected ❌" },
]

export function AddJobModal({ isOpen, onClose, defaultStatus = "SAVED" }: AddJobModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [skillInput, setSkillInput] = useState("")

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      company: "",
      title: "",
      location: "",
      isRemote: false,
      employmentType: "FULL_TIME" as const,
      salary: "",
      deadline: "",
      url: "",
      sourcePlatform: "" as any,
      skills: [] as string[],
      tags: [] as string[],
      priority: "MEDIUM" as const,
      notes: "",
      status: defaultStatus as string,
      oaPlatform: "HackerRank",
      oaTotalRounds: 1,
      oaCurrentRound: 1,
      oaStatus: "PENDING",
      oaTopics: "",
      interviewTotalRounds: 3,
      interviewCurrentRound: 1,
      isHrRound: false,
      hrRecruiterName: "",
      hrExpectedSalary: "",
      hrCultureFitNotes: "",
      offerAmount: "",
      offerBaseSalary: "",
      offerBonus: "",
      offerStocks: "",
      offerDeadline: "",
      rejectionStage: "Resume Screen / No Shortlist",
      rejectionReasonCategory: "Failed OA / Coding Challenge Testcases",
      rejectionWhatWasAsked: "",
      rejectionWhyRejected: "",
      rejectionWhereFumbled: "",
      rejectionLessonsLearned: "",
    },
  })

  const skills = watch("skills")
  const tags = watch("tags")
  const priority = watch("priority")
  const currentStatus = watch("status")
  const isHrRound = watch("isHrRound")

  useEffect(() => {
    if (isOpen) {
      reset({
        status: defaultStatus,
        skills: [],
        tags: [],
        priority: "MEDIUM",
        isRemote: false,
        employmentType: "FULL_TIME",
        oaPlatform: "HackerRank",
        oaTotalRounds: 1,
        oaCurrentRound: 1,
        oaStatus: "PENDING",
        interviewTotalRounds: 3,
        interviewCurrentRound: 1,
        isHrRound: false,
        rejectionStage: defaultStatus === "REJECTED" ? "Technical Round 1 (DSA / Coding)" : "Resume Screen / No Shortlist",
        rejectionReasonCategory: "DSA & Problem-Solving Speed Gaps",
      })
      setSkillInput("")
    }
  }, [isOpen, defaultStatus, reset])

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Build structured payload
      const payload: any = {
        company: data.company,
        title: data.title,
        location: data.location || null,
        isRemote: data.isRemote,
        employmentType: data.employmentType,
        salary: data.salary || null,
        deadline: data.deadline || null,
        url: data.url || null,
        sourcePlatform: data.sourcePlatform || null,
        skills: data.skills,
        tags: data.tags,
        priority: data.priority,
        notes: data.notes || null,
        status: data.status,
      }

      // Add OA details if OA or relevant
      if (data.status === "ASSESSMENT" || data.oaTopics || data.oaPlatform) {
        payload.oaDetails = {
          platform: data.oaPlatform,
          totalRounds: data.oaTotalRounds || 1,
          currentRound: data.oaCurrentRound || 1,
          status: data.oaStatus || "PENDING",
          topics: data.oaTopics ? data.oaTopics.split(",").map(s => s.trim()) : [],
        }
      }

      // Add Interview & HR details if INTERVIEW
      if (data.status === "INTERVIEW" || data.isHrRound) {
        payload.interviewRounds = [
          {
            id: "r1",
            roundNumber: data.interviewCurrentRound || 1,
            roundName: `Round ${data.interviewCurrentRound || 1} - Technical`,
            roundType: "TECHNICAL",
            status: "PENDING",
          }
        ]
        payload.isHrRound = Boolean(data.isHrRound)
        if (data.isHrRound || data.hrExpectedSalary) {
          payload.hrRoundDetails = {
            recruiterName: data.hrRecruiterName || null,
            expectedSalary: data.hrExpectedSalary || null,
            cultureFitNotes: data.hrCultureFitNotes || null,
            status: "PENDING",
          }
        }
      }

      // Add Offer Details if OFFER
      if (data.status === "OFFER" || data.offerAmount) {
        payload.offerDetails = {
          totalAmount: data.offerAmount || data.salary || null,
          baseSalary: data.offerBaseSalary || null,
          bonus: data.offerBonus || null,
          stocks: data.offerStocks || null,
          deadline: data.offerDeadline || null,
        }
      }

      // Add Rejection Post-Mortem if REJECTED
      if (data.status === "REJECTED" || data.rejectionWhatWasAsked || data.rejectionWhereFumbled) {
        payload.rejectionDetails = {
          stage: data.rejectionStage || "Resume Screen / No Shortlist",
          reasonCategory: data.rejectionReasonCategory,
          whatWasAsked: data.rejectionWhatWasAsked || null,
          whyRejected: data.rejectionWhyRejected || null,
          whereFumbled: data.rejectionWhereFumbled || null,
          lessonsLearned: data.rejectionLessonsLearned || null,
          rejectionDate: new Date().toISOString(),
        }
      }

      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create job")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({ type: "success", title: "Job added!", message: "Opportunity and details tracked successfully." })
      onClose()
    },
    onError: (err: Error) => {
      toast({ type: "error", title: "Failed to add job", message: err.message })
    },
  })

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !skills.includes(skill)) {
      setValue("skills", [...skills, skill])
    }
    setSkillInput("")
  }

  const removeSkill = (s: string) => setValue("skills", skills.filter((x) => x !== s))
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setValue("tags", tags.filter((t) => t !== tag))
    } else {
      setValue("tags", [...tags, tag])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/90 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Add New Job & Track Application</h2>
              <p className="text-xs text-muted-foreground">Save opportunity with OA, interview rounds, offer, or rejection post-mortem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-5">
          {/* Status Selector Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Application Stage / Flow
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {PIPELINE_STATUS_OPTIONS.map((opt) => {
                const isSelected = currentStatus === opt.value
                const cfg = STATUS_CONFIG[opt.value]
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("status", opt.value)}
                    className={cn(
                      "py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border truncate",
                      isSelected
                        ? cn(cfg.bgColor, cfg.textColor, "border-primary shadow-sm")
                        : "border-border bg-secondary/10 text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("company")}
                placeholder="e.g. Google, Stripe, Zepto"
                className={cn(
                  "w-full rounded-xl border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all",
                  errors.company ? "border-rose-500/50" : "border-border"
                )}
              />
              {errors.company && <p className="text-xs text-rose-400">{errors.company.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Role Title <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="e.g. SDE-1, Backend Engineer"
                className={cn(
                  "w-full rounded-xl border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all",
                  errors.title ? "border-rose-500/50" : "border-border"
                )}
              />
              {errors.title && <p className="text-xs text-rose-400">{errors.title.message}</p>}
            </div>
          </div>

          {/* Location + Remote */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
            <div className="flex gap-3">
              <input
                {...register("location")}
                placeholder="e.g. Bangalore, SF, Remote"
                className="flex-1 rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <Controller
                name="isRemote"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
                      field.value
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🌐 Remote
                  </button>
                )}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              OA / ASSESSMENT SECTION (Shown when ASSESSMENT or on demand)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStatus === "ASSESSMENT" && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Brain className="h-4 w-4" /> Online Assessment (OA) Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">OA Platform</label>
                  <select
                    {...register("oaPlatform")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  >
                    {OA_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Total OA Rounds</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    {...register("oaTotalRounds")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">OA Status</label>
                  <select
                    {...register("oaStatus")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  >
                    <option value="PENDING">Pending Assessment</option>
                    <option value="CLEARED">Cleared / Shortlisted ✅</option>
                    <option value="FAILED">Failed ❌</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Topics / Questions Covered (comma separated)</label>
                <input
                  {...register("oaTopics")}
                  placeholder="e.g. DP on trees, Dijkstra, SQL Query, 20 MCQs"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              INTERVIEW & HR ROUNDS SECTION (Shown when INTERVIEW)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStatus === "INTERVIEW" && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="h-4 w-4" /> Interview Rounds Setup
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Total Interview Rounds</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    {...register("interviewTotalRounds")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Current Round</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    {...register("interviewCurrentRound")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                  />
                </div>
              </div>

              {/* HR Round Toggle */}
              <div className="pt-2 border-t border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Include HR / Cultural Fit Details?</span>
                  <button
                    type="button"
                    onClick={() => setValue("isHrRound", !isHrRound)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      isHrRound
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                        : "bg-secondary/40 text-muted-foreground border border-border"
                    )}
                  >
                    {isHrRound ? "✓ HR Round Enabled" : "+ Add HR Info"}
                  </button>
                </div>
                {isHrRound && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <input
                      {...register("hrRecruiterName")}
                      placeholder="Recruiter / HR Name"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                    />
                    <input
                      {...register("hrExpectedSalary")}
                      placeholder="Expected CTC Discussed"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              OFFER DETAILS SECTION (Shown when OFFER)
          ═══════════════════════════════════════════════ */}
          {currentStatus === "OFFER" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <DollarSign className="h-4 w-4" /> Offer Compensation & Details 🎉
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Total CTC / Compensation</label>
                  <input
                    {...register("offerAmount")}
                    placeholder="e.g. ₹28 LPA or $160,000"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Base Salary</label>
                  <input
                    {...register("offerBaseSalary")}
                    placeholder="e.g. ₹22 LPA Base"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Bonus & Joining Perks</label>
                  <input
                    {...register("offerBonus")}
                    placeholder="e.g. ₹2L Joining Bonus"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Offer Acceptance Deadline</label>
                  <input
                    type="date"
                    {...register("offerDeadline")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              REJECTION POST-MORTEM & REASON TRACKER (Shown when REJECTED)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStatus === "REJECTED" && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertOctagon className="h-4 w-4" /> Rejection Post-Mortem & Reason Tracker ❌
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Log the exact questions, mistakes, and reasons so you can study your gaps and avoid repeating them.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Where Was It Rejected?</label>
                  <select
                    {...register("rejectionStage")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  >
                    {REJECTION_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Primary Reason Category</label>
                  <select
                    {...register("rejectionReasonCategory")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  >
                    {REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">📝 What Was Asked? (Problems / Concepts / Architecture)</label>
                <textarea
                  {...register("rejectionWhatWasAsked")}
                  rows={2}
                  placeholder="e.g. LRU cache implementation with O(1), Kafka partition rebalancing, behavioral conflict question"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-rose-400">🔍 Where Did I Fumble / Make Mistakes?</label>
                <textarea
                  {...register("rejectionWhereFumbled")}
                  rows={2}
                  placeholder="e.g. Got stuck handling edge case for doubly linked list pointers, took too long to analyze time complexity"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">💡 Lessons Learned & Next Steps</label>
                <input
                  {...register("rejectionLessonsLearned")}
                  placeholder="e.g. Practice 15 more linked-list/hashmap medium problems on LeetCode before next round"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>
            </div>
          )}

          {/* Employment Type + Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employment Type</label>
              <select
                {...register("employmentType")}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="PART_TIME">Part-time</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Salary / Stipend</label>
              <input
                {...register("salary")}
                placeholder="e.g. ₹30,000/mo or $120k"
                className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Deadline + URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Application Deadline</label>
              <input
                type="date"
                {...register("deadline")}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Application Link</label>
              <input
                {...register("url")}
                placeholder="https://..."
                className={cn(
                  "w-full rounded-xl border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
                  errors.url ? "border-rose-500/50" : "border-border"
                )}
              />
              {errors.url && <p className="text-xs text-rose-400">{errors.url.message}</p>}
            </div>
          </div>

          {/* Source Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source Platform</label>
            <select
              {...register("sourcePlatform")}
              className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="">Select platform...</option>
              {SOURCE_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skills Required</label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                placeholder="Type skill and press Enter"
                className="flex-1 rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button type="button" onClick={addSkill} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-rose-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
            <div className="flex gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("priority", p)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-xs font-bold uppercase tracking-wide transition-all",
                    priority === p
                      ? p === "HIGH"
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                        : p === "MEDIUM"
                        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                        : "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition-all",
                    tags.includes(tag)
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Any notes about this opportunity..."
              className="w-full rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="h-4 w-4" /> Save Opportunity</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
