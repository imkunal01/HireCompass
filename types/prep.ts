export type PrepTab =
  | "war-room"
  | "griller"
  | "star-matrix"
  | "remediation"
  | "primer"

export type InterviewerPersona = "staff" | "lead" | "em"

export interface PersonaConfig {
  id: InterviewerPersona
  name: string
  role: string
  avatar: string
  description: string
  tone: string
}

export interface Scorecard {
  technicalDepth: number // 1-10
  tradeOffAwareness: number // 1-10
  communicationComposure: number // 1-10
  composure?: number // alias
  strengths: string[]
  gaps: string[]
  goldStandardAnswer?: string
  goldStandardCounter?: string // alias
  feedback: string
  critique?: string // alias
}

export interface GrillerMessage {
  id: string
  role: "assistant" | "user" | "system"
  content: string
  timestamp: string
  scorecard?: Scorecard
}

export interface GrillerSession {
  _id?: string
  userId: string
  projectId: string
  projectTitle: string
  persona: InterviewerPersona
  status: "active" | "completed"
  messages: GrillerMessage[]
  overallScore?: number
  createdAt: string
  updatedAt: string
}

export type StarAudience = "em" | "pe" | "pm"

export interface StarStory {
  _id?: string
  id?: string
  userId: string
  projectId?: string
  projectTitle: string
  title: string
  archetype:
    | "outage_crisis"
    | "technical_disagreement"
    | "tight_deadlines"
    | "ambiguity_architecture"
    | "leadership_mentorship"
    | "custom"
  situation: string
  task: string
  action: string
  result: string
  metrics?: string[]
  audienceVersions: {
    em: string
    pe: string
    pm: string
  }
  versions?: {
    em: string
    pe: string
    pm: string
  }
  tags: string[]
  bookmarked?: boolean
  createdAt: string
  updatedAt: string
}

export interface ReverseQuestion {
  category: "Architecture" | "Scale & Reliability" | "Culture & Team" | "Product & Vision" | string
  question: string
  contextRationale: string
}

export interface WarRoomDossier {
  company: string
  role: string
  roundType: string
  cultureNotes: string
  roundExpectations: string[]
  highYieldTopics: string[]
  reverseQuestions: (ReverseQuestion | string)[]
  commonPitfalls?: string[]
  suggestedSheetCategory?: string
}

export interface RemediationGap {
  rejectionId?: string
  company: string
  stage: string
  reasonCategory: string
  identifiedGaps: string[]
  recommendedTopics: string[]
  confidenceScore: number
}
