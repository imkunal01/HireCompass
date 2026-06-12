import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { streamText, isGeminiConfigured } from "@/lib/gemini"
import * as cheerio from "cheerio"

const EXTRACTION_PROMPT = (content: string) => `
You are a precise job description parser. Extract structured information from the following job posting content.

Return ONLY a valid JSON object with exactly these fields (no markdown, no backticks):
{
  "company": "company name or empty string",
  "role": "job title or empty string",
  "location": "location or empty string",
  "type": "Internship|Full-time|Contract|Part-time or empty string",
  "salary": "salary/stipend range or empty string",
  "deadline": "application deadline in YYYY-MM-DD format or empty string",
  "link": "direct application URL or empty string",
  "skills": ["skill1", "skill2"],
  "description": "2-3 sentence summary of the role",
  "confidence": 85
}

confidence is 0-100 based on how much info was found.

Job posting content:
${content.slice(0, 12000)}
`

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys"
      }, { status: 503 })
    }

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Fetch the page server-side
    let html: string
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ApplyFlow/1.0; +https://applyflow.app)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) {
        return NextResponse.json({
          error: `Could not fetch page (HTTP ${res.status}). The site may block automated access.`
        }, { status: 422 })
      }
      html = await res.text()
    } catch (fetchErr) {
      return NextResponse.json({
        error: "Could not reach that URL. Check if the link is public and accessible."
      }, { status: 422 })
    }

    // Parse with cheerio — extract meaningful content
    const $ = cheerio.load(html)

    // Remove noise elements
    $("nav, header, footer, script, style, noscript, iframe, ads, .ad, .advertisement, [class*='cookie'], [class*='banner'], [id*='cookie']").remove()

    // Try to find the job description container
    const selectors = [
      "[class*='job-description']",
      "[class*='jobDescription']",
      "[class*='description__text']",
      "[class*='job-details']",
      "[class*='posting']",
      "main",
      "article",
      "#content",
      ".content",
    ]

    let mainContent = ""
    for (const sel of selectors) {
      const el = $(sel).first()
      if (el.length && el.text().trim().length > 200) {
        mainContent = el.text().trim()
        break
      }
    }

    // Fallback to body
    if (!mainContent || mainContent.length < 100) {
      mainContent = $("body").text().trim()
    }

    // Clean up whitespace
    const cleanedContent = mainContent
      .replace(/\s{3,}/g, "\n\n")
      .replace(/\t/g, " ")
      .slice(0, 15000)

    // Return both raw content and a stream of the AI extraction
    // We send raw content first as JSON, then stream AI response
    // Use a multipart-style approach: first chunk is raw content JSON, rest is AI stream
    const rawContentPayload = JSON.stringify({ rawContent: cleanedContent.slice(0, 3000) }) + "\n__AI_START__\n"
    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // First: send raw content
          controller.enqueue(encoder.encode(rawContentPayload))

          // Then: stream AI extraction
          const aiStream = streamText(EXTRACTION_PROMPT(cleanedContent))
          const reader = aiStream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error"
          controller.enqueue(encoder.encode(`__ERROR__:${msg}`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[POST /api/import/url]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
