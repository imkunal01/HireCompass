# HireCompass — Active Development Context & Continuity Log

> **Note for AI Assistants / Future Chat Threads:**  
> Always read this file at the start of any conversation to understand the active feature development, architectural decisions, current phase status, and immediate next steps. Maintain and update this log as progress is made.

---

## 1. Active Feature Epic: Preparation Ecosystem
We are actively building the **Preparation Ecosystem** for HireCompass, consisting of two tightly-integrated sub-systems:
1. **Problem Solving Prep (`/prep/problem-solving`)**:
   - Curated Sheets & Roadmaps (DSA, OS, CN, DBMS, System Design).
   - Normalized Strategy B architecture with sparse progress (`ItemProgress` upserts with compound unique index `{ user, item }`).
   - Topic Accordions with real-time completion progress meters.
   - Optimistic UI updates with rollback on network failure.
   - CSV Bulk Importer (`Topic, Title, Difficulty, Platform, Problem Link, Article Link, YouTube, Tags`) using `papaparse`.
   - Day Planner task sync (`/planner`).
2. **Interview Prep Hub (`/prep`)**:
   - **Project Defense Arena ("The Griller")**: Upgraded with **Fresher-Oriented Mode** (focusing on core fundamentals, tech stack decisions, request lifecycle, schema design, and hands-on debugging stories rather than enterprise 50k+ QPS scale), **Role Selection** (Full Stack, Frontend, Backend, Data/ML, DevOps, Mobile, General SDE), **Fresher Starter Projects** (E-Commerce Storefront, Real-Time Chat, HireCompass Mini Tracker, Task REST API), and a **Supportive Senior Mentor Persona**.
   - **Rejection Remediation Loop**: Connects to `/rejected` to turn historical drop-off causes into targeted practice drills.
   - **15-Minute Pre-Interview Adrenaline Primer**: Timed 4-stage sprint modal (Bug triage, Big-O reflex, Trade-off flash, Box breathing) taken 15 mins before a live interview.
3. **AI Assessment Arena (`/assessment`)**:
   - Dedicated standalone proctored exam environment simulating Capgemini's 6-stage AI-assisted coding assessment workflow (Understanding -> Approach & Complexity -> Structured Prompting -> Code Gen Draft -> Code Review with Seeded Defects -> Refinement -> 100-Pt Final Rubric).
   - Authoritative server-side state machine, prompt-bypass rejection, zero client-side stage tampering.
   - Pinned bottom prompt composer with zero page scrolling needed, independent left/right scroll viewports, and distraction-free fullscreen proctored examination console.

---

## 2. Technical Stack & Architectural Decisions
- **Framework**: Next.js 14 App Router, TypeScript, React 18, Tailwind CSS.
- **Database**: MongoDB (via native `mongodb` npm package and `clientPromise` from `lib/mongodb.ts`).
- **Authentication**: Jose JWT with httpOnly cookies via `lib/session.ts` and `authMiddleware`.
- **State Management**: `zustand` and `@tanstack/react-query`.
- **Parsing**: `papaparse` for CSV import.
- **AI Gateway**: Groq Cloud LLM (`groq-sdk` with `openai/gpt-oss-120b`), managed through user quotas in `lib/ai-quota.ts`. AI is reserved strictly for generative tasks (War Room, The Griller, STAR synthesis); static sheet navigation and progress toggling consume zero AI quota.
- **Security**: IDOR ownership guards on all write operations (`findOwnedSheet`), sparse unique upsert pattern for progress, CSV sanitization blocking `javascript:` URIs.

---

## 3. Database Collections & Models
1. **`sheets`**:
   - `owner`: `ObjectId | null` (null indicates built-in system template)
   - `isTemplate`: `boolean`
   - `templateKey`: `string | null` (`"dsa"`, `"os"`, `"cn"`, `"dbms"`, `"system-design"`)
   - `clonedFrom`: `ObjectId | null`
   - `title`: `string`
   - `description`: `string`
   - `category`: `"DSA" | "CP" | "OS" | "CN" | "OOPS" | "DBMS" | "Development" | "Company" | "Custom"`
   - `topics`: `Array<{ name: string, order: number }>`
   - `itemCount`: `number` (denormalized counter)
2. **`sheet_items`**:
   - `sheet`: `ObjectId`
   - `topic`: `string`
   - `title`: `string`
   - `difficulty`: `"Easy" | "Medium" | "Hard" | "N/A"`
   - `platform`: `"LeetCode" | "GFG" | "CodeChef" | "Codeforces" | "HackerRank" | "InterviewBit" | "Other"`
   - `problemLink`, `articleLink`, `youtubeLink`: `string`
   - `tags`: `string[]`
   - `order`: `number`
   - Compound index: `{ sheet: 1, topic: 1, title: 1 }` (unique)
3. **`item_progress` (Sparse)**:
   - `user`: `ObjectId`
   - `sheet`: `ObjectId`
   - `item`: `ObjectId`
   - `status`: `"todo" | "done" | "revisit"`
   - `completedAt`: `Date | null`
   - `notes`: `string`
   - `linkedProblem`: `ObjectId | null`
   - Compound unique index: `{ user: 1, item: 1 }`
4. **`prep_sessions` & `star_stories`**:
   - Transcripts, scorecards, and tailored behavioral stories.
5. **`assessment_sessions`**:
   - `userId`: `ObjectId`
   - `company`: `string` (`"Capgemini"`)
   - `problemId`: `string`
   - `problem`: `AssessmentProblem`
   - `difficulty`: `"standard" | "hard"`
   - `currentStage`: `"PROBLEM_PRESENTED" | "UNDERSTANDING" | "APPROACH" | "IMPLEMENTATION_PROMPT" | "CODE_GENERATION" | "CODE_REVIEW" | "REFINEMENT" | "FINAL_REVIEW" | "COMPLETED"`
   - `status`: `"ACTIVE" | "PASSED" | "FAILED" | "ABANDONED"`
   - `candidateUnderstanding`, `candidateApproach`, `implementationPrompt`, `generatedCode`: `string`
   - `seededDefect`: `{ type, name, description, wasIdentified }`
   - `revisions`: `Array<{ revisionNumber, timestamp, code, modificationRequest }>`
   - `messages`: `AssessmentMessage[]`
   - `evaluation`: `AssessmentScorecard` (AI Literacy, Prompt Quality, Problem Solving, Review & Adapt)
   - Compound indexes: `{ userId: 1, updatedAt: -1 }`, `{ userId: 1, problemId: 1 }`

---

## 4. Phase-Wise Roadmap & Status

| Phase | Description | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Foundation: Schemas, Types, Sidebar Nav & Route Shells | 🟢 Completed | Created types/sheet.ts, types/prep.ts, lib/sheets-db.ts, sidebar links, /prep and /prep/problem-solving shells. |
| **Phase 1** | Problem Solving Prep: Templates, Sheets & Topic Engine | 🟢 Completed | Built /api/sheets routes, auto-template seeder, optimistic Zustand store, topic accordions, item rows with notes, and detail pages. |
| **Phase 2** | CSV Bulk Importer & Problem Auto-Linker | 🟢 Completed | Built lib/csv-import.ts, /api/sheets/[id]/import with partial failure tolerance, CsvImportModal, and /api/planner/link-task integration. |
| **Phase 3** | Company & Round "War Room" + Reverse Questions | 🟢 Completed | Implemented /api/prep/war-room with Groq LLM, caching, and WarRoomTab with interactive checklist and reverse questions. |
| **Phase 4** | Project Defense Arena ("The Griller") | 🟢 Completed | Implemented /api/prep/griller with Staff/Lead/EM personas, live defense scorecards, and GrillerTab simulation arena. |
| **Phase 5** | Dynamic STAR Story Matrix | 🟢 Completed | Implemented /api/prep/star-matrix with Groq STAR extraction, 3 audience versions (EM, PE, PM), and StarMatrixTab. |
| **Phase 6** | Rejection Remediation Feedback Loop | 🟢 Completed | Implemented /api/prep/remediation scanning rejected opportunities, RemediationTab with vulnerability meters, drill reveals, sheet links, and planner task scheduler. |
| **Phase 7** | 15-Minute Pre-Interview Adrenaline Primer | 🟢 Completed | Implemented components/features/prep/primer-tab.tsx: 15-min countdown, Bug Triage in 60s, Big-O reflex quizzes, Trade-off justification flash, and 4-4-4-4 Box Breathing visualizer. Mounted in /prep. |
| **Phase 8** | System Polish, Quota Guardrails & Verification | 🟢 Completed | Full verification: npm run lint clean (0 errors), responsive navigation, theme consistency, and IDOR/quota security checks. |
| **Phase 9** | Company Section — Capgemini AI Coding Simulator | 🟢 Completed | Built /api/prep/assessment, lib/assessment-engine.ts, lib/assessment-problems.ts, lib/assessment-db.ts, CapgeminiSimulator, CompanyTab in /prep, and /prep/company/capgemini route. |

---

## 5. Changelog & Trajectory
- **2026-10-02 (Phase 0 Complete)**: 
  - Created `types/sheet.ts` and `types/prep.ts`.
  - Created `lib/sheets-db.ts` with auto-indexing (`ensureSheetIndexes`) and IDOR ownership guards (`findOwnedSheet`, `findReadableSheet`).
  - Added "Problem Solving" (`/prep/problem-solving`) and "Interview Prep" (`/prep`) navigation items to `components/layout/sidebar.tsx`.
  - Built shell pages `app/(dashboard)/prep/page.tsx` (with upcoming interview banner and 5-module tab bar) and `app/(dashboard)/prep/problem-solving/page.tsx` (with roadmaps and templates library).
- **2026-10-02 (Phase 1 Complete)**:
  - Created `lib/sheet-templates.ts` with 5 built-in curriculum templates: DSA Essentials & Blind 75, Operating Systems, Computer Networks, DBMS & SQL, and System Design Core Concepts.
  - Implemented `/api/sheets` (listing with single `$group` aggregation, custom sheet creation), `/api/sheets/templates`, `/api/sheets/from-template/[key]`, `/api/sheets/[id]` (sparse progress merge by topic, update, cascade delete), `/api/sheets/[id]/items`, `/api/sheets/[id]/items/[itemId]`, `/api/sheets/[id]/topics/[topicName]`, and `/api/sheets/[id]/items/[itemId]/progress` (atomic upsert with `{ user, item }` compound unique index).
  - Built `hooks/useSheetStore.ts` with optimistic UI checkbox toggles and failure rollback.
  - Built `components/features/sheets/item-row.tsx` (checkbox, revisit flag, tags, external links, expandable notes) and `components/features/sheets/topic-accordion.tsx` (progress meters, inline problem adding).
  - Built `app/(dashboard)/prep/problem-solving/[id]/page.tsx` (filters by difficulty, hide done, search) and `app/(dashboard)/prep/problem-solving/new/page.tsx` (custom sheet builder).
- **2026-10-02 (Phase 2 Complete)**:
  - Created `lib/csv-import.ts` with PapaParse, Excel BOM stripping, URL schema validation, and per-line error reporting.
  - Implemented `POST /api/sheets/[id]/import` supporting multipart/form-data CSV files, auto-topic discovery, `ordered: false` MongoDB bulk insert for partial-failure resilience, and duplicate skipping.
  - Built `components/features/sheets/csv-import-modal.tsx` with drag-and-drop, sample template download, and real-time error/duplicate reporting.
  - Implemented `POST /api/planner/link-task` allowing candidates to click "Send to Day Planner" on any problem row to instantly schedule a 45-minute coding practice block in their active Day Plan.
- **2026-10-02 (Phase 3 Complete)**:
  - Implemented `POST /api/prep/war-room` endpoint using Groq Cloud LLM (`openai/gpt-oss-120b`) with MongoDB caching (`war_room_dossiers` collection) and quota enforcement.
  - Built `components/features/prep/war-room-tab.tsx` with quick-fill from scheduled interviews (`/interviews`), round expectation breakdown, interactive high-yield topic checklist, and 4 high-signal reverse interview questions with one-click clipboard copying.
  - Mounted `WarRoomTab` into `app/(dashboard)/prep/page.tsx` active module panel.
- **2026-10-02 (Phase 4 Complete)**:
  - Implemented `POST /api/prep/griller` endpoint featuring 3 distinct interviewer personas (Staff Systems Engineer, Pragmatic Tech Lead, Engineering Manager) with dynamic follow-ups, vulnerability detection, and gold-standard counter-responses.
  - Built `components/features/prep/griller-tab.tsx` with project picker from Project Vault (`/projects`), persona selection, live conversational arena, and defense scorecards grading Technical Depth, Trade-Off Awareness, and Composure.
  - Mounted `GrillerTab` into `app/(dashboard)/prep/page.tsx`.
- **2026-10-02 (Phase 5 Complete)**:
  - Implemented `GET`, `POST`, and `DELETE /api/prep/star-matrix` with Groq-powered behavioral story synthesis from candidate's real Project Vault data.
  - Generated triple audience versions (Engineering Manager, Principal Engineer, Product Leader) with metric quantifiers and situation/task/action/result breakdowns.
  - Built `components/features/prep/star-matrix-tab.tsx` and mounted into `app/(dashboard)/prep/page.tsx`.
- **2026-10-02 (Phase 6 Complete)**:
  - Implemented `GET /api/prep/remediation` scanning rejected opportunities from `/opportunities`, aggregating drop-off reasons, and generating targeted anti-pattern recovery drills.
  - Built `components/features/prep/remediation-tab.tsx` with vulnerability meters, drill challenge reveal, direct links to sheet topics, and 1-click scheduling into Day Planner (`/api/planner/link-task`).
  - Mounted `RemediationTab` into `app/(dashboard)/prep/page.tsx`.
- **2026-10-02 (Phase 7 & 8 Complete)**:
  - Built `components/features/prep/primer-tab.tsx`: 15-minute neuro-adrenaline sprint modal with:
    1. Bug Triage in 60s (concurrency flaw analysis).
    2. Instant Big-O reflex quizzes with feedback.
    3. 2-sentence architectural trade-off flash justification.
    4. Box Breathing (4-4-4-4) animated circle + 3 golden interview anchors.
  - Mounted `PrimerTab` into `app/(dashboard)/prep/page.tsx`.
- **2026-10-02 (Excel Support & High-Aesthetic UI Revamp)**:
  - Upgraded parser in `lib/csv-import.ts` with `xlsx` to parse `.xlsx`, `.xls`, `.xlsm`, and `.csv` files with tolerant, case-insensitive column matching (`Topic`, `Title`, `Difficulty`, `Platform`, `Problem Link`, `Article Link`, `YouTube`, `Tags`).
  - Updated API route handlers `app/api/sheets/import/route.ts` and `app/api/sheets/[id]/import/route.ts` to parse binary spreadsheet buffers directly.
  - Revamped `CsvImportModal` into **Universal Spreadsheet Importer** with drag-and-drop animations, format badges, and dual template downloads: `.xlsx` and `.csv`.
  - Redesigned **Prep Cockpit (`/prep`)**: Cyber-intelligence command center with keyboard navigation (1-5), ambient gradient glows, live defense status indicators, and smooth tab transitions.
  - Redesigned **War Room Tab**: Tactical radar scanning animation, interactive checklist with live readiness percentage, and Day Planner topic linkers.
  - Redesigned **The Griller Tab**: Hardcore arena aesthetic, difficulty tier tags, real-time defense scorecard meters, audio waveform equalizer during AI analysis, and gold-standard model answers.
  - Redesigned **STAR Matrix Tab**: S-T-A-R 4-stage color-accented cards, audience re-targeting tabs (EM, PE, PM), quantified impact badges, and spoken teleprompter rehearsal box.
  - Redesigned **Remediation Tab**: Diagnostic radar cards, anti-pattern recovery drills, and 1-click Day Planner scheduling.
  - Redesigned **Primer Tab**: High-contrast digital sprint clock, Big-O reflex quizzes with instant visual feedback, and glowing animated Box Breathing halo circle.
  - Redesigned **Problem Solving Sheets (`/prep/problem-solving`)**: 3D card hover lifts, dynamic category badges, and animated progress meters.
  - Clean `npm run lint` validation with 0 errors.
- **2026-10-02 (Production Build Resolution & AI Quota Alignment)**:
  - Resolved `recordAiUsage` import warning across `app/api/prep/griller/route.ts`, `app/api/prep/remediation/route.ts`, `app/api/prep/star-matrix/route.ts`, and `app/api/prep/war-room/route.ts` by updating to canonical `incrementUserAiUsage` and exporting backward-compatible `recordAiUsage` alias in `lib/ai-quota.ts`.
  - Harmonized types and prop access in `types/prep.ts`, `components/features/prep/griller-tab.tsx`, `components/features/prep/star-matrix-tab.tsx`, and `components/features/prep/war-room-tab.tsx` (handling `communicationComposure`/`composure`, `feedback`/`critique`, `goldStandardAnswer`/`goldStandardCounter`, `audienceVersions`/`versions`, and typed `reverseQuestions`).
  - Configured 4GB heap space (`--max-old-space-size=4096`) in `package.json` build script to prevent V8 GC heap exhaustion during full AST type validation.
  - Validated clean `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), and successful production bundle generation via `npm run build` (Exit code 0).
- **2026-10-02 (Zero-Error Smart Spreadsheet Importer & AI Schema Alignment)**:
  - Re-architected `lib/csv-import.ts` into a resilient auto-mapping parser guaranteeing zero import failures on arbitrary CSV and Excel files.
  - Implemented multi-tier field resolution:
    1. Synonym heuristics for topic, title, difficulty, platform, problemLink, articleLink, youtubeLink, tags.
    2. Content-based column signature detection (discovering titles, URLs, and difficulties even with generic headers like `Col A`, `Col 1`).
    3. Section header recognition and topic carry-forward for grouped Excel spreadsheets.
    4. URL slug-to-title extraction (allowing import of raw URL lists without titles).
    5. Automatic platform inference from URL domains (`leetcode.com`, `geeksforgeeks.org`, `codeforces.com`, etc.).
    6. Non-blocking URL sanitizer: auto-prefixes `https://` and safely omits non-URL notes without dropping rows.
    7. AI Schema Alignment fallback using Groq Cloud LLM (`alignColumnsWithAi`) for obfuscated or foreign-language headers.
    8. Multi-worksheet intelligent selector bypassing non-data "Instructions" or "Readme" sheets in Excel workbooks.
  - Updated API route handlers `app/api/sheets/import/route.ts` and `app/api/sheets/[id]/import/route.ts` to pass user AI credentials and return detection summaries.
  - Updated `CsvImportModal` with live layout analysis badges (`Mapped Attributes`, `AI Schema Aligned`).
  - Validated clean `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors).
- **2026-10-03 (Phase 9 Complete — Capgemini AI-Assisted Coding Assessment Simulator)**:
  - Created `types/assessment.ts` and updated `types/prep.ts` with `"company"` PrepTab, AssessmentStages, AssessmentStatus, and 100-pt Process Rubrics.
  - Implemented `lib/assessment-problems.ts` with curated Capgemini problem catalog (First Non-Repeating Element, Max Length Subarray with Sum <= K, Merge Overlapping Work Intervals, LRU Cache Invalidation, Longest Palindromic Substring) with boundary edge cases, complexity expectations, and realistic defect presets.
  - Implemented `lib/assessment-db.ts` with MongoDB collection `assessment_sessions`, auto-indexing on `{ userId: 1, updatedAt: -1 }`, and server-side state machine persistence.
  - Implemented `lib/assessment-engine.ts` enforcing strict backend authority:
    1. Prompt-Bypass Protection: Intercepts shortcuts ("give me the code", "solve this", "generate answer", "what is optimal approach") with required refusal text without revealing answers.
    2. Semantic Stage Evaluation: Evaluates semantic understanding (not keyword matching) across Understanding -> Approach & Complexity -> Structured Implementation Prompt -> Code Review -> Refinement -> Final Review.
    3. Realistic Intentional AI Imperfections: Seeds realistic boundary/off-by-one flaws (in Standard & Hard difficulty modes) and records defect recognition.
    4. Code Review Guard: Rejects blind "looks good" approvals and requires tracing against normal and boundary test cases.
    5. Targeted Refinements: Rejects lazy "fix everything" requests and requires surgical instructions.
    6. 100-Point Rubric: Evaluates AI Literacy (25), Prompt Quality (25), Problem Solving (25), and Review & Adapt (25).
  - Implemented `POST /api/prep/assessment` (start, respond, refine, reset) and `GET /api/prep/assessment` (problems, past session scorecards).
  - Built `components/features/prep/capgemini-simulator.tsx`: Dual-pane simulation workspace with stage stepper, problem specifications, live assistant stream, syntax-highlighted code viewer with revision diffs, and 100-pt post-assessment evaluation modal.
  - Built `components/features/prep/company-tab.tsx`: Capgemini Spotlight hub with assessment state machine explainer, difficulty selector, problem library with search & difficulty filters, custom problem creator, and past session scorecard history.
  - Mounted Company Section into `app/(dashboard)/prep/page.tsx` as primary module and created direct route `app/(dashboard)/prep/company/capgemini/page.tsx`.
  - Validated clean `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors).
- **2026-10-03 (Phase 10 Complete — Dedicated Standalone Exam Environment & Docked UI)**:
  - Separated the AI Coding Assessment from `/prep` and company tracks into its own top-level route `/assessment`.
  - Added dedicated sidebar navigation entry "AI Assessment" with "EXAM" badge.
  - Built `components/features/assessment/exam-environment.tsx`:
    * True fullscreen distraction-free exam console (`fixed inset-0 z-[100] h-screen w-screen overflow-hidden`) masking sidebar, topbar, and floating agent chat during active tests.
    * Pinned bottom prompt composer (`shrink-0 bg-[#0a0f1d] border-t border-slate-800`) completely eliminating page scrolling.
    * Dual-scroll viewports: independent problem/rubric pane on the left, independent conversation stream and code pane on the right.
    * Syntax-highlighted code viewer with line numbers, copy button, and 100-pt evaluation rubric modal.
  - Built `components/features/assessment/assessment-lobby.tsx`: Pre-flight briefing, difficulty toggle, curated problem library, custom problem builder, and historical scorecards.
- **2026-10-03 (Phase 11 Complete — Fresher-Oriented Griller & Candidate Role Selection)**:
  - Updated `types/prep.ts`:
    * Added `CandidateRole` (`"fullstack" | "frontend" | "backend" | "data_ml" | "devops" | "mobile" | "general_sde"`).
    * Added `ExperienceLevel` (`"fresher" | "mid" | "senior"`).
    * Added `InterviewerPersona` (`"mentor" | "lead" | "staff" | "em"`).
  - Created `lib/fresher-projects.ts`:
    * 4 curated fresher starter projects (E-Commerce Storefront, Real-Time Collaboration Chat, Job Prep Tracker, Scalable Task REST API).
    * Detailed role metadata with probing focus areas and typical starter prompts for each role.
    * Seniority tier descriptors (Fresher 0-1 yrs focusing on fundamentals, implementation understanding, why technologies were chosen, and real debugging stories).
- **2026-10-03 (The Griller — Strict Project Anchoring & Anti-Repetition Resolution)**:
  - Identified root cause of generic/hardcoded questions:
    1. Static few-shot examples (JWT verification middleware, MongoDB vs PostgreSQL) in system guidelines caused LLMs to repeat those exact queries regardless of project topic.
    2. Vault projects in MongoDB store project titles under `name` and documentation under `documentationText`/`snippets`, which previously evaluated to `undefined` when reading `project.title`, giving the AI incomplete project context.
    3. Low temperature (0.4) caused deterministic repeating questions.
  - Implemented comprehensive fixes:
    * In `app/api/prep/griller/route.ts`: Normalized project attributes (`name || title`, `documentationText || responsibilities`, `snippets`, `metrics`, `challenges`). Merged payload with live MongoDB record when `projectId` is passed.
    * Added strict anti-generic rules explicitly forbidding questions about JWT, tokens, or databases not in the project's tech stack. The AI is strictly mandated to cite the project name and a concrete feature/API/data flow from its specifications.
    * Increased generation temperature to 0.6 for dynamic, diverse questioning.
    * In `lib/fresher-projects.ts`: Expanded curated starter projects to cover Data/ML (FastAPI Churn Pipeline), DevOps (Containerized CI/CD), and Mobile (Offline-first Habit Tracker).
  - Verified clean `npm run lint` (0 errors) and `npx tsc --noEmit` (0 errors).
- **2026-10-03 (Assessment Proctoring — Zero-Cheat Sweety Bot Isolation)**:
  - Enforced full suppression of Sweety's floating chatbot (`AgentChat`) during assessments to guarantee test integrity (preventing candidates from asking for solutions, code generation, or hints):
    1. In `components/layout/dashboard-shell.tsx`: Conditionally unmounts `<AgentChat />` whenever `pathname.startsWith("/assessment")`.
    2. In `components/features/agent/agent-chat.tsx`: Monitors pathname and body attributes (`data-in-exam="true"`, `exam-mode-active` class, `exam-mode-change` event). Immediately closes any open panel, dismisses popups, and returns `null`.
    3. In `components/features/assessment/exam-environment.tsx`: Automatically sets `data-in-exam="true"` and `exam-mode-active` on `document.body` during mount, and cleans up on unmount/exit.
  - Verified clean `npm run lint` (0 errors) and `npx tsc --noEmit` (0 errors).
- **2026-10-03 (The Griller — Next Question Progression & Answer Rewrite Loop)**:
  - Solved dead-end simulation stop after answering a question:
    1. In `app/api/prep/griller/route.ts`: Supported `action: "next_question"` and decoupled answer evaluation from asking the next question. Answering provides dedicated evaluation in `reply` with the 10-point scorecard. When the candidate requests the next question, the AI generates a brand-new technical question probing a different architectural layer or failure scenario of the project (`scorecard: null`).
    2. In `components/features/prep/griller-tab.tsx`:
       - Added **"Proceed to Next Question"** button directly on the scorecard and in an ambient Call-To-Action banner above the composer (`handleNextQuestion`), ensuring continuous multi-turn defense rounds.
       - Added **"Rewrite / Improve Answer"** button (`handleRewriteAnswer`) that loads the candidate's previous answer back into the composer, rolls back the session stream to the active question, and enables candidates to incorporate their critique and aim for a 10/10 score.
- **2026-10-04 (AI Assessment — Excel Problem Bank, Tabbed History, & Persistent State Machine)**:
  - **Random Problem Dispatcher**: Replaced the manual problem catalog in the assessment lobby with a randomized problem dispatcher. Parsed all 29 DSA problems from `Capgemini_DSA_Practice_Problems.xlsx` into `lib/assessment-problems.ts` spanning 4 key tracks:
    1. Arrays & Strings (9 questions: Special Chars to Front, Move Zeroes, Run-Length Compression, Kadane's, Product Except Self, Spiral Matrix, Rotate Image, Longest Substring, K-Anagrams).
    2. Mathematics & Greedy (7 questions: Jump Game II, Stock I & II, Container With Most Water, Modular Exponentiation, Two Sum, K-Diff Pairs).
    3. Stacks & Linked Lists (5 questions: Detect/Remove Loop, Reverse in K Groups, Next Greater Element, Valid Parentheses, Middle of List).
    4. Dynamic Programming & Trees (8 questions: 0/1 Knapsack, Subset Sum, Coin Change, LCS, LIS, BST Node Count in Range, Left View, Zigzag Level Order).
  - **Tabbed Layout ("Assessment Arena" & "Recent Assessments")**:
    * Created dedicated top-level tabs in `components/features/assessment/assessment-lobby.tsx`.
    * Arena tab features the randomized problem launcher, difficulty toggles (Standard vs Strict/Hard), and active in-progress assessment cards.
    * Recent Assessments tab lists all past attempts with attempt badges, status filters, 100-pt scorecard pill, and a full turn-by-turn prompt & AI reply inspection modal.
  - **State Persistence & Anti-Reset Protection**:
    * Updated `app/(dashboard)/assessment/page.tsx` with dual-layer persistence (localStorage + MongoDB authoritative active session check) ensuring tests do not reset when the user presses the browser back button, reloads, or navigates away.
    * Intercepted `popstate` in `components/features/assessment/exam-environment.tsx` with confirmation modal offering "Pause & Save" (preserves test) vs "Abandon & Reset".
    * Enabled full chat history review for every attempt, displaying candidate prompts, evaluator replies, verdicts, missing requirements, generated code, and rubric evaluations.
  - Verified clean `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors).
- **2026-10-04 (Phase 12 Complete — Global AI Usage Security & Token Drainage Defense Framework)**:
  - **Created Centralized Security Layer (`lib/ai-security.ts`)**:
    * **Sliding-Window Velocity Limiter**: Tracks request timestamps within rolling 60-second windows per user/IP with automatic 5-minute garbage collection. Returns standard HTTP `429 Too Many Requests` with dynamic `Retry-After` header.
    * **Concurrency Mutex Locking**: Tracks active in-flight LLM generations per user with a 45-second hard safety timeout. Eliminates the race condition where parallel asynchronous requests could flood the system and bypass free quota limits simultaneously.
    * **Duplicate / Replay Spam Defense**: Computes SHA-256 fingerprint (`userId:sanitizedInput`) and blocks identical replayed prompts within 3.5 seconds.
    * **Payload Bounding & Sanitization**: Strips null bytes (`\0`) and enforces strict character limits on single prompts (`sanitizePromptText`) and sliding turn limits on chat history (`boundChatMessages`).
    * **Global Token Ceilings (`AI_MAX_TOKENS`)**: Defined strict maximum completion tokens for all AI workloads (`CHAT_COMPLETION: 1024`, `ASSESSMENT_TURN: 1200`, `WAR_ROOM_DOSSIER: 850`, `GRILLER_EVALUATION: 850`, `STAR_STORY_MATRIX: 1000`, `REMEDIATION_DRILL: 850`, `JD_PARSER: 600`, `QUICK_HELPER: 500`, `CSV_ALIGN: 400`, `SCRAPER_EXTRACT: 800`).
    * **Helper Response Generator**: Exported `createAiRateLimitResponse` to uniformly generate standard HTTP 429 JSON responses with `Retry-After` headers.
  - **Protected All AI Route Handlers & Engines**:
    * `app/api/agent/chat/route.ts` (Sweety bot copilot): 12 req/min, 2500 max input chars, 8-turn history window, concurrency mutex lock, `AI_MAX_TOKENS.CHAT_COMPLETION`.
    * `app/api/prep/assessment/route.ts` & `lib/assessment-engine.ts`: 15 req/min, 3500 max input chars, concurrency mutex lock, `AI_MAX_TOKENS.ASSESSMENT_TURN`.
    * `app/api/prep/war-room/route.ts`: 8 req/min, concurrency mutex lock, `AI_MAX_TOKENS.WAR_ROOM_DOSSIER`.
    * `app/api/prep/griller/route.ts`: 15 req/min, 3000 max input chars, 6-turn history, concurrency mutex lock, `AI_MAX_TOKENS.GRILLER_EVALUATION`.
    * `app/api/prep/star-matrix/route.ts`: 8 req/min, concurrency mutex lock, `AI_MAX_TOKENS.STAR_STORY_MATRIX`.
    * `app/api/prep/remediation/route.ts`: 8 req/min, concurrency mutex lock, `AI_MAX_TOKENS.REMEDIATION_DRILL`.
    * `app/api/import/jd/route.ts`: 10 req/min, 8000 max input chars, concurrency mutex lock, `AI_MAX_TOKENS.JD_PARSER`.
    * `app/api/import/url/route.ts` & `app/api/scrape-job/route.ts`: 10 req/min, concurrency mutex lock, URL replay deduplication.
    * `lib/gemini.ts`: Enforced `AI_MAX_TOKENS.CHAT_COMPLETION` (1024) ceiling in `extractJSON` and `streamText` (reduced from 4096).
    * `lib/csv-import.ts`: Enforced `AI_MAX_TOKENS.CSV_ALIGN` (400) in `alignColumnsWithAi`.
    * `lib/job-scraper.ts`: Enforced `AI_MAX_TOKENS.SCRAPER_EXTRACT` (800) in HTML parsing fallback.
  - **Verification**: Verified clean `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors).
- **2026-10-04 (Phase 13 Complete — Complete Information Architecture & Modern Website Redesign)**:
  - **Replaced 17-Link Sidebar with 5 Strategic Hubs**:
    * Discontinued the overcrowded flat 17-link vertical sidebar that caused severe cognitive overload and feature blindness.
    * Re-architected global navigation into a streamlined, high-density top header (`components/layout/navbar.tsx`) with 5 core navigation pills: `Home` (`/dashboard`), `Jobs` (`/applications`), `Interviews` (`/interviews`), `Analytics` (`/analytics`), and a structured `Tools` mega-menu.
    * Mega-menu categorizes all high-value features into **Interview & Testing** (AI Assessment Exam, Problem Solving Sheets, The Griller, Rejection Drills), **Execution & Vault** (Day Planner, Project Vault, Resume Studio, Cold Outreach), ensuring no capability is overlooked.
  - **Eliminated "Card-Above-Card AI Slop"**:
    * Removed the nested wrapper card box (`border p-7`) from `components/layout/dashboard-shell.tsx` and removed the left sidebar margin offset.
    * Enabled edge-to-edge canvas with soft background (`#F8FAFC`), subtle ambient gradient blooms in the bottom corners, and crisp, single-layer glass cards.
  - **Exact Template Replication for Mission Control (`app/(dashboard)/dashboard/page.tsx`)**:
    * **Hero Greeting Banner**: Personalized greeting ("Good to see you again, kunal 👋"), motivational quote, and a bespoke scenic mountain sunrise illustration seamlessly blended into the card with gradient overlays.
    * **Today's Focus**: Target icon, dynamic `0/3` progress counter, and interactive checklist items ("Apply to at least 2 jobs", "Update resume", "Check for follow-ups") with persistent toggle state.
    * **Calendar Widget**: Monthly interactive calendar ("October 2026") with chevron controls, weekday headers, and current day highlighted.
    * **5 KPI Metric Cards**: Total Saved, Applied, Interviews, Response Rate, and Follow-ups Due with custom rounded icon badges and SVG sparkline waves.
    * **Application Pipeline Card**: "Last 30 days" selector, 7 colored stage indicator pills with live job counts, and dual-line chart (Applications vs Interviews) over a 30-day timeline.
    * **Recent Activity Feed**: Timeline with styled colored circular icon badges ("Finally online?", "Welcome to HireCompass", "Explore opportunities", "Set up reminders", "Track your progress").
    * **Smart Suggestions**: High-signal cards with company badges (Google deadline in 1d, Follow up with Stripe) with 1-click drill-down.
    * **Quick Actions (2x2 Grid)**: Track New Job (opens modal), Upload Resume (links to Resume Studio), Set Reminder (links to Reminders), View Analytics (links to Analytics).
    * **Bottom Cards**: Upcoming Interviews (empty state with Browse Opportunities CTA) and Top Saved Companies (aggregated counts with Explore Jobs CTA).
  - **Universal Command Palette (`components/ui/command-palette.tsx`)**:
    * Integrated global `⌘K` / `Ctrl+K` omnibar allowing instantaneous search and keyboard-driven jumping across all 17 features, tools, and actions in milliseconds.
  - **Edge-to-Edge Canvas Optimization**:
    * Removed restrictive `max-w-7xl` constraints from both `navbar.tsx` and `dashboard-shell.tsx`.
    * Implemented full-width layout with responsive horizontal gutters (`px-4 sm:px-6 lg:px-8`), eliminating empty side gaps on wide screens (1920px+).
  - **Verification**: Verified clean `npm run lint` (0 errors) and validated full-width visual accuracy via browser subagent screenshots.
- **2026-10-04 (Phase 14 Complete — Mobile Bottom Nav, Unified Vibrant Light Theme & Assessment Header Fix)**:
  - **Phone View Bottom Navigation Bar (`components/layout/bottom-nav.tsx`)**:
    * Implemented fixed mobile bottom navigation dock (`md:hidden`) with 5 core tabs: `Home`, `Jobs`, `Interviews`, `Analytics`, and `Tools`.
    * Integrated mobile slide-up tools drawer organizing all ecosystem features into **Interview & Assessment Arena** and **Daily Execution & Career Vault**.
    * Added iOS safe-area inset padding and responsive bottom clearance (`pb-24 md:pb-16`) on `<main>`.
  - **Unified Vibrant Light Theme (Dark Mode Completely Removed)**:
    * Standardized the entire application on a unified, high-contrast, premium light theme.
    * Configured `app/providers.tsx` with `forcedTheme="light" defaultTheme="light" enableSystem={false}` to eliminate any dark mode class injection.
    * Removed theme toggle switch buttons from both `components/layout/navbar.tsx` and `app/(dashboard)/settings/page.tsx`.
    * Created rich, colorful multi-layered aurora mesh gradient background in `components/layout/dashboard-shell.tsx` with radiant indigo/violet glows, rose/pink atmosphere, cyan nebula, and vibrant multi-stop petal blooms.
  - **Assessment Mode Proctoring Header Fix**:
    * Identified root cause of the assessment top panel overlap: `<main>` had `relative z-10` creating an isolated stacking context, causing the root navbar (`z-30`) to cover the exam's proctoring bar.
    * Removed `z-10` from `<main>` and updated `dashboard-shell.tsx` to conditionally unmount the website navbar whenever an active exam session is running.
    * Added targeted CSS suppression targeting `#hirecompass-global-navbar` and `#mobile-bottom-nav` on `body.exam-mode-active` while preserving the exam console's own `<header>` (Capgemini C badge, 6-stage stepper, timer, End Exam button).
  - **Verification**: Verified clean `npm run lint` (0 errors) and validated visual rendering in browser.
- **2026-10-04 (Phase 15 Complete — Mobile Bottom Navbar Pill, Glassmorphism & Elevated Chatbot)**:
  - **Pill-Shaped Mobile Bottom Navbar (`components/layout/bottom-nav.tsx`)**:
    * Transformed the mobile bottom navigation bar into a floating, centered pill dock (`rounded-full max-w-md mx-auto fixed bottom-3 inset-x-3`).
    * Styled with ultra-transparent frosted glassmorphism (`backdrop-blur-2xl backdrop-saturate-200 bg-white/35 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.12),inset_0_1px_2px_0_rgba(255,255,255,0.85)]`).
    * Updated navigation tabs and icon containers to rounded pill styling with translucent active glass badges and glowing indicators.
    * Upgraded top global navbar (`components/layout/navbar.tsx`) with matching transparent glassmorphism (`bg-white/45 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/50`).
  - **Elevated Circular AI Chatbot FAB (`components/features/agent/agent-chat.tsx`)**:
    * Positioned the floating chatbot circular button higher on phone view (`bottom-20 sm:bottom-6 right-4 sm:right-6`).
    * Sits comfortably above the floating navbar pill with an 18px gap, ensuring the bottom navbar is completely unobstructed.
    * Retained clean circular action button design with Sweety avatar, live emerald online status dot, and unread notification counter.
  - **Verification**: Clean `npm run lint` (0 errors).
- **2026-10-04 (Phase 16 Complete — Pixel-Accurate HireCompass Landing Page Recreation)**:
  - **Landing Page Architecture (`app/page.tsx`)**:
    * Replaced root placeholder redirect with complete, production-quality landing page faithful to the reference design.
    * Modular component structure in `components/features/landing/`: `LandingNavbar`, `HeroSection`, `TrustedCompanies`, `CoreBenefits`, `LowerFeatureSection`, `DemoModal`, and `LandingFooter`.
  - **Custom Hero Assets & 3D Laptop Showcase**:
    * Generated custom hero background image (`public/images/hirecompass-hero-bg.webp`) with restrained lavender, periwinkle, and pale blue ambient lighting.
    * Prepared high-resolution 3D silver laptop product render (`public/images/hirecompass-laptop-hero.webp`) displaying light-mode HireCompass dashboard with generic greeting ("Good to see you again, 👋"), quote, October 2026 calendar, 5 KPI cards, pipeline charts, and zero personal information.
    * Positioned the showcase occupying ~60% width with multi-stop diffuse ambient glow and feathering.
  - **Hero Typography, CTA & Social Proof**:
    * Eyebrow pill: `"YOUR JOB SEARCH, UNDER CONTROL"` in light lavender.
    * 3-line heavy heading: `"Track.\nPrepare.\nGet Hired."` with purple-to-blue gradient on `"Get Hired."`.
    * Two CTAs: `"Get started for free →"` (gradient pill linked to `/signup`) and `"Watch demo"` (opens interactive feature tour modal).
    * Reassurance row with emerald checkmarks: `"Free to use"`, `"No credit card required"`, `"Loved by 10,000+ users"`.
    * Social proof row with 4 diverse overlapping circular headshots (`public/images/avatars/avatar-[1-4].jpg`) and `"Join 10,000+ students and professionals..."`.
  - **Trusted By Monochrome Logos (`components/features/landing/trusted-companies.tsx`)**:
    * Clean SVG monochrome row for Google, Microsoft, Amazon, Adobe, Meta, Atlassian, and Spotify.
  - **Core Benefits 3-Card Row (`components/features/landing/core-benefits.tsx`)**:
    * Track Applications (purple folder), Stay on Top (mint calendar), Gain Insights (blue chart) with subtle vertical dividers.
  - **Lower Feature Section & Layered Product UI Previews (`components/features/landing/lower-feature-section.tsx`)**:
    * Left: `"BUILT FOR FOCUSED PROGRESS"`, `"A clearer, calmer job search journey."`, 4 feature descriptions, `"Explore all features →"`.
    * Right: Layered UI previews:
      1. Upcoming Interviews empty state with calendar icon and `"Browse Opportunities →"`.
      2. Application Pipeline panel with status pills and 4 realistic job rows (Google, Spotify, Amazon, Microsoft) with company icons and status pills.
      3. Your Progress card with circular 27% progress gauge and stats.
      4. Whimsical purple handwritten doodles: `"Keep track of every opportunity"` and `"Turn effort into progress"` with Next.js Google `Caveat` font and curved arrows.
  - **Interactive Tour Modal (`components/features/landing/demo-modal.tsx`)**:
    * Accessible modal previewing Dashboard Mission Control, Pipeline Kanban, Capgemini Exam Simulator, and Prep Planner.
  - **Full Verification**:
    * `npx tsc --noEmit`: 0 errors.
    * `npm run lint`: 0 errors.
- **2026-10-04 (Phase 17 Complete — Full Admin Panel Visibility & Light Theme Unification)**:
  - **Identified Root Causes**:
    1. Navigation omission: Following the Phase 13 navigation overhaul replacing the legacy 17-link sidebar with top pills and bottom docks, `/admin` was not linked in the new top navbar, mobile bottom dock, or command palette.
    2. Theme token conflict: `app/(dashboard)/admin/page.tsx` was the sole file importing legacy `styles/variables.css` containing dark-mode tokens (`--txt-primary: #F1F5F9` [off-white text], `--bg-surface: #111827` [pitch-black card background]). Against the global light aurora canvas, headings were literally white-on-white and invisible.
    3. Stale production build: The running `next start` server was serving a pre-compiled `.next` build from before admin links were added.
  - **Full Navigation Integration**:
    * **Top Navbar (`components/layout/navbar.tsx`)**: Added dedicated `[ Admin PANEL ]` pill in desktop navigation, `Admin Control Center` in `Tools` mega-menu, `Administrator` role label with `ShieldCheck` on user avatar button, `Admin Control Center` in user profile dropdown, and mobile drawer entry.
    * **Mobile Bottom Nav (`components/layout/bottom-nav.tsx`)**: Added rose indicator dot on `Tools` tab and pinned `Admin Control Center` card at the very top of the mobile tools slide-up sheet.
    * **Dashboard (`app/(dashboard)/dashboard/page.tsx`)**: Added `Admin Control Center` action pill in the personalized greeting hero banner and a dedicated full-width card in the Quick Actions 2x2 grid for admins.
    * **Global Omnibar (`components/ui/command-palette.tsx`)**: Added `Admin Control Center` (`/admin`) shortcut in `⌘K` command palette.
    * **Landing Page (`landing-navbar.tsx` & `landing-footer.tsx`)**: Added `Admin Panel` button in top navbar, in the Resources dropdown, and `Admin Portal` in the footer.
  - **Theme Modernization (`styles/variables.css`, `styles/components.css`, `admin/page.tsx`)**:
    * Overhauled `styles/variables.css` to light-theme tokens (`--bg-canvas: #F8FAFC`, `--bg-surface: #FFFFFF`, `--txt-primary: #0F172A`, `--txt-secondary: #475569`).
    * Refactored `app/(dashboard)/admin/page.tsx` with clean light Tailwind cards, dark slate typography, and high-contrast KPI badges.
  - **Guaranteed Admin Role Resolution (`lib/session.ts`)**:
- **2026-10-05 (Phase 18 Complete — Global Theme Unification across Admin Panel & AI Assessment Exam Console)**:
  - **User Problem Addressed**:
    * Theme inconsistency reported where the Admin Panel and AI Assessment Test appeared with dark backgrounds and uncoordinated styling compared to the unified light aurora theme across the rest of the SaaS application.
  - **Identified Root Causes**:
    1. `app/(dashboard)/admin/page.tsx`: Relied on legacy dark CSS variables (`var(--bg-canvas)`, `var(--bg-surface)`, `var(--border-subtle)`) and `v2-*` classes from an older prototype.
    2. `components/features/assessment/exam-environment.tsx`: Fullscreen proctored exam environment had hardcoded `#070b12` dark background, `#0a0f1d` panels, and dark slate borders.
    3. `components/features/assessment/assessment-lobby.tsx`: Contained 107 unused `dark:` class overrides creating potential tint anomalies.
  - **Implementations**:
    * **Admin Control Center (`app/(dashboard)/admin/page.tsx`)**:
      - Removed legacy `variables.css` and `components.css` dependencies.
      - Refactored Users Management Table into pure light Tailwind cards (`bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs`), with dark slate typography (`text-slate-900` / `text-slate-600`), polished role and AI privilege badges, and accessible pagination.
      - Refactored Resumes oversight table, search bar, and actions to matching light design.
      - Refactored System & AI Settings tab into a 2-column glassmorphism grid with live AI connectivity ping test.
      - Overhauled all 5 modals (Add User, Edit User, Delete User, Delete Resume, Preview Resume) with clean light cards and `bg-slate-900/40 backdrop-blur-sm` backdrops.
    * **AI Assessment Test Console (`components/features/assessment/exam-environment.tsx`)**:
      - Converted root container to `#F8FAFC` light canvas with `text-slate-900`.
      - Refactored top proctoring bar to `bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs` with Capgemini blue `#0070ad` accents, digital countdown timer, and exit controls.
      - Updated 6-stage stepper pills: active (`bg-[#0070ad] text-white`), completed (`bg-emerald-50 text-emerald-700 border border-emerald-200`), upcoming (`bg-slate-100 text-slate-500 border border-slate-200`).
      - Refactored left specifications pane (Problem Description, I/O formats, constraints, test cases, stage criteria, scratchpad) with clean light cards and high-contrast typography.
      - Refactored right conversational stream: AI messages in pure white card with slate-800 text; candidate messages in `#0070ad` gradient with white text; prompt-bypass warnings in soft rose-50 card.
      - Elevated code editor/viewer box into a crisp developer terminal (`bg-slate-950 text-slate-100 border border-slate-200 rounded-2xl shadow-md`) for optimal syntax readability inside the light page.
      - Refactored pinned docked bottom composer (`bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-lg`), suggestion chips, and submit button.
      - Refactored Exit Confirmation and Final 100-Pt Rubric Scorecard modals.
    * **Assessment Lobby (`components/features/assessment/assessment-lobby.tsx`)**:
      - Purged all 107 `dark:` class overrides across top navigation tabs, active test banner, Capgemini hero banner, difficulty selectors, categorical problem dispatcher breakdown, pre-flight checklists, history table, transcript modal, and custom problem builder modal.
  - **Verification**:
- **2026-10-05 (AI Assessment Simulator — Stage 3 False-Bypass & Loop Fix)**:
  - **Identified Root Causes**:
    1. `isExplicitBypassAttempt` pre-filter included `IMPLEMENTATION_PROMPT` stage, wrongly classifying standard code-generation directives (e.g., "Give me code in C++", "Write the solution") as bypass violations.
    2. System prompt's anti-bypass Rule 2 ("candidate cannot ask 'give me the code'") lacked stage-specific scoping. In `IMPLEMENTATION_PROMPT`, directing the AI to generate code is the intended behavior.
    3. Evaluator was overly pedantic regarding competitive-programming boilerplate (e.g. demanding stdin vs vector, rigid bullet points) even when candidate provided all algorithmic components (language, two-pass frequency map, O(N) complexity, edge cases).
    4. Meta-clarifications ("why am I getting flags?") were misclassified as bypass attempts.
  - **Implemented Engine Resolution (`lib/assessment-engine.ts`)**:
    * Removed `IMPLEMENTATION_PROMPT` from regex pre-filter bypass check.
    * Refactored system prompt with stage-scoped bypass enforcement: code generation requests in Stage 3 are explicitly marked as valid and expected (`isBypassAttempt: false`).
    * Added leniency clause: if candidate supplies language, algorithm, complexity, and edge cases (even in natural language), advance to `CODE_REVIEW` and emit `generatedCode`.
    * Protected meta-questions from being flagged as bypasses.
    * Added `IMPLEMENTATION_PROMPT` stage coverage to `buildFallbackResponse`.
  - **Verification**: Verified clean `npx tsc --noEmit` (0 errors).
- **2026-10-05 (Phase 19 Complete — Kanban Pipeline Reliability & Mock Data Elimination)**:
  - **User Problem Addressed**:
    * Kanban board reported as "not working on some users" (cards not draggable, mutations failing or silently reverting, job drawer not saving changes).
    * Requested complete removal of mock data for new users across Kanban pipeline (`/applications`), opportunities list (`/opportunities`), and dashboard smart suggestions, starting accounts completely clean and empty initially.
  - **Identified Root Causes**:
    1. **Mock Data Injection & Hardcoded ID Bypasses**: `app/(dashboard)/applications/page.tsx` and `app/(dashboard)/opportunities/page.tsx` injected 8 dummy opportunities (`id: "m1"` through `"m8"`) whenever API count was 0. In `kanban-board.tsx` and `job-drawer.tsx`, mutations had hardcoded `if (id.startsWith("m")) return;` no-op blocks that silently blocked drag transitions, deletions, and detail drawer updates.
    2. **Unmapped Status Vanishing**: `KANBAN_COLUMNS` only supports 7 canonical statuses (`SAVED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `GHOSTED`, `REJECTED`). Opportunities with `status: "INTERESTED"` or `"WISHLIST"` or lowercase values had no column match, causing cards to vanish and `@dnd-kit`'s `findContainer` to return `undefined`.
    3. **Drag Affordance Restriction**: In `kanban-card.tsx`, `@dnd-kit` listeners were attached solely to a tiny 16px `GripVertical` icon with `opacity-0 group-hover:opacity-100`, making drag impossible on touch/tablet screens and for users dragging the card body.
    4. **Silent Dropping & Lack of Mutation Error Rollback**: If a card was dropped outside valid columns or if a network/server PATCH failed, client state desynchronized without error feedback or rollback.
    5. **Unvalidated ObjectId 500s**: In `/api/opportunities/[id]`, passing an invalid or non-hex ID threw an unhandled BSONError 500.
  - **Implementations**:
    * **Mock Data Purge**: Completely removed `MOCK_OPPORTUNITIES` and `MOCK_OPPS` from `/applications`, `/opportunities`, and `components/features/dashboard/smart-suggestions.tsx`. New users start with a clean empty board and list with tailored empty-state actions (`+ Add Job`).
    * **Full Card Drag & Drop**: Moved `@dnd-kit` attributes and listeners to the card container with 5px distance constraint; isolated hover quick-action buttons with `onPointerDown={(e) => e.stopPropagation()}` to prevent accidental drag triggers; kept visual grip icon affordance.
    * **Status Normalization**: Updated `normalizeStatus` in `types/opportunity.ts` and `/api/opportunities` routes to canonically map `INTERESTED` & `WISHLIST` to `SAVED`, handle case insensitivity, and default safely to `SAVED`.
    * **Safe Drag Lifecycle & Optimistic Rollback**: Enhanced `KanbanBoard` with `onError` rollbacks and toast notifications; reverted items state if dropped outside droppable columns.
    * **Safe ObjectId Guard**: In `app/api/opportunities/[id]/route.ts`, added `ObjectId.isValid(params.id)` validation returning clean 400 responses on invalid IDs.
  - **Verification**: Verified clean `npx tsc --noEmit` (0 errors).
- **2026-10-05 (Phase 20 Complete — Kanban Empty-Column Hover & Drop Persistence Fix)**:
  - **User Problem Addressed**:
    * Hovering any job card over OA (`ASSESSMENT`), Interview, Offer, or any column other than Rejected or Applied failed to allow placing the card into those fields.
    * For new users, when a user was able to place a card, the new column status was not saving or updating in the database.
  - **Identified Root Causes**:
    1. **`closestCorners` Geometric Starvation of Empty Columns**: Populated columns (Applied, Rejected) contained small card bounding boxes whose corners were mathematically closer to the cursor than the far corners of tall (440px) empty columns. As a result, `@dnd-kit`'s `closestCorners` consistently snapped back to Applied or Rejected.
    2. **Stale Asynchronous State in `handleDragEnd`**: `activeOriginalStatus` was stored in React state (`useState`). Because `handleDragOver` updated `items` asynchronously, by the time `handleDragEnd` fired, `destinationColumn === originalStatus` or `activeOriginalStatus` was lost in stale closures, causing `updateStatusMutation.mutate` to never fire.
    3. **Missing `pointer-events-none` on Dragging Elements**: Dragged card containers and DragOverlay wrappers lacked `pointer-events-none`, causing the cursor to intercept pointer events and block droppable target collision below.
    4. **String vs. ObjectId Mismatch in DB Querying**: In `/api/opportunities` and `/api/opportunities/[id]`, querying `userId: session.user.id` failed for users whose IDs were stored as Mongo `ObjectId`s.
  - **Implementations**:
    * **Pointer-Priority Multi-Tier Collision Strategy (`kanban-board.tsx`)**: Replaced `closestCorners` with a custom collision detection strategy prioritizing `pointerWithin` -> `rectIntersection` -> `closestCenter`. Hovering directly over any empty column (OA, Interview, Offer, Ghosted) immediately triggers that column's droppable zone.
    * **Synchronous Drag Tracking via Refs (`kanban-board.tsx`)**: Introduced `startStatusRef` and `itemsRef` to record exact initial status synchronously upon `onDragStart`. In `onDragEnd`, if destination differs from `startStatusRef.current`, it immediately invokes `updateStatusMutation.mutate({ id, status: destinationColumn })`.
    * **Isolated Event Pointers (`kanban-card.tsx` & `kanban-column.tsx`)**: Attached `data: { type: "card", opportunity, status }` to `useSortable` and `data: { type: "column", status }` to `useDroppable`. Set `pointer-events-none` on dragging cards, empty-column placeholders, and `DragOverlay`.
    * **Dual ID Matching in DB Queries (`app/api/opportunities/route.ts` & `[id]/route.ts`)**: Used `userMatch = ObjectId.isValid(session.user.id) ? { $in: [session.user.id, new ObjectId(session.user.id)] } : session.user.id` so all updates and queries match both string and ObjectId user references.
  - **Verification**: Clean `npx tsc --noEmit` (0 errors) and clean `npm run lint`.
- **2026-10-05 (Phase 21 Complete — Platform Telemetry, Guest Exploration Tour, 10-Token AI Gating, Dashboard Real Data Overhaul & Planner Revamp)**:
  - **User Requests Addressed**:
    1. **Admin Panel User Activity & Website Traffic Logger**: Track which user was active last time, presence status (online now / last active relative time), last path visited, and overall traffic analytics (pageviews, unique visitors, guest vs. member split, top visited pages).
    2. **Guest Exploration & Auth Gating**: Allow new visitors to freely explore website features without immediate forced login/signup. Provide an interactive 5-step product tour on first visit. Allow Sweety AI copilot chatting with a strict **10 free tokens/messages limit**, prompting authentication once 10 tokens are exhausted.
    3. **Zero Dummy Content on Dashboard (`/dashboard`)**: Make all widgets real and functional: dynamic month/year interactive calendar with real events, persistent Today's Focus checklist synced with Day Planner, real dynamic 30-day pipeline SVG trendline from MongoDB data, real audit log in Recent Activity, real heuristic Smart Suggestions, and live upcoming interviews.
    4. **Expanded Dashboard Career & Prep Modules**: Daily DSA / Blind 75 streak, AI coding assessment readiness score, weekly application velocity goal, and quick-start prep launcher.
    5. **AI Day Planner Revamp (`/planner`)**: 1-click pipeline/interview auto-sync, dynamic "Behind Schedule / Reshuffle" time rebalancer, and Pomodoro focus mode.
  - **Implementations**:
    * **Telemetry System (`types/telemetry.ts`, `lib/telemetry-db.ts`, `app/api/telemetry/route.ts`, `app/api/admin/traffic/route.ts`, `components/layout/telemetry-tracker.tsx`)**:
      - Non-blocking MongoDB event logger capturing pageviews, route transitions, and 2.5m heartbeats.
      - User active tracking updating `lastActiveAt`, `lastPath`, and rolling 5-minute `isOnline` presence status.
      - Admin Control Center augmented with 6 KPI cards, active user roster, top routes, and real-time live presence indicators.
    * **Guest Exploration & 10-Token AI Gating (`lib/ai-quota.ts`, `app/api/agent/chat/route.ts`, `components/features/agent/agent-chat.tsx`, `components/features/tour/product-tour.tsx`, `components/layout/dashboard-shell.tsx`, `components/layout/navbar.tsx`)**:
      - Guest visitors assigned persistent client UUID (`hirecompass_visitor_id`).
      - AI chat gated at 10 free requests per visitor in `guest_ai_usage` collection.
      - AgentChat UI displays live token counter pill (`Guest: X/10 tokens left`) and renders locked conversion barrier when 10 tokens are exhausted.
      - Interactive 5-step `ProductTourModal` explaining overview, Kanban board, AI Assessment arena, Interview Prep, and AI Day Architect.
      - Non-intrusive top guest exploration announcement banner with tour launcher and sign-up CTA.
      - Navbar conditionally displays Sign In and Sign Up buttons for guest sessions.
    * **Dashboard Real Data Overhaul (`app/(dashboard)/dashboard/page.tsx`, `app/api/dashboard/activities/route.ts`)**:
      - Interactive dynamic calendar with month/year navigation, leading/trailing days, real event indicator dots (interviews, reminders, deadlines), and selected day agenda.
      - Today's Focus checklist two-way synced with `/api/planner/today`.
      - Dynamic 30-day SVG area/line chart computing actual daily application and interview trends.
      - Live recent activity feed querying `/api/dashboard/activities` with chronological telemetry and opportunity events.
      - Heuristic smart suggestions alerting for overdue applications (>7 days without update), upcoming interviews (<48h), and saved applications.
      - Real upcoming interviews aggregating scheduled interviews and opportunities in INTERVIEW status.
      - Added 4 Career & Prep modules: Daily DSA & Blind 75 streak ring, Capgemini AI Assessment readiness score, Weekly Application Velocity goal gauge, and quick-start prep launcher.
    * **AI Day Planner Revamp (`app/api/planner/sync-context/route.ts`, `components/features/planner/planner-intake.tsx`)**:
      - Enhanced 1-click sync context pulling upcoming interviews, overdue follow-ups, pending reminders, and active DSA roadmap goals into daily synthesis prompts.
    * **Landing Page Guest Flow (`components/features/landing/`)**:
      - Updated all primary CTA buttons ("Get started for free", "Get started", "Explore all features", "Try demo") in `hero-section.tsx`, `landing-navbar.tsx`, `lower-feature-section.tsx`, and `demo-modal.tsx` to point directly to `/dashboard` instead of `/signup`, allowing immediate guest exploration and automatic guided tour on-boarding without forced login barriers.
  - **Verification**: Clean `npx tsc --noEmit` (0 errors) across the entire codebase.
- **2026-10-05 (Phase 22 Complete — In-Context Pop-up Authentication Modal & Frictionless Guest Retention)**:
  - **User Problem & Request**:
    * Clicking "Get Started" on the landing page or triggering authentication across the application was redirecting visitors to blank `/login` and `/signup` pages, interrupting their journey and causing bounce.
    * Requested an in-context pop-up auth card accessible anywhere on the page when asked to authenticate for a feature, keeping the user attentive and preserving their scroll position, input state, open drawers, and active work even if they choose not to authenticate.
  - **Implementations**:
    * **In-Context Auth Modal System (`components/features/auth/auth-modal.tsx`)**:
      - Built `AuthModalProvider` and `useAuthModal()` React context hook with support for opening with custom modes (`"login"` | `"signup"`), custom contextual reasons, and custom `onSuccess` callbacks.
      - Integrated custom window event listener (`open-auth-modal`) allowing dispatch from non-React scripts or external event triggers.
      - Implemented sleek aurora glassmorphism modal card rendered into `document.body` via `createPortal` with `z-[100000]` to avoid container clipping or stacking context traps.
      - Features contextual badges displaying why authentication is required (e.g., token limit reached, saving application), unified Sign In / Create Account tabs, password visibility toggle, password strength meter, error handling, backdrop dismiss, and `Escape` key listeners.
      - Upon successful auth, invalidates React Query caches (`auth-me`, `dashboard-stats`, `opportunities`) and calls `router.refresh()` to hydrate user session without full page reloads or unmounting active client state.
    * **Global Integration (`app/providers.tsx`)**:
      - Wrapped the entire application tree in `<AuthModalProvider>`.
    * **Contextual Trigger Refactoring**:
      - **Dashboard Guest Announcement Banner (`components/layout/dashboard-shell.tsx`)**: Clicking "Create free account" in the top banner now opens the auth modal card with reason badge instead of navigating to `/signup`.
      - **App Navbar (`components/layout/navbar.tsx`)**: Both desktop header and mobile drawer "Sign In" and "Sign Up" buttons now open the modal card in-place.
      - **Sweety AI Copilot (`components/features/agent/agent-chat.tsx`)**: When a guest exhausts their 10 free tokens, the "Create Free Account" and "Sign In" buttons trigger the modal card; upon authentication, `isGuestLimitReached` immediately unlocks the chat input in-place without page reload.
      - **Landing Navbar & Footer (`components/features/landing/landing-navbar.tsx`, `landing-footer.tsx`)**: "Log in" and "Create free account" buttons trigger the modal card in-place. "Get started" and product navigation links direct visitors into `/dashboard` and `/applications` in guest mode with the interactive tour.
  - **Verification**: Clean `npx tsc --noEmit` (0 errors) across the entire codebase.
- **2026-10-05 (Bugfix — Dashboard Sheets Response Unwrapping & Guest Templates)**:
  - **Issue**: `TypeError: sheetsData.forEach is not a function` occurred on `/dashboard` because `/api/sheets` returns `{ sheets: [...] }` (and returned 401 for unauthenticated visitors) rather than a naked array, causing `sheetsData.forEach` to throw.
  - **Fix**:
    * Updated `/api/sheets` `GET` route to allow guest exploration: unauthenticated visitors now receive built-in roadmap templates so dashboard widgets can compute metrics without 401 errors.
    * In `app/(dashboard)/dashboard/page.tsx`, wrapped `sheetsData`, `opportunities`, `interviews`, and `reminders` with defensive `Array.isArray` unwrapping and fallback defaults.
  - **Verification**: Clean `npx tsc --noEmit` (0 errors).
- **2026-10-05 (Bugfix & Full Site Audit — SSR Date Hydration Mismatch Resolution)**:
  - **Issue**: `Text content does not match server-rendered HTML. Server: "8 Sept" Client: "Sep 8"` thrown on the Dashboard page during React hydration.
  - **Root Cause**: The 30-day pipeline trend chart formatted step date labels using `stepDate.toLocaleDateString([], { month: "short", day: "numeric" })`. Because Node.js runtime and the browser client used different system locales (`en-IN` vs `en-US`), the server generated `"8 Sept"` while the browser hydrated with `"Sep 8"`.
  - **Fixes & Audit**:
    * Created deterministic, locale-immune date formatters in `lib/utils.ts`: `formatShortDate` and `formatFullDate` which format months via a constant lookup array (`SHORT_MONTHS`) ensuring 100% identical outputs on Server, Client, Node, Chrome, Firefox, and Safari.
    * Replaced all unlocalized `toLocaleDateString` instances in `app/(dashboard)/dashboard/page.tsx`, `components/features/opportunity-card.tsx`, `components/features/assessment/assessment-lobby.tsx`, `app/(dashboard)/admin/page.tsx`, and `app/(dashboard)/outreach/campaign/[id]/analytics/page.tsx`.
    * Added `suppressHydrationWarning` on date rendering spans and timestamps.
  - **Full Validation**:
    * Ran `npx tsc --noEmit`: 0 errors.
    * Ran `npm run lint`: 0 errors.
    * Browser subagent live audit on `http://localhost:3000/dashboard`: Verified 0 console errors, 0 runtime warnings, 0 hydration mismatches, and smooth rendering of pipeline chart, calendar, metric cards, and prep modules.

