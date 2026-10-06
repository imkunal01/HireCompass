import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { getAuthSettings, updateAuthSettings } from "@/lib/auth-settings"

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const settings = await getAuthSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[GET /api/admin/system/auth-settings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const body = await request.json()
    if (typeof body.enablePasswordAuth !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: enablePasswordAuth must be a boolean." },
        { status: 400 }
      )
    }

    const updated = await updateAuthSettings(
      { enablePasswordAuth: body.enablePasswordAuth },
      session.user.email
    )

    return NextResponse.json({
      success: true,
      settings: updated,
    })
  } catch (error) {
    console.error("[POST /api/admin/system/auth-settings]", error)
    return NextResponse.json({ error: "Failed to update auth settings" }, { status: 500 })
  }
}
