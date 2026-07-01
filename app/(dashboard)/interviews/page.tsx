"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Calendar, Video, MapPin, ExternalLink, Plus, X, Loader2,
  CheckCircle2, Trash2, ChevronLeft, ChevronRight, Clock, Edit2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastProvider, useToast } from "@/components/ui/toast"

interface Interview {
  id: string
  company: string
  role: string
  date: string
  time: string
  type: string
  location: string
  link: string
  notes: string
  status: "UPCOMING" | "COMPLETED" | "CANCELLED"
  opportunityId?: string
}

const INTERVIEW_TYPES = [
  "Technical Phone Screen",
  "System Design",
  "Behavioral / HR",
  "Take-Home Assignment",
  "On-site / Final Round",
  "Coding Challenge",
  "Culture Fit",
  "Other",
]

const TYPE_COLORS: Record<string, string> = {
  "Technical Phone Screen": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "System Design": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Behavioral / HR": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Take-Home Assignment": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "On-site / Final Round": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Coding Challenge": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Culture Fit": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Other": "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

const EMPTY_FORM = {
  company: "",
  role: "",
  date: "",
  time: "",
  type: "Technical Phone Screen",
  location: "",
  link: "",
  notes: "",
}

function ScheduleModal({
  onClose,
  editInterview,
}: {
  onClose: () => void
  editInterview?: Interview | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(
    editInterview
      ? {
          company: editInterview.company,
          role: editInterview.role,
          date: editInterview.date,
          time: editInterview.time,
          type: editInterview.type,
          location: editInterview.location,
          link: editInterview.link,
          notes: editInterview.notes,
        }
      : EMPTY_FORM
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editInterview ? `/api/interviews/${editInterview.id}` : "/api/interviews"
      const method = editInterview ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
      toast({ type: "success", title: editInterview ? "Interview updated!" : "Interview scheduled!" })
      onClose()
    },
    onError: (e: any) => {
      toast({ type: "error", title: "Failed to save", message: e.message })
    },
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card/95 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h3 className="font-bold text-foreground">
            {editInterview ? "Edit Interview" : "Schedule Interview"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Company *", key: "company", placeholder: "e.g. Google" },
              { label: "Role *", key: "role", placeholder: "e.g. SWE Intern" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Interview Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {INTERVIEW_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Platform / Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Google Meet, Zoom"
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Join Link</label>
              <input
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Preparation Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Topics to revise, questions to prepare..."
              className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border/40">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!form.company || !form.role || !form.date || saveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Calendar className="h-4 w-4" /> {editInterview ? "Update Interview" : "Schedule Interview"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InterviewsInner() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editInterview, setEditInterview] = useState<Interview | null>(null)
  const [calMonth, setCalMonth] = useState(() => new Date())

  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await fetch("/api/interviews")
      if (!res.ok) return []
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
      toast({ type: "success", title: "Interview removed" })
    },
    onError: () => toast({ type: "error", title: "Failed to delete interview" }),
  })

  const markDoneMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interviews"] }),
  })

  // Calendar helpers
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calDays = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )

  const interviewDateSet = new Set(
    interviews.map((i) => {
      const d = new Date(i.date)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
  )

  const upcomingInterviews = interviews
    .filter((i) => i.status === "UPCOMING")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const pastInterviews = interviews
    .filter((i) => i.status !== "UPCOMING")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const calMonthLabel = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Interviews &amp; Sessions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {interviews.length === 0
              ? "No interviews scheduled yet — add your first one!"
              : `${upcomingInterviews.length} upcoming · ${pastInterviews.length} past`}
          </p>
        </div>
        <button
          onClick={() => { setEditInterview(null); setShowModal(true) }}
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-primary/10 transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Schedule Interview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-semibold text-base">Timeline</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/20 p-10 text-center space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No interviews yet</p>
              <p className="text-xs text-muted-foreground">
                Schedule your first interview to start tracking your progress.
              </p>
              <button
                onClick={() => { setEditInterview(null); setShowModal(true) }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 text-primary px-4 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" /> Schedule Interview
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingInterviews.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Upcoming</p>
                  <div className="space-y-6 relative border-l border-border/60 pl-6 ml-3">
                    {upcomingInterviews.map((session) => (
                      <InterviewCard
                        key={session.id}
                        session={session}
                        onEdit={() => { setEditInterview(session); setShowModal(true) }}
                        onDelete={() => deleteMutation.mutate(session.id)}
                        onMarkDone={() => markDoneMutation.mutate({ id: session.id, status: "COMPLETED" })}
                      />
                    ))}
                  </div>
                </div>
              )}
              {pastInterviews.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Past</p>
                  <div className="space-y-6 relative border-l border-border/60 pl-6 ml-3 opacity-70">
                    {pastInterviews.map((session) => (
                      <InterviewCard
                        key={session.id}
                        session={session}
                        onEdit={() => { setEditInterview(session); setShowModal(true) }}
                        onDelete={() => deleteMutation.mutate(session.id)}
                        onMarkDone={() => markDoneMutation.mutate({ id: session.id, status: "COMPLETED" })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
          <h3 className="font-semibold text-base">Calendar</h3>

          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold">{calMonthLabel}</span>
            <button
              onClick={() => setCalMonth(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calDays.map((day, i) => {
              if (!day) return <span key={i} className="p-1" />
              const key = `${year}-${month}-${day}`
              const hasInterview = interviewDateSet.has(key)
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()
              return (
                <span
                  key={i}
                  className={cn(
                    "p-1 rounded-lg font-medium transition-colors cursor-default",
                    hasInterview && "bg-primary text-white font-bold shadow-sm shadow-primary/20",
                    isToday && !hasInterview && "bg-secondary/60 text-foreground font-bold",
                    !hasInterview && !isToday && "text-muted-foreground"
                  )}
                >
                  {day}
                </span>
              )
            })}
          </div>

          {/* Legend */}
          <div className="border-t border-border/40 pt-3 space-y-2">
            {upcomingInterviews.slice(0, 4).map((i) => (
              <div key={i.id} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground truncate">
                  {i.company} — {new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
            {upcomingInterviews.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No upcoming interviews</p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule modal */}
      {showModal && (
        <ScheduleModal
          onClose={() => { setShowModal(false); setEditInterview(null) }}
          editInterview={editInterview}
        />
      )}
    </div>
  )
}

function InterviewCard({
  session,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  session: Interview
  onEdit: () => void
  onDelete: () => void
  onMarkDone: () => void
}) {
  const typeColor = TYPE_COLORS[session.type] || TYPE_COLORS["Other"]
  const isUpcoming = session.status === "UPCOMING"
  const dateLabel = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="relative group">
      <div
        className={cn(
          "absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-background scale-100 group-hover:scale-110 transition duration-200",
          session.status === "COMPLETED" ? "border-emerald-500" : session.status === "CANCELLED" ? "border-slate-400" : "border-primary"
        )}
      />
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/30 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-border/40 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{session.company}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", typeColor)}>
                {session.type}
              </span>
              {session.status === "COMPLETED" && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  ✓ Done
                </span>
              )}
            </div>
            <h4 className="font-semibold text-sm text-foreground mt-0.5">{session.role}</h4>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-semibold text-foreground block">{dateLabel}</span>
            {session.time && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 sm:justify-end mt-0.5">
                <Clock className="h-3 w-3" /> {session.time}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {(session.location || session.link) && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {session.location && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Video className="h-4 w-4 text-violet-400" />
                  <span>{session.location}</span>
                </div>
              )}
              {session.link && (
                <a
                  href={session.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  Join Call <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {session.notes && (
            <div className="rounded-xl bg-secondary/20 border border-border/40 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">Prep Notes:</span>
              {session.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isUpcoming && (
              <button
                onClick={onMarkDone}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="h-3 w-3" /> Mark Done
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-lg bg-secondary/40 border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 text-[11px] font-semibold hover:bg-rose-500/20 transition-colors ml-auto"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InterviewsPage() {
  return (
    <ToastProvider>
      <InterviewsInner />
    </ToastProvider>
  )
}
