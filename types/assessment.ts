export type AssessmentStage =
  | "PROBLEM_PRESENTED"
  | "UNDERSTANDING"
  | "APPROACH"
  | "IMPLEMENTATION_PROMPT"
  | "CODE_GENERATION"
  | "CODE_REVIEW"
  | "REFINEMENT"
  | "FINAL_REVIEW"
  | "COMPLETED"

export type AssessmentStatus = "ACTIVE" | "PASSED" | "FAILED" | "ABANDONED"

export type StageVerdict = "INSUFFICIENT" | "PARTIAL" | "SUFFICIENT" | "INVALID" | "VALID"

export type AssessmentDifficulty = "standard" | "hard"

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface RealisticDefectDefinition {
  type: string
  name: string
  description: string
  defectSnippet: string
  fixedSnippet: string
  explanation: string
}

export interface AssessmentProblem {
  id: string
  title: string
  company: "Capgemini" | string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  tags: string[]
  description: string
  inputFormat: string
  outputFormat: string
  constraints: string[]
  examples: ProblemExample[]
  keyEdgeCases: string[]
  expectedComplexity: {
    time: string
    space: string
  }
  standardApproachHints?: string[]
  potentialDefects?: RealisticDefectDefinition[]
}

export interface SeededDefectState {
  type: string
  name: string
  description: string
  defectSnippet?: string
  fixedSnippet?: string
  wasIdentified: boolean
  candidateIdentifiedDescription?: string
}

export interface AssessmentMessage {
  id: string
  role: "candidate" | "assistant" | "system"
  content: string
  stage: AssessmentStage
  timestamp: string
  isBypassAttempt?: boolean
  codeSnippet?: string
  verdict?: StageVerdict
  missingRequirements?: string[]
  scorecardDelta?: Partial<AssessmentScorecard>
}

export interface CodeRevision {
  revisionNumber: number
  timestamp: string
  code: string
  modificationRequest: string
  isCurrent: boolean
}

export interface AssessmentScorecard {
  aiLiteracy: number // max 25
  promptQuality: number // max 25
  problemSolving: number // max 25
  reviewAndAdapt: number // max 25
  totalScore: number // max 100
  passed: boolean
  summary: string
  strengths: string[]
  gaps: string[]
  stageBreakdown: {
    understanding: { score: number; verdict: string; notes: string }
    approach: { score: number; verdict: string; notes: string }
    prompting: { score: number; verdict: string; notes: string }
    review: { score: number; verdict: string; notes: string }
    refinement: { score: number; verdict: string; notes: string }
  }
}

export interface AssessmentSession {
  _id?: string
  id?: string
  userId: string
  company: string
  problemId: string
  problem: AssessmentProblem
  difficulty: AssessmentDifficulty
  currentStage: AssessmentStage
  status: AssessmentStatus
  bypassAttemptsCount: number
  candidateUnderstanding?: string
  candidateApproach?: string
  implementationPrompt?: string
  generatedCode?: string
  seededDefect?: SeededDefectState | null
  reviewFindings?: string[]
  revisions: CodeRevision[]
  messages: AssessmentMessage[]
  evaluation?: AssessmentScorecard | null
  startedAt: string
  updatedAt: string
}

export interface EvaluatorEngineOutput {
  stage: AssessmentStage
  status: StageVerdict
  reason: string
  missingRequirements: string[]
  candidateHasDemonstratedReasoning: boolean
  unlockNextStage: boolean
  nextStage?: AssessmentStage
  aiMessage: string
  generatedCode?: string
  seededDefect?: SeededDefectState | null
  isBypassAttempt?: boolean
  defectAcknowledged?: boolean
  scorecard?: AssessmentScorecard | null
}
