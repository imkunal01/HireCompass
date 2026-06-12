/**
 * GET /api/auth/me
 * Returns the current user from the JWT cookie.
 * Used by the client-side useUser() hook.
 */
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
  return NextResponse.json({ user: session.user })
}
