import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getGoogleOAuth2Client } from "@/lib/google-auth"
import { google } from "googleapis"

export const dynamic = "force-dynamic"

/**
 * GET /api/auth/gmail-outreach/callback
 * Google redirects here after the user grants (or denies) gmail.send access.
 * On success: saves their tokens to `outreach_gmail_tokens` in MongoDB.
 * On failure: redirects back to outreach page with an error message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state")

  const outreachUrl = new URL("/outreach", request.url)

  // User denied access or error from Google
  if (error || !code) {
    const reason =
      error === "access_denied"
        ? "Gmail permission was denied. Please try again and click 'Allow'."
        : error || "Gmail connection failed. Please try again."
    outreachUrl.searchParams.set("error", reason)
    return NextResponse.redirect(outreachUrl)
  }

  // Decode state to get userId
  let userId: string | null = null
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
      userId = decoded.userId || null
    } catch {
      // fall through
    }
  }

  if (!userId) {
    outreachUrl.searchParams.set("error", "Session expired. Please try connecting Gmail again.")
    return NextResponse.redirect(outreachUrl)
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/gmail-outreach/callback`

    const oauth2Client = getGoogleOAuth2Client(redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      // This can happen if the user already granted access before without prompt:consent.
      // The initiation route uses prompt:consent so this shouldn't happen, but guard anyway.
      outreachUrl.searchParams.set(
        "error",
        "Gmail refresh token not received. Please disconnect and reconnect your Gmail account."
      )
      return NextResponse.redirect(outreachUrl)
    }

    // Get the user's Gmail address to confirm which account was connected
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    const connectedEmail = userInfo.email || null

    // Persist tokens in MongoDB (upsert by userId)
    const client = await clientPromise
    const db = client.db()

    await db.collection("outreach_gmail_tokens").updateOne(
      { userId },
      {
        $set: {
          userId,
          connectedEmail,
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope || null,
          connectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    outreachUrl.searchParams.set("gmailConnected", "1")
    return NextResponse.redirect(outreachUrl)
  } catch (err: any) {
    console.error("[GET /api/auth/gmail-outreach/callback]", err)
    outreachUrl.searchParams.set(
      "error",
      err?.message || "Gmail connection failed. Please try again."
    )
    return NextResponse.redirect(outreachUrl)
  }
}

