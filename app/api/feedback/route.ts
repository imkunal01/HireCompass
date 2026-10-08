import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    const body = await request.json()
    const {
      type = "feedback",
      rating = 5,
      category = "General",
      message,
      pageUrl,
      userName,
      userEmail,
    } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Feedback or suggestion message is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const feedbackCol = db.collection("user_feedback")

    const resolvedUserName = session?.user?.name || userName?.trim() || "HireCompass User"
    const resolvedUserEmail = session?.user?.email || userEmail?.trim() || "Anonymous"

    const doc = {
      userId: session?.user?.id || null,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      type: ["feedback", "suggestion", "bug_report"].includes(type) ? type : "feedback",
      rating: Math.max(1, Math.min(5, parseInt(String(rating || 5), 10))),
      category: category?.trim() || "General",
      message: message.trim(),
      pageUrl: pageUrl?.trim() || "/",
      createdAt: new Date(),
    }

    const result = await feedbackCol.insertOne(doc)

    return NextResponse.json(
      {
        success: true,
        feedback: {
          ...doc,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
          createdAt: doc.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[POST /api/feedback]", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
