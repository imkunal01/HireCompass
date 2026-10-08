"use client"

import React, { useState } from "react"
import { MessageSquarePlus, Lightbulb, Star, Send, CheckCircle2, Sparkles, MessageSquare } from "lucide-react"

export default function DashboardFeedbackWidget() {
  const [type, setType] = useState<"feedback" | "suggestion">("feedback")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [category, setCategory] = useState("General")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const categories = [
    "General",
    "AI Coding Assessment",
    "DSA Sheets",
    "Resume Studio",
    "Job Tracker",
    "UI & Experience",
    "Other",
  ]

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
          pageUrl: "/dashboard",
        }),
      })

      if (res.ok) {
        setIsSubmitted(true)
        setMessage("")
        if (typeof window !== "undefined") {
          localStorage.setItem("hirecompass_feedback_submitted", "true")
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 sm:p-7">
      
      {/* Aurora Ambient Background Highlight */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-2xl" />

      {isSubmitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Thank you for sharing your thoughts! 🎉
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your {type === "suggestion" ? "suggestion" : "feedback"} has been recorded for the engineering team. We read every response to build a better experience for all job seekers.
          </p>
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Submit another suggestion or note
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Community Feedback & Suggestions</span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                    Direct to Team
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share your assessment experience, request new problem sheets, or suggest website improvements.
                </p>
              </div>
            </div>

            {/* Type Switcher Pills */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setType("feedback")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  type === "feedback"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Feedback</span>
              </button>
              <button
                type="button"
                onClick={() => setType("suggestion")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  type === "suggestion"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Feature Suggestion</span>
              </button>
            </div>
          </div>

          {/* Form Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Rating & Category */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Overall Satisfaction
                </label>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
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
                  <span className="text-[11px] font-semibold text-slate-500 ml-auto mr-1">
                    {hoverRating || rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category / Topic
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column: Textarea & Submit */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {type === "suggestion" ? "What feature or change would you love to see?" : "Your Feedback & Thoughts"}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    type === "suggestion"
                      ? "Describe your ideal feature, assessment tools, or problem sheets..."
                      : "Tell us about what you found helpful, or any rough edges we can smooth out..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs tracking-tight shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>{isSubmitting ? "Submitting..." : type === "suggestion" ? "Submit Suggestion" : "Submit Feedback"}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
