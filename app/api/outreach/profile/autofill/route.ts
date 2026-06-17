import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pdfParse from "pdf-parse"
import { extractJSON } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    // Parse the PDF
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { PDFParse } = require("pdf-parse")
    const parser = new PDFParse({ data: buffer })
    const pdfData = await parser.getText()
    const text = pdfData.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 })
    }

    // AI Prompt for extraction
    const prompt = `You are an expert ATS parser and resume writer. 
I am going to provide you with the raw text from a candidate's resume.
Your job is to extract the following information and format it perfectly into JSON:

1. "bio": A short, professional 2-3 sentence summary of the candidate's background and experience.
2. "skills": A flat array of strings containing all technical, hard, and soft skills found in the resume.
3. "projects": An array of up to 5 of the most impressive projects or work experiences. Each project must have:
   - "name": The name of the project or role.
   - "description": A brief 1-2 sentence description of what it was and what they achieved.
   - "techStack": An array of strings representing the tools/technologies used in that project.

RESUME TEXT:
${text.substring(0, 8000)} // Truncate just in case it's huge

Respond ONLY with valid JSON in this exact structure:
{
  "bio": "string",
  "skills": ["string"],
  "projects": [
    { "name": "string", "description": "string", "techStack": ["string"] }
  ]
}`

    const extracted = await extractJSON<{
      bio: string;
      skills: string[];
      projects: { name: string; description: string; techStack: string[] }[];
    }>(prompt)

    return NextResponse.json(extracted)
  } catch (err) {
    console.error("[POST /api/outreach/profile/autofill]", err)
    return NextResponse.json({ error: "Failed to extract data from CV" }, { status: 500 })
  }
}
