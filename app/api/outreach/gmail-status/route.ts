import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

/**
 * GET /api/outreach/gmail-status
 * Returns whether the current user has connected their Gmail for outreach,
 * and which email address is connected.
 *
 * DELETE /api/outreach/gmail-status
 * Disconnects (removes) the user's stored Gmail tokens.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const doc = await client
      .db()
      .collection("outreach_gmail_tokens")
      .findOne(
        { userId: session.user.id },
        { projection: { connectedEmail: 1, connectedAt: 1, refreshToken: 1 } }
      )

    if (!doc?.refreshToken) {
      return NextResponse.json({ connected: false, email: null })
    }

    return NextResponse.json({
      connected: true,
      email: doc.connectedEmail || null,
      connectedAt: doc.connectedAt?.toISOString?.() || null,
    })
  } catch (err) {
    console.error("[GET /api/outreach/gmail-status]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    await client
      .db()
      .collection("outreach_gmail_tokens")
      .deleteOne({ userId: session.user.id })

    return NextResponse.json({ success: true, message: "Gmail disconnected." })
  } catch (err) {
    console.error("[DELETE /api/outreach/gmail-status]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

