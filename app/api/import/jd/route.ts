import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import Groq from "groq-sdk"

const MODEL = "llama-3.3-70b-versatile"

// POST /api/import/jd — parse a pasted job description and create an opportunity
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text, save = false } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: "No JD text provided" }, { status: 400 })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 })

  const groq = new Groq({ apiKey })

  const today = new Date().toISOString().split("T")[0]

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You extract structured job details from a job description.
Return ONLY a valid JSON object (no markdown, no explanation) with these exact keys:
{
  "title": string,
  "company": string,
  "location": string | null,
  "isRemote": boolean,
  "employmentType": "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "FREELANCE",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "salaryCurrency": string | null,
  "skills": string[],
  "deadline": "YYYY-MM-DD" | null,
  "url": string | null,
  "notes": string
}
Today is ${today}. If the deadline is relative (e.g. "apply in 2 weeks"), calculate the actual date.`,
      },
      { role: "user", content: text.slice(0, 8000) },
    ],
    temperature: 0.1,
    max_tokens: 600,
  })

  const raw = completion.choices[0]?.message?.content ?? "{}"
  let parsed: any = {}
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match?.[0] ?? "{}")
  } catch {
    return NextResponse.json({ error: "Failed to parse JD — try pasting more of the job description." }, { status: 422 })
  }

  if (!parsed.title || !parsed.company) {
    return NextResponse.json({ error: "Could not extract job title or company from the text." }, { status: 422 })
  }

  // If save=true, persist to DB
  if (save) {
    const client = await clientPromise
    const now = new Date()
    const doc = {
      userId: session.user.id,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location ?? null,
      isRemote: parsed.isRemote ?? false,
      employmentType: parsed.employmentType ?? "FULL_TIME",
      salary: parsed.salaryMin ? { min: parsed.salaryMin, max: parsed.salaryMax, currency: parsed.salaryCurrency ?? "INR" } : null,
      url: parsed.url ?? null,
      sourcePlatform: "OTHER",
      status: "SAVED",
      priority: "MEDIUM",
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      skills: parsed.skills ?? [],
      tags: ["jd-import"],
      notes: parsed.notes ?? "",
      timeline: [{ event: "Added via JD Parser", description: "Imported from pasted job description", timestamp: now }],
      createdAt: now,
      updatedAt: now,
    }
    const result = await client.db().collection("opportunities").insertOne(doc)
    return NextResponse.json({ ...parsed, id: result.insertedId.toString(), saved: true })
  }

  return NextResponse.json({ ...parsed, saved: false })
}
