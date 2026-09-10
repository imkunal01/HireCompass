import { ObjectId } from "mongodb"

export type UserRole = "admin" | "user"

export type AiAccessMode = "DEFAULT" | "UNRESTRICTED" | "DISABLED"

export interface UserAiUsage {
  count: number
  limit?: number
  lastUsedAt?: Date | string | null
}

export interface EncryptedKeyData {
  ciphertext: string
  iv: string
  tag: string
}

/**
 * MongoDB User Schema Representation
 * Stored in `users` collection.
 */
export interface UserDocument {
  _id?: ObjectId | string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  aiAccess?: AiAccessMode
  aiLimit?: number
  aiUsage?: UserAiUsage
  groqKey?: EncryptedKeyData
  groqModel?: string
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Client-facing User representation (safe for sessions and hooks)
 */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  aiAccess?: AiAccessMode
  aiUsage?: UserAiUsage
  createdAt?: string | null
}
