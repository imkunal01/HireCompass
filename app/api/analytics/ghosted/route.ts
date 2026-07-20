import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

// GET /api/analytics/ghosted - applications with no response in N days
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get("days") ?? "14", 10)
  const cutoff = new Date(Date.now() - days * 86400000)

  const client = await clientPromise
  const ghosted = await client.db().collection("opportunities").find({
    userId: session.user.id,
    status: { $in: ["APPLIED", "ASSESSMENT"] },
    updatedAt: { $lt: cutoff },
  }).sort({ updatedAt: 1 }).toArray()

  const now = Date.now()
  return NextResponse.json(ghosted.map((g) => ({
    id: g._id.toString(),
    title: g.title,
    company: g.company,
    status: g.status,
    url: g.url ?? null,
    updatedAt: g.updatedAt?.toISOString?.() ?? g.updatedAt,
    daysSince: Math.floor((now - new Date(g.updatedAt).getTime()) / 86400000),
  })))
}
