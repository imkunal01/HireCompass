"use client"

import React, { useState, useEffect } from "react"
import { AlertTriangle, Clock, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface RateLimitBannerProps {
  message: string
  retryAfter?: number | null  // seconds
  onRetry?: () => void
  className?: string
}

export function RateLimitBanner({ message, retryAfter, onRetry, className }: RateLimitBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter ?? 0)
  const [canRetry, setCanRetry] = useState(!retryAfter || retryAfter <= 0)

  useEffect(() => {
    if (!retryAfter || retryAfter <= 0) return
    setSecondsLeft(retryAfter)
    setCanRetry(false)
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          setCanRetry(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [retryAfter])

  const isQuotaExhausted = message.toLowerCase().includes("daily") || message.toLowerCase().includes("tomorrow")

  return (
    <div className={cn(
      "rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-amber-300">
            {isQuotaExhausted ? "Daily AI Quota Exhausted" : "Gemini Rate Limit Hit"}
          </p>
          <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">
            {isQuotaExhausted
              ? "You've used all free-tier requests for today across all Gemini models. The quota resets at midnight Pacific Time."
              : message}
          </p>
        </div>
      </div>

      {/* Countdown or action */}
      {!isQuotaExhausted && secondsLeft > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
          <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-sm text-amber-300 font-mono font-semibold">
            {secondsLeft}s
          </span>
          <span className="text-xs text-amber-200/70">until retry is available</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </button>
        )}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-200/70 hover:text-amber-300 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Get a new API key
        </a>
        <a
          href="https://ai.google.dev/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-200/70 hover:text-amber-300 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Enable billing (paid tier)
        </a>
      </div>

      {/* What's happening explanation */}
      <details className="group">
        <summary className="text-[11px] text-amber-200/50 cursor-pointer hover:text-amber-300 transition-colors list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
          Why am I seeing this?
        </summary>
        <div className="mt-2 text-[11px] text-amber-200/50 space-y-1 leading-relaxed pl-3 border-l border-amber-500/20">
          <p>The Gemini free tier allows <strong className="text-amber-200/70">1,500 requests/day</strong> and <strong className="text-amber-200/70">15 requests/minute</strong> across all your API usage.</p>
          <p>ApplyFlow automatically tries <strong className="text-amber-200/70">3 different Gemini models</strong> before giving up. All free-tier quotas are shared per API key per day.</p>
          <p>To remove limits: enable billing at Google AI Studio (~$0.075 per 1M tokens with Gemini 1.5 Flash).</p>
        </div>
      </details>
    </div>
  )
}
