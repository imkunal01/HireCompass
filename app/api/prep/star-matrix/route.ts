import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getUserAiConfig, recordAiUsage } from "@/lib/ai-quota"
import Groq from "groq-sdk"
import { ObjectId } from "mongodb"
import { StarStory } from "@/types/prep"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const stories = await db
      .collection("star_stories")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    const serialized = stories.map((s) => ({
      ...s,
      _id: s._id.toString(),
      id: s._id.toString(),
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
      updatedAt: s.updatedAt?.toISOString?.() ?? s.updatedAt,
    }))

    return NextResponse.json({ stories: serialized })
  } catch (error) {
    console.error("[GET /api/prep/star-matrix]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db()
    const storiesCol = db.collection("star_stories")

    // AI Synthesis Mode
    if (body.action === "synthesize") {
      const { projectId, archetype = "outage_crisis" } = body
      if (!projectId) {
        return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
      }

      const project = await db.collection("projects").findOne({
        _id: ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId,
        userId: session.user.id,
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      // Resolve AI config
      const aiConfig = await getUserAiConfig(session.user.id)
      if (aiConfig.usage.isLimitReached) {
        return NextResponse.json(
          {
            error: "Free AI quota limit reached. Add your Groq API key in Settings for unlimited stories.",
            isQuotaExceeded: true,
          },
          { status: 429 }
        )
      }

      const groq = new Groq({ apiKey: aiConfig.apiKey })

      const prompt = `You are an Executive Tech Career Coach & Behavioral Interview Specialist.
Convert the candidate's real project experience into a punchy, metric-backed behavioral interview story using the STAR framework.

Candidate's Project Details:
- Title: ${project.title}
- Tech Stack: ${Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack || "Full Stack"}
- Description: ${project.description || ""}
- Challenges / Responsibilities: ${project.responsibilities || project.challenges || ""}
- Metrics: ${project.metrics || ""}

Target Behavioral Archetype: ${archetype} (e.g. outage crisis, technical disagreement, tight deadlines, ambiguity architecture).

INSTRUCTIONS:
1. Frame the Situation, Task, Action, and Result with specificity and quantifiable impact.
2. Generate 3 audience-specific narrative versions of this story:
   - "em": For an Engineering Manager (emphasize teamwork, timeline negotiation, communication, proactive risk mitigation).
   - "pe": For a Principal / Staff Engineer (emphasize root cause depth, fault isolation, architectural trade-offs, post-mortem rigor).
   - "pm": For a Product Manager / Business Leader (emphasize user experience, customer retention, revenue impact, latency drop).

Respond ONLY with a valid JSON object matching this structure:
{
  "title": "A crisp, memorable headline for this story",
  "archetype": "${archetype}",
  "situation": "2 sentences setting the scene, stakes, and high-pressure context.",
  "task": "1-2 sentences on what was specifically expected of you.",
  "action": "3-4 concrete, technical actions you drove to resolve the problem.",
  "result": "2 sentences detailing quantifiable outcomes, latency reduction, or team wins.",
  "metrics": ["Key metric 1", "Key metric 2"],
  "audienceVersions": {
    "em": "The full spoken pitch framed for an Engineering Manager...",
    "pe": "The full spoken pitch framed for a Principal Engineer...",
    "pm": "The full spoken pitch framed for a Product Leader..."
  },
  "tags": ["tag1", "tag2"]
}`

      const completion = await groq.chat.completions.create({
        model: aiConfig.model || "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You output only clean, valid JSON without markdown fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      })

      const raw = completion.choices[0]?.message?.content || "{}"
      let synthesized: any
      try {
        synthesized = JSON.parse(raw)
      } catch {
        return NextResponse.json({ error: "Failed to parse synthesized story" }, { status: 500 })
      }

      await recordAiUsage(session.user.id)

      const now = new Date()
      const newStory: any = {
        userId: session.user.id,
        projectId: project._id.toString(),
        projectTitle: project.title,
        title: synthesized.title,
        archetype: synthesized.archetype || archetype,
        situation: synthesized.situation,
        task: synthesized.task,
        action: synthesized.action,
        result: synthesized.result,
        metrics: synthesized.metrics || [],
        audienceVersions: synthesized.audienceVersions,
        tags: synthesized.tags || [],
        bookmarked: false,
        createdAt: now,
        updatedAt: now,
      }

      const insertResult = await storiesCol.insertOne(newStory)

      return NextResponse.json({
        story: {
          ...newStory,
          _id: insertResult.insertedId.toString(),
          id: insertResult.insertedId.toString(),
        },
      })
    }

    // Manual Save Mode
    const now = new Date()
    const doc = {
      userId: session.user.id,
      projectId: body.projectId || null,
      projectTitle: body.projectTitle || "Custom Experience",
      title: body.title || "Behavioral Story",
      archetype: body.archetype || "custom",
      situation: body.situation || "",
      task: body.task || "",
      action: body.action || "",
      result: body.result || "",
      metrics: body.metrics || [],
      audienceVersions: body.audienceVersions || {
        em: body.situation + " " + body.action + " " + body.result,
        pe: body.situation + " " + body.action + " " + body.result,
        pm: body.situation + " " + body.action + " " + body.result,
      },
      tags: body.tags || [],
      bookmarked: Boolean(body.bookmarked),
      createdAt: now,
      updatedAt: now,
    }

    const res = await storiesCol.insertOne(doc)
    return NextResponse.json({
      story: {
        ...doc,
        _id: res.insertedId.toString(),
        id: res.insertedId.toString(),
      },
    })
  } catch (error: any) {
    console.error("[POST /api/prep/star-matrix]", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Story ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const objId = ObjectId.isValid(id) ? new ObjectId(id) : null

    if (objId) {
      await db.collection("star_stories").deleteOne({ _id: objId, userId: session.user.id })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/prep/star-matrix]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
