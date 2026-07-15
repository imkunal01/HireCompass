import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON } from "@/lib/gemini"
import { SNIPPET_LENGTH_CONFIG, SnippetLength } from "@/types/project"

/**
 * POST /api/ai/generate-snippet
 *
 * Body:
 * {
 *   projectName: string
 *   description: string          // full master description
 *   techStack: string[]
 *   roleCategories: string[]
 *   metrics: string[]
 *   links: { github?, live? }
 *   roleTag: string              // target role, e.g. "Backend SDE Intern"
 *   length: "short" | "medium" | "long" | "custom"
 *   customWords?: number
 *   companyName?: string
 *   jobDescription?: string
 *   documentationText?: string
 * }
 *
 * Returns: { snippet: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectName,
      description,
      techStack,
      roleCategories,
      metrics,
      links,
      roleTag,
      length,
      customWords,
      companyName,
      jobDescription,
      documentationText,
    } = body

    if (!projectName || !roleTag || !length) {
      return NextResponse.json(
        { error: "projectName, roleTag, and length are required" },
        { status: 400 }
      )
    }

    const lengthConfig = SNIPPET_LENGTH_CONFIG[length as SnippetLength]
    if (!lengthConfig) {
      return NextResponse.json({ error: "Invalid length value" }, { status: 400 })
    }

    // Build a rich prompt that passes the FULL project context to the AI
    const techStackStr = (techStack || []).join(", ") || "Not specified"
    const metricsStr = (metrics || []).length > 0
      ? (metrics as string[]).map((m) => `- ${m}`).join("\n")
      : "None provided"
    const linksStr = [
      links?.github ? `GitHub: ${links.github}` : null,
      links?.live ? `Live: ${links.live}` : null,
    ]
      .filter(Boolean)
      .join(", ") || "None"

    const isJD = !!jobDescription;
    const wordTarget = length === "custom" && customWords ? `exactly ${customWords} words` : `around ${lengthConfig.words} (maximum ${lengthConfig.maxWords} words)`;

    const prompt = `You are an expert career coach and technical writer specializing in job applications.

A candidate wants a tailored project description snippet ${isJD ? `for a job application at ${companyName || 'a company'}` : `for a specific role`}.

## Full Project Context (use all of this to write the snippet)

**Project Name**: ${projectName}

**Nutshell Description**:
${description || "Not provided"}

${documentationText ? `**Comprehensive Documentation**:
${documentationText}
` : ""}
**Tech Stack**: ${techStackStr}

**Role Categories**: ${(roleCategories || []).join(", ") || "Not specified"}

**Impact & Metrics**:
${metricsStr}

**Project Links**: ${linksStr}

---
${isJD ? `## Job Description (JD) Target
Analyze this Job Description and highly tailor the project summary to emphasize overlapping skills, requirements, and responsibilities.

**Target Role**: ${roleTag}
**Company**: ${companyName || 'Not provided'}
**Job Description**:
${jobDescription}
---` : ""}

## Task

Write a project description snippet tailored specifically for the **${roleTag}** role${isJD ? ` at ${companyName || 'this company'}` : ""}.

Requirements:
- Target word count: **${wordTarget}**
- Emphasize skills and aspects most relevant to the ${isJD ? "Job Description" : `"${roleTag}" role`}
- Use active, confident language — first person is fine
- Lead with the most impressive or relevant aspect
- Include 1-2 specific metrics/impact points if available
- Do NOT use bullet points — write as flowing prose
- Do NOT include a project title header — just the description paragraph(s)
- Sound natural and genuine, not like a generic template

Return JSON with exactly one key:
{ "snippet": "..." }`

    const result = await extractJSON<{ snippet: string }>(prompt)

    if (!result.snippet) {
      return NextResponse.json({ error: "AI returned empty snippet" }, { status: 500 })
    }

    return NextResponse.json({ snippet: result.snippet.trim() })
  } catch (error: any) {
    console.error("[POST /api/ai/generate-snippet]", error)
    const msg = error?.message || "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
