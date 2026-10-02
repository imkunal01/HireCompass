export type SheetCategory =
  | "DSA"
  | "CP"
  | "OS"
  | "CN"
  | "OOPS"
  | "DBMS"
  | "Development"
  | "Company"
  | "Custom"

export type Difficulty = "Easy" | "Medium" | "Hard" | "N/A"

export type Platform =
  | "LeetCode"
  | "GFG"
  | "CodeChef"
  | "Codeforces"
  | "HackerRank"
  | "InterviewBit"
  | "Other"

export type ItemStatus = "todo" | "done" | "revisit"

export interface SheetTopic {
  name: string
  order: number
}

export interface Sheet {
  _id: string
  owner: string | null // null => built-in template
  isTemplate: boolean
  templateKey?: string | null // e.g. "dsa", "os", "cn", "dbms", "system-design"
  clonedFrom?: string | null
  title: string
  description?: string
  category: SheetCategory
  topics: SheetTopic[]
  itemCount: number
  createdAt?: string
  updatedAt?: string
}

export interface SheetItem {
  _id: string
  sheet: string
  topic: string
  title: string
  difficulty: Difficulty
  platform: Platform
  problemLink?: string
  articleLink?: string
  youtubeLink?: string
  tags?: string[]
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface ItemProgress {
  _id?: string
  user: string
  sheet: string
  item: string
  status: ItemStatus
  completedAt?: string | null
  notes?: string
  linkedProblem?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MergedSheetItem extends SheetItem {
  status: ItemStatus
  completedAt?: string | null
  notes: string
}

export interface MergedSheetTopic {
  name: string
  total: number
  done: number
  percent: number
  items: MergedSheetItem[]
}

export interface SheetSummary {
  total: number
  done: number
  percent: number
}

export interface SheetDetailResponse {
  sheet: Sheet
  topics: MergedSheetTopic[]
  summary: SheetSummary
}

export interface SheetListItem extends Sheet {
  done: number
  percent: number
}

export interface TemplateSummary {
  key: string
  title: string
  category: SheetCategory
  topicCount: number
  itemCount: number
  description?: string
}
