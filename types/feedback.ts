export type FeedbackType = "feedback" | "suggestion" | "bug_report"

export interface UserFeedback {
  id: string
  _id?: string
  userId?: string | null
  userName?: string
  userEmail?: string
  type: FeedbackType
  rating: number // 1 to 5
  category: string
  message: string
  pageUrl?: string
  createdAt: string
}
