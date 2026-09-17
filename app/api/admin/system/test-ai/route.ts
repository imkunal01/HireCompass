import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import Groq from "groq-sdk"

export async function POST(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin(request)
    if (errorResponse) return errorResponse

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      return NextResponse.json({
        success: false,
        error: "GROQ_API_KEY is not set or is using placeholder.",
      }, { status: 400 })
    }

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"
    const groq = new Groq({ apiKey })

    const start = Date.now()
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a health-check responder." },
        { role: "user", content: "Respond with the single word: OK" },
      ],
      max_tokens: 10,
      temperature: 0.1,
    })
    const latencyMs = Date.now() - start
    const reply = completion.choices?.[0]?.message?.content?.trim() || "OK"

    return NextResponse.json({
      success: true,
      model,
      latencyMs,
      reply,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[POST /api/admin/system/test-ai]", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to reach AI service.",
    }, { status: 500 })
  }
}
