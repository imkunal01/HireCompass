import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

// GET /api/settings/digest — get digest preference
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await clientPromise
  const doc = await client.db().collection("user_settings").findOne({ userId: session.user.id })
  return NextResponse.json({ dailyDigest: doc?.dailyDigest ?? true })
}

// POST /api/settings/digest — toggle digest
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { enabled } = await request.json()
  const client = await clientPromise
  await client.db().collection("user_settings").updateOne(
    { userId: session.user.id },
    { $set: { userId: session.user.id, dailyDigest: !!enabled, updatedAt: new Date() } },
    { upsert: true }
  )
  return NextResponse.json({ success: true, dailyDigest: !!enabled })
}
