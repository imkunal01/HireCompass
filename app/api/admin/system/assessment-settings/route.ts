import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import {
  getAssessmentGlobalSettings,
  updateAssessmentGlobalSettings,
} from "@/lib/assessment-settings"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const settings = await getAssessmentGlobalSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[GET /api/admin/system/assessment-settings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const body = await request.json()
    const { globalTokenLimit, defaultTimeLimitMinutes, tokenAccountingMode } = body

    if (
      globalTokenLimit !== undefined &&
      (typeof globalTokenLimit !== "number" ||
        isNaN(globalTokenLimit) ||
        globalTokenLimit < 500 ||
        globalTokenLimit > 50000)
    ) {
      return NextResponse.json(
        { error: "Invalid globalTokenLimit: Must be a number between 500 and 50,000." },
        { status: 400 }
      )
    }

    if (
      tokenAccountingMode !== undefined &&
      tokenAccountingMode !== "PROMPT_ONLY" &&
      tokenAccountingMode !== "COMBINED"
    ) {
      return NextResponse.json(
        { error: "Invalid tokenAccountingMode: Must be 'PROMPT_ONLY' or 'COMBINED'." },
        { status: 400 }
      )
    }

    const updated = await updateAssessmentGlobalSettings(
      {
        ...(typeof globalTokenLimit === "number" ? { globalTokenLimit } : {}),
        ...(typeof defaultTimeLimitMinutes === "number" ? { defaultTimeLimitMinutes } : {}),
        ...(tokenAccountingMode ? { tokenAccountingMode } : {}),
      },
      session.user.email
    )

    return NextResponse.json({
      success: true,
      settings: updated,
    })
  } catch (error) {
    console.error("[POST /api/admin/system/assessment-settings]", error)
    return NextResponse.json(
      { error: "Failed to update global assessment settings" },
      { status: 500 }
    )
  }
}
