"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Bot,
  X,
  Send,
  Loader2,
  ChevronDown,
  Sparkles,
  BriefcaseBusiness,
  Bell,
  Calendar,
  BarChart3,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowUpRight,
  Zap,
  RotateCcw,
} from "lucide-react"

const SWEETY_STYLE = `
  @keyframes sweet-float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-4px) scale(1.05); }
  }
  .animate-sweet-float {
    animation: sweet-float 3s ease-in-out infinite;
  }
`;

function SweetyAvatar({ className, imageClass }: { className?: string; imageClass?: string }) {
  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-50 to-violet-100 border border-indigo-200/50", className)}>
      <style>{SWEETY_STYLE}</style>
      <img 
        src="/sweety-avatar.png" 
        alt="Sweety" 
        className={cn("w-full h-full object-cover animate-sweet-float", imageClass)} 
      />
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionData {
  toolName: string
  data: any
  message: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  actions?: ActionData[]
  navigateTo?: string | null
  isError?: boolean
  isTyping?: boolean
}

// ─── Quick suggestion chips ───────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "My applications", prompt: "Show me all my active job applications" },
  { label: "Pending reminders", prompt: "What reminders did I forget about?" },
  { label: "Upcoming interviews", prompt: "Do I actually have any interviews coming up?" },
  { label: "Check my stats", prompt: "Show me my job search stats" },
  { label: "Add a new job", prompt: "I want to add a new job to my tracker" },
  { label: "Ghosting radar", prompt: "Check my ghosting radar for cold applications" },
]

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    // Italics: *text*
    const iParts = part.split(/(\*[^*]+\*)/g)
    return iParts.map((ip, j) => {
      if (ip.startsWith("*") && ip.endsWith("*") && ip.length > 2) {
        return (
          <em key={j} className="italic text-indigo-600 font-medium">
            {ip.slice(1, -1)}
          </em>
        )
      }
      return <span key={j}>{ip}</span>
    })
  })
}

// ─── Action card ─────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  add_opportunity:          BriefcaseBusiness,
  update_opportunity_status: BriefcaseBusiness,
  delete_opportunity:       Trash2,
  create_reminder:          Bell,
  mark_reminder_done:       CheckCircle2,
  create_interview:         Calendar,
  get_analytics:            BarChart3,
  list_projects:            FolderGit2,
  navigate:                 ArrowUpRight,
}

function ActionCard({ action, onNavigate }: { action: ActionData; onNavigate: (path: string) => void }) {
  const Icon = TOOL_ICONS[action.toolName] ?? Zap
  const isDelete = action.toolName === "delete_opportunity"

  return (
    <div
      className={cn(
        "mt-2 rounded-xl border px-3 py-2.5 text-xs flex items-start gap-2.5 shadow-sm transition-all duration-200",
        isDelete
          ? "border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60"
          : "border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", isDelete ? "text-rose-500" : "text-indigo-500 dark:text-indigo-400")} />
      <div className="flex-1 min-w-0">
        {action.data && (
          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {action.data.company
              ? `${action.data.company}${action.data.title ? ` — ${action.data.title}` : ""}`
              : action.data.name || action.data.message || action.data.role || ""}
          </div>
        )}
        {action.data?.status && (
          <div className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Status: {action.data.status}</div>
        )}
        {action.data?.date && (
          <div className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{action.data.date}{action.data.time ? ` · ${action.data.time}` : ""}</div>
        )}
        {action.data?.dueAt && (
          <div className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Due: {new Date(action.data.dueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onNavigate,
}: {
  msg: ChatMessage
  onNavigate: (path: string) => void
}) {
  const isUser = msg.role === "user"

  if (msg.isTyping) {
    return (
      <div className="flex items-end gap-2">
        <SweetyAvatar className="w-7 h-7 rounded-full shadow-sm shadow-indigo-900/10" />
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl rounded-bl-md px-3 py-2.5">
          <TypingDots />
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm shadow-md shadow-indigo-900/10">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <SweetyAvatar className="w-7 h-7 rounded-full mt-0.5 shadow-sm shadow-indigo-900/10" />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "max-w-[90%] rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm shadow-sm",
            msg.isError
              ? "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          )}
        >
          <p className="leading-relaxed whitespace-pre-wrap break-words">{renderMarkdown(msg.content)}</p>
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="mt-1.5 max-w-[90%] space-y-1.5">
            {msg.actions.map((action, i) => (
              <ActionCard key={i} action={action} onNavigate={onNavigate} />
            ))}
          </div>
        )}
        {msg.navigateTo && (
          <button
            onClick={() => onNavigate(msg.navigateTo!)}
            className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-semibold"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Go there now
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Agent Chat Component ────────────────────────────────────────────────

const STORAGE_KEY = "hire-bot-history"
const MAX_STORED  = 30   // messages kept in localStorage
const MAX_API     = 20   // messages sent to Groq per request

const INTRO_MSG: ChatMessage = {
  role: "assistant",
  content:
    "Oh, look who finally decided to show up. What do you need me to fix for you today? And please tell me you are not here to procrastinate again.",
}

export default function AgentChat() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MSG])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [welcomePopup, setWelcomePopup] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Load history from localStorage on mount ─────────────────────────────
  useEffect(() => {
    setMounted(true)
    const popups = [
      "Oh, you're back. Hope you're actually going to apply to jobs this time.",
      "Don't just stare at the screen. Get to work.",
      "I was having a peaceful day until you showed up. What do you want?",
      "Are you going to track your applications or wait for them to track themselves?",
      "Finally online? Hurry up, we have work to do.",
      "Stop overthinking and just apply. What do you need?",
    ]
    setWelcomePopup(popups[Math.floor(Math.random() * popups.length)])
    const timer = setTimeout(() => setWelcomePopup(null), 10000)

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      // Corrupt data — start fresh
      localStorage.removeItem(STORAGE_KEY)
    }
    return () => clearTimeout(timer)
  }, [])

  // ── Persist history to localStorage whenever messages change ────────────
  useEffect(() => {
    if (!mounted) return
    const toSave = messages
      .filter((m) => !m.isTyping)          // never persist the typing indicator
      .slice(-MAX_STORED)                  // keep only the last N
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // Storage full — fail silently
    }
  }, [messages, mounted])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 100)
      setHasNewMessage(false)
    }
  }, [open, messages])

  useEffect(() => {
    if (!open && messages.length > 1) {
      const last = messages[messages.length - 1]
      if (last.role === "assistant") setHasNewMessage(true)
    }
  }, [messages, open])

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
      setOpen(false)
    },
    [router]
  )

  const sendMessage = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim()
      if (!userText || loading) return

      setInput("")
      const userMsg: ChatMessage = { role: "user", content: userText }
      const typingMsg: ChatMessage = { role: "assistant", content: "", isTyping: true }

      setMessages((prev) => [...prev, userMsg, typingMsg])
      setLoading(true)

      // Build history for API — exclude typing, trim to MAX_API, enrich with action data
      // Appending action summaries to assistant content ensures the LLM always knows
      // what it fetched/created in previous turns (context memory).
      const history = [...messages, userMsg]
        .filter((m) => !m.isTyping)
        .slice(-MAX_API)
        .map((m) => {
          let content = m.content || ""
          // If this assistant turn had actions, append a compact summary so the
          // next LLM call can refer back to what was done / what data was returned.
          if (m.role === "assistant" && m.actions && m.actions.length > 0) {
            const actionSummary = m.actions
              .map((a) => {
                // Strip markdown bold markers for clean context
                const msg = a.message.replace(/\*\*/g, "")
                // For list-type actions, include the data items
                if (Array.isArray(a.data) && a.data.length > 0) {
                  const items = a.data
                    .slice(0, 10)
                    .map((item: any) =>
                      [item.company, item.title, item.role, item.name, item.message]
                        .filter(Boolean)
                        .join(" — ")
                    )
                    .join("; ")
                  return `${msg} [Items: ${items}]`
                }
                return msg
              })
              .join(" | ")
            if (actionSummary && !content.includes(actionSummary.slice(0, 20))) {
              content = content ? `${content}\n[Actions taken: ${actionSummary}]` : `[Actions taken: ${actionSummary}]`
            }
          }
          return { role: m.role, content }
        })

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        })

        const data = await res.json()

        if (!res.ok) {
          setMessages((prev) => [
            ...prev.filter((m) => !m.isTyping),
            {
              role: "assistant",
              content: data.error ?? "Something went wrong. Please try again.",
              isError: true,
            },
          ])
          return
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.content || "",
          actions: data.actions ?? [],
          navigateTo: data.navigateTo ?? null,
        }

        setMessages((prev) => [...prev.filter((m) => !m.isTyping), assistantMsg])

        // Auto-navigate if triggered
        if (data.navigateTo) {
          setTimeout(() => navigate(data.navigateTo), 800)
        }
      } catch {
        setMessages((prev) => [
          ...prev.filter((m) => !m.isTyping),
          {
            role: "assistant",
            content: "Network error. Please check your connection and try again.",
            isError: true,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, messages, navigate]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    const freshMsg: ChatMessage = { role: "assistant", content: "Chat cleared! Memory wiped. How can I help you?" }
    setMessages([freshMsg])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const rememberedCount = messages.filter((m) => !m.isTyping && m.role !== "assistant" || m === messages[0]).length

  if (!mounted) return null

  return createPortal(
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={cn(
          "fixed bottom-24 right-4 sm:right-6 z-[9998]",
          "w-[calc(100vw-2rem)] sm:w-[380px]",
          "flex flex-col",
          "rounded-2xl overflow-hidden",
          "shadow-2xl shadow-indigo-900/20 dark:shadow-black/60 ring-1 ring-slate-900/5 dark:ring-white/10",
          "border border-white/80 dark:border-slate-800/80",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl",
          "transition-all duration-300 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{
          maxHeight: "min(600px, calc(100dvh - 160px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/60 shrink-0">
          <SweetyAvatar className="w-10 h-10 rounded-[14px] shadow-sm shadow-indigo-900/10" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sweety</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Personal Assistant
              {messages.length > 1 && (
                <span className="ml-1.5 text-indigo-500/80 dark:text-indigo-400">
                  · {messages.filter(m => !m.isTyping).length} messages
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-4 scroll-smooth bg-slate-50/30 dark:bg-slate-950/40">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onNavigate={navigate} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions (shown only when 1 message = intro) */}
        {messages.length === 1 && (
          <div className="px-3.5 pb-4 shrink-0 bg-slate-50/30 dark:bg-slate-950/40">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2.5 font-bold uppercase tracking-wider pl-1">Suggested for you</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.prompt}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={loading}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 shadow-sm transition-all disabled:opacity-40 font-medium"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3.5 pb-3.5 shrink-0 border-t border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 pt-3.5">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-inner-sm focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want now..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none min-h-[20px] max-h-[100px] overflow-y-auto leading-5 pt-0.5 disabled:opacity-50"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                input.trim() && !loading
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2.5 font-medium">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>

      {/* ── Floating Trigger Button ───────────────────────────────────────── */}
      <button
        onClick={() => setOpen((p) => !p)}
        id="hire-bot-trigger"
        className={cn(
          "fixed bottom-6 right-4 sm:right-6 z-[9999]",
          "w-14 h-14 rounded-2xl",
          "flex items-center justify-center",
          "shadow-card-xl transition-all duration-300 ease-out",
          "hover:scale-105 active:scale-95",
          open
            ? "bg-slate-800 dark:bg-slate-700 rotate-0"
            : "btn-primary-glow bg-gradient-to-br from-indigo-500 to-violet-600"
        )}
        aria-label="Open Sweety"
      >
        {/* Glow pulse when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl bg-indigo-500/40 animate-ping" style={{ animationDuration: "3s" }} />
        )}

        {open ? (
          <X className="h-6 w-6 text-white relative z-10" />
        ) : (
          <>
            <SweetyAvatar className="w-12 h-12 rounded-[14px] z-10 bg-transparent border-none shadow-none" imageClass="drop-shadow-md" />
            {hasNewMessage && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white flex items-center justify-center z-20 shadow-sm animate-bounce">
                !
              </span>
            )}
          </>
        )}
      </button>

      {/* Sweet Welcome Popup */}
      {!open && welcomePopup && (
        <div
          className={cn(
            "fixed bottom-8 right-20 sm:right-24 z-[9997]",
            "flex items-center gap-3 px-4 py-3 rounded-2xl rounded-br-sm",
            "bg-white/95 dark:bg-slate-800/95 border border-indigo-100 dark:border-slate-750 shadow-card-xl dark:shadow-black/50",
            "text-slate-800 dark:text-slate-100 text-sm font-medium max-w-[280px]",
            "animate-in slide-in-from-right-4 fade-in duration-500",
            "backdrop-blur-md"
          )}
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="leading-snug">{welcomePopup}</span>
        </div>
      )}
    </>,
    document.body
  )
}
