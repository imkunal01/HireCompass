import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { GeneratePlannerRequest, PlannerStrategyOption, PlannerTask } from "@/types/planner"

export const dynamic = "force-dynamic"

/**
 * Intelligent fallback that extracts actual topics/goals from user's raw text
 * so even in offline/rate-limit fallback mode, the plan directly matches what the user entered!
 */
function generateFallbackOptions(
  rawInput: string,
  availableHours: number,
  energyLevel: string
): PlannerStrategyOption[] {
  const totalMins = Math.max(60, Math.round(availableHours * 60))
  const cleanInput = rawInput.trim()

  // Extract key topics from user text (split by 'and', commas, plus, newlines, semicolons)
  const rawParts = cleanInput
    ? cleanInput
        .split(/[,;\n\+]|\band\b/i)
        .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, ""))
        .filter((s) => s.length > 2)
    : ["Core Technical Topic", "Interview Problem Solving", "Job Applications"]

  const topics = rawParts.length > 0 ? rawParts : ["Primary Goal", "Secondary Practice"]

  const formatTime = (totalMinutesFromStart: number) => {
    const startHour = energyLevel === "night_owl" ? 18 : 9 // 9 AM or 6 PM
    const startMins = startHour * 60 + totalMinutesFromStart
    const h = Math.floor(startMins / 60) % 24
    const m = startMins % 60
    const ampm = h >= 12 ? "PM" : "AM"
    const displayH = h % 12 || 12
    const minStr = m < 10 ? `0${m}` : m
    return `${displayH < 10 ? `0${displayH}` : displayH}:${minStr} ${ampm}`
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
    const slotDuration = Math.max(30, Math.round((totalMins * 0.82) / Math.max(1, order.length)))

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

      // Insert 15m break after second task if time permits
      if (idx === 1 && currentMin + 20 < totalMins) {
        const breakStart = formatTime(currentMin)
        currentMin += 15
        const breakEnd = formatTime(currentMin)
        tasks.push({
          id: `${strategyId}-break`,
          title: "Hydration & Cognitive Recharge",
          category: "break",
          durationMinutes: 15,
          startTime: breakStart,
          endTime: breakEnd,
          priority: "low",
          completed: false,
          description: "Step away from screen, drink water and stretch.",
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
      whyThisWorks: `Prioritizes ${topics[0]} while giving structure to complete all ${topics.length} commitments today.`,
      tasks,
    }
  }

  return [
    buildPlan(
      "strat-1",
      "Deep Focus First (Eat The Frog)",
      "Tackle your hardest topic during peak energy hours, followed by application and review.",
      "deep_work",
      "zap",
      "High",
      [...topics]
    ),
    buildPlan(
      "strat-2",
      "Pomodoro & Balanced Flow",
      "Structured 45m deep study sprints with restorative pauses for sustained stamina.",
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
    const { rawInput, availableHours, energyLevel, intensity, syncedEvents } = body

    if (!rawInput && !syncedEvents) {
      return NextResponse.json(
        { error: "Please enter your goals or sync events for today." },
        { status: 400 }
      )
    }

    const hours = Number(availableHours) || 4

    if (!isGeminiConfigured()) {
      const fallbackOptions = generateFallbackOptions(rawInput || "Tech prep", hours, energyLevel || "morning_peak")
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
Plan a realistic, high-impact day schedule for a student or engineer based on their EXACT input.

USER'S EXACT GOALS & INPUT:
"${rawInput}"

PARAMETERS:
- Available Time: ${hours} hours (${hours * 60} minutes total)
- Peak Energy: ${energyLevel || "morning_peak"}
- Pace: ${intensity || "balanced"}
${syncedContextStr ? `\nFixed Calendar Constraints:\n${syncedContextStr}` : ""}

CRITICAL INSTRUCTIONS:
1. MATCH USER PROMPT SPECIFICALLY:
   - Extract the EXACT topics, tools, problem sets, and jobs mentioned in the user prompt (e.g. if they say "React Server components and 2 leetcode graph questions and apply to 3 jobs", each of those MUST be separate tasks named after those exact topics).
   - NEVER use vague titles like "Deep Dive: Core Concept" or "Study Block 1".
2. STRUCTURE 3 BLUEPRINTS:
   - Option 1: "Deep Focus First (Eat The Frog)" (vibe: "deep_work") — hardest technical topic scheduled first during peak mental energy.
   - Option 2: "Pomodoro & Balanced Flow" (vibe: "balanced_flow") — balanced intervals with planned break.
   - Option 3: "Momentum & Velocity" (vibe: "momentum_velocity") — start with quick wins (e.g. applications/review) to build momentum before deep study.
3. Keep each blueprint between 4 and 6 total tasks (including 1 or 2 breaks).
4. For each task:
   - id: string ("t1", "t2", etc.)
   - title: concise, specific title derived directly from user's input
   - category: "study" | "interview_prep" | "application" | "coding" | "break" | "review"
   - durationMinutes: integer (e.g. 30, 45, 60, 90)
   - startTime: format "09:00 AM" (progressive times)
   - endTime: format "10:00 AM"
   - priority: "high" | "medium" | "low"
   - completed: false
   - description: 1 concise sentence (max 15 words) on what to accomplish
   - aiTips: array of 2 short actionable bullet points

Output valid JSON only matching schema:
{
  "options": [
    {
      "id": "strat-1",
      "strategyName": "Deep Focus First (Eat The Frog)",
      "tagline": "...",
      "vibe": "deep_work",
      "icon": "zap",
      "totalFocusMinutes": 210,
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
      "totalFocusMinutes": 200,
      "totalBreakMinutes": 40,
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
      "totalFocusMinutes": 220,
      "totalBreakMinutes": 20,
      "cognitiveLoad": "Medium",
      "whyThisWorks": "...",
      "tasks": [ ... ]
    }
  ]
}`

    try {
      // Use 4096 tokens to prevent JSON truncation
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
      const fallbackOptions = generateFallbackOptions(rawInput || "Tech prep", hours, energyLevel || "morning_peak")
      return NextResponse.json({ options: fallbackOptions })
    }
  } catch (error) {
    console.error("[POST /api/planner/generate]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
