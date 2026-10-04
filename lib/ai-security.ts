import crypto from "crypto"
import { NextResponse } from "next/server"

/**
 * Global AI Usage Security & Token Drainage Defense Framework for HireCompass
 * 
 * Protects all LLM interactions against:
 * 1. Sliding Window Burst Attacks (rate limiting per minute)
 * 2. Concurrent In-Flight Flooding (mutex lock per user preventing parallel race conditions)
 * 3. Payload Bloat / Context Window Drainage (message history & input character ceilings)
 * 4. Duplicate Prompt / Replay Spamming (fast hash deduplication within 4s window)
 * 5. Output Token Runaway (strict max_tokens constants)
 */

// ─── 1. Output Token Ceilings ──────────────────────────────────────────────────

export const AI_MAX_TOKENS = {
  CHAT_COMPLETION: 1024,
  ASSESSMENT_TURN: 1200,
  WAR_ROOM_DOSSIER: 850,
  GRILLER_EVALUATION: 850,
  STAR_STORY_MATRIX: 1000,
  REMEDIATION_DRILL: 850,
  JD_PARSER: 600,
  QUICK_HELPER: 500,
  CSV_ALIGN: 400,
  SCRAPER_EXTRACT: 800,
} as const

// ─── 2. In-Memory Sliding Window State ─────────────────────────────────────────

interface SlidingWindowRecord {
  timestamps: number[]
}

interface InFlightLock {
  startedAt: number
  timer: NodeJS.Timeout
}

interface PromptReplayRecord {
  hash: string
  timestamp: number
}

// Global state maps with periodic garbage collection
const rateLimitMap = new Map<string, SlidingWindowRecord>()
const inFlightLockMap = new Map<string, InFlightLock>()
const promptReplayMap = new Map<string, PromptReplayRecord>()

// Sweep stale entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()

    // Clean rate limits
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 120000)
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key)
      }
    }

    // Clean replay cache
    for (const [key, record] of promptReplayMap.entries()) {
      if (now - record.timestamp > 10000) {
        promptReplayMap.delete(key)
      }
    }

    // Clean orphaned in-flight locks (> 60s)
    for (const [key, lock] of inFlightLockMap.entries()) {
      if (now - lock.startedAt > 60000) {
        clearTimeout(lock.timer)
        inFlightLockMap.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS).unref?.()
}

// ─── 3. Input Sanitization & Payload Bounding ──────────────────────────────────

export const DEFAULT_MAX_INPUT_CHARS = 3000
export const DEFAULT_MAX_HISTORY_TURNS = 8
export const DEFAULT_MAX_MSG_CHARS = 2500

/**
 * Sanitizes and truncates a single prompt string.
 */
export function sanitizePromptText(
  input: string | undefined | null,
  maxChars = DEFAULT_MAX_INPUT_CHARS
): string {
  if (!input || typeof input !== "string") return ""
  // Strip null bytes and normalize whitespace
  const sanitized = input.replace(/\0/g, "").trim()
  return sanitized.slice(0, maxChars)
}

/**
 * Bounds and sanitizes a multi-turn chat history to prevent payload bloat attacks.
 */
export function boundChatMessages<T extends { role: string; content?: any }>(
  messages: T[] | undefined | null,
  maxTurns = DEFAULT_MAX_HISTORY_TURNS,
  maxCharPerMsg = DEFAULT_MAX_MSG_CHARS
): T[] {
  if (!messages || !Array.isArray(messages)) return []

  // Retain only the latest `maxTurns` messages
  const recent = messages.slice(-maxTurns)

  return recent.map((msg) => {
    if (typeof msg.content === "string") {
      return {
        ...msg,
        content: msg.content.replace(/\0/g, "").slice(0, maxCharPerMsg),
      }
    }
    return msg
  })
}

// ─── 4. Rate Limiting & Concurrency Mutex ───────────────────────────────────────

export interface AiSecurityCheckOptions {
  userId: string
  userInput?: string
  messages?: Array<{ role: string; content?: any }>
  maxRequestsPerMinute?: number
  maxInputChars?: number
  maxHistoryTurns?: number
  checkDuplicate?: boolean
  enforceConcurrencyLock?: boolean
}

export interface AiSecurityCheckResult {
  allowed: boolean
  error?: string
  status?: number
  retryAfterSeconds?: number
  sanitizedInput?: string
  sanitizedMessages?: any[]
  releaseLock?: () => void
}

/**
 * Centralized guard checking velocity, concurrent requests, duplicate spam,
 * and payload bounding for all AI endpoints.
 */
export async function verifyAiRequestSecurity(
  options: AiSecurityCheckOptions
): Promise<AiSecurityCheckResult> {
  const {
    userId,
    userInput,
    messages,
    maxRequestsPerMinute = 12,
    maxInputChars = DEFAULT_MAX_INPUT_CHARS,
    maxHistoryTurns = DEFAULT_MAX_HISTORY_TURNS,
    checkDuplicate = true,
    enforceConcurrencyLock = true,
  } = options

  if (!userId) {
    return {
      allowed: false,
      error: "Authentication required for AI operations.",
      status: 401,
    }
  }

  const now = Date.now()

  // ── A. Concurrency Mutex Check (Prevent Parallel Race Flooding) ──
  if (enforceConcurrencyLock) {
    const existingLock = inFlightLockMap.get(userId)
    if (existingLock) {
      const elapsed = Math.round((now - existingLock.startedAt) / 1000)
      if (elapsed < 45) {
        return {
          allowed: false,
          error: "Another AI generation is currently processing for your account. Please wait a moment.",
          status: 429,
          retryAfterSeconds: 3,
        }
      }
      // Stale lock expired (>45s) -> clear it
      clearTimeout(existingLock.timer)
      inFlightLockMap.delete(userId)
    }
  }

  // ── B. Duplicate Prompt Replay Blocker ───────────────────────────
  const sanitizedInput = userInput ? sanitizePromptText(userInput, maxInputChars) : ""
  if (checkDuplicate && sanitizedInput && sanitizedInput.length > 5) {
    const promptHash = crypto
      .createHash("sha256")
      .update(`${userId}:${sanitizedInput}`)
      .digest("hex")

    const lastReplay = promptReplayMap.get(userId)
    if (lastReplay && lastReplay.hash === promptHash && now - lastReplay.timestamp < 3500) {
      return {
        allowed: false,
        error: "Duplicate request detected. Please wait a moment before sending the same message.",
        status: 429,
        retryAfterSeconds: 4,
      }
    }

    promptReplayMap.set(userId, { hash: promptHash, timestamp: now })
  }

  // ── C. Sliding Window Velocity Rate Limiter ──────────────────────
  const WINDOW_MS = 60 * 1000
  let record = rateLimitMap.get(userId)
  if (!record) {
    record = { timestamps: [] }
    rateLimitMap.set(userId, record)
  }

  // Retain only requests within the active 60-second window
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS)

  if (record.timestamps.length >= maxRequestsPerMinute) {
    const oldest = record.timestamps[0]
    const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000))

    return {
      allowed: false,
      error: `AI rate limit exceeded (${maxRequestsPerMinute} req/min). Please slow down and try again in ${retryAfter}s.`,
      status: 429,
      retryAfterSeconds: retryAfter,
    }
  }

  // Record this request timestamp
  record.timestamps.push(now)

  // ── D. Acquire Concurrency Lock if enabled ───────────────────────
  let releaseLock: (() => void) | undefined
  if (enforceConcurrencyLock) {
    const timeoutHandle = setTimeout(() => {
      inFlightLockMap.delete(userId)
    }, 45000)

    inFlightLockMap.set(userId, {
      startedAt: now,
      timer: timeoutHandle,
    })

    releaseLock = () => {
      const lock = inFlightLockMap.get(userId)
      if (lock) {
        clearTimeout(lock.timer)
        inFlightLockMap.delete(userId)
      }
    }
  }

  // ── E. Sanitize & Bound Payload ──────────────────────────────────
  const sanitizedMessages = messages
    ? boundChatMessages(messages, maxHistoryTurns)
    : undefined

  return {
    allowed: true,
    sanitizedInput,
    sanitizedMessages,
    releaseLock,
  }
}

/**
 * Generates a standardized Next.js JSON response for blocked/rate-limited AI operations,
 * including Retry-After header and detailed status.
 */
export function createAiRateLimitResponse(check: AiSecurityCheckResult) {
  return NextResponse.json(
    {
      error: check.error || "AI rate limit exceeded. Please wait a moment.",
      isRateLimited: true,
      retryAfterSeconds: check.retryAfterSeconds,
    },
    {
      status: check.status || 429,
      headers: check.retryAfterSeconds
        ? { "Retry-After": String(check.retryAfterSeconds) }
        : undefined,
    }
  )
}

