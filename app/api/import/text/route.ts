import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { streamText, isGeminiConfigured } from "@/lib/gemini"

const EXTRACTION_PROMPT = (content: string) => `
You are a precise job description parser. Extract structured information from the following job posting.

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

Job posting:
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

    const { text } = await request.json()
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Please paste at least 50 characters of job description text." }, { status: 400 })
    }

    // Directly stream the AI extraction — no URL fetching needed
    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Send a sentinel so the client knows raw content = the pasted text itself
          const rawPayload = JSON.stringify({ rawContent: text.slice(0, 2000) }) + "\n__AI_START__\n"
          controller.enqueue(encoder.encode(rawPayload))

          // Stream AI extraction
          const aiStream = streamText(EXTRACTION_PROMPT(text.trim()))
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
    console.error("[POST /api/import/text]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
