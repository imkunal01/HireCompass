import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export interface UserActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: "job" | "interview" | "assessment" | "planner" | "system"
  iconType: "send" | "calendar" | "zap" | "bell" | "chart"
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      // In guest mode, return a curated real onboarding activity stream
      return NextResponse.json({
        activities: [
          {
            id: "guest-1",
            title: "Guest Explorer Mode Active",
            description: "Exploring live features with 10 free AI copilot tokens.",
            timestamp: new Date().toISOString(),
            type: "system",
            iconType: "zap",
          },
          {
            id: "guest-2",
            title: "Capgemini Assessment Ready",
            description: "150 curated Capgemini DSA & prompt engineering challenges available.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: "assessment",
            iconType: "chart",
          },
          {
            id: "guest-3",
            title: "Kanban Pipeline Initialized",
            description: "Ready to track applications from Saved to Offer.",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            type: "job",
            iconType: "send",
          },
        ],
      })
    }

    const userId = session.user.id
    const client = await clientPromise
    const db = client.db()

    const activities: UserActivityItem[] = []

    // 1. Fetch recent telemetry user activities
    const userActs = await db
      .collection("user_activities")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(8)
      .toArray()

    userActs.forEach((act) => {
      activities.push({
        id: act._id.toString(),
        title: act.title || act.action || "Platform Activity",
        description: act.path ? `Visited ${act.path}` : "User interaction logged",
        timestamp: act.timestamp ? new Date(act.timestamp).toISOString() : new Date().toISOString(),
        type: act.path?.includes("assessment")
          ? "assessment"
          : act.path?.includes("planner")
          ? "planner"
          : "system",
        iconType: act.path?.includes("assessment")
          ? "zap"
          : act.path?.includes("planner")
          ? "calendar"
          : "chart",
      })
    })

    // 2. Fetch recent opportunities created or updated
    const opps = await db
      .collection("opportunities")
      .find({ userId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(6)
      .toArray()

    opps.forEach((opp) => {
      const isNew = opp.createdAt && Math.abs(new Date(opp.updatedAt || opp.createdAt).getTime() - new Date(opp.createdAt).getTime()) < 10000
      activities.push({
        id: `opp-${opp._id.toString()}`,
        title: isNew ? `Saved ${opp.company}` : `${opp.company} (${opp.status})`,
        description: isNew
          ? `Added "${opp.title}" to your tracking pipeline.`
          : `Application status updated to ${opp.status}.`,
        timestamp: new Date(opp.updatedAt || opp.createdAt || Date.now()).toISOString(),
        type: "job",
        iconType: opp.status === "INTERVIEW" ? "calendar" : opp.status === "APPLIED" ? "send" : "bell",
      })
    })

    // 3. Fetch recent interviews
    const interviews = await db
      .collection("interviews")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray()

    interviews.forEach((inv) => {
      activities.push({
        id: `inv-${inv._id.toString()}`,
        title: `${inv.company} Interview Scheduled`,
        description: `${inv.role} round on ${inv.date} ${inv.time || ""}`,
        timestamp: new Date(inv.createdAt || Date.now()).toISOString(),
        type: "interview",
        iconType: "calendar",
      })
    })

    // Sort all combined activities chronologically descending
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Fallback if empty
    if (activities.length === 0) {
      activities.push(
        {
          id: "welcome-1",
          title: "Account Setup Complete",
          description: "Your job search dashboard is ready to track applications.",
          timestamp: new Date().toISOString(),
          type: "system",
          iconType: "zap",
        },
        {
          id: "welcome-2",
          title: "Track First Opportunity",
          description: "Click '+ Add Job' above or use the Chrome extension.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "job",
          iconType: "send",
        }
      )
    }

    return NextResponse.json({ activities: activities.slice(0, 7) })
  } catch (error) {
    console.error("[GET /api/dashboard/activities]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
