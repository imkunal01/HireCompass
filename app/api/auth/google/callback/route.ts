import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyAndExtractGoogleUser } from "@/lib/google-auth"
import { signToken, isEmailAdmin } from "@/lib/session"
import { ensureUserDefaultSheets } from "@/lib/sheets-db"

const COOKIE_NAME = "auth-token"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state")

  // Default redirect destination
  let returnUrl = "/dashboard"
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
      if (
        decodedState.returnUrl &&
        typeof decodedState.returnUrl === "string" &&
        decodedState.returnUrl.startsWith("/") &&
        !decodedState.returnUrl.startsWith("//")
      ) {
        returnUrl = decodedState.returnUrl
      }
    } catch {
      // Keep default /dashboard
    }
  }

  // Handle errors or user cancellation from Google OAuth screen
  if (error || !code) {
    const errorDescription =
      error === "access_denied"
        ? "Google sign-in was cancelled."
        : error || "Authentication with Google failed."
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url)
    )
  }

  try {
    // Exchange authorization code for verified Google user profile
    const googleUser = await verifyAndExtractGoogleUser(code)

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    // Check for existing account by email
    const existingUser = await users.findOne({ email: googleUser.email })

    const isAdmin = isEmailAdmin(googleUser.email) || existingUser?.role === "admin"
    const role: "admin" | "user" = isAdmin ? "admin" : (existingUser?.role || "user")

    let userId: string

    if (existingUser) {
      userId = existingUser._id.toString()

      // Update user with Google profile information and active timestamp
      await users.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            googleId: googleUser.googleId,
            avatar: existingUser.avatar || googleUser.picture,
            emailVerified: true,
            authProvider: existingUser.authProvider || "google",
            role,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          },
        }
      )
    } else {
      // Provision a new verified user account
      const now = new Date()
      const insertResult = await users.insertOne({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
        role,
        emailVerified: true,
        authProvider: "google",
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
      })

      userId = insertResult.insertedId.toString()

      // Provision initial Capgemini DSA study sheets
      await ensureUserDefaultSheets(db, userId).catch((err) =>
        console.error("[google/callback] Default sheet provision error:", err)
      )
    }

    // Generate JWT session payload
    const sessionUser = {
      id: userId,
      name: existingUser?.name || googleUser.name,
      email: googleUser.email,
      role,
    }

    const token = await signToken(sessionUser)

    // Build redirect response with secure authentication cookie
    const response = NextResponse.redirect(new URL(returnUrl, request.url))

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })

    return response
  } catch (err: any) {
    console.error("[GET /api/auth/google/callback]", err)
    const message = err?.message || "Google sign-in could not be completed. Please try again."
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url))
  }
}
