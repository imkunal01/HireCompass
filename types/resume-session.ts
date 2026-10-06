export type ResumeToolType = "assessment" | "sheet" | "prep"

export interface ResumeSessionSnapshot {
  id: string
  toolType: ResumeToolType
  title: string
  subtitle: string
  badgeText: string
  badgeVariant: "indigo" | "emerald" | "amber" | "purple"
  progressPercent: number
  progressLabel?: string
  lastActive: string // ISO date string
  href: string
  actionLabel: string
  meta?: {
    stageIndex?: number
    totalStages?: number
    sheetId?: string
    doneCount?: number
    totalCount?: number
    category?: string
    lastTopic?: string
    lastItemTitle?: string
    tab?: string
    persona?: string
    projectName?: string
    difficulty?: string
    company?: string
    role?: string
    turnCount?: number
    totalTurns?: number
  }
}
