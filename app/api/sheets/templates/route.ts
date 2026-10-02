import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { BUILTIN_TEMPLATES } from "@/lib/sheet-templates"

// GET /api/sheets/templates — list built-in roadmap templates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = Object.entries(BUILTIN_TEMPLATES).map(([key, t]) => {
      const topicCount = Object.keys(t.topics).length
      const itemCount = Object.values(t.topics).reduce((acc, items) => acc + items.length, 0)
      return {
        key,
        title: t.title,
        category: t.category,
        description: t.description,
        topicCount,
        itemCount,
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[GET /api/sheets/templates]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
