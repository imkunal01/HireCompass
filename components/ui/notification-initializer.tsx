"use client"

import { useEffect, useCallback } from "react"

interface Reminder {
  id: string
  company: string | null
  jobTitle: string | null
  message: string
  type: string
  dueAt: string
  eventDate?: string | null
  registrationDeadline?: string | null
  done: boolean
}

function getTimeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 1) return `${days} days`
  if (hours > 1) return `${hours} hours`
  if (minutes > 1) return `${minutes} minutes`
  return "very soon"
}

function showBrowserNotification(title: string, body: string, icon = "/logo.png", tag?: string) {
  if (typeof window === "undefined") return
  if (Notification.permission !== "granted") return
  
  try {
    const n = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: tag ?? title,
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      window.location.href = "/reminders"
      n.close()
    }
    // Auto-close after 8 seconds
    setTimeout(() => n.close(), 8000)
  } catch (e) {
    console.warn("[NotificationInitializer] Notification failed:", e)
  }
}

function checkAndNotify(reminders: Reminder[]) {
  if (!reminders?.length) return
  
  const now = Date.now()
  const notified = JSON.parse(localStorage.getItem("hc-notified") ?? "{}")
  const updated: Record<string, boolean> = { ...notified }

  for (const r of reminders) {
    if (r.done) continue

    // Check event date: notify if within 5h
    if (r.eventDate) {
      const diff = new Date(r.eventDate).getTime() - now
      if (diff > 0 && diff <= 5 * 3600000) {
        const key = `evt-5h-${r.id}`
        if (!notified[key]) {
          const title = r.company ? `${r.company} — Event Today!` : "Event coming up!"
          showBrowserNotification(
            `⚡ ${title}`,
            `${r.jobTitle || r.message || "Event"} starts in ${getTimeLeft(r.eventDate)}`,
            "/logo.png",
            key
          )
          updated[key] = true
        }
      }
      if (diff > 0 && diff <= 24 * 3600000 && diff > 5 * 3600000) {
        const key = `evt-24h-${r.id}`
        if (!notified[key]) {
          const title = r.company ? `${r.company} — Tomorrow!` : "Event tomorrow!"
          showBrowserNotification(
            `🔔 ${title}`,
            `${r.jobTitle || r.message || "Event"} is in ${getTimeLeft(r.eventDate)}`,
            "/logo.png",
            key
          )
          updated[key] = true
        }
      }
    }

    // Check registration deadline
    if (r.registrationDeadline) {
      const diff = new Date(r.registrationDeadline).getTime() - now
      if (diff > 0 && diff <= 5 * 3600000) {
        const key = `reg-5h-${r.id}`
        if (!notified[key]) {
          const title = r.company ? `${r.company} — Register Now!` : "Registration closing soon!"
          showBrowserNotification(
            `⚠️ ${title}`,
            `Registration deadline in ${getTimeLeft(r.registrationDeadline)} — Don't miss it!`,
            "/logo.png",
            key
          )
          updated[key] = true
        }
      }
      if (diff > 0 && diff <= 24 * 3600000 && diff > 5 * 3600000) {
        const key = `reg-24h-${r.id}`
        if (!notified[key]) {
          const title = r.company ? `${r.company} — Register Tomorrow!` : "Registration closes tomorrow!"
          showBrowserNotification(
            `📋 ${title}`,
            `Registration for ${r.jobTitle || r.message || "opportunity"} closes in ${getTimeLeft(r.registrationDeadline)}`,
            "/logo.png",
            key
          )
          updated[key] = true
        }
      }
    }

    // Check general dueAt
    const diff = new Date(r.dueAt).getTime() - now
    if (!r.eventDate && !r.registrationDeadline && diff > 0 && diff <= 3 * 3600000) {
      const key = `due-${r.id}`
      if (!notified[key]) {
        const title = r.company ? `${r.company}` : "Reminder due soon!"
        showBrowserNotification(
          `⏰ ${title}`,
          `${r.jobTitle || r.message} — Due in ${getTimeLeft(r.dueAt)}`,
          "/logo.png",
          key
        )
        updated[key] = true
      }
    }
  }

  localStorage.setItem("hc-notified", JSON.stringify(updated))
}

export default function NotificationInitializer() {
  const fetchAndCheck = useCallback(async () => {
    if (typeof window === "undefined") return
    if (Notification.permission !== "granted") return

    try {
      const res = await fetch("/api/reminders?status=pending")
      if (!res.ok) return
      const reminders: Reminder[] = await res.json()
      checkAndNotify(reminders)
    } catch (e) {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Initial check
    fetchAndCheck()

    // Re-check every 30 minutes
    const interval = setInterval(fetchAndCheck, 30 * 60 * 1000)

    // Also check when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchAndCheck()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchAndCheck])

  return null // Pure side-effect component
}
