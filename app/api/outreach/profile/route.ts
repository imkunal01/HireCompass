import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

// ── GET /api/outreach/profile — get user outreach profile ─────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const col = client.db().collection("outreach_profiles")

    const profile = await col.findOne({ userId: session.user.id })

    if (!profile) {
      // Return empty default
      return NextResponse.json({
        userId: session.user.id,
        fullName: session.user.name || "",
        email: session.user.email || "",
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
        skills: [],
        bio: "",
        projects: [],
      })
    }

    return NextResponse.json({
      ...profile,
      _id: profile._id.toString(),
      updatedAt: profile.updatedAt?.toISOString?.() ?? profile.updatedAt,
    })
  } catch (err) {
    console.error("[GET /api/outreach/profile]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST /api/outreach/profile — save user outreach profile ───────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, phone, linkedin, github, portfolio, skills, bio, projects } = body

    const client = await clientPromise
    const col = client.db().collection("outreach_profiles")

    const now = new Date()
    await col.updateOne(
      { userId: session.user.id },
      {
        $set: {
          userId: session.user.id,
          fullName: fullName || session.user.name,
          email: email || session.user.email,
          phone: phone || "",
          linkedin: linkedin || "",
          github: github || "",
          portfolio: portfolio || "",
          skills: skills || [],
          bio: bio || "",
          projects: projects || [],
          updatedAt: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST /api/outreach/profile]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
