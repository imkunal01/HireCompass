import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { logTrafficEvent } from "@/lib/telemetry-db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    const body = await request.json().catch(() => ({}))

    const {
      visitorId,
      path = "/",
      referrer,
      device = "desktop",
      action = "pageview",
      metadata = {},
    } = body

    const userAgent = request.headers.get("user-agent") || undefined

    // Non-blocking background log
    logTrafficEvent({
      visitorId: visitorId || "guest_anonymous",
      userId: session?.user?.id || null,
      userName: session?.user?.name || null,
      userEmail: session?.user?.email || null,
      path,
      referrer,
      userAgent,
      device: ["desktop", "mobile", "tablet"].includes(device) ? device : "desktop",
      action: ["pageview", "heartbeat", "feature_click", "ai_token_used", "guest_tour"].includes(action)
        ? action
        : "pageview",
      metadata,
    }).catch((err) => console.error("[logTrafficEvent background err]", err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/telemetry]", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
