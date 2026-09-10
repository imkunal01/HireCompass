import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

interface MatchResult {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  keyStrengths: string[]
  strategicAdvice: string
}

export async function OPTIONS(request: NextRequest) {
  return handleOptionsCors(request)
}

export async function POST(request: NextRequest) {
  const corsHeaders = getExtensionCorsHeaders(request)
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { jobTitle, company, description, skills: extractedSkills = [] } = body

    if (!jobTitle || !description) {
      return NextResponse.json({ error: "Job title and description are required" }, { status: 400, headers: corsHeaders })
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id

    // Fetch user profile and projects
    const outreachProfile = await db.collection("outreach_profiles").findOne({ userId })
    const projects = await db.collection("projects").find({ userId }).toArray()

    const userSkills: string[] = [
      ...(outreachProfile?.skills || []),
      ...projects.flatMap((p) => p.techStack || []),
    ]
    const uniqueUserSkills = Array.from(new Set(userSkills.map((s) => s.trim())))

    // Fast heuristic fallback
    const heuristicMatch = (): MatchResult => {
      const descLower = description.toLowerCase()
      const matched = uniqueUserSkills.filter((s) => descLower.includes(s.toLowerCase()))
      const missing = (extractedSkills as string[]).filter(
        (s) => !uniqueUserSkills.some((us) => us.toLowerCase() === s.toLowerCase())
      )

      const baseScore = Math.min(
        92,
        Math.max(45, Math.round((matched.length / Math.max(1, matched.length + missing.length)) * 100))
      )

      return {
        matchScore: baseScore || 75,
        matchedSkills: matched.slice(0, 8),
        missingSkills: missing.slice(0, 5),
        keyStrengths: matched.slice(0, 3),
        strategicAdvice:
          matched.length > 3
            ? `Strong overlap in ${matched.slice(0, 2).join(" & ")}. Highlight these in your resume header.`
            : "Tailor your project descriptions to emphasize relevant tools required in the posting.",
      }
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(heuristicMatch())
    }

    try {
      const prompt = `You are a career strategist. Analyze how well this candidate fits this job posting.

Candidate Skills & Background:
Skills: ${uniqueUserSkills.join(", ") || "General Full-stack & Software Engineering"}
Bio: ${outreachProfile?.bio || "Software Engineer"}
Projects: ${projects.map((p) => `${p.title} (${(p.techStack || []).join(", ")})`).join("; ") || "Web applications"}

Job Posting:
Title: ${jobTitle} at ${company || "Company"}
Description Snippet:
${description.slice(0, 3000)}

Return JSON with exact keys:
{
  "matchScore": <integer 0-100>,
  "matchedSkills": [<strings of skills candidate has that match the job>],
  "missingSkills": [<strings of key skills or requirements the candidate lacks>],
  "keyStrengths": [<2-3 bullet strings of standout advantages>],
  "strategicAdvice": "<1-2 concise actionable sentences on how to position the application>"
}`

      const result = await extractJSON<MatchResult>(prompt, undefined, undefined, 1024)
      return NextResponse.json(result, { headers: corsHeaders })
    } catch (aiErr) {
      console.warn("AI match failed, using heuristic:", aiErr)
      return NextResponse.json(heuristicMatch(), { headers: corsHeaders })
    }
  } catch (error) {
    console.error("[POST /api/extension/match]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
