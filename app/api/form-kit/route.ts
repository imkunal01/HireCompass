import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { FormKitItem, Project, ProjectSnippet, SnippetLength } from "@/types/project"

/**
 * GET /api/form-kit?opportunityId=xxx
 *
 * Returns projects ranked by skill overlap with the given opportunity,
 * each with their best matching snippets (short/medium/long).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get("opportunityId")

    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Fetch the opportunity to get its skills + title
    const opp = await db.collection("opportunities").findOne({
      _id: new ObjectId(opportunityId),
      userId: session.user.id,
    })

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }

    const jobSkills: string[] = (opp.skills || []).map((s: string) => s.toLowerCase())
    const jobTitle: string = (opp.title || "").toLowerCase()

    // Fetch all user's projects
    const projects = await db.collection("projects").find({ userId: session.user.id }).toArray()

    if (projects.length === 0) {
      return NextResponse.json([])
    }

    // Score each project
    const scored: FormKitItem[] = projects.map((p) => {
      const techStack: string[] = p.techStack || []
      const techLower = techStack.map((t: string) => t.toLowerCase())

      // Skill overlap score
      const matchedSkills = jobSkills.filter((skill) =>
        techLower.some((tech) => tech.includes(skill) || skill.includes(tech))
      )

      // Bonus: role category match with job title
      const roleCategories: string[] = p.roleCategories || []
      const roleCategoryBonus = roleCategories.some((cat: string) =>
        jobTitle.includes(cat.toLowerCase()) || cat.toLowerCase().includes(jobTitle.split(" ")[0])
      )
        ? 15
        : 0

      const overlapScore =
        jobSkills.length > 0
          ? Math.round((matchedSkills.length / jobSkills.length) * 85)
          : 0

      const matchScore = Math.min(100, overlapScore + roleCategoryBonus)

      // Find best matching snippets per length
      // Prefer snippets whose roleTag closely matches the job title
      const snippets: ProjectSnippet[] = p.snippets || []

      function bestSnippetForLength(len: SnippetLength): ProjectSnippet | null {
        const lengthSnippets = snippets.filter((s: ProjectSnippet) => s.length === len)
        if (lengthSnippets.length === 0) return null

        // Score each snippet's roleTag against the job title
        const scored = lengthSnippets.map((s: ProjectSnippet) => {
          const tagWords = s.roleTag.toLowerCase().split(/\s+/)
          const titleWords = jobTitle.split(/\s+/)
          const overlap = tagWords.filter((w) => titleWords.some((tw) => tw.includes(w) || w.includes(tw))).length
          return { snippet: s, score: overlap }
        })

        scored.sort((a, b) => b.score - a.score)
        return scored[0].snippet
      }

      return {
        projectId: p._id.toString(),
        projectName: p.name,
        techStack,
        matchScore,
        matchedSkills: matchedSkills.map((s) =>
          jobSkills.find((js) => js === s) || s
        ),
        snippets: {
          short: bestSnippetForLength("short"),
          medium: bestSnippetForLength("medium"),
          long: bestSnippetForLength("long"),
        },
        hasAnySnippet: snippets.length > 0,
      }
    })

    // Sort by match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json(scored)
  } catch (error) {
    console.error("[GET /api/form-kit]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
