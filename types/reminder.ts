export type ReminderType = "DEADLINE" | "FOLLOWUP" | "INTERVIEW" | "EVENT" | "REGISTRATION" | "TASK" | "CUSTOM"

export interface Reminder {
  id: string
  jobId?: string | null
  jobTitle?: string | null
  company?: string | null
  type: ReminderType | string
  dueAt: string
  eventDate?: string | null
  registrationDeadline?: string | null
  message: string
  done: boolean
  googleCalendarEventId?: string | null
  createdAt?: string
}
