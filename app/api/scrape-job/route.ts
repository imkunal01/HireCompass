import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
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
  } catch (error) {
    console.error("[POST /api/scrape-job]", error)
    const msg = error instanceof Error ? error.message : "Scraping failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
