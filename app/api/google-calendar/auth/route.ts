import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getAuthUrl } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch (err) {
    console.error("[google-calendar/auth]", err)
    return NextResponse.json(
      { error: "Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env" },
      { status: 500 }
    )
  }
}
