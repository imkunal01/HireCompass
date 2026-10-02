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
   - **Company & Round War Room**: Syncs with scheduled interviews from `/interviews`, generates round profile intelligence, focus checklists, and high-signal Reverse Interview questions.
   - **Project Defense Arena ("The Griller")**: AI Staff Engineer interrogation simulation testing candidates on their actual projects from `/projects`.
   - **Dynamic STAR Story Matrix**: Auto-synthesizes quantified behavioral stories from project data with 1-click audience re-targeting (EM, Principal Engineer, PM).
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






