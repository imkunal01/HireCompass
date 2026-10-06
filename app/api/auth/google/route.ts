import { NextRequest, NextResponse } from "next/server"
import { generateGoogleAuthUrl } from "@/lib/google-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("callbackUrl") || "/dashboard"
    const format = searchParams.get("format")

    // Validate returnUrl to avoid open redirect vulnerabilities
    const safeReturnUrl = returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : "/dashboard"

    const authUrl = generateGoogleAuthUrl({ returnUrl: safeReturnUrl })

    if (format === "json") {
      return NextResponse.json({ url: authUrl })
    }

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("[GET /api/auth/google]", error)
    const errorMsg = encodeURIComponent(error?.message || "Failed to initiate Google authentication")
    return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, request.url))
  }
}
