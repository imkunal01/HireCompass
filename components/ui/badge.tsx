"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG, STATUS_CONFIG, Priority, OpportunityStatus } from "@/types/opportunity"

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  )
}

interface CompanyAvatarProps {
  company: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
]

export function CompanyAvatar({ company, size = "md", className }: CompanyAvatarProps) {
  const colorIndex = company.charCodeAt(0) % AVATAR_COLORS.length
  const gradient = AVATAR_COLORS[colorIndex]
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white",
        `bg-gradient-to-br ${gradient}`,
        sizeClasses[size],
        className
      )}
    >
      {company.charAt(0).toUpperCase()}
    </div>
  )
}
