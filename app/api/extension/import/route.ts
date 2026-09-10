import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

interface ParsedJD {
  title: string
  company: string
  location?: string | null
  isRemote?: boolean
  employmentType?: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "FREELANCE"
  salary?: string | null
  skills?: string[]
  deadline?: string | null
  notes?: string
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
    let {
      title,
      company,
      location,
      salary,
      url,
      description,
      rawText,
      sourcePlatform = "OTHER",
      status = "SAVED",
      employmentType = "FULL_TIME",
      isRemote = false,
      skills = [],
      notes,
    } = body

    const userId = session.user.id

    // ─── If raw JD text is provided (or title/company missing), use AI to parse entire dump ───
    const contentToParse = rawText || (description && description.length > 150 ? description : null)

    if ((!title?.trim() || !company?.trim() || rawText) && contentToParse && isGeminiConfigured()) {
      try {
        const today = new Date().toISOString().split("T")[0]
        const prompt = `You are a precision job parser. Extract structured details from this job description.
Return ONLY valid JSON with these exact keys:
{
  "title": "<job title / role>",
  "company": "<company name>",
  "location": "<city, country or null>",
  "isRemote": <true if remote/hybrid, false otherwise>,
  "employmentType": "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "FREELANCE",
  "salary": "<salary / compensation range if mentioned, or null>",
  "skills": ["<skill1>", "<skill2>", "<skill3>"],
  "deadline": "<YYYY-MM-DD or null>",
  "notes": "<2-3 sentence executive summary of the role>"
}
Today is ${today}.

Job Description:
${contentToParse.slice(0, 10000)}`

        const aiParsed = await extractJSON<ParsedJD>(prompt, undefined, undefined, 1024)

        if (aiParsed.title) title = aiParsed.title
        if (aiParsed.company) company = aiParsed.company
        if (aiParsed.location) location = aiParsed.location
        if (aiParsed.isRemote !== undefined) isRemote = aiParsed.isRemote
        if (aiParsed.employmentType) employmentType = aiParsed.employmentType
        if (aiParsed.salary) salary = aiParsed.salary
        if (aiParsed.skills && aiParsed.skills.length > 0) skills = aiParsed.skills
        if (aiParsed.notes) notes = aiParsed.notes
      } catch (aiErr) {
        console.warn("AI JD parsing failed, falling back to basic extraction:", aiErr)
      }
    }

    if (!title?.trim() || !company?.trim()) {
      return NextResponse.json(
        { error: "Could not extract job title and company from the provided text. Please ensure the JD includes the role and company name." },
        { status: 400, headers: corsHeaders }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("opportunities")

    // Check for duplicate application
    const duplicateQuery: Record<string, any> = { userId }
    if (url && url.length > 10) {
      try {
        const parsedUrl = new URL(url)
        const cleanUrl = `${parsedUrl.origin}${parsedUrl.pathname}`
        duplicateQuery.$or = [
          { url: { $regex: cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          {
            $and: [
              { company: { $regex: `^${company.trim()}$`, $options: "i" } },
              { title: { $regex: `^${title.trim()}$`, $options: "i" } },
            ],
          },
        ]
      } catch {
        duplicateQuery.company = { $regex: `^${company.trim()}$`, $options: "i" }
        duplicateQuery.title = { $regex: `^${title.trim()}$`, $options: "i" }
      }
    } else {
      duplicateQuery.company = { $regex: `^${company.trim()}$`, $options: "i" }
      duplicateQuery.title = { $regex: `^${title.trim()}$`, $options: "i" }
    }

    const existing = await col.findOne(duplicateQuery)
    if (existing) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: `Already in your pipeline as "${existing.status}"`,
        opportunity: {
          ...existing,
          id: existing._id.toString(),
          _id: existing._id.toString(),
        },
      }, { headers: corsHeaders })
    }

    const now = new Date()
    const newDoc = {
      userId,
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,
      salary: salary?.trim() || null,
      url: url?.trim() || null,
      sourcePlatform: sourcePlatform || "OTHER",
      status: status || "SAVED",
      priority: "MEDIUM",
      employmentType: employmentType || "FULL_TIME",
      isRemote: Boolean(isRemote),
      skills: Array.isArray(skills) ? skills : [],
      tags: ["ai-jd-dump", "extension-import"],
      notes: notes || description || null,
      timeline: [
        {
          event: "Imported via AI JD Dump",
          description: `Automatically extracted and saved from ${sourcePlatform}`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(newDoc)

    return NextResponse.json(
      {
        success: true,
        isDuplicate: false,
        message: `✓ AI successfully parsed and saved "${title}" at ${company}!`,
        opportunity: {
          ...newDoc,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
          createdAt: newDoc.createdAt.toISOString(),
          updatedAt: newDoc.updatedAt.toISOString(),
        },
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error("[POST /api/extension/import]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
