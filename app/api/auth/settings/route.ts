import { NextResponse } from "next/server"
import { getAuthSettings } from "@/lib/auth-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const settings = await getAuthSettings()
    return NextResponse.json({
      enablePasswordAuth: settings.enablePasswordAuth,
      googleAuthEnabled: settings.googleAuthEnabled,
    })
  } catch (error) {
    console.error("[GET /api/auth/settings]", error)
    return NextResponse.json(
      {
        enablePasswordAuth: false,
        googleAuthEnabled: true,
      },
      { status: 200 }
    )
  }
}
