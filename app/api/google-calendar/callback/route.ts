import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createOAuth2Client } from "@/lib/google-calendar"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    return NextResponse.redirect(
      new URL(`/reminders?cal_error=access_denied`, baseUrl || request.url)
    )
  }

  try {
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    // Store tokens in the user's DB document
    const client = await clientPromise
    const db = client.db()

    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          googleCalendarTokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          },
          googleCalendarConnected: true,
          updatedAt: new Date(),
        },
      }
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    return NextResponse.redirect(
      new URL(`/reminders?cal_connected=1`, baseUrl || request.url)
    )
  } catch (err) {
    console.error("[google-calendar/callback]", err)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    return NextResponse.redirect(
      new URL(`/reminders?cal_error=token_exchange_failed`, baseUrl || request.url)
    )
  }
}
