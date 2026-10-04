import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { verifyAiRequestSecurity, createAiRateLimitResponse } from "@/lib/ai-security"
import { scrapeJobUrl } from "@/lib/job-scraper"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await request.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid URL is required" }, { status: 400 })
    }

    // AI / Scraper Security check
    const securityCheck = await verifyAiRequestSecurity({
      userId: session.user.id,
      userInput: url,
      maxRequestsPerMinute: 10,
      checkDuplicate: true,
      enforceConcurrencyLock: true,
    })

    if (!securityCheck.allowed) {
      return createAiRateLimitResponse(securityCheck)
    }

    try {
      const result = await scrapeJobUrl(url)
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Scraping failed" }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        url,
        data: result.data,
        source: result.data?.source,
      })
    } finally {
      securityCheck.releaseLock?.()
    }
  } catch (error) {
    console.error("[POST /api/scrape-job]", error)
    const msg = error instanceof Error ? error.message : "Scraping failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
