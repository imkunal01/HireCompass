import { ResumeSessionSnapshot } from "@/types/resume-session"

export const RESUME_SESSION_KEYS = {
  ASSESSMENT_SNAPSHOT: "hirecompass_active_assessment_snapshot",
  SHEET_SNAPSHOT: "hirecompass_active_sheet_snapshot",
  PREP_SNAPSHOT: "hirecompass_active_prep_snapshot",
  DISMISSED_KEYS: "hirecompass_dismissed_session_ids",
} as const

const SESSION_UPDATE_EVENT = "hirecompass_session_update"

function emitSessionUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_UPDATE_EVENT))
  }
}

export function subscribeToSessionUpdates(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(SESSION_UPDATE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(SESSION_UPDATE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

// ── Assessment Session Storage ──────────────────────────────────────────────
export function saveAssessmentSessionSnapshot(snapshot: ResumeSessionSnapshot) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      RESUME_SESSION_KEYS.ASSESSMENT_SNAPSHOT,
      JSON.stringify({ ...snapshot, lastActive: new Date().toISOString() })
    )
    unmarkDismissed(snapshot.id)
    emitSessionUpdate()
  } catch (e) {
    console.error("[saveAssessmentSessionSnapshot]", e)
  }
}

export function clearAssessmentSessionSnapshot() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(RESUME_SESSION_KEYS.ASSESSMENT_SNAPSHOT)
    localStorage.removeItem("hirecompass_active_assessment_id")
    emitSessionUpdate()
  } catch (e) {
    console.error("[clearAssessmentSessionSnapshot]", e)
  }
}

// ── Sheet / DSA Session Storage ─────────────────────────────────────────────
export function saveSheetSessionSnapshot(snapshot: ResumeSessionSnapshot) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      RESUME_SESSION_KEYS.SHEET_SNAPSHOT,
      JSON.stringify({ ...snapshot, lastActive: new Date().toISOString() })
    )
    unmarkDismissed(snapshot.id)
    emitSessionUpdate()
  } catch (e) {
    console.error("[saveSheetSessionSnapshot]", e)
  }
}

export function clearSheetSessionSnapshot() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(RESUME_SESSION_KEYS.SHEET_SNAPSHOT)
    emitSessionUpdate()
  } catch (e) {
    console.error("[clearSheetSessionSnapshot]", e)
  }
}

// ── Prep Tools Session Storage ──────────────────────────────────────────────
export function savePrepSessionSnapshot(snapshot: ResumeSessionSnapshot) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      RESUME_SESSION_KEYS.PREP_SNAPSHOT,
      JSON.stringify({ ...snapshot, lastActive: new Date().toISOString() })
    )
    unmarkDismissed(snapshot.id)
    emitSessionUpdate()
  } catch (e) {
    console.error("[savePrepSessionSnapshot]", e)
  }
}

export function clearPrepSessionSnapshot() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(RESUME_SESSION_KEYS.PREP_SNAPSHOT)
    emitSessionUpdate()
  } catch (e) {
    console.error("[clearPrepSessionSnapshot]", e)
  }
}

// ── Dismissed Sessions ──────────────────────────────────────────────────────
export function getDismissedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RESUME_SESSION_KEYS.DISMISSED_KEYS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function dismissSessionId(id: string) {
  if (typeof window === "undefined") return
  try {
    const dismissed = getDismissedIds()
    if (!dismissed.includes(id)) {
      dismissed.push(id)
      localStorage.setItem(
        RESUME_SESSION_KEYS.DISMISSED_KEYS,
        JSON.stringify(dismissed)
      )
    }
    emitSessionUpdate()
  } catch (e) {
    console.error("[dismissSessionId]", e)
  }
}

function unmarkDismissed(id: string) {
  if (typeof window === "undefined") return
  try {
    const dismissed = getDismissedIds().filter((d) => d !== id)
    localStorage.setItem(
      RESUME_SESSION_KEYS.DISMISSED_KEYS,
      JSON.stringify(dismissed)
    )
  } catch {}
}

export function getStoredSessionSnapshots(): ResumeSessionSnapshot[] {
  if (typeof window === "undefined") return []
  const dismissed = new Set(getDismissedIds())
  const results: ResumeSessionSnapshot[] = []

  const keys = [
    RESUME_SESSION_KEYS.ASSESSMENT_SNAPSHOT,
    RESUME_SESSION_KEYS.SHEET_SNAPSHOT,
    RESUME_SESSION_KEYS.PREP_SNAPSHOT,
  ]

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const item: ResumeSessionSnapshot = JSON.parse(raw)
      if (item && item.id && !dismissed.has(item.id)) {
        results.push(item)
      }
    } catch {}
  }

  // Sort by most recently active first
  return results.sort((a, b) => {
    const timeA = new Date(a.lastActive || 0).getTime()
    const timeB = new Date(b.lastActive || 0).getTime()
    return timeB - timeA
  })
}
