"use client"

import React, { useState, useEffect } from "react"
import { Star, MessageSquarePlus, Sparkles, X, CheckCircle2 } from "lucide-react"

export default function FeedbackAutoPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [type, setType] = useState<"feedback" | "suggestion">("feedback")
  const [category, setCategory] = useState("General")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Never pop feedback prompt in exam mode
    if (
      document.body.classList.contains("exam-mode-active") ||
      document.body.getAttribute("data-in-exam") === "true"
    ) {
      return
    }

    // Check if feedback already submitted
    if (localStorage.getItem("hirecompass_feedback_submitted") === "true") {
      return
    }

    // Check if recently dismissed
    const dismissedUntil = localStorage.getItem("hirecompass_feedback_dismissed_until")
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return
    }

    // Track visit count using session latch
    const sessionTracked = sessionStorage.getItem("hirecompass_visit_session_tracked")
    let currentVisits = parseInt(localStorage.getItem("hirecompass_visit_count") || "0", 10)

    if (!sessionTracked) {
      currentVisits += 1
      localStorage.setItem("hirecompass_visit_count", String(currentVisits))
      sessionStorage.setItem("hirecompass_visit_session_tracked", "true")
    }

    // Trigger auto-prompt if visited 2 or more times
    if (currentVisits >= 2) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3500) // gentle 3.5s delay after landing
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsOpen(false)
    if (typeof window !== "undefined") {
      // Dismiss for 2 days so it doesn't spam
      const twoDaysFromNow = Date.now() + 2 * 24 * 60 * 60 * 1000
      localStorage.setItem("hirecompass_feedback_dismissed_until", String(twoDaysFromNow))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating,
          category,
          message: message.trim(),
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      })

      if (res.ok) {
        setIsSubmitted(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("hirecompass_feedback_submitted", "true")
        }
        setTimeout(() => {
          setIsOpen(false)
        }, 1800)
      }
    } catch {
      // Error handled quietly
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss feedback prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your insights help us continuously polish HireCompass into the ultimate career navigation platform.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Quick Check-In
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  How is HireCompass working for you?
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We noticed you&apos;ve explored the platform a few times. Please share your rating and any suggestions to make it better!
            </p>

            {/* Star Rating */}
            <div className="flex flex-col items-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Rate your experience
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform focus:outline-hidden"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          active
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "fill-transparent text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType("feedback")}
                className={`py-1.5 rounded-lg transition-all ${
                  type === "feedback"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Feedback
              </button>
              <button
                type="button"
                onClick={() => setType("suggestion")}
                className={`py-1.5 rounded-lg transition-all ${
                  type === "suggestion"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Suggestion
              </button>
            </div>

            {/* Message Area */}
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder={
                  type === "suggestion"
                    ? "Tell us what features, sheets, or tools you'd love to see..."
                    : "What do you like, or what could be improved?"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>{isSubmitting ? "Sending..." : "Send Feedback"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
