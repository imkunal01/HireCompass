"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

function getVisitorId(): string {
  if (typeof window === "undefined") return "server"
  try {
    let id = localStorage.getItem("hirecompass_visitor_id")
    if (!id) {
      id = "v_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36)
      localStorage.setItem("hirecompass_visitor_id", id)
    }
    return id
  } catch {
    return "guest_" + Date.now()
  }
}

function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop"
  const width = window.innerWidth
  if (width < 640) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

export function TelemetryTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  const sendPing = (action: "pageview" | "heartbeat") => {
    if (typeof window === "undefined") return

    try {
      const payload = {
        visitorId: getVisitorId(),
        path: pathname || "/",
        referrer: document.referrer || null,
        device: getDeviceType(),
        action,
        timestamp: new Date().toISOString(),
      }

      const bodyStr = JSON.stringify(payload)

      if (navigator.sendBeacon) {
        const blob = new Blob([bodyStr], { type: "application/json" })
        navigator.sendBeacon("/api/telemetry", blob)
      } else {
        fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr,
          keepalive: true,
        }).catch(() => {})
      }
    } catch (err) {
      // Non-blocking, ignore errors
    }
  }

  // 1. Track pageview on route change
  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return
    lastTrackedPath.current = pathname
    sendPing("pageview")
  }, [pathname])

  // 2. Heartbeat every 2.5 minutes while tab is open and visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        sendPing("heartbeat")
      }
    }, 150000) // 2.5 mins

    return () => clearInterval(interval)
  }, [pathname])

  return null
}

export default TelemetryTracker
