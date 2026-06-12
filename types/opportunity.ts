// Expanded status to support 6-column Kanban pipeline
export type OpportunityStatus =
  | "SAVED"
  | "INTERESTED"
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  // Legacy aliases kept for backward compatibility with seeded data
  | "WISHLIST"
  | "INTERVIEWING"

export type Priority = "HIGH" | "MEDIUM" | "LOW"

export type EmploymentType = "INTERNSHIP" | "FULL_TIME" | "CONTRACT" | "PART_TIME"

export type SourcePlatform =
  | "LINKEDIN"
  | "INTERNSHALA"
  | "GLASSDOOR"
  | "ANGELLIST"
  | "COMPANY_SITE"
  | "REFERRAL"
  | "OTHER"

export interface TimelineEvent {
  id: string
  event: string
  description?: string
  timestamp: string | Date
}

export interface Opportunity {
  _id?: string
  id: string
  userId: string
  title: string
  company: string
  location?: string | null
  isRemote?: boolean
  employmentType?: EmploymentType
  salary?: string | null
  url?: string | null
  sourcePlatform?: SourcePlatform | null
  status: OpportunityStatus
  priority?: Priority
  deadline?: string | Date | null
  skills?: string[]
  tags?: string[]
  notes?: string | null
  timeline?: TimelineEvent[]
  createdAt: string | Date
  updatedAt?: string | Date
  interviews?: any[]
}

export interface DashboardStats {
  totalSaved: number
  applicationsSent: number
  interviewsScheduled: number
  responseRate: number
  followUpsDue: number
}

export interface ActivityItem {
  id: string
  type: "JOB_ADDED" | "STATUS_CHANGED" | "EMAIL_SENT" | "INTERVIEW_SCHEDULED" | "NOTE_ADDED"
  title: string
  description: string
  timestamp: string | Date
  jobId?: string
  company?: string
}

// Normalize legacy statuses to new ones for display
export function normalizeStatus(status: string): OpportunityStatus {
  if (status === "WISHLIST") return "SAVED"
  if (status === "INTERVIEWING") return "INTERVIEW"
  return status as OpportunityStatus
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; textColor: string; borderColor: string }> = {
  SAVED:       { label: "Saved",       color: "#3b82f6", bgColor: "bg-blue-500/10",   textColor: "text-blue-400",   borderColor: "border-t-blue-500" },
  WISHLIST:    { label: "Saved",       color: "#3b82f6", bgColor: "bg-blue-500/10",   textColor: "text-blue-400",   borderColor: "border-t-blue-500" },
  INTERESTED:  { label: "Interested",  color: "#8b5cf6", bgColor: "bg-violet-500/10", textColor: "text-violet-400", borderColor: "border-t-violet-500" },
  APPLIED:     { label: "Applied",     color: "#f59e0b", bgColor: "bg-amber-500/10",  textColor: "text-amber-400",  borderColor: "border-t-amber-500" },
  ASSESSMENT:  { label: "Assessment",  color: "#06b6d4", bgColor: "bg-cyan-500/10",   textColor: "text-cyan-400",   borderColor: "border-t-cyan-500" },
  INTERVIEW:   { label: "Interview",   color: "#a855f7", bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderColor: "border-t-purple-500" },
  INTERVIEWING:{ label: "Interview",   color: "#a855f7", bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderColor: "border-t-purple-500" },
  OFFER:       { label: "Offer",       color: "#10b981", bgColor: "bg-emerald-500/10",textColor: "text-emerald-400",borderColor: "border-t-emerald-500" },
  REJECTED:    { label: "Rejected",    color: "#ef4444", bgColor: "bg-rose-500/10",   textColor: "text-rose-400",   borderColor: "border-t-rose-500" },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgColor: string; textColor: string }> = {
  HIGH:   { label: "High",   bgColor: "bg-red-500/10",    textColor: "text-red-400" },
  MEDIUM: { label: "Medium", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400" },
  LOW:    { label: "Low",    bgColor: "bg-green-500/10",  textColor: "text-green-400" },
}

export const KANBAN_COLUMNS: { status: OpportunityStatus; label: string }[] = [
  { status: "SAVED",       label: "Saved" },
  { status: "INTERESTED",  label: "Interested" },
  { status: "APPLIED",     label: "Applied" },
  { status: "ASSESSMENT",  label: "Assessment" },
  { status: "INTERVIEW",   label: "Interview" },
  { status: "OFFER",       label: "Offer" },
]
