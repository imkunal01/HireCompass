import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { GeneratePlannerRequest, PlannerStrategyOption, PlannerTask } from "@/types/planner"

export const dynamic = "force-dynamic"

function formatMinutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 || 12
  const minStr = m < 10 ? `0${m}` : m
  return `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`
}

/**
 * Intelligent fallback that extracts actual topics/goals & durations from user's raw text
 * and starts accurately from the user's real-world current local time!
 */
function generateFallbackOptions(
  rawInput: string,
  clientCurrentMinutes?: number,
  sessionDurationMinutes?: number,
  breakHoldingMinutes?: number,
  breakMode?: "fit_inside" | "extend_window"
): PlannerStrategyOption[] {
  const cleanInput = rawInput.trim()

  // Auto-detect durations from user prompt text (e.g. "2 hours", "90m", "45 mins")
  const hourMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|h)\b/i)
  const minMatch = cleanInput.match(/(\d+)\s*(?:minutes|mins|min|m)\b/i)
  const promptDurationMins = hourMatch
    ? Math.round(parseFloat(hourMatch[1]) * 60)
    : minMatch
    ? parseInt(minMatch[1], 10)
    : undefined

  // Auto-detect break duration from user prompt
  const breakPromptMatch = cleanInput.match(/(?:break|pause|rest)\s*(?:of\s*)?(\d+)?\s*(?:min|m)?/i)
  const promptBreakMins = breakPromptMatch
    ? parseInt(breakPromptMatch[1], 10) || 30
    : cleanInput.toLowerCase().includes("break")
    ? 30
    : undefined

  const effectiveSessionMins = sessionDurationMinutes || promptDurationMins || 120
  const effectiveBreakMins = breakHoldingMinutes !== undefined ? breakHoldingMinutes : promptBreakMins !== undefined ? promptBreakMins : 20

  // Extract key topics from user text (split by 'and', commas, plus, newlines, semicolons)
  const rawParts = cleanInput
    ? cleanInput
        .split(/[,;\n\+]|\band\b/i)
        .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, "").replace(/\b\d+\s*(?:hours|hrs|hr|h|mins|min|m)\b/gi, "").trim())
        .filter((s) => s.length > 2 && !/^(?:take|a)?\s*break$/i.test(s))
    : ["Core Technical Focus", "Interview Problem Solving", "Job Applications"]

  let topics = rawParts.length > 0 ? rawParts : ["Primary Subject Focus", "Secondary Practice"]

  if (topics.length === 1 && effectiveSessionMins >= 90) {
    topics = [`${topics[0]}: Core Architecture & Theory`, `${topics[0]}: Deep Practice & Edge Cases`]
  }

  // ACCURATE GLOBAL TIME: Anchor to client's exact current local minute (rounded to next 5m)
  const now = new Date()
  const baseStartMins = clientCurrentMinutes !== undefined
    ? Math.ceil(clientCurrentMinutes / 5) * 5
    : Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5

  const formatTime = (totalMinutesFromStart: number) => {
    return formatMinutesToTime(baseStartMins + totalMinutesFromStart)
  }

  // Helper to construct a task sequence
  const buildPlan = (
    strategyId: string,
    strategyName: string,
    tagline: string,
    vibe: "deep_work" | "balanced_flow" | "momentum_velocity",
    icon: string,
    cognitiveLoad: "High" | "Medium" | "Low",
    order: string[]
  ): PlannerStrategyOption => {
    let currentMin = 0
    const tasks: PlannerTask[] = []
    const slotDuration = effectiveSessionMins

    order.forEach((topic, idx) => {
      const isCoding = /leetcode|code|coding|dsa|algo|problem/i.test(topic)
      const isApp = /apply|application|outreach|email|resume/i.test(topic)
      const isInterview = /mock|interview|prep|system design/i.test(topic)
      const category = isCoding ? "coding" : isApp ? "application" : isInterview ? "interview_prep" : "study"

      const start = formatTime(currentMin)
      currentMin += slotDuration
      const end = formatTime(currentMin)

      tasks.push({
        id: `${strategyId}-t${idx + 1}`,
        title: topic.charAt(0).toUpperCase() + topic.slice(1),
        category,
        durationMinutes: slotDuration,
        startTime: start,
        endTime: end,
        priority: idx === 0 ? "high" : "medium",
        completed: false,
        description: `Dedicated focused block: ${topic}`,
        aiTips: ["Break down into sub-problems", "Keep distractions muted during the block"],
      })

      // Insert held break between major subject sessions
      if (effectiveBreakMins > 0 && idx < order.length - 1) {
        const breakStart = formatTime(currentMin)
        currentMin += effectiveBreakMins
        const breakEnd = formatTime(currentMin)
        tasks.push({
          id: `${strategyId}-break-${idx + 1}`,
          title: "Held Break & Cognitive Recharge",
          category: "break",
          durationMinutes: effectiveBreakMins,
          startTime: breakStart,
          endTime: breakEnd,
          priority: "low",
          completed: false,
          description: "Step away from screen, hydrate, and let concepts consolidate.",
        })
      }
    })

    const focusMins = tasks.filter((t) => t.category !== "break").reduce((s, t) => s + t.durationMinutes, 0)
    const breakMins = tasks.filter((t) => t.category === "break").reduce((s, t) => s + t.durationMinutes, 0)

    return {
      id: strategyId,
      strategyName,
      tagline,
      vibe,
      icon,
      totalFocusMinutes: focusMins,
      totalBreakMinutes: breakMins,
      cognitiveLoad,
      whyThisWorks: `Constructed based on your exact goals: ${slotDuration}m deep blocks starting at ${formatTime(0)} with ${effectiveBreakMins}m recharge breaks.`,
      tasks,
    }
  }

  return [
    buildPlan(
      "strat-1",
      "Deep Focus First (Eat The Frog)",
      "Tackle your hardest topic first, followed by scheduled break and second subject session.",
      "deep_work",
      "zap",
      "High",
      [...topics]
    ),
    buildPlan(
      "strat-2",
      "Pomodoro & Balanced Flow",
      "Structured deep study sprints with restorative pauses for sustained stamina.",
      "balanced_flow",
      "clock",
      "Medium",
      [...topics]
    ),
    buildPlan(
      "strat-3",
      "Momentum & Velocity",
      "Start with rapid progress on lighter goals to unlock dopamine and focus for main study.",
      "momentum_velocity",
      "flame",
      "Medium",
      [...topics].reverse()
    ),
  ]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: GeneratePlannerRequest = await request.json()
    const {
      rawInput,
      availableHours,
      sessionDurationMinutes,
      breakHoldingMinutes,
      breakMode,
      clientCurrentMinutes,
      clientTimeStr,
      syncedEvents,
    } = body

    if (!rawInput && !syncedEvents) {
      return NextResponse.json(
        { error: "Please enter your goals or sync events for today." },
        { status: 400 }
      )
    }

    // Accurate real-world local time
    const now = new Date()
    const currentMins = clientCurrentMinutes !== undefined
      ? clientCurrentMinutes
      : now.getHours() * 60 + now.getMinutes()

    const startFromTimeStr = clientTimeStr || formatMinutesToTime(Math.ceil(currentMins / 5) * 5)

    if (!isGeminiConfigured()) {
      const fallbackOptions = generateFallbackOptions(
        rawInput || "Tech prep",
        clientCurrentMinutes,
        sessionDurationMinutes,
        breakHoldingMinutes,
        breakMode
      )
      return NextResponse.json({ options: fallbackOptions })
    }

    // Build rich AI prompt
    const syncedContextStr = [
      syncedEvents?.interviews?.length
        ? `Fixed Interviews Today: ${syncedEvents.interviews.map((i) => `${i.company} (${i.time || "Scheduled"})`).join(", ")}`
        : "",
      syncedEvents?.reminders?.length
        ? `Pending Reminders: ${syncedEvents.reminders.map((r) => r.message).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")

    const prompt = `You are an elite productivity executive coach for tech candidates.
Plan a realistic, high-impact day schedule for a student or engineer based on their EXACT natural text input.

USER'S EXACT GOALS & INPUT:
"${rawInput}"

CRITICAL REQUIREMENT — GLOBAL TIME ACCURACY:
- Current real-world local time right now is: ${startFromTimeStr}
- The very first task MUST start at ${startFromTimeStr} (rounded to next 5 mins).
- Under NO circumstances start at 9:00 AM unless the current time is actually 9:00 AM.
- Consecutive tasks must flow continuously (endTime of task 1 = startTime of task 2).

CRITICAL INSTRUCTIONS ON PARSING USER INTENT:
1. Extract the EXACT topics, durations, and breaks mentioned in the user prompt:
   - If they wrote "DSA 2 hours, System design 2 hours, take a break in between", create:
     * Task 1: DSA (120 mins) starting at ${startFromTimeStr}
     * Task 2: Break (30 mins)
     * Task 3: System Design (120 mins)
   - If they mentioned specific tools, languages, or problem sets, create tasks titled with those exact names.
   - NEVER use vague titles like "Study Block 1" or "Core Concept".
2. STRUCTURE 3 BLUEPRINTS:
   - Option 1: "Deep Focus First (Eat The Frog)" (vibe: "deep_work") — hardest technical topic scheduled first.
   - Option 2: "Pomodoro & Balanced Flow" (vibe: "balanced_flow") — balanced intervals with planned break.
   - Option 3: "Momentum & Velocity" (vibe: "momentum_velocity") — start with quick wins before deep study.
3. Keep each blueprint cleanly structured (primary subject blocks with dedicated held breaks in-between).
4. For each task:
   - id: string ("t1", "t2", etc.)
   - title: concise, specific title derived directly from user's input (or "Held Break & Cognitive Recharge" for breaks)
   - category: "study" | "interview_prep" | "application" | "coding" | "break" | "review"
   - durationMinutes: integer (e.g. 120, 60, 45, 30, 20, 15)
   - startTime: format "01:00 PM" (continuous times starting from ${startFromTimeStr})
   - endTime: format "03:00 PM"
   - priority: "high" | "medium" | "low"
   - completed: false
   - description: 1 concise sentence on what to accomplish
   - aiTips: array of 2 short actionable bullet points

${syncedContextStr ? `Fixed Calendar Constraints:\n${syncedContextStr}\n` : ""}

Output valid JSON only matching schema:
{
  "options": [
    {
      "id": "strat-1",
      "strategyName": "Deep Focus First (Eat The Frog)",
      "tagline": "...",
      "vibe": "deep_work",
      "icon": "zap",
      "totalFocusMinutes": 240,
      "totalBreakMinutes": 30,
      "cognitiveLoad": "High",
      "whyThisWorks": "...",
      "tasks": [ ... ]
    },
    {
      "id": "strat-2",
      "strategyName": "Pomodoro & Balanced Flow",
      "tagline": "...",
      "vibe": "balanced_flow",
      "icon": "clock",
      "totalFocusMinutes": 240,
      "totalBreakMinutes": 30,
      "cognitiveLoad": "Medium",
      "whyThisWorks": "...",
      "tasks": [ ... ]
    },
    {
      "id": "strat-3",
      "strategyName": "Momentum & Velocity",
      "tagline": "...",
      "vibe": "momentum_velocity",
      "icon": "flame",
      "totalFocusMinutes": 240,
      "totalBreakMinutes": 30,
      "cognitiveLoad": "Medium",
      "whyThisWorks": "...",
      "tasks": [ ... ]
    }
  ]
}`

    try {
      const result = await extractJSON<{ options: PlannerStrategyOption[] }>(
        prompt,
        undefined,
        undefined,
        4096
      )
      if (result?.options && Array.isArray(result.options) && result.options.length > 0) {
        return NextResponse.json({ options: result.options })
      }
      throw new Error("Invalid options format returned from AI")
    } catch (aiErr) {
      console.warn("[POST /api/planner/generate] AI error, using smart fallback:", aiErr)
      const fallbackOptions = generateFallbackOptions(
        rawInput || "Tech prep",
        clientCurrentMinutes,
        sessionDurationMinutes,
        breakHoldingMinutes,
        breakMode
      )
      return NextResponse.json({ options: fallbackOptions })
    }
  } catch (error) {
    console.error("[POST /api/planner/generate]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
