import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { encryptApiKey, decryptApiKey, maskApiKey, EncryptedData } from "@/lib/crypto"
import Groq from "groq-sdk"

export const FREE_AI_REQUEST_LIMIT = process.env.FREE_AI_LIMIT
  ? parseInt(process.env.FREE_AI_LIMIT, 10)
  : 30

export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

export interface UserAiConfig {
  apiKey: string
  isCustom: boolean
  maskedKey?: string
  model: string
  usage: {
    count: number
    limit: number
    isLimitReached: boolean
  }
}

/**
 * Validate a Groq API key by testing it against the Groq models list endpoint.
 */
export async function validateGroqKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const trimmed = apiKey.trim()
  if (!trimmed.startsWith("gsk_") || trimmed.length < 30) {
    return {
      valid: false,
      error: "Invalid format. Groq API keys must start with 'gsk_' followed by your key characters.",
    }
  }

  try {
    const testClient = new Groq({ apiKey: trimmed })
    const models = await testClient.models.list()
    if (models?.data && models.data.length > 0) {
      return { valid: true }
    }
    return { valid: false, error: "Unable to retrieve models. Please verify the key." }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes("401") || msg.toLowerCase().includes("invalid api key") || msg.toLowerCase().includes("unauthorized")) {
      return { valid: false, error: "Invalid Groq API key. Authentication failed." }
    }
    return { valid: false, error: msg || "Failed to validate Groq API key." }
  }
}

/**
 * Resolves the AI configuration for a given user.
 * If the user has a custom encrypted key, decrypts and returns it with unlimited quota.
 * Otherwise, returns the system default key and checks against the free quota limit.
 */
export async function getUserAiConfig(userId: string): Promise<UserAiConfig> {
  const client = await clientPromise
  const db = client.db()
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

  const usageCount = user?.aiUsage?.count ?? 0
  const isLimitReached = usageCount >= FREE_AI_REQUEST_LIMIT

  // Check for custom key
  if (user?.groqKey?.ciphertext && user?.groqKey?.iv && user?.groqKey?.tag) {
    try {
      const decryptedKey = decryptApiKey(user.groqKey as EncryptedData)
      if (decryptedKey && decryptedKey.startsWith("gsk_")) {
        return {
          apiKey: decryptedKey,
          isCustom: true,
          maskedKey: maskApiKey(decryptedKey),
          model: user.groqModel || DEFAULT_GROQ_MODEL,
          usage: {
            count: usageCount,
            limit: FREE_AI_REQUEST_LIMIT,
            isLimitReached: false, // Custom key users bypass the platform quota
          },
        }
      }
    } catch (err) {
      console.error("[getUserAiConfig] Error decrypting user key, falling back to system key:", err)
    }
  }

  // System fallback key
  const systemKey = process.env.GROQ_API_KEY || ""
  return {
    apiKey: systemKey,
    isCustom: false,
    model: DEFAULT_GROQ_MODEL,
    usage: {
      count: usageCount,
      limit: FREE_AI_REQUEST_LIMIT,
      isLimitReached,
    },
  }
}

/**
 * Increment the AI request usage count for a user (only tracked for free-tier users).
 */
export async function incrementUserAiUsage(userId: string, count: number = 1): Promise<void> {
  try {
    const client = await clientPromise
    const db = client.db()
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { "aiUsage.count": count },
        $set: { "aiUsage.lastUsedAt": new Date() },
      },
      { upsert: false }
    )
  } catch (err) {
    console.error("[incrementUserAiUsage] Failed to increment usage:", err)
  }
}

/**
 * Validates, encrypts, and saves a user's custom Groq API key.
 */
export async function saveUserApiKey(
  userId: string,
  apiKey: string,
  model?: string
): Promise<{ success: boolean; message: string; maskedKey: string; model: string }> {
  const cleanKey = apiKey.trim()
  const validation = await validateGroqKey(cleanKey)
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid Groq API key")
  }

  const encrypted = encryptApiKey(cleanKey)
  const selectedModel = model?.trim() || DEFAULT_GROQ_MODEL

  const client = await clientPromise
  const db = client.db()
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        groqKey: encrypted,
        groqModel: selectedModel,
        updatedAt: new Date(),
      },
    }
  )

  return {
    success: true,
    message: "Groq API key saved and verified successfully!",
    maskedKey: maskApiKey(cleanKey),
    model: selectedModel,
  }
}

/**
 * Deletes a user's custom Groq API key and reverts back to the platform tier.
 */
export async function removeUserApiKey(userId: string): Promise<void> {
  const client = await clientPromise
  const db = client.db()
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $unset: {
        groqKey: "",
        groqModel: "",
      },
      $set: { updatedAt: new Date() },
    }
  )
}
