export interface TrafficLog {
  id?: string
  _id?: string
  visitorId: string
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  path: string
  referrer?: string | null
  userAgent?: string | null
  device?: "desktop" | "mobile" | "tablet"
  action: "pageview" | "heartbeat" | "feature_click" | "ai_token_used" | "guest_tour"
  metadata?: Record<string, any>
  timestamp: string | Date
}

export interface UserActivity {
  id?: string
  _id?: string
  userId: string
  userName: string
  userEmail: string
  action: string
  title: string
  path: string
  timestamp: string | Date
}

export interface TrafficSummary {
  onlineUsersCount: number
  totalPageviewsToday: number
  totalPageviews7d: number
  uniqueVisitorsToday: number
  guestVisitorsToday: number
  registeredVisitorsToday: number
  topPages: Array<{ path: string; count: number }>
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  hourlyTrafficToday: Array<{ hour: number; label: string; count: number }>
  recentLogs: TrafficLog[]
  recentActivities: UserActivity[]
  activeUsersList: Array<{
    id: string
    name: string
    email: string
    role: string
    lastActiveAt: string
    lastPath: string
    isOnline: boolean
    aiUsageCount: number
  }>
}
