import clientPromise from "@/lib/mongodb"

export interface AuthSettings {
  enablePasswordAuth: boolean
  googleAuthEnabled: boolean
  updatedAt?: string | Date
  updatedBy?: string
}

const SETTINGS_KEY = "auth_settings"
let cachedSettings: AuthSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 15000 // 15-second in-memory cache to reduce DB load

/**
 * Retrieves the platform authentication configuration.
 * By default, password auth is disabled (false) to enforce verified Google Sign-In
 * and prevent fake-email token abuse, unless explicitly turned ON via Admin Panel or env.
 */
export async function getAuthSettings(): Promise<AuthSettings> {
  const now = Date.now()
  if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const doc = await db.collection("system_settings").findOne({ key: SETTINGS_KEY })

    // Optional environment variable fallback
    const envDefault = process.env.ENABLE_PASSWORD_AUTH === "true"

    const settings: AuthSettings = {
      enablePasswordAuth: doc !== null ? Boolean(doc.enablePasswordAuth) : envDefault,
      googleAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      updatedAt: doc?.updatedAt || undefined,
      updatedBy: doc?.updatedBy || undefined,
    }

    cachedSettings = settings
    cacheTimestamp = now
    return settings
  } catch (error) {
    console.error("[getAuthSettings] Error reading auth settings:", error)
    return {
      enablePasswordAuth: process.env.ENABLE_PASSWORD_AUTH === "true",
      googleAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    }
  }
}

/**
 * Updates the authentication feature flag from the Admin Panel.
 */
export async function updateAuthSettings(
  updates: { enablePasswordAuth: boolean },
  updatedBy?: string
): Promise<AuthSettings> {
  const client = await clientPromise
  const db = client.db()

  const now = new Date()
  await db.collection("system_settings").updateOne(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        enablePasswordAuth: Boolean(updates.enablePasswordAuth),
        updatedAt: now,
        updatedBy: updatedBy || "admin",
      },
    },
    { upsert: true }
  )

  cachedSettings = {
    enablePasswordAuth: Boolean(updates.enablePasswordAuth),
    googleAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    updatedAt: now,
    updatedBy,
  }
  cacheTimestamp = Date.now()

  return cachedSettings
}
