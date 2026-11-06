import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getGoogleOAuth2Client } from "@/lib/google-auth"

export const dynamic = "force-dynamic"

/**
 * GET /api/auth/gmail-outreach
 * Initiates a Google OAuth2 consent flow requesting the gmail.send scope.
 * This is SEPARATE from the sign-in flow — it links the user's own Gmail
 * account to their HireCompass outreach profile so emails are sent as them.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/gmail-outreach/callback`

    const oauth2Client = getGoogleOAuth2Client(redirectUri)

    // Encode userId in state so the callback knows which user to save tokens for
    const stateData = {
      userId: session.user.id,
      nonce: Math.random().toString(36).substring(2, 15),
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64url")

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",        // We NEED offline to get a refresh_token
      scope: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/gmail.send", // ← The key scope
      ],
      prompt: "consent",             // Force consent screen so we always get refresh_token
      state,
    })

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("[GET /api/auth/gmail-outreach]", error)
    return NextResponse.redirect(
      new URL(
        `/outreach?error=${encodeURIComponent("Failed to start Gmail connection. Try again.")}`,
        request.url
      )
    )
  }
}

