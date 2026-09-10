export type TaskCategory =
  | "study"
  | "interview_prep"
  | "application"
  | "coding"
  | "break"
  | "review"

export type TaskPriority = "high" | "medium" | "low"

export interface PlannerTask {
  id: string
  title: string
  category: TaskCategory
  durationMinutes: number
  startTime?: string // e.g. "09:00 AM"
  endTime?: string   // e.g. "10:30 AM"
  priority: TaskPriority
  completed: boolean
  completedAt?: string
  description?: string
  notes?: string
  aiTips?: string[]
}

export type StrategyVibe = "deep_work" | "balanced_flow" | "momentum_velocity"

export interface PlannerStrategyOption {
  id: string
  strategyName: string
  tagline: string
  vibe: StrategyVibe
  icon: string
  totalFocusMinutes: number
  totalBreakMinutes: number
  cognitiveLoad: "High" | "Medium" | "Low"
  tasks: PlannerTask[]
  whyThisWorks: string
}

export type EnergyLevel = "morning_peak" | "afternoon_peak" | "night_owl" | "balanced"
export type IntensityMode = "light" | "balanced" | "crunch"

export interface DayPlan {
  _id?: string
  id?: string
  userId: string
  date: string // YYYY-MM-DD
  rawInput: string
  availableHours: number
  energyLevel: EnergyLevel
  intensity: IntensityMode
  selectedStrategyId: string
  strategyName: string
  strategyTagline?: string
  tasks: PlannerTask[]
  status: "active" | "completed" | "abandoned"
  focusMinutesLogged: number
  createdAt: string
  updatedAt: string
}

export interface DayPlannerStats {
  currentStreak: number
  totalFocusHoursLogged: number
  completedTasksCount: number
  recentPlansCount: number
}

export interface GeneratePlannerRequest {
  rawInput: string
  availableHours: number
  energyLevel: EnergyLevel
  intensity: IntensityMode
  syncedEvents?: {
    interviews?: Array<{ company: string; role?: string; time?: string; type?: string }>
    reminders?: Array<{ message: string; dueAt?: string; company?: string }>
  }
}

export interface ReshuffleRequest {
  planId?: string
  reason: "running_late_30" | "running_late_60" | "fatigued_light" | "cut_short_2h" | "custom"
  customPrompt?: string
  tasks: PlannerTask[]
  remainingAvailableMinutes?: number
}

export interface AssistRequest {
  taskTitle: string
  category: TaskCategory
  description?: string
}
