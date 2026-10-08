export type BroadcastType = "announcement" | "urgent" | "update" | "maintenance" | "alert" | "info"
export type BroadcastTargetType = "ALL" | "USER"

export interface BroadcastMessage {
  id: string
  _id?: string
  title: string
  message: string
  type: BroadcastType
  targetType: BroadcastTargetType
  targetUserId?: string | null
  targetUserEmail?: string | null
  targetUserName?: string | null
  createdByName?: string
  createdByEmail?: string
  createdAt: string
  dismissedBy: string[]
  isActive: boolean
  repingCount?: number
}
