import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { ModifyPlanRequest, PlannerTask } from "@/types/planner"

export const dynamic = "force-dynamic"

function formatMinutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 || 12
  const minStr = m < 10 ? `0${m}` : m
  return `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hours < 12) hours += 12
  if (ampm === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function recalculateTimeline(taskList: PlannerTask[], startMins?: number): PlannerTask[] {
  let pointer = startMins ?? 540
  if (startMins === undefined && taskList.length > 0 && taskList[0].startTime) {
    const p = parseTimeToMinutes(taskList[0].startTime)
    if (p !== null) pointer = p
  }

  return taskList.map((t) => {
    if (t.completed) return t
    const dur = t.durationMinutes || 30
    const startStr = formatMinutesToTime(pointer)
    pointer += dur
    const endStr = formatMinutesToTime(pointer)
    return {
      ...t,
      startTime: startStr,
      endTime: endStr,
    }
  })
}

function fallbackModify(tasks: PlannerTask[], instruction: string, clientCurrentMinutes?: number): { tasks: PlannerTask[]; explanation: string } {
  let updated = [...tasks]
  const lower = instruction.toLowerCase()

  // If user says "break" and mentions minutes
  const breakMatch = lower.match(/(?:add|insert|take|make)\s*(?:a\s*)?(\d+)?\s*(?:min|m)?\s*break/i)
  if (breakMatch) {
    const breakMins = parseInt(breakMatch[1], 10) || 20
    const newBreak: PlannerTask = {
      id: "mod-break-" + Date.now(),
      title: "Held Break & Cognitive Recharge",
      category: "break",
      durationMinutes: breakMins,
      priority: "low",
      completed: false,
      description: "Scheduled recharge break per AI modification request.",
    }
    // insert in the middle
    const midIndex = Math.max(1, Math.floor(updated.length / 2))
    updated.splice(midIndex, 0, newBreak)
  }

  // If user mentions duration change like "2 hours" or "1.5 hours" or "45 mins"
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|h)/i)
  const minMatch = lower.match(/(\d+)\s*(?:minutes|mins|min|m)\b/i)

  if (hourMatch || minMatch) {
    const newDur = hourMatch ? Math.round(parseFloat(hourMatch[1]) * 60) : parseInt(minMatch![1], 10)
    // Find target subject if mentioned
    let targetIndex = 0
    updated.forEach((t, i) => {
      if (lower.includes(t.title.toLowerCase()) || lower.includes(t.category)) {
        targetIndex = i
      }
    })
    if (updated[targetIndex] && updated[targetIndex].category !== "break") {
      updated[targetIndex] = { ...updated[targetIndex], durationMinutes: newDur }
    }
  }

  // Recalculate times
  const baseStart = clientCurrentMinutes !== undefined
    ? Math.ceil(clientCurrentMinutes / 5) * 5
    : undefined

  const finalTasks = recalculateTimeline(updated, baseStart)

  return {
    tasks: finalTasks,
    explanation: `Applied modification: "${instruction}". Recalculated timeline accurately.`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ModifyPlanRequest = await request.json()
    const { instruction, tasks, clientCurrentMinutes } = body

    if (!instruction || !instruction.trim()) {
      return NextResponse.json({ error: "Please enter your modification instruction" }, { status: 400 })
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks to modify" }, { status: 400 })
    }

    const nowMinutes = clientCurrentMinutes !== undefined
      ? clientCurrentMinutes
      : new Date().getHours() * 60 + new Date().getMinutes()

    const formattedNowTime = formatMinutesToTime(Math.ceil(nowMinutes / 5) * 5)

    if (!isGeminiConfigured()) {
      const fallbackResult = fallbackModify(tasks, instruction, clientCurrentMinutes)
      return NextResponse.json(fallbackResult)
    }

    const prompt = `You are an elite productivity executive assistant.
The candidate has an active Day Plan / Todo List and wants to make modifications via natural language.

CANDIDATE'S INSTRUCTION:
"${instruction}"

CURRENT REAL-WORLD TIME: ${formattedNowTime}
CURRENT TASKS IN PLAN:
${tasks.map((t, i) => `${i + 1}. [${t.category}] "${t.title}" (${t.durationMinutes} mins, ${t.startTime || ""} - ${t.endTime || ""}, completed: ${t.completed})`).join("\n")}

CRITICAL INSTRUCTIONS:
1. Modify the tasks list to accurately reflect the user's instruction.
   - You may change durations (e.g. from 60m to 120m).
   - You may insert new tasks or break sessions (category: "break").
   - You may remove or split tasks if asked.
   - Any completed task MUST remain completed and intact.
2. GLOBAL TIME ACCURACY:
   - Recalculate startTime and endTime for all tasks sequentially starting from ${formattedNowTime}.
   - The first uncompleted task MUST start at ${formattedNowTime}.
   - Each subsequent task starts exactly when the previous task ends.
3. Return valid JSON only with this schema:
{
  "tasks": [
    {
      "id": "t1",
      "title": "Task title",
      "category": "study" | "interview_prep" | "application" | "coding" | "break" | "review",
      "durationMinutes": 120,
      "startTime": "01:00 PM",
      "endTime": "03:00 PM",
      "priority": "high" | "medium" | "low",
      "completed": false,
      "description": "Short description"
    }
  ],
  "explanation": "1-sentence summary of the changes made"
}`

    try {
      const result = await extractJSON<{ tasks: PlannerTask[]; explanation?: string }>(prompt)
      if (result?.tasks && Array.isArray(result.tasks) && result.tasks.length > 0) {
        return NextResponse.json({
          tasks: result.tasks,
          explanation: result.explanation || "Modified tasks according to your instruction.",
        })
      }
      throw new Error("Invalid modification output format from AI")
    } catch (aiErr) {
      console.warn("[POST /api/planner/modify] AI error, falling back:", aiErr)
      const fallbackResult = fallbackModify(tasks, instruction, clientCurrentMinutes)
      return NextResponse.json(fallbackResult)
    }
  } catch (error) {
    console.error("[POST /api/planner/modify]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
