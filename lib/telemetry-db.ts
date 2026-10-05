import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { TrafficLog, TrafficSummary, UserActivity } from "@/types/telemetry"

let indexesEnsured = false

export async function ensureTelemetryIndexes() {
  if (indexesEnsured) return
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Index on traffic_logs
    await db.collection("traffic_logs").createIndex({ timestamp: -1 })
    await db.collection("traffic_logs").createIndex({ visitorId: 1 })
    await db.collection("traffic_logs").createIndex({ userId: 1, timestamp: -1 })
    await db.collection("traffic_logs").createIndex({ path: 1 })

    // Index on user_activities
    await db.collection("user_activities").createIndex({ timestamp: -1 })
    await db.collection("user_activities").createIndex({ userId: 1, timestamp: -1 })

    // Index on users lastActiveAt
    await db.collection("users").createIndex({ lastActiveAt: -1 })

    indexesEnsured = true
  } catch (err) {
    console.error("[ensureTelemetryIndexes error]", err)
  }
}

/**
 * Record a pageview, heartbeat, or interaction in non-blocking manner
 */
export async function logTrafficEvent(event: {
  visitorId: string
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  path: string
  referrer?: string | null
  userAgent?: string | null
  device?: "desktop" | "mobile" | "tablet"
  action?: "pageview" | "heartbeat" | "feature_click" | "ai_token_used" | "guest_tour"
  metadata?: Record<string, any>
}) {
  try {
    await ensureTelemetryIndexes()
    const client = await clientPromise
    const db = client.db()

    const now = new Date()
    const cleanPath = event.path || "/"

    const doc = {
      visitorId: event.visitorId,
      userId: event.userId || null,
      userName: event.userName || null,
      userEmail: event.userEmail || null,
      path: cleanPath,
      referrer: event.referrer || null,
      userAgent: event.userAgent || null,
      device: event.device || "desktop",
      action: event.action || "pageview",
      metadata: event.metadata || {},
      timestamp: now,
    }

    await db.collection("traffic_logs").insertOne(doc)

    // Update user's lastActiveAt and lastPath if authenticated
    if (event.userId && ObjectId.isValid(event.userId)) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(event.userId) },
        {
          $set: {
            lastActiveAt: now,
            lastPath: cleanPath,
          },
        }
      )
    }
  } catch (err) {
    console.error("[logTrafficEvent error]", err)
  }
}

/**
 * Record a high-signal candidate activity (e.g. applied to job, started test)
 */
export async function logUserActivity(activity: {
  userId: string
  userName: string
  userEmail: string
  action: string
  title: string
  path: string
}) {
  try {
    await ensureTelemetryIndexes()
    const client = await clientPromise
    const db = client.db()
    const now = new Date()

    await db.collection("user_activities").insertOne({
      userId: activity.userId,
      userName: activity.userName,
      userEmail: activity.userEmail,
      action: activity.action,
      title: activity.title,
      path: activity.path,
      timestamp: now,
    })

    if (ObjectId.isValid(activity.userId)) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(activity.userId) },
        {
          $set: {
            lastActiveAt: now,
            lastPath: activity.path,
          },
        }
      )
    }
  } catch (err) {
    console.error("[logUserActivity error]", err)
  }
}

/**
 * Aggregates complete traffic and user activity summary for the Admin Panel
 */
export async function getTrafficSummary(): Promise<TrafficSummary> {
  await ensureTelemetryIndexes()
  const client = await clientPromise
  const db = client.db()

  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 1. Online users (active in last 5 minutes)
  const [onlineVisitorsAgg, onlineUsersList] = await Promise.all([
    db.collection("traffic_logs").aggregate([
      { $match: { timestamp: { $gte: fiveMinutesAgo } } },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]).toArray(),

    db.collection("users")
      .find(
        { lastActiveAt: { $exists: true } },
        {
          projection: {
            name: 1,
            email: 1,
            role: 1,
            lastActiveAt: 1,
            lastPath: 1,
            "aiUsage.count": 1,
          },
        }
      )
      .sort({ lastActiveAt: -1 })
      .limit(30)
      .toArray(),
  ])

  const onlineUsersCount = onlineVisitorsAgg[0]?.count || 0

  // 2. Page views today & last 7 days
  const [pageviewsToday, pageviews7d, visitorsAgg] = await Promise.all([
    db.collection("traffic_logs").countDocuments({ timestamp: { $gte: twentyFourHoursAgo } }),
    db.collection("traffic_logs").countDocuments({ timestamp: { $gte: sevenDaysAgo } }),
    db.collection("traffic_logs").aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: "$visitorId",
          isGuest: { $first: { $eq: ["$userId", null] } },
        },
      },
    ]).toArray(),
  ])

  const uniqueVisitorsToday = visitorsAgg.length
  const guestVisitorsToday = visitorsAgg.filter((v) => v.isGuest).length
  const registeredVisitorsToday = uniqueVisitorsToday - guestVisitorsToday

  // 3. Top visited pages (last 7 days)
  const topPagesAgg = await db.collection("traffic_logs").aggregate([
    { $match: { timestamp: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$path", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 7 },
  ]).toArray()

  const topPages = topPagesAgg.map((p) => ({
    path: p._id || "/",
    count: p.count,
  }))

  // 4. Device breakdown
  const deviceAgg = await db.collection("traffic_logs").aggregate([
    { $match: { timestamp: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$device", count: { $sum: 1 } } },
  ]).toArray()

  const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 }
  deviceAgg.forEach((d) => {
    if (d._id && deviceMap[d._id] !== undefined) {
      deviceMap[d._id] = d.count
    }
  })

  // 5. Hourly traffic for today
  const hourlyAgg = await db.collection("traffic_logs").aggregate([
    { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
    {
      $project: {
        hour: { $hour: "$timestamp" },
      },
    },
    {
      $group: {
        _id: "$hour",
        count: { $sum: 1 },
      },
    },
  ]).toArray()

  const hourlyMap = new Map(hourlyAgg.map((h) => [h._id, h.count]))
  const hourlyTrafficToday = Array.from({ length: 24 }).map((_, h) => {
    const ampm = h >= 12 ? "PM" : "AM"
    const displayH = h % 12 || 12
    return {
      hour: h,
      label: `${displayH}${ampm}`,
      count: hourlyMap.get(h) || 0,
    }
  })

  // 6. Recent logs
  const rawRecentLogs = await db
    .collection("traffic_logs")
    .find({})
    .sort({ timestamp: -1 })
    .limit(20)
    .toArray()

  const recentLogs: TrafficLog[] = rawRecentLogs.map((log) => ({
    id: log._id.toString(),
    _id: log._id.toString(),
    visitorId: log.visitorId,
    userId: log.userId,
    userName: log.userName,
    userEmail: log.userEmail,
    path: log.path,
    referrer: log.referrer,
    userAgent: log.userAgent,
    device: log.device,
    action: log.action,
    metadata: log.metadata,
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
  }))

  // 7. Recent activities
  const rawRecentActivities = await db
    .collection("user_activities")
    .find({})
    .sort({ timestamp: -1 })
    .limit(20)
    .toArray()

  const recentActivities: UserActivity[] = rawRecentActivities.map((act) => ({
    id: act._id.toString(),
    _id: act._id.toString(),
    userId: act.userId,
    userName: act.userName,
    userEmail: act.userEmail,
    action: act.action,
    title: act.title,
    path: act.path,
    timestamp: act.timestamp instanceof Date ? act.timestamp.toISOString() : String(act.timestamp),
  }))

  // Format active users list
  const activeUsersList = onlineUsersList.map((u) => {
    const lastActiveTime = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0
    const isOnline = Date.now() - lastActiveTime <= 5 * 60 * 1000

    return {
      id: u._id.toString(),
      name: u.name || "Unnamed Seeker",
      email: u.email || "",
      role: u.role || "user",
      lastActiveAt: u.lastActiveAt instanceof Date ? u.lastActiveAt.toISOString() : String(u.lastActiveAt || ""),
      lastPath: u.lastPath || "/dashboard",
      isOnline,
      aiUsageCount: u.aiUsage?.count ?? 0,
    }
  })

  return {
    onlineUsersCount: Math.max(onlineUsersCount, activeUsersList.filter((u) => u.isOnline).length),
    totalPageviewsToday: pageviewsToday,
    totalPageviews7d: pageviews7d,
    uniqueVisitorsToday,
    guestVisitorsToday,
    registeredVisitorsToday,
    topPages,
    deviceBreakdown: {
      desktop: deviceMap.desktop || 0,
      mobile: deviceMap.mobile || 0,
      tablet: deviceMap.tablet || 0,
    },
    hourlyTrafficToday,
    recentLogs,
    recentActivities,
    activeUsersList,
  }
}
