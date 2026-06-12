"use client"

import React, { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus, Loader2, Building2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { OpportunityStatus, Priority } from "@/types/opportunity"
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

export function AddJobModal({ isOpen, onClose, defaultStatus = "SAVED" }: AddJobModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [skillInput, setSkillInput] = React.useState("")

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
    },
  })

  const skills = watch("skills")
  const tags = watch("tags")
  const isRemote = watch("isRemote")
  const priority = watch("priority")

  useEffect(() => {
    if (isOpen) {
      reset({ status: defaultStatus, skills: [], tags: [], priority: "MEDIUM", isRemote: false, employmentType: "FULL_TIME" })
      setSkillInput("")
    }
  }, [isOpen, defaultStatus, reset])

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create job")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast({ type: "success", title: "Job added!", message: "Your opportunity has been saved." })
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
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Add New Job</h2>
              <p className="text-xs text-muted-foreground">Save an opportunity to your pipeline</p>
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
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("company")}
                placeholder="e.g. Google"
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
                placeholder="e.g. Software Engineer"
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
                placeholder="e.g. San Francisco, CA"
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
                <><Plus className="h-4 w-4" /> Add Job</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
