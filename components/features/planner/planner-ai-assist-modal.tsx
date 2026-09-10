"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import { PlannerTask } from "@/types/planner"

interface Props {
  task: PlannerTask
  onClose: () => void
}

interface AssistData {
  summary?: string
  keyPrinciples?: string[]
  interviewQuestions?: string[]
  actionChecklist?: string[]
}

export default function PlannerAiAssistModal({ task, onClose }: Props) {
  const [data, setData] = useState<AssistData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchAssist() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/planner/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskTitle: task.title,
            category: task.category,
            description: task.description,
          }),
        })
        if (res.ok && isMounted) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error("Assist fetch error:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchAssist()

    return () => {
      isMounted = false
    }
  }, [task])

  const handleCopy = () => {
    if (!data) return
    const text = [
      `Task: ${task.title}`,
      `Summary: ${data.summary || ""}`,
      "\nKey Principles:",
      ...(data.keyPrinciples?.map((p) => `- ${p}`) || []),
      "\nLikely Interview Questions:",
      ...(data.interviewQuestions?.map((q) => `? ${q}`) || []),
    ].join("\n")

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 md:p-7 flex flex-col gap-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} /> AI Study Breakdown & Drills
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 size={26} className="animate-spin text-indigo-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Extracting core concepts & interview questions...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Summary */}
            {data?.summary && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-l-4 border-l-indigo-500">
                {data.summary}
              </div>
            )}

            {/* Principles */}
            {data?.keyPrinciples && data.keyPrinciples.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} className="text-indigo-500" /> Core Principles
                </span>
                <div className="flex flex-col gap-1.5">
                  {data.keyPrinciples.map((principle, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{principle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview questions */}
            {data?.interviewQuestions && data.interviewQuestions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={12} className="text-amber-500" /> Likely Interview Questions
                </span>
                <div className="flex flex-col gap-1.5">
                  {data.interviewQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy Notes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Ready to Study
          </button>
        </div>
      </div>
    </div>
  )
}
