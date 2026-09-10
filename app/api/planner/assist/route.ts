import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { extractJSON, isGeminiConfigured } from "@/lib/gemini"
import { AssistRequest } from "@/types/planner"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: AssistRequest = await request.json()
    const { taskTitle, category, description } = body

    if (!taskTitle) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 })
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        summary: `Core breakdown for: ${taskTitle}`,
        keyPrinciples: [
          "Understand the problem statement and constraints before coding.",
          "Identify trade-offs (Time vs Space complexity).",
          "Communicate your thought process out loud.",
        ],
        interviewQuestions: [
          `How would you explain the fundamentals of ${taskTitle} in an interview?`,
          "What is the most common pitfall or edge case to avoid?",
          "How does this scale in high-throughput production environments?",
        ],
        actionChecklist: [
          "Write out 1 concrete code snippet or architectural diagram",
          "Test with 1 extreme edge case",
        ],
      })
    }

    const prompt = `You are a world-class technical mentor helping a candidate preparing for top tech jobs.
The candidate is working on this specific task:
- Title: "${taskTitle}"
- Category: "${category}"
${description ? `- Context: "${description}"` : ""}

TASK:
Provide high-yield, punchy guidance so they can excel at this task right now in this study block.
Respond with JSON matching:
{
  "summary": "2-sentence high-level intuition / concept summary",
  "keyPrinciples": [
    "Punchy takeaway 1",
    "Punchy takeaway 2",
    "Punchy takeaway 3"
  ],
  "interviewQuestions": [
    "Most likely question asked by interviewers on this topic 1",
    "Technical drill or edge-case question 2",
    "System design or trade-off question 3"
  ],
  "actionChecklist": [
    "Immediate action 1",
    "Immediate action 2"
  ]
}`

    try {
      const result = await extractJSON<any>(prompt)
      return NextResponse.json(result)
    } catch (err) {
      console.warn("[POST /api/planner/assist] AI error, falling back", err)
      return NextResponse.json({
        summary: `Key focus points for: ${taskTitle}`,
        keyPrinciples: [
          "Break down complex logic into modular sub-problems.",
          "Analyze time and space complexity upfront.",
          "Test edge conditions (null, empty, large inputs).",
        ],
        interviewQuestions: [
          `What are the core trade-offs involved in ${taskTitle}?`,
          "How would you optimize this under strict memory constraints?",
        ],
        actionChecklist: ["Implement a working prototype", "Review key documentation"],
      })
    }
  } catch (error) {
    console.error("[POST /api/planner/assist]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
