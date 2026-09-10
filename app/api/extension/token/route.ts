import { NextRequest, NextResponse } from "next/server"
import { getSession, signToken } from "@/lib/session"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

export async function OPTIONS(request: NextRequest) {
  return handleOptionsCors(request)
}

export async function GET(request: NextRequest) {
  const corsHeaders = getExtensionCorsHeaders(request)
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    // Generate a dedicated 30-day token for the extension
    const token = await signToken(session.user)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      expiresIn: "30 days",
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[GET /api/extension/token]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
