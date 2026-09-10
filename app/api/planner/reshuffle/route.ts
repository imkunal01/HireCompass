import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { ReshuffleRequest, PlannerTask } from "@/types/planner"

export const dynamic = "force-dynamic"

function fallbackReshuffle(tasks: PlannerTask[], delayMinutes: number, lighten: boolean): PlannerTask[] {
  const completed = tasks.filter((t) => t.completed)
  const remaining = tasks.filter((t) => !t.completed)

  let adjustedRemaining = remaining
  if (lighten) {
    // Drop or trim low priority tasks
    adjustedRemaining = remaining
      .filter((t) => t.priority !== "low" || t.category === "break")
      .map((t) => ({
        ...t,
        durationMinutes: Math.max(15, Math.round(t.durationMinutes * 0.8)),
      }))
  }

  // Recalculate start and end times starting from current time
  const now = new Date()
  let currentMoment = new Date(now.getTime() + delayMinutes * 60000)

  const formatTime = (d: Date) => {
    let hours = d.getHours()
    const minutes = d.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    const minStr = minutes < 10 ? `0${minutes}` : minutes
    return `${hours < 10 ? `0${hours}` : hours}:${minStr} ${ampm}`
  }

  const updatedRemaining = adjustedRemaining.map((task) => {
    const startStr = formatTime(currentMoment)
    const endMoment = new Date(currentMoment.getTime() + task.durationMinutes * 60000)
    const endStr = formatTime(endMoment)
    currentMoment = endMoment
    return {
      ...task,
      startTime: startStr,
      endTime: endStr,
    }
  })

  return [...completed, ...updatedRemaining]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ReshuffleRequest = await request.json()
    const { reason, customPrompt, tasks } = body

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided to reshuffle" }, { status: 400 })
    }

    const completed = tasks.filter((t) => t.completed)
    const incomplete = tasks.filter((t) => !t.completed)

    let delayMinutes = 0
    let isLighten = false
    let instruction = "Recalculate schedule starting from now."

    if (reason === "running_late_30") {
      delayMinutes = 30
      instruction = "User is running 30 minutes behind schedule. Shift start/end times and adjust intervals slightly to fit."
    } else if (reason === "running_late_60") {
      delayMinutes = 60
      instruction = "User is running 1 hour behind schedule. Shift times, compress non-essential breaks or low-priority tasks."
    } else if (reason === "fatigued_light") {
      isLighten = true
      instruction = "User is experiencing cognitive fatigue. Reduce duration of heavy tasks by 20-30%, insert small breathing room, prioritize high value over volume."
    } else if (reason === "cut_short_2h") {
      instruction = "Remaining day has been cut short. Focus only on the absolute highest priority tasks, prune or defer low priority tasks."
    } else if (reason === "custom" && customPrompt) {
      instruction = `User custom request: "${customPrompt}". Adapt remaining tasks accordingly.`
    }

    if (!isGeminiConfigured()) {
      const reshuffled = fallbackReshuffle(tasks, delayMinutes, isLighten)
      return NextResponse.json({ tasks: reshuffled, message: "Schedule adapted with standard fallback" })
    }

    const prompt = `You are an adaptive productivity AI planner.
The user needs to dynamically reshuffle their remaining day schedule without feeling guilty.

Status:
- Completed tasks: ${completed.length} (These MUST NOT be changed or removed).
- Remaining incomplete tasks:
${incomplete.map((t) => `- [${t.priority}] ${t.title} (${t.durationMinutes}m, category: ${t.category})`).join("\n")}

Reshuffle Context / Instruction:
${instruction}

Current Time: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}

TASK:
Rebalance and reschedule the INCOMPLETE tasks.
- You may adjust task durations (e.g., from 60m down to 45m).
- You may reorder tasks or prune non-essential low-priority tasks if time is very tight.
- Recalculate realistic startTime and endTime strings (e.g. "02:15 PM" to "03:00 PM").
- Return valid JSON matching schema:
{
  "reshuffledIncompleteTasks": [
    {
      "id": "existing-or-new-id",
      "title": "Task title",
      "category": "study" | "interview_prep" | "application" | "coding" | "break" | "review",
      "durationMinutes": 45,
      "startTime": "02:15 PM",
      "endTime": "03:00 PM",
      "priority": "high" | "medium" | "low",
      "completed": false,
      "description": "Short description",
      "aiTips": ["tip 1", "tip 2"]
    }
  ],
  "encouragement": "One encouraging 1-sentence note on how to conquer the rest of the day."
}`

    try {
      const result = await extractJSON<{
        reshuffledIncompleteTasks: PlannerTask[]
        encouragement?: string
      }>(prompt)

      if (result?.reshuffledIncompleteTasks && Array.isArray(result.reshuffledIncompleteTasks)) {
        const fullTasks = [...completed, ...result.reshuffledIncompleteTasks]
        return NextResponse.json({
          tasks: fullTasks,
          encouragement: result.encouragement || "Schedule adapted. Take it one step at a time!",
        })
      }
      throw new Error("Invalid reshuffle output from AI")
    } catch (aiErr) {
      console.warn("[POST /api/planner/reshuffle] AI error, falling back:", aiErr)
      const fullTasks = fallbackReshuffle(tasks, delayMinutes, isLighten)
      return NextResponse.json({
        tasks: fullTasks,
        encouragement: "Schedule updated to give you fresh breathing room.",
      })
    }
  } catch (error) {
    console.error("[POST /api/planner/reshuffle]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
