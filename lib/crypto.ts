import crypto from "crypto"

/**
 * Derives a 32-byte (256-bit) encryption key from the environment secrets.
 * Prioritizes ENCRYPTION_SECRET, falling back to JWT_SECRET.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "hirecompass-default-secret-key-32b"
  return crypto.createHash("sha256").update(secret).digest()
}

export interface EncryptedData {
  ciphertext: string
  iv: string
  tag: string
}

/**
 * Encrypts a sensitive string (e.g. Groq API Key) using AES-256-GCM.
 */
export function encryptApiKey(plainText: string): EncryptedData {
  const key = getDerivedKey()
  const iv = crypto.randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  let encrypted = cipher.update(plainText, "utf8", "hex")
  encrypted += cipher.final("hex")
  const tag = cipher.getAuthTag().toString("hex")

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag,
  }
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plain text.
 */
export function decryptApiKey(encrypted: EncryptedData): string {
  if (!encrypted?.ciphertext || !encrypted?.iv || !encrypted?.tag) {
    throw new Error("Invalid encrypted payload.")
  }

  const key = getDerivedKey()
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.iv, "hex")
  )

  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"))

  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Returns a masked representation of an API key for safe UI display.
 * Example: "gsk_1234567890abcdef123456" -> "gsk_••••••••••••3456"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "••••••••"
  const prefix = apiKey.startsWith("gsk_") ? "gsk_" : apiKey.slice(0, 4)
  const suffix = apiKey.slice(-4)
  return `${prefix}••••••••••••${suffix}`
}
