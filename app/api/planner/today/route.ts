import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { DayPlan, DayPlannerStats } from "@/types/planner"

export const dynamic = "force-dynamic"

function getTodayString(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("daily_plans")

    const todayStr = getTodayString()

    // Find today's plan
    const todayPlanDoc = await col.findOne({
      userId: session.user.id,
      date: todayStr,
    })

    // Compute stats (streak, total focus logged, completed tasks)
    const allPastPlans = await col
      .find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(30)
      .toArray()

    let currentStreak = 0
    let totalFocusMinutes = 0
    let completedTasksCount = 0

    // Check consecutive days
    const uniqueDates = Array.from(new Set(allPastPlans.map((p) => p.date))).sort().reverse()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let checkDate = new Date(today)
    for (const dStr of uniqueDates) {
      const pDate = new Date(dStr)
      pDate.setHours(0, 0, 0, 0)
      const diffDays = Math.round((checkDate.getTime() - pDate.getTime()) / (1000 * 3600 * 24))
      if (diffDays === 0 || diffDays === 1) {
        currentStreak++
        checkDate = pDate
      } else {
        break
      }
    }

    allPastPlans.forEach((p) => {
      totalFocusMinutes += p.focusMinutesLogged || 0
      if (Array.isArray(p.tasks)) {
        completedTasksCount += p.tasks.filter((t: any) => t.completed).length
      }
    })

    const stats: DayPlannerStats = {
      currentStreak: Math.max(currentStreak, todayPlanDoc ? 1 : 0),
      totalFocusHoursLogged: Number((totalFocusMinutes / 60).toFixed(1)),
      completedTasksCount,
      recentPlansCount: allPastPlans.length,
    }

    let plan: DayPlan | null = null
    if (todayPlanDoc) {
      plan = {
        ...todayPlanDoc,
        id: todayPlanDoc._id.toString(),
        _id: todayPlanDoc._id.toString(),
      } as DayPlan
    }

    return NextResponse.json({ plan, stats })
  } catch (error) {
    console.error("[GET /api/planner/today]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: Partial<DayPlan> = await request.json()
    const todayStr = getTodayString()

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("daily_plans")

    const now = new Date()

    const updateDoc = {
      userId: session.user.id,
      date: todayStr,
      rawInput: body.rawInput || "",
      availableHours: body.availableHours || 4,
      energyLevel: body.energyLevel || "morning_peak",
      intensity: body.intensity || "balanced",
      selectedStrategyId: body.selectedStrategyId || "",
      strategyName: body.strategyName || "Custom Plan",
      strategyTagline: body.strategyTagline || "",
      tasks: body.tasks || [],
      status: body.status || "active",
      focusMinutesLogged: body.focusMinutesLogged || 0,
      updatedAt: now.toISOString(),
    }

    const result = await col.findOneAndUpdate(
      { userId: session.user.id, date: todayStr },
      {
        $set: updateDoc,
        $setOnInsert: { createdAt: now.toISOString() },
      },
      { upsert: true, returnDocument: "after" }
    )

    const saved = result?.value || updateDoc

    return NextResponse.json({
      plan: {
        ...saved,
        id: saved._id ? saved._id.toString() : "today-plan",
      },
    })
  } catch (error) {
    console.error("[POST /api/planner/today]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("daily_plans")

    const todayStr = getTodayString()
    await col.deleteOne({ userId: session.user.id, date: todayStr })

    return NextResponse.json({ success: true, message: "Today's plan reset successfully" })
  } catch (error) {
    console.error("[DELETE /api/planner/today]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
