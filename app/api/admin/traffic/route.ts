import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { getTrafficSummary } from "@/lib/telemetry-db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const summary = await getTrafficSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("[GET /api/admin/traffic]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
