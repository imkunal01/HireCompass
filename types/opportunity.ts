// Expanded status to support full Kanban pipeline
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
  id?: string
  event: string
  description?: string
  timestamp: string | Date
}

// ── Structured Round / Stage Interfaces ──────────────────────────────────────

export interface InterviewRoundItem {
  id: string
  roundNumber: number
  roundName: string
  roundType:
    | "OA"
    | "TECHNICAL"
    | "SYSTEM_DESIGN"
    | "BEHAVIORAL"
    | "HR"
    | "MANAGERIAL"
    | "TAKE_HOME"
    | "OTHER"
  date?: string | null
  interviewer?: string | null
  topicsCovered?: string | null
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  status: "PASSED" | "FAILED" | "PENDING" | "SCHEDULED"
  notes?: string | null
}

export interface OADetails {
  totalRounds?: number
  currentRound?: number
  platform?: string
  date?: string | null
  topics?: string[]
  status?: "PENDING" | "CLEARED" | "FAILED"
  score?: string | null
  notes?: string | null
}

export interface HrRoundDetails {
  isCompleted?: boolean
  recruiterName?: string | null
  date?: string | null
  expectedSalary?: string | null
  currentSalary?: string | null
  noticePeriod?: string | null
  cultureFitNotes?: string | null
  status?: "PENDING" | "CLEARED" | "FAILED"
}

export interface OfferDetails {
  totalAmount?: string | null
  baseSalary?: string | null
  bonus?: string | null
  stocks?: string | null
  deadline?: string | Date | null
  location?: string | null
  notes?: string | null
}

export interface RejectionDetails {
  stage: string
  reasonCategory?: string
  whatWasAsked?: string | null
  whyRejected?: string | null
  whereFumbled?: string | null
  lessonsLearned?: string | null
  rejectionDate?: string | Date | null
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
  // New structured lifecycle tracking fields
  oaDetails?: OADetails
  interviewRounds?: InterviewRoundItem[]
  isHrRound?: boolean
  hrRoundDetails?: HrRoundDetails
  offerDetails?: OfferDetails
  rejectionDetails?: RejectionDetails
}

export interface DashboardStats {
  totalSaved: number
  applicationsSent: number
  interviewsScheduled: number
  responseRate: number
  followUpsDue: number
  totalRejected?: number
  totalOffers?: number
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
  SAVED:       { label: "Saved",          color: "#3b82f6", bgColor: "bg-blue-50 dark:bg-blue-950/60",       textColor: "text-blue-600 dark:text-blue-400",       borderColor: "border-t-blue-500" },
  WISHLIST:    { label: "Saved",          color: "#3b82f6", bgColor: "bg-blue-50 dark:bg-blue-950/60",       textColor: "text-blue-600 dark:text-blue-400",       borderColor: "border-t-blue-500" },
  INTERESTED:  { label: "Interested",     color: "#8b5cf6", bgColor: "bg-violet-50 dark:bg-violet-950/60",   textColor: "text-violet-600 dark:text-violet-400",   borderColor: "border-t-violet-500" },
  APPLIED:     { label: "Applied",        color: "#f59e0b", bgColor: "bg-amber-50 dark:bg-amber-950/60",     textColor: "text-amber-600 dark:text-amber-400",     borderColor: "border-t-amber-500" },
  ASSESSMENT:  { label: "OA / Assessment",color: "#06b6d4", bgColor: "bg-cyan-50 dark:bg-cyan-950/60",       textColor: "text-cyan-600 dark:text-cyan-400",       borderColor: "border-t-cyan-500" },
  INTERVIEW:   { label: "Interview",      color: "#a855f7", bgColor: "bg-purple-50 dark:bg-purple-950/60",   textColor: "text-purple-600 dark:text-purple-400",   borderColor: "border-t-purple-500" },
  INTERVIEWING:{ label: "Interview",      color: "#a855f7", bgColor: "bg-purple-50 dark:bg-purple-950/60",   textColor: "text-purple-600 dark:text-purple-400",   borderColor: "border-t-purple-500" },
  OFFER:       { label: "Offer 🎉",       color: "#10b981", bgColor: "bg-emerald-50 dark:bg-emerald-950/60", textColor: "text-emerald-600 dark:text-emerald-400", borderColor: "border-t-emerald-500" },
  REJECTED:    { label: "Rejected ❌",    color: "#ef4444", bgColor: "bg-rose-50 dark:bg-rose-950/60",       textColor: "text-rose-600 dark:text-rose-400",       borderColor: "border-t-rose-500" },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgColor: string; textColor: string }> = {
  HIGH:   { label: "High",   bgColor: "bg-red-50 dark:bg-red-950/60",       textColor: "text-red-600 dark:text-red-400" },
  MEDIUM: { label: "Med",    bgColor: "bg-yellow-50 dark:bg-yellow-950/60", textColor: "text-yellow-600 dark:text-yellow-400" },
  LOW:    { label: "Low",    bgColor: "bg-green-50 dark:bg-green-950/60",   textColor: "text-green-600 dark:text-green-400" },
}

export const KANBAN_COLUMNS: { status: OpportunityStatus; label: string }[] = [
  { status: "SAVED",       label: "Saved" },
  { status: "APPLIED",     label: "Applied" },
  { status: "ASSESSMENT",  label: "OA / Assessment" },
  { status: "INTERVIEW",   label: "Interview" },
  { status: "OFFER",       label: "Offer" },
  { status: "REJECTED",    label: "Rejected" },
]

export const OA_PLATFORMS = [
  "HackerRank",
  "CodeSignal",
  "LeetCode",
  "Mettl",
  "Glider AI",
  "HireVue",
  "TestGorilla",
  "Codility",
  "Karat",
  "Company Custom Test",
  "Other",
]

export const REJECTION_STAGES = [
  "Resume Screen / No Shortlist",
  "Online Assessment (OA)",
  "Technical Round 1 (DSA / Coding)",
  "Technical Round 2 (Core / Domain)",
  "System Design (HLD / LLD)",
  "Hiring Manager Round",
  "HR / Behavioral / Culture Fit",
  "Post-Interview / Role Frozen",
  "Ghosted after Interview",
  "Other",
]

export const REJECTION_REASONS = [
  "Failed OA / Coding Challenge Testcases",
  "DSA & Problem-Solving Speed Gaps",
  "System Design & Scalability Knowledge",
  "Core Computer Science / Framework Depth",
  "Lack of Experience / Seniority Mismatch",
  "Behavioral / Values / Culture Fit",
  "Salary Expectation / Budget Mismatch",
  "Headcount Frozen / Position Cancelled",
  "Better Candidate Selected",
  "Communication & Articulation",
  "Ghosted / No Specific Feedback Given",
  "Other",
]
