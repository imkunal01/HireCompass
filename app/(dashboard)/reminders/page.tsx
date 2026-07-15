"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Clock, ArrowRight, Calendar, Bell, Plus,
  ChevronLeft, ChevronRight, X, Check, AlarmClock,
  Trash2, RefreshCw, CalendarDays, AlertCircle,
  ExternalLink, Mail, Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { useSearchParams, useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────────────
interface Reminder {
  id: string
  jobId: string | null
  jobTitle: string | null
  company: string | null
  type: "DEADLINE" | "FOLLOWUP" | "INTERVIEW"
  dueAt: string
  eventDate?: string | null
  registrationDeadline?: string | null
  message: string
  done: boolean
  googleCalendarEventId?: string | null
  createdAt: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  colorId?: string
  htmlLink?: string
  description?: string
}

// ── Config ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  DEADLINE:  { label: "Deadline",   color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20",   icon: Clock },
  FOLLOWUP:  { label: "Follow-up",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: ArrowRight },
  INTERVIEW: { label: "Interview",  color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Calendar },
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

// ── Helpers ────────────────────────────────────────────────────────────────
function getDueLabelColor(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return "text-rose-500"
  if (diff === 0) return "text-rose-400"
  if (diff === 1) return "text-orange-400"
  return "text-muted-foreground"
}

function getDueLabel(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function getTimeLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`
  return `${Math.floor(diff / 60000)}m`
}

function formatDateLocal(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  })
}

// ── Google Calendar Connect Button ─────────────────────────────────────────
function CalendarConnectBanner({ connected }: { connected: boolean }) {
  if (connected) return null
  return (
    <a
      href="/api/google-calendar/auth"
      className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-blue-100">
        <CalendarDays className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-blue-800">Connect Google Calendar</p>
        <p className="text-xs text-blue-600 mt-0.5">Sync reminders and view your calendar events here</p>
      </div>
      <ExternalLink className="h-4 w-4 text-blue-400 group-hover:text-blue-600 flex-shrink-0" />
    </a>
  )
}

// ── Google Calendar Events Panel ───────────────────────────────────────────
const GCAL_COLORS: Record<string, string> = {
  "1": "bg-blue-100 text-blue-700 border-blue-200",
  "2": "bg-green-100 text-green-700 border-green-200",
  "3": "bg-purple-100 text-purple-700 border-purple-200",
  "4": "bg-rose-100 text-rose-700 border-rose-200",
  "5": "bg-amber-100 text-amber-700 border-amber-200",
  "9": "bg-indigo-100 text-indigo-700 border-indigo-200",
}

function GoogleCalendarPanel({ connected, events, isLoading, onRefresh }: {
  connected: boolean
  events: CalendarEvent[]
  isLoading: boolean
  onRefresh: () => void
}) {
  if (!connected) return null

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">Google Calendar</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold">Connected</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No upcoming events in Google Calendar</p>
      )}

      {!isLoading && events.length > 0 && (
        <div className="space-y-2">
          {events.slice(0, 5).map((ev) => (
            <a
              key={ev.id}
              href={ev.htmlLink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs hover:shadow-sm transition-all",
                GCAL_COLORS[ev.colorId ?? "9"] ?? GCAL_COLORS["9"]
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{ev.title}</p>
                <p className="text-[10px] opacity-70 mt-0.5">
                  {new Date(ev.start).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {new Date(ev.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Reminder Card ──────────────────────────────────────────────────────────
function ReminderCard({ reminder, onToggle, onSnooze, onDelete, onSyncToCalendar, calendarConnected }: {
  reminder: Reminder
  onToggle: () => void
  onSnooze: (s: string) => void
  onDelete: () => void
  onSyncToCalendar: () => void
  calendarConnected: boolean
}) {
  const config = TYPE_CONFIG[reminder.type]
  const Icon = config.icon
  const [showSnooze, setShowSnooze] = useState(false)

  const primaryDate = reminder.eventDate || reminder.registrationDeadline || reminder.dueAt
  const timeLeft = getTimeLeft(primaryDate)

  return (
    <div className={cn(
      "group relative flex flex-col sm:flex-row items-start gap-3 rounded-2xl border p-4 transition-all duration-300",
      reminder.done
        ? "border-border/30 bg-card/10 opacity-50"
        : `${config.border} ${config.bg} hover:shadow-md`
    )}>
      {/* Type icon */}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-semibold", reminder.done ? "line-through text-muted-foreground" : "text-foreground")}>
              {reminder.company && <span>{reminder.company} — </span>}
              {reminder.jobTitle || reminder.message}
            </p>
            {reminder.message && reminder.jobTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {timeLeft && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                new Date(primaryDate).getTime() - Date.now() <= 5 * 3600000
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : new Date(primaryDate).getTime() - Date.now() <= 24 * 3600000
                  ? "bg-orange-50 text-orange-600 border-orange-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              )}>
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Event date + Registration deadline pills */}
        <div className="flex flex-wrap gap-2 mt-2.5">
          {reminder.eventDate && (
            <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-2.5 py-1">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span className="text-[11px] font-semibold text-indigo-700">Event: {getDueLabel(reminder.eventDate)}</span>
              <span className={cn("text-[10px] font-bold", getDueLabelColor(reminder.eventDate))}>
                {new Date(reminder.eventDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            </div>
          )}
          {reminder.registrationDeadline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 px-2.5 py-1">
              <Mail className="h-3 w-3 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">Register by: {getDueLabel(reminder.registrationDeadline)}</span>
            </div>
          )}
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", config.border, config.color, config.bg)}>
            {config.label}
          </span>

          {/* Google Calendar sync button */}
          {calendarConnected && !reminder.done && (
            <button
              onClick={onSyncToCalendar}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors",
                reminder.googleCalendarEventId
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-border bg-secondary/20 text-muted-foreground hover:text-indigo-600 hover:border-indigo-200"
              )}
            >
              <CalendarDays className="h-2.5 w-2.5" />
              {reminder.googleCalendarEventId ? "Synced ✓" : "Sync to Calendar"}
            </button>
          )}

          {/* Snooze button */}
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
                  {[["1day", "1 day"], ["3days", "3 days"], ["1week", "1 week"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { onSnooze(val); setShowSnooze(false) }}
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email alerts badge */}
          {(reminder.eventDate || reminder.registrationDeadline) && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Mail className="h-2.5 w-2.5" />
              Email alerts: 24h + 5h
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
        <button
          onClick={onToggle}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl border-2 transition-all",
            reminder.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-500/10"
          )}
          title="Mark complete"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Add Reminder Modal ─────────────────────────────────────────────────────
function AddReminderModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (r: any) => void }) {
  const [form, setForm] = useState({
    company: "", jobTitle: "", type: "DEADLINE" as Reminder["type"],
    dueAt: "", message: "", eventDate: "", registrationDeadline: ""
  })

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!form.dueAt || !form.type) return
    onAdd(form)
    onClose()
    setForm({ company: "", jobTitle: "", type: "DEADLINE", dueAt: "", message: "", eventDate: "", registrationDeadline: "" })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-white shadow-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        
        {/* Handle on mobile */}
        <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Add Reminder</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { key: "company", label: "Company", placeholder: "e.g. Google, TCS, Infosys" },
            { key: "jobTitle", label: "Role / Event", placeholder: "e.g. Software Engineer, Campus Drive" },
            { key: "message", label: "Note", placeholder: "Additional details..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="DEADLINE">Deadline</option>
                <option value="FOLLOWUP">Follow-up</option>
                <option value="INTERVIEW">Interview</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reminder On</label>
              <input
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-t border-border/50" />
            <span className="text-xs text-muted-foreground font-medium">Email Alerts (optional)</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          {/* Blue info box */}
          <div className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <Info className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700">
              Set an event date and/or registration deadline to receive <strong>automated email alerts 24 hours and 5 hours before</strong> each date.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Event Date
              </label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                <Mail className="h-3 w-3" /> Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => setForm((p) => ({ ...p, registrationDeadline: e.target.value }))}
                className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.dueAt}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Add Reminder
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
function RemindersInner() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending")
  const [calMonth, setCalMonth] = useState(new Date())
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  // Handle Google Calendar OAuth return
  useEffect(() => {
    const calConnected = searchParams.get("cal_connected")
    const calError = searchParams.get("cal_error")
    if (calConnected === "1") {
      toast({ type: "success", title: "Google Calendar Connected! 🎉" })
      queryClient.invalidateQueries({ queryKey: ["gcal-events"] })
      queryClient.invalidateQueries({ queryKey: ["gcal-status"] })
      router.replace("/reminders")
    }
    if (calError) {
      toast({ type: "error", title: `Could not connect Google Calendar: ${calError}` })
      router.replace("/reminders")
    }
  }, [searchParams])

  // ── Reminders query ─────────────────────────────────────────────────────
  const { data: apiReminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["reminders", filter],
    queryFn: async () => {
      const res = await fetch(`/api/reminders${filter !== "all" ? `?status=${filter}` : ""}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const reminders = useMemo(() => apiReminders || [], [apiReminders])

  // ── Google Calendar queries ─────────────────────────────────────────────
  const { data: gcalData, isLoading: gcalLoading, refetch: refetchGcal } = useQuery<{
    connected: boolean; events: CalendarEvent[]
  }>({
    queryKey: ["gcal-events"],
    queryFn: async () => {
      const res = await fetch("/api/google-calendar/events")
      if (!res.ok) return { connected: false, events: [] }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const calendarConnected = gcalData?.connected ?? false
  const gcalEvents = gcalData?.events ?? []

  // ── Mutations ───────────────────────────────────────────────────────────
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
        body: JSON.stringify({
          ...data,
          dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : new Date().toISOString(),
          eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : null,
          registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      toast({ type: "success", title: "Reminder added! 📬 Confirmation email sent." })
    },
    onError: () => {
      toast({ type: "error", title: "Failed to add reminder" })
    }
  })

  // ── Sync to Google Calendar ─────────────────────────────────────────────
  const syncToCalendar = async (reminder: Reminder) => {
    if (syncingIds.has(reminder.id)) return
    setSyncingIds((s) => new Set(s).add(reminder.id))

    try {
      const targetDate = reminder.eventDate || reminder.registrationDeadline || reminder.dueAt
      const title = `${reminder.company ? reminder.company + " — " : ""}${reminder.jobTitle || reminder.message}`
      const res = await fetch("/api/google-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderId: reminder.id,
          title,
          description: reminder.message,
          startDate: targetDate,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ type: "success", title: "Added to Google Calendar! 📅" })
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      queryClient.invalidateQueries({ queryKey: ["gcal-events"] })
    } catch {
      toast({ type: "error", title: "Failed to sync to Google Calendar" })
    } finally {
      setSyncingIds((s) => {
        const next = new Set(s)
        next.delete(reminder.id)
        return next
      })
    }
  }

  // ── Calendar helpers ────────────────────────────────────────────────────
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1)
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const startPad = firstDay.getDay()
  const calDays = Array.from({ length: startPad + daysInMonth }, (_, i) =>
    i < startPad ? null : i - startPad + 1
  )

  const remindersByDay = useMemo(() => {
    const map: Record<number, Reminder[]> = {}
    reminders.forEach((r) => {
      const checkDate = r.eventDate || r.registrationDeadline || r.dueAt
      const d = new Date(checkDate)
      if (d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear()) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(r)
      }
    })
    return map
  }, [reminders, calMonth])

  const gcalByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}
    gcalEvents.forEach((ev) => {
      const d = new Date(ev.start)
      if (d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear()) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(ev)
      }
    })
    return map
  }, [gcalEvents, calMonth])

  const pending = reminders.filter((r) => !r.done)
  const overdue = pending.filter((r) => new Date(r.eventDate || r.registrationDeadline || r.dueAt) < new Date())

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Reminders</h1>
            {overdue.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-pulse">
                {overdue.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending.length} pending · {overdue.length} overdue · Email alerts active
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card/40 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-lg transition-all text-xs font-medium px-3", viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn("p-1.5 rounded-lg transition-all text-xs font-medium px-3", viewMode === "calendar" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Reminder
          </button>
        </div>
      </div>

      {/* Google Calendar connect banner */}
      <CalendarConnectBanner connected={calendarConnected} />

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {(["pending", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl border px-4 py-2 text-xs font-semibold transition-all capitalize whitespace-nowrap flex-shrink-0",
              filter === f ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card/20 text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main layout — sidebar on desktop */}
      <div className="flex flex-col xl:flex-row gap-5">
        {/* List / Calendar */}
        <div className="flex-1 min-w-0">
          {viewMode === "list" && (
            <div className="space-y-3">
              {isLoading && (
                <div className="space-y-3">
                  {Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-card/20 animate-pulse" />
                  ))}
                </div>
              )}
              {!isLoading && reminders.length === 0 && (
                <div className="flex flex-col items-center py-16 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-semibold text-foreground">No reminders</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first reminder to get email alerts.</p>
                </div>
              )}
              {reminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  calendarConnected={calendarConnected}
                  onToggle={() => toggleMutation.mutate({ id: r.id, done: !r.done })}
                  onSnooze={(s) => snoozeMutation.mutate({ id: r.id, snooze: s })}
                  onDelete={() => deleteMutation.mutate(r.id)}
                  onSyncToCalendar={() => syncToCalendar(r)}
                />
              ))}
            </div>
          )}

          {viewMode === "calendar" && (
            <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-md overflow-hidden">
              {/* Calendar nav */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <button
                  onClick={() => setCalMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="font-semibold text-foreground text-sm">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</h2>
                <button
                  onClick={() => setCalMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all"
                >
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
                  const hasGcal = day && gcalByDay[day]
                  const isToday = day &&
                    new Date().getDate() === day &&
                    new Date().getMonth() === calMonth.getMonth() &&
                    new Date().getFullYear() === calMonth.getFullYear()

                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[60px] md:min-h-[80px] border-b border-r border-border/20 p-1.5",
                        !day && "bg-secondary/5",
                        isToday && "bg-primary/5"
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn(
                            "flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full text-[10px] md:text-xs font-semibold",
                            isToday ? "bg-primary text-white" : "text-foreground"
                          )}>
                            {day}
                          </span>
                          <div className="mt-0.5 space-y-0.5">
                            {hasReminders && remindersByDay[day].slice(0, 2).map((r) => {
                              const cfg = TYPE_CONFIG[r.type]
                              return (
                                <div key={r.id} className={cn("rounded px-1 py-0.5 text-[8px] md:text-[9px] font-medium truncate", cfg.bg, cfg.color)}>
                                  {r.company || r.message}
                                </div>
                              )
                            })}
                            {hasGcal && gcalByDay[day].slice(0, 1).map((ev) => (
                              <div key={ev.id} className="rounded px-1 py-0.5 text-[8px] md:text-[9px] font-medium truncate bg-indigo-100 text-indigo-600">
                                📅 {ev.title}
                              </div>
                            ))}
                            {((remindersByDay[day]?.length ?? 0) + (gcalByDay[day]?.length ?? 0)) > 2 && (
                              <div className="text-[8px] text-muted-foreground">
                                +{((remindersByDay[day]?.length ?? 0) + (gcalByDay[day]?.length ?? 0)) - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Google Calendar Sidebar */}
        <div className="xl:w-72 space-y-4 flex-shrink-0">
          <GoogleCalendarPanel
            connected={calendarConnected}
            events={gcalEvents}
            isLoading={gcalLoading}
            onRefresh={() => refetchGcal()}
          />
        </div>
      </div>

      <AddReminderModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={(data) => addMutation.mutate(data)} />
    </div>
  )
}

export default function RemindersPage() {
  return (
    <ToastProvider>
      <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <RemindersInner />
      </React.Suspense>
    </ToastProvider>
  )
}
