import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { streamText, isGeminiConfigured } from "@/lib/gemini"
import { scrapeJobUrl } from "@/lib/job-scraper"
import * as cheerio from "cheerio"

const EXTRACTION_PROMPT = (content: string, url: string) => `
You are a precise job description parser. Extract structured information from the following job posting content.

Return ONLY a valid JSON object with exactly these fields (no markdown, no backticks, no preamble):
{
  "company": "company name or empty string",
  "role": "job title or empty string",
  "location": "location or empty string",
  "type": "Internship|Full-time|Contract|Part-time or empty string",
  "salary": "salary/stipend range or empty string",
  "deadline": "application deadline in YYYY-MM-DD format or empty string",
  "link": "${url}",
  "skills": ["skill1", "skill2"],
  "description": "2-3 sentence summary of the role",
  "confidence": 85
}

RULES:
- confidence is 0-100 based on how much clear job information was found.
- If deadline is not a real calendar date, leave it as empty string "".
- Return ONLY the raw JSON object.

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
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const rawUrl = parsedUrl.toString()
    const host = parsedUrl.hostname.toLowerCase()

    // 1. Check known anti-bot walled gardens
    if (host.includes("linkedin.com")) {
      return NextResponse.json({
        error: "LinkedIn blocks direct automated fetching. Please copy the job description text from the page and switch to the 'Paste Job Description' tab — AI will parse it instantly!"
      }, { status: 422 })
    }

    if (host.includes("indeed.com")) {
      return NextResponse.json({
        error: "Indeed blocks direct automated fetching. Please copy the job description text and switch to the 'Paste Job Description' tab — AI will extract everything automatically!"
      }, { status: 422 })
    }

    // 2. Try ATS APIs & structured scraper (Greenhouse, Lever, Ashby, JSON-LD)
    let scrapedContent = ""
    let prestructuredJson: any = null

    try {
      const scrapeResult = await scrapeJobUrl(rawUrl)
      if (scrapeResult.success && scrapeResult.data) {
        const d = scrapeResult.data
        if (d.source === "greenhouse_api" || d.source === "lever_api" || d.source === "ashby_api" || d.source === "jsonld") {
          prestructuredJson = {
            company: d.company || "",
            role: d.title || "",
            location: d.location && d.location !== "Not specified" ? d.location : "",
            type: d.employmentType || "Full-time",
            salary: d.salaryRange && d.salaryRange !== "Not specified" ? d.salaryRange : "",
            deadline: d.deadline || "",
            link: rawUrl,
            skills: d.skillsRequired || [],
            description: d.description || "",
            confidence: 95,
          }
          scrapedContent = `Company: ${d.company}\nRole: ${d.title}\nLocation: ${d.location}\nType: ${d.employmentType}\nSalary: ${d.salaryRange}\n\nDescription:\n${d.description}`
        } else if (d.description && d.description.length > 100) {
          scrapedContent = d.description
        }
      }
    } catch (e) {
      console.warn("[/api/import/url] Specialized scraper error, falling back to direct fetch:", e)
    }

    // 3. If ATS scraper didn't get content, fetch directly with modern browser headers
    if (!scrapedContent) {
      try {
        const res = await fetch(rawUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
          },
          signal: AbortSignal.timeout(12000),
        })

        if (!res.ok) {
          return NextResponse.json({
            error: `Could not reach that page (HTTP ${res.status}). The website may require login or block automated access. Please copy the text and use the 'Paste Job Description' tab.`
          }, { status: 422 })
        }

        const html = await res.text()
        const $ = cheerio.load(html)
        $("nav, header, footer, script, style, noscript, iframe, ads, .ad, .advertisement, [class*='cookie'], [class*='banner'], [id*='cookie']").remove()

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

        for (const sel of selectors) {
          const el = $(sel).first()
          if (el.length && el.text().trim().length > 200) {
            scrapedContent = el.text().trim()
            break
          }
        }

        if (!scrapedContent || scrapedContent.length < 100) {
          scrapedContent = $("body").text().trim()
        }
      } catch (fetchErr: any) {
        return NextResponse.json({
          error: "Could not reach that URL. Check if the link is public and accessible, or copy the text into the 'Paste Job Description' tab."
        }, { status: 422 })
      }
    }

    const cleanedContent = scrapedContent
      .replace(/\s{3,}/g, "\n\n")
      .replace(/\t/g, " ")
      .slice(0, 15000)

    if (!cleanedContent || cleanedContent.length < 50) {
      return NextResponse.json({
        error: "Could not extract readable job text from this page. Please switch to the 'Paste Job Description' tab and paste the text manually."
      }, { status: 422 })
    }

    const rawContentPayload = JSON.stringify({ rawContent: cleanedContent.slice(0, 3000) }) + "\n__AI_START__\n"
    const encoder = new TextEncoder()

    // If we already have prestructured ATS data, return that directly as a stream chunk
    if (prestructuredJson) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(rawContentPayload))
          controller.enqueue(encoder.encode(JSON.stringify(prestructuredJson, null, 2)))
          controller.close()
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
    }

    // Stream AI extraction
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(rawContentPayload))
          const aiStream = streamText(EXTRACTION_PROMPT(cleanedContent, rawUrl))
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
