import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  getUserAiConfig,
  saveUserApiKey,
  removeUserApiKey,
  validateGroqKey,
} from "@/lib/ai-quota"

export const dynamic = "force-dynamic"

/**
 * GET /api/settings/ai-key
 * Returns the current user's AI BYOK configuration and free tier usage status.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await getUserAiConfig(session.user.id)

    return NextResponse.json({
      hasCustomKey: config.isCustom,
      maskedKey: config.maskedKey || null,
      model: config.model,
      usage: config.usage,
    })
  } catch (error) {
    console.error("[GET /api/settings/ai-key]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/settings/ai-key
 * Validates, encrypts, and saves a user's custom Groq API key and preferred model.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey, model } = body

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Groq API key is required." }, { status: 400 })
    }

    const result = await saveUserApiKey(session.user.id, apiKey, model)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[POST /api/settings/ai-key]", error)
    const msg = error?.message || "Failed to save Groq API key."
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

/**
 * DELETE /api/settings/ai-key
 * Removes the user's custom Groq API key and reverts back to the platform tier.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await removeUserApiKey(session.user.id)

    return NextResponse.json({
      success: true,
      message: "Custom Groq API key removed successfully.",
    })
  } catch (error) {
    console.error("[DELETE /api/settings/ai-key]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
