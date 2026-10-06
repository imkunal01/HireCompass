import { google } from "googleapis"

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_AUTH_REDIRECT_URI) {
    return process.env.GOOGLE_AUTH_REDIRECT_URI
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  return `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`
}

export function getGoogleOAuth2Client(customRedirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = customRedirectUri || getGoogleRedirectUri()

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
    )
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export interface GoogleAuthOptions {
  returnUrl?: string
  prompt?: string
}

export function generateGoogleAuthUrl(options?: GoogleAuthOptions): string {
  const oauth2Client = getGoogleOAuth2Client()

  // State encodes the destination returnUrl safely
  const stateData = {
    nonce: Math.random().toString(36).substring(2, 15),
    returnUrl: options?.returnUrl || "/dashboard",
  }
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url")

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: options?.prompt || "select_account",
    state,
  })
}

export interface VerifiedGoogleUser {
  googleId: string
  email: string
  name: string
  picture: string | null
  verifiedEmail: boolean
}

/**
 * Exchanges authorization code with Google and validates user email authenticity.
 * Rejects accounts that do not have a verified email to protect against fake bot accounts.
 */
export async function verifyAndExtractGoogleUser(
  code: string,
  customRedirectUri?: string
): Promise<VerifiedGoogleUser> {
  const oauth2Client = getGoogleOAuth2Client(customRedirectUri)
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()

  if (!data.email) {
    throw new Error("Google account did not provide an email address.")
  }

  // Strict anti-abuse security check: email MUST be verified by Google
  const isVerified = Boolean(data.verified_email)
  if (!isVerified) {
    throw new Error(
      "Your Google email is unverified. Only verified Google accounts can access HireCompass."
    )
  }

  const normalizedEmail = data.email.toLowerCase().trim()
  const name = (data.name || normalizedEmail.split("@")[0] || "User").trim()

  return {
    googleId: data.id || "",
    email: normalizedEmail,
    name,
    picture: data.picture || null,
    verifiedEmail: isVerified,
  }
}
