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
- **2026-10-04 (Production Build Resolution & Type Safety Fix)**:
  - **Identified Production Build Failures**:
    1. `components/layout/navbar.tsx`: Missing type import `Reminder` on notification dropdown query and navbar pending reminder state.
    2. Missing helper functions `getUrgencyLevel`, `URGENCY_STYLE`, and `getTimeLabel` in `navbar.tsx`.
    3. Missing convenience script `"prod": "next start"` in `package.json`.
  - **Implemented Comprehensive Fixes**:
    * Created canonical `types/reminder.ts` exporting `Reminder` and `ReminderType` for cross-component type consistency.
    * Added `getUrgencyLevel`, `URGENCY_STYLE` dictionary with tailwind color badges, and relative `getTimeLabel` in `components/layout/navbar.tsx`.
    * Added `"prod": "next start"` to `package.json` scripts.
  - **Full Verification**:
    * `npx tsc --noEmit`: 0 errors (clean exit code 0).
    * `npm run lint`: 0 errors (clean exit code 0).
    * `npm run build`: Successfully generated production bundles for all static & dynamic routes and API handlers (Exit code 0).



