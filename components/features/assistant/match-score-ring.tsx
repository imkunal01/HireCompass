"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface MatchScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  animate?: boolean
  className?: string
}

const GRADE_COLORS: Record<string, { stroke: string; text: string; label: string }> = {
  "Strong Fit": { stroke: "#10b981", text: "text-emerald-400", label: "Strong Fit" },
  "Good Fit":   { stroke: "#3b82f6", text: "text-blue-400",    label: "Good Fit" },
  "Partial Fit":{ stroke: "#f59e0b", text: "text-amber-400",   label: "Partial Fit" },
  "Weak Fit":   { stroke: "#ef4444", text: "text-rose-400",    label: "Weak Fit" },
}

function getGrade(score: number) {
  if (score >= 80) return "Strong Fit"
  if (score >= 60) return "Good Fit"
  if (score >= 40) return "Partial Fit"
  return "Weak Fit"
}

export function MatchScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  animate = true,
  className,
}: MatchScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const grade = getGrade(score)
  const config = GRADE_COLORS[grade]

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  useEffect(() => {
    if (!animate || !circleRef.current) return
    // Start from 0 then animate to target
    circleRef.current.style.strokeDashoffset = String(circumference)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
          circleRef.current.style.strokeDashoffset = String(offset)
        }
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [score, offset, circumference, animate])

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary/60"
          />
          {/* Progress arc */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? circumference : offset}
            style={!animate ? {} : undefined}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-black leading-none", config.text)}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", config.text,
        grade === "Strong Fit" ? "bg-emerald-500/10" :
        grade === "Good Fit"   ? "bg-blue-500/10" :
        grade === "Partial Fit"? "bg-amber-500/10" :
                                  "bg-rose-500/10"
      )}>
        {config.label}
      </span>
    </div>
  )
}

/** Compact badge for Kanban cards */
export function FitBadge({ score }: { score: number }) {
  const grade = getGrade(score)
  const config = GRADE_COLORS[grade]
  const bgMap: Record<string, string> = {
    "Strong Fit":  "bg-emerald-500/10 text-emerald-400",
    "Good Fit":    "bg-blue-500/10 text-blue-400",
    "Partial Fit": "bg-amber-500/10 text-amber-400",
    "Weak Fit":    "bg-rose-500/10 text-rose-400",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold", bgMap[grade])}>
      <span className="h-1 w-1 rounded-full" style={{ backgroundColor: config.stroke }} />
      {score}%
    </span>
  )
}
