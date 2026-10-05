import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const

export function formatShortDate(d: Date | string | number | null | undefined): string {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ""
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`
}

export function formatFullDate(d: Date | string | number | null | undefined): string {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ""
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
