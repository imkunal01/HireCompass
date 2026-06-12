import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { streamText, isGeminiConfigured } from "@/lib/gemini"

function buildEmailPrompt(job: any, userProfile: any, tone: string) {
  return `You are a professional job application writer helping a candidate apply for jobs.

Write a personalized cold email for this opportunity:
- Company: ${job.company}
- Role: ${job.title}
- Key Skills: ${(job.skills || []).join(", ")}
- Description: ${job.description || ""}

Applicant Profile:
${JSON.stringify(userProfile, null, 2)}

Tone: ${tone}

Instructions:
1. Write a compelling cold email with: greeting, 2-sentence intro, why you're a great fit (mention 2-3 specific skills/projects from profile), professional closing
2. Keep it under 200 words
3. After the email, write exactly 3 short personalized tips on separate lines

Format your response EXACTLY like this:
<EMAIL>
Subject: [subject line here]

[email body here]
</EMAIL>
<TIPS>
["tip 1 text", "tip 2 text", "tip 3 text"]
</TIPS>`
}

function buildCoverLetterPrompt(job: any, userProfile: any, tone: string) {
  return `Write a professional cover letter for this job application:
- Company: ${job.company}
- Role: ${job.title}
- Key Skills: ${(job.skills || []).join(", ")}

Applicant Profile:
${JSON.stringify(userProfile, null, 2)}

Tone: ${tone}

Write a 3-paragraph cover letter (intro, body with 2-3 achievements, closing). Max 300 words.
Format:
<COVER>
[cover letter here]
</COVER>`
}

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

    const { job, userProfile, templateType = "Professional", type = "email" } = await request.json()

    if (!job?.company || !job?.title) {
      return NextResponse.json({ error: "Job company and title are required" }, { status: 400 })
    }

    const prompt = type === "cover"
      ? buildCoverLetterPrompt(job, userProfile, templateType)
      : buildEmailPrompt(job, userProfile, templateType)

    return new Response(streamText(prompt), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[POST /api/ai/generate-email]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
