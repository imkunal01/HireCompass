import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { PlannerTask } from "@/types/planner"

export const dynamic = "force-dynamic"

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

// POST /api/planner/link-task — adds a coding problem task directly to today's Day Plan
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, problemLink, topic, difficulty, platform, durationMinutes = 45 } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const col = db.collection("daily_plans")

    const todayStr = getTodayString()
    const now = new Date()

    const newTask: PlannerTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Solve: ${title}`,
      category: "coding",
      durationMinutes: typeof durationMinutes === "number" ? durationMinutes : 45,
      priority: difficulty === "Hard" ? "high" : "medium",
      completed: false,
      description: problemLink ? `Practice on ${platform || "LeetCode"}: ${problemLink}` : `Topic: ${topic || "DSA"}`,
      notes: `Target: ${topic || "Coding"} (${difficulty || "Practice"}). Added from Problem Solving Sheets.`,
    }

    const existingPlan = await col.findOne({ userId: session.user.id, date: todayStr })

    if (existingPlan) {
      await col.updateOne(
        { _id: existingPlan._id },
        {
          $push: { tasks: newTask as any },
          $set: { updatedAt: now.toISOString() },
        }
      )
    } else {
      const newPlan = {
        userId: session.user.id,
        date: todayStr,
        rawInput: "Auto-generated from Problem Solving practice session",
        availableHours: 4,
        energyLevel: "morning_peak",
        intensity: "balanced",
        selectedStrategyId: "coding_focus",
        strategyName: "Problem Solving Sprint",
        strategyTagline: "Targeted algorithm and concept practice",
        tasks: [newTask],
        status: "active",
        focusMinutesLogged: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
      await col.insertOne(newPlan)
    }

    return NextResponse.json({
      success: true,
      message: `Added "${title}" to today's Day Planner`,
      task: newTask,
    })
  } catch (error) {
    console.error("[POST /api/planner/link-task]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
