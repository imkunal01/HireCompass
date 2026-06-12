"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Clock, ArrowRight, Calendar, Bell, CheckSquare, Plus,
  ChevronLeft, ChevronRight, X, Loader2, Check, AlarmClock,
  Trash2, MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastProvider, useToast } from "@/components/ui/toast"

interface Reminder {
  id: string
  jobId: string | null
  jobTitle: string | null
  company: string | null
  type: "DEADLINE" | "FOLLOWUP" | "INTERVIEW"
  dueAt: string
  message: string
  done: boolean
  createdAt: string
}

const TYPE_CONFIG = {
  DEADLINE:  { label: "Deadline",   color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20",   icon: Clock },
  FOLLOWUP:  { label: "Follow-up",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: ArrowRight },
  INTERVIEW: { label: "Interview",  color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Calendar },
}

const MOCK_REMINDERS: Reminder[] = [
  { id: "r1", jobId: "m1", jobTitle: "Software Engineer Intern", company: "Google",  type: "INTERVIEW", dueAt: new Date(Date.now() + 1 * 86400000).toISOString(), message: "Technical Round 2 — prep DS&A", done: false, createdAt: "" },
  { id: "r2", jobId: "m3", jobTitle: "Fullstack Developer",      company: "Stripe",  type: "FOLLOWUP",  dueAt: new Date(Date.now() + 0 * 86400000).toISOString(), message: "7 days since applying — send follow-up email", done: false, createdAt: "" },
  { id: "r3", jobId: "m2", jobTitle: "Frontend Engineer",        company: "Vercel",  type: "DEADLINE",  dueAt: new Date(Date.now() + 2 * 86400000).toISOString(), message: "Application deadline", done: false, createdAt: "" },
  { id: "r4", jobId: "m5", jobTitle: "Platform Engineer",        company: "Figma",   type: "DEADLINE",  dueAt: new Date(Date.now() + 4 * 86400000).toISOString(), message: "Take-home assessment due", done: false, createdAt: "" },
  { id: "r5", jobId: "m6", jobTitle: "React Developer",          company: "Notion",  type: "FOLLOWUP",  dueAt: new Date(Date.now() - 1 * 86400000).toISOString(), message: "Check in on application status", done: true, createdAt: "" },
]

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function getDueLabelColor(dueAt: string) {
  const diff = Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86400000)
  if (diff < 0) return "text-rose-500"
  if (diff === 0) return "text-rose-400"
  if (diff === 1) return "text-orange-400"
  return "text-muted-foreground"
}

function getDueLabel(dueAt: string) {
  const diff = Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return new Date(dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function ReminderCard({ reminder, onToggle, onSnooze, onDelete }: {
  reminder: Reminder
  onToggle: () => void
  onSnooze: (s: string) => void
  onDelete: () => void
}) {
  const config = TYPE_CONFIG[reminder.type]
  const Icon = config.icon
  const [showSnooze, setShowSnooze] = useState(false)

  return (
    <div className={cn(
      "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300",
      reminder.done
        ? "border-border/30 bg-card/10 opacity-50"
        : `${config.border} ${config.bg} hover:shadow-md`
    )}>
      {/* Type icon */}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("text-sm font-semibold", reminder.done ? "line-through text-muted-foreground" : "text-foreground")}>
              {reminder.company && <span>{reminder.company} — </span>}
              {reminder.jobTitle || reminder.message}
            </p>
            {reminder.message && reminder.jobTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>
            )}
          </div>
          <span className={cn("shrink-0 text-xs font-semibold", getDueLabelColor(reminder.dueAt))}>
            {getDueLabel(reminder.dueAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", config.border, config.color, config.bg)}>
            {config.label}
          </span>
          {!reminder.done && (
            <div className="relative">
              <button
                onClick={() => setShowSnooze(!showSnooze)}
                className="flex items-center gap-1 rounded-lg border border-border bg-secondary/20 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <AlarmClock className="h-2.5 w-2.5" /> Snooze
              </button>
              {showSnooze && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border border-border bg-card shadow-lg overflow-hidden w-32">
                  {["1day", "3days", "1week"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { onSnooze(s); setShowSnooze(false) }}
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s === "1day" ? "1 day" : s === "3days" ? "3 days" : "1 week"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl border-2 transition-all",
            reminder.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-500/10"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function AddReminderModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (r: any) => void }) {
  const [form, setForm] = useState({ company: "", jobTitle: "", type: "DEADLINE" as Reminder["type"], dueAt: "", message: "" })
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/95 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Add Reminder</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: "company", label: "Company", placeholder: "e.g. Google" },
            { key: "jobTitle", label: "Job Title", placeholder: "e.g. Software Engineer" },
            { key: "message", label: "Note", placeholder: "What do you need to do?" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
              <input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="DEADLINE">Deadline</option>
                <option value="FOLLOWUP">Follow-up</option>
                <option value="INTERVIEW">Interview</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</label>
              <input type="date" value={form.dueAt} onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">Cancel</button>
          <button
            onClick={() => { if (!form.dueAt || !form.type) return; onAdd(form); onClose() }}
            disabled={!form.dueAt}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            Add Reminder
          </button>
        </div>
      </div>
    </div>
  )
}

function RemindersInner() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending")
  const [calMonth, setCalMonth] = useState(new Date())

  const { data: apiReminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["reminders", filter],
    queryFn: async () => {
      const res = await fetch(`/api/reminders${filter !== "all" ? `?status=${filter}` : ""}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const reminders = (apiReminders && apiReminders.length > 0) ? apiReminders : MOCK_REMINDERS.filter(
    r => filter === "all" ? true : filter === "pending" ? !r.done : r.done
  )

  const toggleMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  })

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, snooze }: { id: string; snooze: string }) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snooze }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ type: "success", title: "Reminder snoozed!" })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, dueAt: new Date(data.dueAt).toISOString() }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      toast({ type: "success", title: "Reminder added!" })
    },
  })

  // Calendar helpers
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1)
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const startPad = firstDay.getDay()
  const calDays = Array.from({ length: startPad + daysInMonth }, (_, i) => i < startPad ? null : i - startPad + 1)

  const remindersByDay = useMemo(() => {
    const map: Record<number, Reminder[]> = {}
    reminders.forEach((r) => {
      const d = new Date(r.dueAt)
      if (d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear()) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(r)
      }
    })
    return map
  }, [reminders, calMonth])

  const pending = reminders.filter((r) => !r.done)
  const overdue = pending.filter((r) => new Date(r.dueAt) < new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Reminders</h1>
            {overdue.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {overdue.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending.length} pending · {overdue.length} overdue
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card/40 p-1">
            <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-lg transition-all text-xs font-medium px-2", viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>List</button>
            <button onClick={() => setViewMode("calendar")} className={cn("p-1.5 rounded-lg transition-all text-xs font-medium px-2", viewMode === "calendar" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>Calendar</button>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Reminder
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl border px-4 py-2 text-xs font-semibold transition-all capitalize",
              filter === f ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card/20 text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {viewMode === "list" && (
        <div className="space-y-3">
          {isLoading && <div className="space-y-3">{Array.from({length: 3}).map((_,i) => <div key={i} className="h-20 rounded-2xl bg-card/20 animate-pulse" />)}</div>}
          {!isLoading && reminders.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">No reminders</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first reminder to stay on track.</p>
            </div>
          )}
          {reminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onToggle={() => toggleMutation.mutate({ id: r.id, done: !r.done })}
              onSnooze={(s) => snoozeMutation.mutate({ id: r.id, snooze: s })}
              onDelete={() => deleteMutation.mutate(r.id)}
            />
          ))}
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
          {/* Calendar nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <button onClick={() => setCalMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-foreground">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</h2>
            <button onClick={() => setCalMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/30">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calDays.map((day, i) => {
              const hasReminders = day && remindersByDay[day]
              const isToday = day && new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear()
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[72px] border-b border-r border-border/20 p-2",
                    !day && "bg-secondary/5",
                    isToday && "bg-primary/5"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-primary text-white" : "text-foreground"
                      )}>
                        {day}
                      </span>
                      {hasReminders && (
                        <div className="mt-1 space-y-0.5">
                          {remindersByDay[day].slice(0, 2).map((r) => {
                            const cfg = TYPE_CONFIG[r.type]
                            return (
                              <div key={r.id} className={cn("rounded px-1 py-0.5 text-[9px] font-medium truncate", cfg.bg, cfg.color)}>
                                {r.company || r.message}
                              </div>
                            )
                          })}
                          {remindersByDay[day].length > 2 && (
                            <div className="text-[9px] text-muted-foreground">+{remindersByDay[day].length - 2} more</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AddReminderModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={(data) => addMutation.mutate(data)} />
    </div>
  )
}

export default function RemindersPage() {
  return (
    <ToastProvider>
      <RemindersInner />
    </ToastProvider>
  )
}
