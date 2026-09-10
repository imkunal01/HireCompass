import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { getExtensionCorsHeaders, handleOptionsCors } from "@/lib/extension-cors"

export async function OPTIONS(request: NextRequest) {
  return handleOptionsCors(request)
}

export async function GET(request: NextRequest) {
  const corsHeaders = getExtensionCorsHeaders(request)
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id

    // 1. Pipeline Stats
    const totalSaved = await db.collection("opportunities").countDocuments({ userId, status: "SAVED" })
    const totalApplied = await db.collection("opportunities").countDocuments({ userId, status: "APPLIED" })
    const totalInterviews = await db.collection("opportunities").countDocuments({ userId, status: { $in: ["INTERVIEW", "INTERVIEWING"] } })

    // 2. Outreach / User Profile
    const outreachProfile = await db.collection("outreach_profiles").findOne({ userId })

    // 3. FormKit Projects & Snippets
    const projects = await db.collection("projects").find({ userId }).toArray()
    const formKitSnippets = projects.flatMap((p) => {
      const snippets = p.snippets || {}
      const list: Array<{ id: string; title: string; length: string; text: string; category: string }> = []
      if (snippets.short) list.push({ id: `${p._id}-s`, title: `${p.title} (Short)`, length: "short", text: snippets.short, category: p.roleCategory || "Project" })
      if (snippets.medium) list.push({ id: `${p._id}-m`, title: `${p.title} (Medium)`, length: "medium", text: snippets.medium, category: p.roleCategory || "Project" })
      if (snippets.long) list.push({ id: `${p._id}-l`, title: `${p.title} (Long)`, length: "long", text: snippets.long, category: p.roleCategory || "Project" })
      return list
    })

    // 4. Today's Active Day Planner Task
    const today = new Date().toISOString().split("T")[0]
    const todayPlan = await db.collection("daily_plans").findOne({ userId, date: today })
    let activeTask = null
    if (todayPlan && todayPlan.tasks) {
      activeTask = todayPlan.tasks.find((t: any) => !t.completed) || null
    }

    // 5. Upcoming Reminders & Follow-Ups
    const now = new Date()
    const upcomingDeadlines = await db.collection("reminders")
      .find({ userId, done: false, dueAt: { $gte: now } })
      .sort({ dueAt: 1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      stats: {
        totalSaved,
        totalApplied,
        totalInterviews,
      },
      profile: outreachProfile ? {
        fullName: outreachProfile.fullName || session.user.name,
        email: outreachProfile.email || session.user.email,
        phone: outreachProfile.phone || "",
        linkedin: outreachProfile.linkedin || "",
        github: outreachProfile.github || "",
        portfolio: outreachProfile.portfolio || "",
        skills: outreachProfile.skills || [],
        bio: outreachProfile.bio || "",
      } : {
        fullName: session.user.name || "",
        email: session.user.email || "",
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
        skills: [],
        bio: "",
      },
      formKitSnippets,
      activeTask,
      reminders: upcomingDeadlines.map((r) => ({
        id: r._id.toString(),
        company: r.company,
        jobTitle: r.jobTitle,
        type: r.type,
        dueAt: r.dueAt,
        message: r.message,
      })),
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[GET /api/extension/status]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
