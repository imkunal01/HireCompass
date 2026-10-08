import clientPromise from "@/lib/mongodb"

export interface AssessmentGlobalSettings {
  globalTokenLimit: number
  defaultTimeLimitMinutes: number
  updatedAt?: string | Date
  updatedBy?: string
}

const SETTINGS_KEY = "assessment_global_settings"
let cachedSettings: AssessmentGlobalSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 15000 // 15-second in-memory cache to reduce database load
const DEFAULT_GLOBAL_TOKEN_LIMIT = 2000
const DEFAULT_TIME_LIMIT_MINUTES = 30

/**
 * Retrieves the global default configuration for AI-assisted coding assessments.
 * If not set by admin, defaults to 2,000 tokens and 30 minutes.
 */
export async function getAssessmentGlobalSettings(): Promise<AssessmentGlobalSettings> {
  const now = Date.now()
  if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const doc = await db.collection("system_settings").findOne({ key: SETTINGS_KEY })

    const envTokenLimit = process.env.ASSESSMENT_GLOBAL_TOKEN_LIMIT
      ? parseInt(process.env.ASSESSMENT_GLOBAL_TOKEN_LIMIT, 10)
      : NaN

    const limit =
      typeof doc?.globalTokenLimit === "number" && doc.globalTokenLimit > 0
        ? doc.globalTokenLimit
        : !isNaN(envTokenLimit) && envTokenLimit > 0
        ? envTokenLimit
        : DEFAULT_GLOBAL_TOKEN_LIMIT

    const timeLimit =
      typeof doc?.defaultTimeLimitMinutes === "number" && doc.defaultTimeLimitMinutes > 0
        ? doc.defaultTimeLimitMinutes
        : DEFAULT_TIME_LIMIT_MINUTES

    const settings: AssessmentGlobalSettings = {
      globalTokenLimit: limit,
      defaultTimeLimitMinutes: timeLimit,
      updatedAt: doc?.updatedAt || undefined,
      updatedBy: doc?.updatedBy || undefined,
    }

    cachedSettings = settings
    cacheTimestamp = now
    return settings
  } catch (error) {
    console.error("[getAssessmentGlobalSettings] Error reading assessment settings:", error)
    return {
      globalTokenLimit: DEFAULT_GLOBAL_TOKEN_LIMIT,
      defaultTimeLimitMinutes: DEFAULT_TIME_LIMIT_MINUTES,
    }
  }
}

/**
 * Updates the global assessment token limit and configuration.
 * Admin-only operation.
 */
export async function updateAssessmentGlobalSettings(
  updates: { globalTokenLimit?: number; defaultTimeLimitMinutes?: number },
  updatedBy?: string
): Promise<AssessmentGlobalSettings> {
  const client = await clientPromise
  const db = client.db()

  const current = await getAssessmentGlobalSettings()
  const globalTokenLimit =
    typeof updates.globalTokenLimit === "number" && updates.globalTokenLimit >= 500
      ? Math.min(50000, Math.round(updates.globalTokenLimit))
      : current.globalTokenLimit

  const defaultTimeLimitMinutes =
    typeof updates.defaultTimeLimitMinutes === "number" && updates.defaultTimeLimitMinutes >= 5
      ? Math.min(180, Math.round(updates.defaultTimeLimitMinutes))
      : current.defaultTimeLimitMinutes

  const now = new Date()
  await db.collection("system_settings").updateOne(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        globalTokenLimit,
        defaultTimeLimitMinutes,
        updatedAt: now,
        updatedBy: updatedBy || "admin",
      },
    },
    { upsert: true }
  )

  cachedSettings = {
    globalTokenLimit,
    defaultTimeLimitMinutes,
    updatedAt: now,
    updatedBy: updatedBy || "admin",
  }
  cacheTimestamp = Date.now()

  return cachedSettings
}
