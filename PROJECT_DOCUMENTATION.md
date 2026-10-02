# HireCompass — Complete Technical Architecture & System Documentation

> **Version:** 1.0.0  
> **Target Audience:** Developers, Technical Architects, DevOps Engineers, and Product Owners  
> **Last Updated:** September 2026  

---

## Table of Contents
1. [Executive Summary & System Philosophy](#1-executive-summary--system-philosophy)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Technology Stack & Key Dependencies](#3-technology-stack--key-dependencies)
4. [Repository Topology & Directory Structure](#4-repository-topology--directory-structure)
5. [Database Architecture & MongoDB Schema Reference](#5-database-architecture--mongodb-schema-reference)
   - [5.1 users Collection](#51-users-collection)
   - [5.2 opportunities Collection](#52-opportunities-collection)
   - [5.3 projects Collection](#53-projects-collection)
   - [5.4 cv_documents Collection](#54-cv_documents-collection)
   - [5.5 outreach_campaigns & outreach_records Collections](#55-outreach_campaigns--outreach_records-collections)
   - [5.6 day_plans Collection](#56-day_plans-collection)
   - [5.7 interviews, reminders & email_jobs Collections](#57-interviews-reminders--email_jobs-collections)
   - [5.8 sheets, sheet_items & item_progress Collections](#58-sheets-sheet_items--item_progress-collections)
   - [5.9 prep_sessions, star_stories & war_room_dossiers Collections](#59-prep_sessions-star_stories--war_room_dossiers-collections)
6. [Core Modules & Engineering Deep-Dive](#6-core-modules--engineering-deep-dive)
   - [6.1 Authentication, Session Management & Cryptography](#61-authentication-session-management--cryptography)
   - [6.2 AI Quota, LLM Gateway & Dynamic Encryption Vault](#62-ai-quota-llm-gateway--dynamic-encryption-vault)
   - [6.3 Opportunities Management & Kanban Pipeline](#63-opportunities-management--kanban-pipeline)
   - [6.4 Rejection Intelligence & Drop-off Tracker](#64-rejection-intelligence--drop-off-tracker)
   - [6.5 AI-Powered Cold Outreach Automation](#65-ai-powered-cold-outreach-automation)
   - [6.6 AI Day Planner & Execution Cockpit](#66-ai-day-planner--execution-cockpit)
   - [6.7 Project Vault & Form Kit](#67-project-vault--form-kit)
   - [6.8 ATS Job Scraper & Intelligent Importer](#68-ats-job-scraper--intelligent-importer)
   - [6.9 Autonomous AI Agent ("Sweety")](#69-autonomous-ai-agent-sweety)
   - [6.10 Interview Management & Google Calendar Sync](#610-interview-management--google-calendar-sync)
   - [6.11 Notification Subsystem, Email Alerts & Morning Digest](#611-notification-subsystem-email-alerts--morning-digest)
   - [6.12 Administration, Observability & User Management](#612-administration-observability--user-management)
   - [6.13 Problem Solving Prep Ecosystem & Universal Spreadsheet Importer](#613-problem-solving-prep-ecosystem--universal-spreadsheet-importer)
   - [6.14 Interview Prep Hub & Defense Cockpit](#614-interview-prep-hub--defense-cockpit)
7. [Comprehensive API Route Matrix](#7-comprehensive-api-route-matrix)
8. [Environment Configuration Reference](#8-environment-configuration-reference)
9. [DevOps, Local Development & Deployment Guide](#9-devops-local-development--deployment-guide)
10. [Delivered Preparation Ecosystem & Cross-System Synergy](#10-delivered-preparation-ecosystem--cross-system-synergy)
11. [Conclusion & Maintenance](#11-conclusion--maintenance)

---

## 1. Executive Summary & System Philosophy

**HireCompass** is an intelligent, full-stack career orchestration and job application intelligence platform designed to eliminate the friction, disorganization, and manual fatigue of the modern tech hiring market. 

Job seeking in software engineering has evolved into a multi-variable problem requiring:
- Tracking dozens of active applications across different interview stages.
- Managing Online Assessments (OAs), technical rounds, take-homes, and HR screens.
- Performing structured post-mortems on rejections to identify skill gaps.
- Sending hyper-personalized cold outreach emails to recruiters without getting flagged.
- Aligning portfolio projects with job descriptions for fast form filling.
- Maintaining daily discipline with focused preparation, coding practice, and application quotas.

HireCompass unifies these disparate concerns into a cohesive workspace powered by **Next.js 14 App Router**, **MongoDB**, **Tailwind CSS**, and **Groq Cloud LLMs (`openai/gpt-oss-120b`)**.

---

## 2. System Architecture Diagram

```mermaid
graph TD
    subgraph Client["Frontend Layer (Next.js 14 App Router + Tailwind CSS)"]
        UI_Nav["Responsive Shell & Navigation"]
        UI_Kanban["Kanban Board (@dnd-kit)"]
        UI_Planner["Day Planner & Focus Cockpit"]
        UI_Outreach["Outreach Campaign Manager"]
        UI_Rejection["Rejection Tracker"]
        UI_Projects["Project Vault & Form Kit"]
        UI_Agent["Sweety AI Conversational Agent"]
        UI_Admin["Admin Management Portal"]
    end

    subgraph Middleware["Auth & Security Layer"]
        JWT_Guard["Jose JWT Authentication (httpOnly Cookie)"]
        Crypto_Vault["AES-256-GCM Secret Vault (Custom Groq Keys)"]
        Quota_Manager["AI Request Rate Limiter & Quota Engine"]
        Admin_Guard["Role-Based Access Control (RBAC)"]
    end

    subgraph API["Next.js Route Handlers (/api)"]
        API_Auth["/api/auth/*"]
        API_Opps["/api/opportunities/*"]
        API_Outreach["/api/outreach/*"]
        API_Planner["/api/planner/*"]
        API_Agent["/api/agent/chat (Tool Calling)"]
        API_Projects["/api/projects/* & /api/form-kit"]
        API_Scraper["/api/scrape-job & /api/import/*"]
        API_Cron["/api/cron/* (Daily Digest & Email Jobs)"]
        API_Admin["/api/admin/*"]
    end

    subgraph Storage["Persistence Layer"]
        Mongo[(MongoDB Database)]
        Mongo_Users[(users)]
        Mongo_Opps[(opportunities)]
        Mongo_Outreach[(outreach_campaigns & records)]
        Mongo_Plans[(day_plans)]
        Mongo_Projects[(projects)]
        Mongo_Reminders[(reminders & email_jobs)]
        Mongo_Docs[(cv_documents)]
    end

    subgraph External["External Services & AI Infrastructure"]
        Groq_LLM["Groq AI Cloud (openai/gpt-oss-120b)"]
        Google_Cal["Google Calendar API (OAuth2)"]
        Gmail_SMTP["Gmail SMTP (Nodemailer)"]
        ATS_APIs["ATS Endpoints (Greenhouse, Lever, Ashby)"]
        External_Cron["cron-job.org (Scheduled Triggers)"]
    end

    Client --> Middleware
    Middleware --> API
    API --> Storage
    API --> External
    External_Cron --> API_Cron
```

---

## 3. Technology Stack & Key Dependencies

### 3.1 Frontend Framework & Runtime
- **Next.js 14.2.15**: App Router architecture utilizing Server Components where appropriate and Client Components (`"use client"`) for rich interactive dashboards. Turbopack enabled (`next dev --turbo`).
- **React 18.3.1**: Modern React concurrent features and hooks.
- **TypeScript 5.4.5**: Strict type safety across components, route handlers, and database contracts.

### 3.2 Styling & User Interface
- **Tailwind CSS 3.4.3** & **tailwindcss-animate**: Utility-first CSS styling augmented by CSS variable tokens.
- **next-themes 0.4.6**: Theme switching supporting dark and light modes with zero flash.
- **Lucide React 0.378.0**: Modern, cohesive iconography.
- **@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities**: Accessible, high-performance drag-and-drop mechanics powering the Kanban pipeline.
- **Recharts 3.10.1**: Responsive SVG charts powering the analytics and rejection distribution visualizers.

### 3.3 State Management & Data Fetching
- **@tanstack/react-query 5.37.1**: Declarative server-state caching, automatic cache invalidation, and optimistic UI mutations.
- **Zustand 4.5.2**: Lightweight client-side UI store (`hooks/useStore.ts`) managing sidebar states and viewport breakpoints.
- **nuqs 2.8.9**: Type-safe URL query state management for filter persistence.

### 3.4 Backend & Persistence
- **MongoDB Node.js Driver 6.6.2**: Native driver with connection pooling across hot-module-reloads via `lib/mongodb.ts`.
- **Jose 6.2.3**: Lightweight JavaScript Object Signing and Encryption for HS256 JWT tokens.
- **bcryptjs 3.0.3**: Salted password hashing for credentials authentication.
- **Node.js Crypto**: Built-in cryptographic module providing AES-256-GCM symmetric encryption for user-supplied API keys.

### 3.5 AI & Parsing Engines
- **Groq SDK 1.2.1**: Blazing fast inference interface querying `openai/gpt-oss-120b` (128k context window).
- **Cheerio 1.2.0**: Fast server-side DOM parser for extracting job content from unstructured HTML postings.
- **pdf-parse 2.4.5**: Binary buffer parser extracting text streams from uploaded PDF resumes and CVs.
- **papaparse 5.5.3** & **xlsx 0.18.5**: Multi-format parser for ingesting recruiter contacts from CSV and Excel files.

### 3.6 Communications & External APIs
- **Nodemailer 9.0.0**: SMTP mail transport protocol handler for transactional emails, reminders, and cold outreach.
- **googleapis 173.0.0**: Google OAuth2 client and Calendar v3 SDK for calendar synchronization.

---

## 4. Repository Topology & Directory Structure

```
HireCompass/
├── app/                                # Next.js App Router root
│   ├── (auth)/                         # Unauthenticated auth group
│   │   ├── login/page.tsx              # User login interface
│   │   └── signup/page.tsx             # User registration interface
│   ├── (dashboard)/                    # Authenticated dashboard application
│   │   ├── layout.tsx                  # Dashboard parent layout wrapping shell & providers
│   │   ├── admin/page.tsx              # System administration & user telemetry
│   │   ├── analytics/page.tsx          # Application funnel & conversion metrics
│   │   ├── applications/page.tsx       # Drag-and-drop Kanban pipeline
│   │   ├── assistant/page.tsx          # Redirects to /planner
│   │   ├── dashboard/page.tsx          # Master command center & ghosting radar
│   │   ├── import/page.tsx             # Smart ATS URL & pasted JD scraper
│   │   ├── interviews/page.tsx         # Interview schedule & Google Meet links
│   │   ├── opportunities/page.tsx      # Comprehensive searchable job catalog
│   │   ├── outreach/                   # Cold outreach campaign hub
│   │   │   ├── page.tsx                # Campaign list & aggregate statistics
│   │   │   ├── upload/page.tsx         # CSV / Excel recruiter contact parser
│   │   │   └── campaign/[id]/          # Campaign review, generation & dispatch
│   │   │       ├── page.tsx            # Recruiter record editor & batch sender
│   │   │       └── analytics/page.tsx  # Campaign-specific delivery & reply stats
│   │   ├── planner/page.tsx            # AI Day Planner & Execution Cockpit
│   │   ├── projects/page.tsx           # Portfolio project repository & snippet tailor
│   │   ├── rejected/page.tsx           # Rejection intelligence & fumble diagnostics
│   │   ├── reminders/page.tsx          # Deadlines, follow-up calendar & email alerts
│   │   ├── resumes/page.tsx            # Document vault & resume version manager
│   │   └── settings/page.tsx           # Profile, encryption vault & digest preferences
│   ├── api/                            # Backend route handlers (REST endpoints)
│   │   ├── admin/                      # Admin routes (stats, users, resumes)
│   │   ├── agent/chat/                 # Autonomous AI Agent ("Sweety") tool-calling route
│   │   ├── ai/                         # Modular AI inference routes (match, snippets, plan)
│   │   ├── analytics/                  # Funnel calculations & ghosted app detectors
│   │   ├── auth/                       # Signup, login, logout, me, profile, password
│   │   ├── cron/                       # Scheduled endpoints (daily-digest, process-emails)
│   │   ├── dashboard/                  # Aggregate stats & activity streams
│   │   ├── documents/                  # CV upload, retrieval, deletion & parsing
│   │   ├── form-kit/                   # Project-to-opportunity skill overlap ranker
│   │   ├── google-calendar/            # OAuth2 auth, callback, event sync
│   │   ├── import/                     # Text, URL, and JD parsers
│   │   ├── interviews/                 # CRUD for scheduled interviews
│   │   ├── opportunities/              # CRUD for job applications & status mutations
│   │   ├── outreach/                   # Campaigns, records, extraction, email generation
│   │   ├── planner/                    # Plan generation, reshuffle, task assist, today's plan
│   │   ├── projects/                   # Portfolio projects & AI snippet generator
│   │   ├── reminders/                  # CRUD for alert reminders
│   │   ├── scrape-job/                 # Direct ATS / Cheerio web scraper
│   │   └── settings/                   # User Groq key validation & digest config
│   ├── globals.css                     # Global Tailwind imports & CSS variable themes
│   ├── layout.tsx                      # Root HTML shell with fonts and metadata
│   ├── page.tsx                        # Root redirect route
│   └── providers.tsx                   # React Query & NextThemes wrapper
├── components/
│   ├── features/                       # Domain-specific feature components
│   │   ├── agent/                      # Floating Sweety AI chat window
│   │   ├── assistant/                  # Match score gauge & fit visualizers
│   │   ├── dashboard/                  # GhostingRadar & SmartSuggestions widgets
│   │   ├── kanban/                     # AddJobModal, JobDrawer, KanbanBoard, KanbanCard
│   │   ├── opportunities/              # FilterSidebar & SearchBar with highlights
│   │   └── planner/                    # Cockpit, Intake, StrategyCards, Timer, Audio
│   ├── layout/                         # Core layout wrappers
│   │   ├── dashboard-shell.tsx         # Responsive container with sidebar toggle
│   │   ├── navbar.tsx                  # Top navigation, status indicator, user menu
│   │   └── sidebar.tsx                 # Navigation drawer with mobile backdrop
│   └── ui/                             # Generic reusable atoms
│       ├── badge.tsx                   # Company avatar, status, and priority badges
│       ├── install-prompt.tsx          # PWA installation banner
│       ├── notification-initializer.tsx# Browser notification permission requester
│       ├── rate-limit-banner.tsx       # Groq quota warning banner
│       └── toast.tsx                   # Custom toast notifications provider
├── hooks/
│   ├── useStore.ts                     # Zustand store for sidebar and global layout
│   └── useUser.ts                      # React Query hook for authenticated user state
├── lib/
│   ├── ai-quota.ts                     # AI request limiter, model resolver & BYOK logic
│   ├── auth.ts                         # Password hashing helper functions
│   ├── crypto.ts                       # AES-256-GCM encryption & decryption for API keys
│   ├── email.ts                        # Nodemailer HTML template builders & dispatchers
│   ├── gemini.ts                       # Groq SDK adapter (extractJSON, streamText)
│   ├── google-calendar.ts              # Google Calendar OAuth2 client & event creator
│   ├── job-scraper.ts                  # ATS detection, JSON-LD parser, and Cheerio scraper
│   ├── mongodb.ts                      # Cached MongoDB client connection singleton
│   ├── session.ts                      # Jose JWT cookie creation, verification & RBAC guards
│   └── utils.ts                        # Class name merger (`cn`)
├── types/
│   ├── opportunity.ts                  # Types for jobs, OAs, interviews, offers, rejections
│   ├── outreach.ts                     # Types for campaigns, recruiter rows, email states
│   ├── planner.ts                      # Types for day plans, strategies, tasks, energy levels
│   ├── project.ts                      # Types for portfolio projects, snippets, FormKit items
│   └── user.ts                         # User document, session user, and encryption types
├── public/                             # Static public assets (avatars, icons, logos)
├── styles/                             # Modular styling sheets
│   ├── animations.css                  # Custom keyframe animations
│   ├── components.css                  # Reusable card, button, and glassmorphism styles
│   └── variables.css                   # Custom theme tokens and colors
├── .env.example                        # Documented environment variable template
├── package.json                        # NPM package manifests & scripts
├── tailwind.config.js                  # Tailwind configuration with customized palette
└── tsconfig.json                       # TypeScript compiler paths and settings
```

---

## 5. Database Architecture & MongoDB Schema Reference

The persistence tier runs on MongoDB. Below is the comprehensive schema definition for every collection.

### 5.1 `users` Collection
Stores user identity, hashed credentials, role classification, and AI quota/BYOK settings.

```typescript
{
  _id: ObjectId,
  name: string,
  email: string,                       // Unique index
  passwordHash: string,                // bcrypt hash
  role: "admin" | "user",              // Role-based access control
  aiAccess: "DEFAULT" | "UNRESTRICTED" | "DISABLED",
  aiLimit?: number,                    // Overrides system default free quota
  aiUsage: {
    count: number,                     // Number of AI requests used
    limit?: number,
    lastUsedAt?: Date
  },
  groqKey?: {                          // User's own encrypted API key (BYOK)
    ciphertext: string,                // Hex-encoded AES-256-GCM ciphertext
    iv: string,                        // Hex-encoded 96-bit initialization vector
    tag: string                        // Hex-encoded authentication tag
  },
  groqModel?: string,                  // User-selected Groq model
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 `opportunities` Collection
Represents individual job applications through their complete lifecycle.

```typescript
{
  _id: ObjectId,
  userId: string,                      // Foreign key -> users._id
  title: string,                       // e.g. "Software Engineer - Backend"
  company: string,                     // e.g. "Stripe"
  location?: string,                   // e.g. "San Francisco, CA"
  isRemote?: boolean,
  employmentType?: "INTERNSHIP" | "FULL_TIME" | "CONTRACT" | "PART_TIME",
  salary?: string,                     // e.g. "$140,000 - $170,000"
  url?: string,                        // Job posting URL
  sourcePlatform?: "LINKEDIN" | "INTERNSHALA" | "GLASSDOOR" | "ANGELLIST" | "COMPANY_SITE" | "REFERRAL" | "OTHER",
  status: "SAVED" | "INTERESTED" | "APPLIED" | "ASSESSMENT" | "INTERVIEW" | "OFFER" | "REJECTED",
  priority: "HIGH" | "MEDIUM" | "LOW",
  deadline?: Date | string,
  skills?: string[],                   // e.g. ["TypeScript", "Node.js", "PostgreSQL"]
  tags?: string[],                     // e.g. ["fintech", "series-b"]
  notes?: string,
  timeline: Array<{
    id?: string,
    event: string,                     // e.g. "Status changed to APPLIED"
    description?: string,
    timestamp: Date
  }>,
  
  // Online Assessment (OA) details
  oaDetails?: {
    totalRounds?: number,
    currentRound?: number,
    platform?: string,                 // HackerRank, CodeSignal, LeetCode, etc.
    date?: Date | string,
    topics?: string[],
    status?: "PENDING" | "CLEARED" | "FAILED",
    score?: string,
    notes?: string
  },

  // Structured Technical Interview Rounds
  interviewRounds?: Array<{
    id: string,
    roundNumber: number,
    roundName: string,
    roundType: "OA" | "TECHNICAL" | "SYSTEM_DESIGN" | "BEHAVIORAL" | "HR" | "MANAGERIAL" | "TAKE_HOME" | "OTHER",
    date?: Date | string,
    interviewer?: string,
    topicsCovered?: string,
    difficulty?: "EASY" | "MEDIUM" | "HARD",
    status: "PASSED" | "FAILED" | "PENDING" | "SCHEDULED",
    notes?: string
  }>,

  // HR / Recruiter screen details
  isHrRound?: boolean,
  hrRoundDetails?: {
    isCompleted?: boolean,
    recruiterName?: string,
    date?: Date | string,
    expectedSalary?: string,
    currentSalary?: string,
    noticePeriod?: string,
    cultureFitNotes?: string,
    status?: "PENDING" | "CLEARED" | "FAILED"
  },

  // Offer details
  offerDetails?: {
    totalAmount?: string,
    baseSalary?: string,
    bonus?: string,
    stocks?: string,
    deadline?: Date | string,
    location?: string,
    notes?: string
  },

  // Rejection post-mortem diagnostics
  rejectionDetails?: {
    stage: string,                     // Drop-off stage
    reasonCategory?: string,           // e.g. "DSA & Problem-Solving Speed Gaps"
    whatWasAsked?: string,             // Specific interview question
    whyRejected?: string,              // Company feedback
    whereFumbled?: string,             // Candidate's self-reflection
    lessonsLearned?: string,           // Action item for future interviews
    rejectionDate?: Date | string
  },

  createdAt: Date,
  updatedAt: Date
}
```

### 5.3 `projects` Collection
Contains user portfolio projects and modular AI-generated snippets for rapid application completion.

```typescript
{
  _id: ObjectId,
  userId: string,
  name: string,
  description: string,                 // Master elevator pitch
  documentationText?: string,          // Detailed architectural markdown
  techStack: string[],                 // ["Next.js", "MongoDB", "Tailwind"]
  roleCategories: string[],            // ["fullstack", "backend", "cloud"]
  metrics: string[],                   // ["Reduced latency by 45%", "Handled 10k DAU"]
  links: {
    github?: string,
    live?: string
  },
  snippets: Array<{
    id: string,
    roleTag: string,                   // e.g. "Backend SDE Intern"
    length: "short" | "medium" | "long" | "custom",
    customWords?: number,
    companyName?: string,
    jobDescription?: string,
    content: string,                   // Generated tailored snippet
    isAiGenerated: boolean,
    createdAt: Date
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.4 `cv_documents` Collection
Stores uploaded resumes, cover letters, and parsed plain text for AI context.

```typescript
{
  _id: ObjectId,
  userId: string,
  name: string,                        // File name
  type: "RESUME" | "COVER_LETTER" | "PORTFOLIO" | "TRANSCRIPT" | "OTHER",
  targetRole?: string,                 // e.g. "Fullstack Developer"
  fileData: BinaryBuffer | string,     // Stored resume binary or base64
  mimeType: string,                    // "application/pdf"
  sizeBytes: number,
  parsedContent?: string,              // Text extracted via pdf-parse
  uploadedAt: Date
}
```

### 5.5 `outreach_campaigns` & `outreach_records` Collections
Drives the AI cold emailing automation module.

**`outreach_campaigns`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  name: string,                        // e.g. "YCombinator Summer 2026 Batch"
  status: "DRAFT" | "GENERATING" | "READY" | "SENDING" | "SENT" | "ARCHIVED",
  totalRecords: number,
  sentCount: number,
  repliedCount: number,
  interviewCount: number,
  attachedCvId?: string,               // Foreign key -> cv_documents._id
  dailyLimit: number,                  // Default 20 emails/day
  delaySeconds: number,                // Default 30s delay between emails
  createdAt: Date,
  updatedAt: Date
}
```

**`outreach_records`:**
```typescript
{
  _id: ObjectId,
  campaignId: string,                  // Foreign key -> outreach_campaigns._id
  userId: string,
  recruiterName: string,
  recruiterEmail: string,
  recruiterRole: string,
  companyName: string,
  companyDescription: string,
  industry: string,
  techStack: string[],
  hiringRequirements: string,
  additionalNotes: string,
  
  // AI Enrichment Output
  companyContext?: {
    companyName: string,
    summary: string,
    industry: string,
    products: string[],
    technologies: string[],
    talkingPoints: string[],
    relevantSkills: string[]
  },
  
  generatedEmail?: string,             // AI synthesized proposal
  emailSubject?: string,
  finalEmail?: string,                 // User edited version
  status: "PENDING" | "DRAFT" | "APPROVED" | "SKIPPED" | "SENDING" | "SENT" | "REPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "FOLLOW_UP_SENT",
  sentAt?: Date,
  error?: string,
  followUpSentAt?: Date
}
```

### 5.6 `day_plans` Collection
Stores the daily timeboxed execution plan and Pomodoro/focus session statistics.

```typescript
{
  _id: ObjectId,
  userId: string,
  date: string,                        // YYYY-MM-DD
  rawInput: string,                    // Raw natural language goals
  availableHours: number,              // e.g. 6.5
  energyLevel: "morning_peak" | "afternoon_peak" | "night_owl" | "balanced",
  intensity: "light" | "balanced" | "crunch",
  selectedStrategyId: string,
  strategyName: string,                // "Deep Work Sprint", etc.
  strategyTagline?: string,
  tasks: Array<{
    id: string,
    title: string,
    category: "study" | "interview_prep" | "application" | "coding" | "break" | "review",
    durationMinutes: number,
    startTime?: string,                // "09:00 AM"
    endTime?: string,                  // "10:30 AM"
    priority: "high" | "medium" | "low",
    completed: boolean,
    completedAt?: string,
    description?: string,
    notes?: string,
    aiTips?: string[]
  }>,
  status: "active" | "completed" | "abandoned",
  focusMinutesLogged: number,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.7 `interviews`, `reminders` & `email_jobs` Collections
Manages calendar events, tasks, and queued asynchronous emails.

**`interviews`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  company: string,
  role: string,
  date: string,                        // YYYY-MM-DD
  time: string,                        // HH:MM
  type: string,                        // "Technical Phone Screen", "System Design", etc.
  location?: string,
  link?: string,                       // Zoom / Google Meet link
  notes?: string,
  status: "UPCOMING" | "COMPLETED" | "CANCELLED",
  opportunityId?: string,
  createdAt: Date
}
```

**`reminders`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  jobId?: string,
  jobTitle?: string,
  company?: string,
  type: "DEADLINE" | "FOLLOWUP" | "INTERVIEW" | "EVENT" | "REGISTRATION" | "TASK" | "CUSTOM",
  dueAt: Date,
  eventDate?: Date,
  registrationDeadline?: Date,
  message: string,
  done: boolean,
  googleCalendarEventId?: string,      // Tracked if synced with Google Calendar
  createdAt: Date
}
```

**`email_jobs`:**
```typescript
{
  _id: ObjectId,
  reminderId: string,
  userId: string,
  userEmail: string,
  sendAt: Date,
  status: "pending" | "sent" | "failed" | "cancelled",
  processedAt?: Date,
  error?: string
}
```

### 5.8 `sheets`, `sheet_items` & `item_progress` Collections
Powers the Problem Solving & Curriculum Engine (`/prep/problem-solving`). Employs a normalized **Strategy B** architecture with sparse user progress for high query efficiency and atomic tracking.

**`sheets`:**
```typescript
{
  _id: ObjectId,
  owner: ObjectId | null,              // null indicates built-in system template (DSA, OS, CN, DBMS, System Design)
  isTemplate: boolean,
  templateKey?: string | null,         // "dsa" | "os" | "cn" | "dbms" | "system-design"
  clonedFrom?: ObjectId | null,
  title: string,                       // e.g. "Blind 75 & Striver SDE Sheet"
  description: string,
  category: "DSA" | "CP" | "OS" | "CN" | "OOPS" | "DBMS" | "Development" | "Company" | "Custom",
  topics: Array<{
    name: string,                      // e.g. "Binary Search", "Dynamic Programming"
    order: number
  }>,
  itemCount: number,                   // Denormalized count of problems
  createdAt: Date,
  updatedAt: Date
}
```

**`sheet_items`:**
```typescript
{
  _id: ObjectId,
  sheet: ObjectId,                     // Foreign key -> sheets._id
  topic: string,                       // Must match one of parent sheet.topics.name
  title: string,                       // e.g. "Two Sum", "LRU Cache"
  difficulty: "Easy" | "Medium" | "Hard" | "N/A",
  platform: "LeetCode" | "GFG" | "CodeChef" | "Codeforces" | "HackerRank" | "InterviewBit" | "Other",
  problemLink?: string,
  articleLink?: string,
  youtubeLink?: string,
  tags: string[],
  order: number,
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: { sheet: 1, topic: 1, title: 1 }
```

**`item_progress` (Sparse User Progress):**
```typescript
{
  _id: ObjectId,
  user: ObjectId,                      // Foreign key -> users._id
  sheet: ObjectId,                     // Foreign key -> sheets._id
  item: ObjectId,                      // Foreign key -> sheet_items._id
  status: "todo" | "done" | "revisit",
  completedAt?: Date | null,
  notes?: string,                      // Personal solution notes or code snippets
  linkedProblem?: ObjectId | null,
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: { user: 1, item: 1 } (Guarantees atomic, idempotent status toggles)
```

### 5.9 `prep_sessions`, `star_stories` & `war_room_dossiers` Collections
Stores AI interview simulation scorecards, behavioral STAR stories, and cached tactical round dossiers.

**`war_room_dossiers`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  company: string,                     // Normalized lowercase
  roundType: string,                   // Normalized lowercase
  role: string,
  cultureNotes: string,
  roundExpectations: string[],
  highYieldTopics: string[],
  reverseQuestions: Array<{
    category: string,
    question: string,
    contextRationale: string
  }>,
  commonPitfalls?: string[],
  suggestedSheetCategory?: string,
  createdAt: Date,
  updatedAt: Date
}
// Unique compound index: { userId: 1, company: 1, roundType: 1 }
```

**`star_stories`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  projectId?: string,                  // Foreign key -> projects._id
  projectTitle: string,
  title: string,                       // Executive title
  archetype: "outage_crisis" | "technical_disagreement" | "tight_deadlines" | "ambiguity_architecture" | "leadership_mentorship" | "custom",
  situation: string,
  task: string,
  action: string,
  result: string,
  metrics: string[],                   // Quantified impact metrics e.g. ["-40% latency", "99.99% uptime"]
  audienceVersions: {
    em: string,                        // Engineering Manager focus (collaboration, timeline, conflict)
    pe: string,                        // Principal Engineer focus (architecture, trade-offs, scale limits)
    pm: string                         // Product Leader focus (user adoption, business metrics, velocity)
  },
  tags: string[],
  bookmarked: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**`prep_sessions`:**
```typescript
{
  _id: ObjectId,
  userId: string,
  projectId: string,
  projectTitle: string,
  persona: "staff" | "lead" | "em",
  status: "active" | "completed",
  messages: Array<{
    id: string,
    role: "assistant" | "user" | "system",
    content: string,
    timestamp: string,
    scorecard?: {
      technicalDepth: number,          // 1-10
      tradeOffAwareness: number,       // 1-10
      communicationComposure: number,  // 1-10
      strengths: string[],
      gaps: string[],
      goldStandardAnswer?: string,
      feedback: string
    }
  }>,
  overallScore?: number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. Core Modules & Engineering Deep-Dive

### 6.1 Authentication, Session Management & Cryptography
HireCompass features a custom JWT implementation (`lib/session.ts`) built with `jose` that supersedes heavy session libraries.
- **Session Tokens**: Tokens are signed using **HS256** with `JWT_SECRET` (validated to be at least 32 characters long).
- **Cookie Security**: Tokens are placed inside an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie named `auth-token` with a 30-day lifespan. Javascript execution cannot inspect this cookie, mitigating XSS token harvesting.
- **Payload Minimization**: Contains only minimal claims: `{ sub: userId, name, email, role }`.
- **Role-Based Guards**: Functions `getSession(request)` and `requireAdmin(request)` provide instant authorization checks across route handlers.

### 6.2 AI Quota, LLM Gateway & Dynamic Encryption Vault
The AI subsystem (`lib/gemini.ts`, `lib/ai-quota.ts`, `lib/crypto.ts`) abstracts model inference across all features.
- **Inference Engine**: Connects via `groq-sdk` to `openai/gpt-oss-120b`, delivering high-speed reasoning with low latency.
- **Two Operating Modes**:
  1. *Structured JSON Output*: `extractJSON<T>(prompt)` instructs the LLM to return strict JSON using `response_format: { type: "json_object" }`. It automatically retries on rate limits (HTTP 429/503) with exponential backoff and message parsing (`parseRetryDelay`).
  2. *Streaming Text*: `streamText(prompt)` returns a standard Web `ReadableStream<Uint8Array>` for chunked live-typing in the browser.
- **Hybrid AI Quota Engine & Usage Tracking**:
  - Unauthenticated users have no access.
  - Standard users receive a free allowance (default: 30 requests, configurable via `FREE_AI_LIMIT`).
  - Administrators and users with `aiAccess: "UNRESTRICTED"` enjoy unlimited platform requests.
  - Standard users can unlock **Bring-Your-Own-Key (BYOK)** by inputting their personal Groq API key (`gsk_...`), bypassing platform quota limits entirely.
  - Usage tracking is centralized through `incrementUserAiUsage(userId, count = 1)` in `lib/ai-quota.ts` (with `recordAiUsage` exported as a backward-compatible alias). Generative features (AI Agent Sweety, Company War Room, The Griller, STAR Story Matrix, and Rejection Remediation) call this method upon successful LLM completion. Static problem-solving sheet operations (viewing sheets, toggling status, adding notes) consume zero AI quota.
- **AES-256-GCM Secret Vault**: User API keys are never stored in plaintext. In `lib/crypto.ts`, keys are encrypted with an initialization vector (`iv`), ciphertext, and authentication tag (`tag`) derived from `ENCRYPTION_SECRET`. Only when the user triggers an AI action is the key temporarily decrypted in memory.

### 6.3 Opportunities Management & Kanban Pipeline
Located in `app/(dashboard)/applications/page.tsx` and `components/features/kanban/`:
- Built with `@dnd-kit/core` and `@dnd-kit/sortable` for silky drag-and-drop state changes across 6 distinct Kanban columns: `Saved`, `Applied`, `OA / Assessment`, `Interview`, `Offer 🎉`, and `Rejected ❌`.
- Supports comprehensive filtering by keyword, priority, platform source, remote-only flags, and employment type.
- Features the **JobDrawer** (`components/features/kanban/job-drawer.tsx`), a sliding modal that enables logging structured interview rounds, OA questions, compensation offers, and custom timelines.

### 6.4 Rejection Intelligence & Drop-off Tracker
Located in `app/(dashboard)/rejected/page.tsx`:
- Most job search tools treat rejection as a dead end. HireCompass transforms it into a diagnostic learning engine.
- Filters applications in the `REJECTED` status and computes a **Funnel Drop-off Analysis** across standardized stages:
  1. Resume Screen / No Shortlist
  2. Online Assessment (OA)
  3. Technical Round 1 (DSA / Problem Solving)
  4. Technical Round 2 (System Architecture / Core Engineering)
  5. Hiring Manager / Behavioral
  6. Post-Interview Headcount Freeze
- Categorizes failure reasons into 11 distinct buckets and prompts the candidate for deep reflection (*What was asked?*, *Where did you fumble?*, *Lessons learned*).
- Provides instant recommendations and prompts the candidate to generate a customized AI learning plan.

### 6.5 AI-Powered Cold Outreach Automation
Located in `app/(dashboard)/outreach/`:
- **Recruiter Ingestion**: Upload recruiter CSV or Excel sheets via `upload/page.tsx`. `papaparse` and `xlsx` normalize disparate header conventions (e.g. "Email", "E-mail", "Recruiter Email") and filter duplicate or invalid addresses.
- **AI Context Enrichment**: `app/api/outreach/extract/route.ts` analyzes company descriptions and tech stacks to synthesize key talking points and skill matches.
- **Hyper-Personalized Email Synthesis**: `app/api/outreach/generate-emails/route.ts` combines recruiter data, company pain points, and the candidate's uploaded CV to compose targeted cold outreach emails.
- **Throttled Dispatch via Nodemailer**: `app/api/outreach/send/route.ts` sends emails directly through the user's configured Gmail SMTP with customizable inter-message delays (default 30 seconds) and daily caps to prevent domain reputation burns.
- **Automatic Opportunity & Follow-up Creation**: Dispatching an outreach email automatically logs a new `APPLIED` entry on the Kanban board and schedules a follow-up reminder 4 days later.

### 6.6 AI Day Planner & Execution Cockpit
Located in `app/(dashboard)/planner/page.tsx` and `components/features/planner/`:
- Eliminates "analysis paralysis" for candidates juggling coding practice, applications, and interview preparation.
- **Intake Flow**: Accepts natural language descriptions of the day's goals, available hours (1 to 14 hrs), energy rhythm (*Morning Peak*, *Afternoon Peak*, *Night Owl*, *Balanced*), and intensity level (*Light*, *Balanced*, *Crunch*).
- **Strategy Synthesis**: Ingests existing interviews and upcoming deadlines to propose 3 distinct scheduling vibes:
  1. *Deep Work Sprint*: Focus blocks dedicated to heavy problem solving and system design.
  2. *Balanced Flow*: Interleaved study, application bursts, and mental recharge breaks.
  3. *Momentum Velocity*: Rapid, low-friction task completion for high-output velocity.
- **Execution Cockpit**: Features an interactive focus timer, Pomodoro counters, task completion checklists, and synthesized audio bell frequencies (`audio-generator.ts`) via the Web Audio API.
- **Mid-Day Reshuffle Engine**: If a candidate runs 30 or 60 minutes late, or experiences unexpected fatigue, the reshuffle modal prompts the AI to reorganize the remaining hours without losing momentum.

### 6.7 Project Vault & Form Kit
Located in `app/(dashboard)/projects/page.tsx` and `app/api/form-kit/route.ts`:
- Maintains master documentation for portfolio repositories, key metrics, and architecture summaries.
- **Snippet Tailor**: Automatically crafts project descriptions tuned for specific role tags (e.g. "Backend SDE Intern" vs. "Fullstack Engineer") across four standard lengths:
  - Short (~50 words)
  - Medium (~150 words)
  - Long (~300 words)
  - Custom word targets
- **Form Kit Scoring Engine**: When applying to a job, Form Kit computes a Jaccard & substring skill overlap score (0–100%) between the opportunity's required skills and the candidate's projects, presenting ready-to-copy snippets to accelerate job portal forms.

### 6.8 ATS Job Scraper & Intelligent Importer
Located in `app/(dashboard)/import/page.tsx` and `lib/job-scraper.ts`:
- Automatically identifies ATS job board URLs:
  - **Greenhouse API**: Fetches structured JSON directly from `boards.greenhouse.io/api/v1/boards/{company}/jobs/{id}`.
  - **Lever API**: Queries `api.lever.co/v0/postings/{company}/{id}`.
  - **Ashby HQ**: Direct JSON queries against `jobs.ashbyhq.com`.
  - **Generic Career Portals**: Parses JSON-LD `<script type="application/ld+json">` metadata schemas with Cheerio.
  - **Unstructured / Raw Text Fallback**: Employs Groq AI to extract structured job titles, locations, compensation ranges, required technologies, and deadlines from raw text blobs.

### 6.9 Autonomous AI Agent ("Sweety")
Located in `components/features/agent/agent-chat.tsx` and `app/api/agent/chat/route.ts`:
- "Sweety" is a full-featured conversational copilot embedded in the dashboard shell.
- Powered by LLM **Tool Calling** (Function Calling) with 15+ executable platform tools:
  - `list_opportunities`, `add_opportunity`, `update_opportunity_status`, `delete_opportunity`
  - `create_reminder`, `list_reminders`, `mark_reminder_done`
  - `create_interview`, `list_interviews`
  - `get_analytics`, `get_ghosted_applications`, `draft_followup_email`
  - `list_projects`, `generate_project_snippet`
  - `list_campaign_hrs`, `preview_hr_email`, `send_hr_email`
  - `scrape_job_url`, `save_groq_api_key`
- Supports two-turn interaction loops: parses user intent, executes database or SMTP side-effects, and returns confirmed state changes to the UI.

### 6.10 Interview Management & Google Calendar Sync
Located in `app/(dashboard)/interviews/page.tsx` and `lib/google-calendar.ts`:
- Tracks upcoming interviews, meeting coordinates, video links (Zoom, Google Meet), and preparation notes.
- **Two-Way Google Calendar Sync**:
  - Implements OAuth2 authorization code flow via `app/api/google-calendar/auth` and `/callback`.
  - Authenticates via Google APIs client and inserts events with customized reminder notification thresholds (24h email, 5m popup).

### 6.11 Notification Subsystem, Email Alerts & Morning Digest
Located in `lib/email.ts` and `app/api/cron/`:
- **Transactional Alert Emails**: Dispatches beautifully styled HTML emails for impending application deadlines, interview reminders, and registration gates.
- **Asynchronous Email Queue**: Background alerts are recorded in `email_jobs` and dispatched in batches by `/api/cron/process-emails` to avoid blocking user interactions.
- **Daily Morning Digest**: `/api/cron/daily-digest` triggers every morning (typically via cron-job.org at 08:00 IST), assembling:
  - Today's pending reminders and deadlines
  - Interviews scheduled within the next 72 hours
  - Applications at risk of ghosting (>14 days without movement)
  - Current Kanban pipeline tally (Applied, Interview, Offer, Rejected)

### 6.12 Administration, Observability & User Management
Located in `app/(dashboard)/admin/page.tsx` and `app/api/admin/`:
- Dedicated portal restricted to users with `role: "admin"`.
- **System Telemetry**: Displays total platform user registrations, cumulative job opportunities tracked, total uploaded resumes, and global AI inference request volumes.
- **User Governance**: Inspect user access modes (`DEFAULT`, `UNRESTRICTED`, `DISABLED`), modify custom AI quota caps, inspect encrypted key presence, or ban compromised accounts.
### 6.13 Problem Solving Prep Ecosystem & Universal Spreadsheet Importer
Located in `app/(dashboard)/prep/problem-solving/`, `lib/csv-import.ts`, and `lib/sheets-db.ts`:
- **Curriculum & Roadmap Engine**:
  - Provides 5 built-in, production-grade templates: *DSA Essentials & Blind 75*, *Operating Systems*, *Computer Networks*, *DBMS & SQL*, and *System Design Core Concepts*.
  - Supports 1-click cloning of templates into user-owned custom sheets, custom sheet creation, topic grouping, inline problem additions, revisit flagging, and personal markdown notes.
- **Normalized Strategy B Architecture with Sparse Progress**:
  - The `sheets` collection stores catalog metadata; `sheet_items` stores problem rows (`order`, `title`, `topic`, `difficulty`, `platform`, `problemLink`, `articleLink`, `youtubeLink`, `tags`).
  - User completion states are persisted sparsely in `item_progress` via atomic compound unique index `{ user, item }`.
  - Detail page `GET /api/sheets/[id]` joins items and progress in a single database roundtrip, grouping items under topic accordions with real-time percentage completion meters.
- **Zero-Failure Smart Spreadsheet Import Engine (`lib/csv-import.ts`)**:
  - **Multi-Format Ingestion**: Ingests `.xlsx`, `.xls`, `.xlsm`, and `.csv` files using `xlsx` (SheetJS) and `papaparse`.
  - **Multi-Worksheet Scanning**: Automatically inspects all sheets in multi-tab workbooks (e.g. Striver, NeetCode) and selects the worksheet with the highest problem row density, bypassing "Readme", "Changelog", or "Instructions" cover sheets.
  - **15+ Synonym Header Mapping**: Tolerant, case-insensitive mapping dictionary supporting every common column naming variation (`Topic`, `Module`, `Pattern`, `Question`, `Problem`, `Task`, `Difficulty`, `Level`, `Platform`, `Site`, `LeetCode URL`, `Link`, `Solution`, `Video`, `Tags`, `Tags / Concepts`).
  - **Content-Based Column Signature Sniffing (`inspectColumnsByContent`)**: If headers are missing, cryptic, or generic (e.g., `Col 1`, `Col 2`, `A`, `B`), parses row data using regex pattern heuristics to identify URL columns, difficulty keywords (`easy`/`med`/`hard`), and title-like strings.
  - **Section-Header & Topic Carry-Forward**: Handles outline-style spreadsheets where topics appear as solitary header rows (e.g., "Two Pointers" on row 1, followed by problem rows). Automatically carries the active topic forward across all subsequent problems until the next section header.
  - **Zero-Drop Title & Platform Recovery**:
    - If a row lacks a title column, infers clean problem titles from URL slugs (e.g., `leetcode.com/problems/trapping-rain-water` -> "Trapping Rain Water").
    - Auto-infers platforms (`LeetCode`, `GeeksforGeeks`, `Codeforces`, `CodeChef`, `HackerRank`, `InterviewBit`) from URL hostnames when the platform column is omitted.
    - Missing topics cleanly default to the sheet title or `"General Problems"` without rejecting the row.
  - **Non-blocking URL Sanitization**: Auto-prefixes missing protocols (`https://`), strips markdown link wrappers (`[Two Sum](url)`), and safely ignores non-URL text notes (`N/A`, `Done`, `-`) without throwing validation errors or dropping items.
  - **AI Schema Alignment Fallback (`alignColumnsWithAi`)**: If heuristic column matching yields 0 valid fields (e.g., in foreign-language or heavily obfuscated sheets), automatically invokes Groq Cloud LLM (`openai/gpt-oss-120b`) to analyze the headers and sample row values, producing an exact JSON field mapping.
  - **Import-Only-Present-Fields Philosophy**: Guaranteed 100% import success rate. If a spreadsheet only contains links or only contains titles and topics, it imports all available data into the sheet gracefully with zero errors.
  - **Duplicate-Tolerant Bulk Insertion**: Leverages MongoDB `ordered: false` insert arrays to gracefully skip duplicate problem rows while inserting hundreds of items in under 2 seconds.
- **Day Planner Linkage (`POST /api/planner/link-task`)**:
  - Candidates can click "Send to Day Planner" on any problem row to instantly schedule a 45-minute coding practice block in their active Day Plan.

### 6.14 Interview Prep Hub & Defense Cockpit
Located in `app/(dashboard)/prep/page.tsx` and `components/features/prep/`:
A unified tactical prep command center designed with high-aesthetic cyber-intelligence styling, keyboard shortcuts (1–5), live defense status indicators, and 5 specialized preparation modules:
1. **Company & Round War Room (`WarRoomTab`)**:
   - Synchronizes with scheduled interviews from `/interviews`.
   - Generates tactical round intelligence using Groq Cloud LLMs: evaluates company culture quirks, round scoring criteria, an interactive high-yield topic checklist with live readiness percentage, and 4 high-signal reverse interview questions with 1-click clipboard copying. Cached in `war_room_dossiers`.
2. **Project Defense Arena ("The Griller") (`GrillerTab`)**:
   - Simulates high-stakes technical defense rounds on the candidate's actual projects from Project Vault (`/projects`).
   - 3 distinct interviewer personas:
     - *Principal / Staff Systems Engineer*: Relentless probing into concurrency, race conditions, failover mechanisms, and 50k+ req/sec scalability limits.
     - *Pragmatic Tech Lead*: Focuses on maintainability, testing strategies, observability, metrics, and incident rollback.
     - *Engineering Manager*: Evaluates trade-offs under deadlines, team leadership, cross-functional alignment, and post-mortems.
   - Dynamic real-time defense scorecards evaluate **Technical Depth (1–10)**, **Trade-Off Awareness (1–10)**, and **Communication & Composure (1–10)** alongside staff critique and gold-standard model answers.
3. **Dynamic STAR Story Matrix (`StarMatrixTab`)**:
   - Synthesizes quantified behavioral STAR stories from project documentation.
   - 1-click audience re-targeting across 3 lenses:
     - *Engineering Manager (EM)*: Team collaboration, timelines, conflict resolution.
     - *Principal Engineer (PE)*: Deep architectural bottlenecks, failure recovery, scale trade-offs.
     - *Product Leader (PM)*: User value, business metrics, delivery velocity.
   - Includes quantified impact badges, 4-stage color-accented cards (Situation, Task, Action, Result), and an integrated 90-second spoken rehearsal teleprompter.
4. **Rejection Remediation Feedback Loop (`RemediationTab`)**:
   - Scans rejected opportunities from `/rejected`, analyzes drop-off stage patterns, and generates targeted anti-pattern recovery drills.
   - Connects identified vulnerability gaps directly to problem-solving sheet topics and enables 1-click scheduling into `/planner`.
5. **15-Minute Pre-Interview Adrenaline Primer (`PrimerTab`)**:
   - High-contrast neuro-adrenaline sprint modal taken 15 minutes before a live interview.
   - Features 4 fast-paced stages: Bug Triage in 60s (concurrency flaw analysis), instant Big-O reflex quizzes with feedback, 2-sentence architectural trade-off justification flash, and a glowing animated 4-4-4-4 Box Breathing visualizer with 3 golden interview anchors.

---

## 7. Comprehensive API Route Matrix

| HTTP Method | Route Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | No | Creates a new user with bcrypt password hashing and default AI quota |
| **POST** | `/api/auth/login` | No | Authenticates credentials and sets `auth-token` HTTP-only cookie |
| **POST** | `/api/auth/logout` | No | Clears the `auth-token` session cookie |
| **GET** | `/api/auth/me` | Yes | Returns current authenticated user profile and AI usage data |
| **PUT** | `/api/auth/profile` | Yes | Updates name, email, or profile metadata |
| **PUT** | `/api/auth/password` | Yes | Verifies current password and updates to new password |
| **GET** | `/api/opportunities` | Yes | Returns all user opportunities with optional status/search filters |
| **POST** | `/api/opportunities` | Yes | Creates a new tracked opportunity |
| **GET** | `/api/opportunities/[id]` | Yes | Fetches single opportunity details including OA and rounds |
| **PUT** | `/api/opportunities/[id]` | Yes | Updates opportunity fields, lifecycle status, or round data |
| **DELETE** | `/api/opportunities/[id]` | Yes | Deletes an opportunity and associated reminders |
| **GET** | `/api/dashboard/stats` | Yes | Calculates pipeline counts, response rate, and scheduled interviews |
| **GET** | `/api/dashboard/activity` | Yes | Returns recent user activities and timeline events |
| **GET** | `/api/analytics` | Yes | Computes recruitment funnel, conversion yields, and weekly velocity |
| **GET** | `/api/analytics/ghosted` | Yes | Identifies applications stuck in Applied/OA for >14 days |
| **POST** | `/api/agent/chat` | Yes | Multi-tool autonomous agent chat loop with function calling |
| **POST** | `/api/ai/match-score` | Yes | Evaluates candidate fit against a job description (0–100%) |
| **POST** | `/api/ai/learning-plan` | Yes | Streams structured markdown learning plan for missing skills |
| **POST** | `/api/ai/generate-snippet` | Yes | Synthesizes tailored project description based on role tag and length |
| **POST** | `/api/ai/generate-email` | Yes | Generates personalized outreach email for a specific company |
| **POST** | `/api/scrape-job` | Yes | Scrapes and extracts structured metadata from any job posting URL |
| **POST** | `/api/import/url` | Yes | Ingests job details from a link into the user's board |
| **POST** | `/api/import/text` | Yes | AI extraction of job details from raw pasted text |
| **POST** | `/api/import/jd` | Yes | Parses full JD and saves to opportunities collection |
| **GET** | `/api/outreach/campaigns` | Yes | Lists all cold outreach campaigns with sent/reply statistics |
| **POST** | `/api/outreach/campaigns` | Yes | Creates a new outreach campaign |
| **GET** | `/api/outreach/campaigns/[id]` | Yes | Returns campaign details and associated recruiter records |
| **DELETE** | `/api/outreach/campaigns/[id]` | Yes | Removes a campaign and its records |
| **POST** | `/api/outreach/extract` | Yes | Parses uploaded recruiter CSV/Excel and extracts contacts |
| **POST** | `/api/outreach/generate-emails`| Yes | Batch synthesizes cold emails for campaign recruiters |
| **POST** | `/api/outreach/send` | Yes | Dispatches queued outreach emails via Gmail SMTP |
| **POST** | `/api/outreach/followup` | Yes | Drafts and sends follow-up outreach email sequence |
| **PUT** | `/api/outreach/records/[id]` | Yes | Updates individual recruiter email content or status |
| **GET** | `/api/outreach/stats` | Yes | Returns aggregate outreach analytics and response rates |
| **GET** | `/api/planner/today` | Yes | Fetches active day plan and user focus statistics |
| **POST** | `/api/planner/generate` | Yes | Generates 3 scheduling strategy options from natural language input |
| **POST** | `/api/planner/reshuffle` | Yes | Reorganizes day plan tasks based on delays or fatigue |
| **POST** | `/api/planner/assist` | Yes | Generates actionable AI tips and guidance for an individual task |
| **GET** | `/api/planner/sync-context` | Yes | Extracts pending interviews and deadlines to merge into day plans |
| **GET** | `/api/projects` | Yes | Lists portfolio projects and their associated snippets |
| **POST** | `/api/projects` | Yes | Creates a portfolio project entry |
| **GET** | `/api/projects/[id]` | Yes | Fetches single project documentation |
| **PUT** | `/api/projects/[id]` | Yes | Updates project description, tech stack, and links |
| **DELETE** | `/api/projects/[id]` | Yes | Deletes a project record |
| **POST** | `/api/projects/[id]/snippets`| Yes | Saves an AI-generated snippet to a project |
| **GET** | `/api/form-kit` | Yes | Ranks projects by skill overlap for an opportunity |
| **GET** | `/api/interviews` | Yes | Lists upcoming and past interviews |
| **POST** | `/api/interviews` | Yes | Schedules an interview and syncs to Google Calendar |
| **PUT** | `/api/interviews/[id]` | Yes | Updates interview time, link, or status |
| **DELETE** | `/api/interviews/[id]` | Yes | Deletes an interview |
| **GET** | `/api/reminders` | Yes | Lists pending and completed reminders |
| **POST** | `/api/reminders` | Yes | Creates a reminder and queues an email alert |
| **PUT** | `/api/reminders/[id]` | Yes | Marks reminder as done or updates due date |
| **DELETE** | `/api/reminders/[id]` | Yes | Deletes a reminder |
| **GET** | `/api/documents` | Yes | Lists uploaded CV documents and parsed text |
| **POST** | `/api/documents` | Yes | Uploads PDF resume and parses text with pdf-parse |
| **DELETE** | `/api/documents/[id]` | Yes | Deletes a stored CV document |
| **GET** | `/api/google-calendar/auth` | Yes | Returns Google OAuth2 authorization URL |
| **GET** | `/api/google-calendar/callback`| No | OAuth2 code exchange callback |
| **POST** | `/api/google-calendar/sync` | Yes | Synchronizes pending interviews to user's Google Calendar |
| **POST** | `/api/settings/ai-key` | Yes | Validates, encrypts (AES-256-GCM), and saves user Groq API key |
| **PUT** | `/api/settings/digest` | Yes | Toggles daily digest email opt-in/opt-out |
| **GET** | `/api/cron/process-emails` | Secret | Processes queued email alerts for reminders |
| **GET** | `/api/cron/daily-digest` | Secret | Generates and sends morning digest emails to all active users |
| **GET** | `/api/admin/stats` | Admin | Returns system-wide user, opportunity, and AI usage metrics |
| **GET** | `/api/admin/users` | Admin | Lists all platform users with AI quota and status |
| **PUT** | `/api/admin/users/[id]` | Admin | Modifies user role, AI limit, or access mode |
| **DELETE** | `/api/admin/users/[id]` | Admin | Deletes a user account and associated data |
| **GET** | `/api/admin/resumes` | Admin | Global list of uploaded resumes |
| **DELETE** | `/api/admin/resumes/[id]` | Admin | Deletes a resume document from storage |
| **GET** | `/api/sheets` | Yes | Lists user custom sheets and curriculum roadmaps with progress counts |
| **POST** | `/api/sheets` | Yes | Creates a new custom problem-solving sheet |
| **GET** | `/api/sheets/templates` | Yes | Returns 5 built-in curriculum templates (DSA, OS, CN, DBMS, System Design) |
| **POST** | `/api/sheets/from-template/[key]` | Yes | Clones a system curriculum template into the user's personal sheets |
| **GET** | `/api/sheets/[id]` | Yes | Fetches sheet metadata, items grouped by topic, and user sparse progress |
| **PUT** | `/api/sheets/[id]` | Yes | Updates sheet title, description, or category (IDOR protected) |
| **DELETE** | `/api/sheets/[id]` | Yes | Cascades deletion of sheet, its items, and user progress records |
| **POST** | `/api/sheets/[id]/items` | Yes | Adds a problem item to a specific topic |
| **PUT** | `/api/sheets/[id]/items/[itemId]` | Yes | Updates problem title, difficulty, platform, or external links |
| **DELETE** | `/api/sheets/[id]/items/[itemId]` | Yes | Deletes an individual problem item and associated progress |
| **POST** | `/api/sheets/[id]/items/[itemId]/progress` | Yes | Atomic upsert of problem status (`todo`, `done`, `revisit`) and notes |
| **DELETE** | `/api/sheets/[id]/topics/[topicName]` | Yes | Removes a topic and deletes all contained problem items |
| **POST** | `/api/sheets/import` | Yes | Universal spreadsheet parser (.xlsx/.csv): auto-creates sheet & inserts items |
| **POST** | `/api/sheets/[id]/import` | Yes | Bulk imports spreadsheet rows into an existing sheet with duplicate tolerance |
| **POST** | `/api/prep/war-room` | Yes | Generates LLM tactical interview dossier with reverse questions (Groq AI) |
| **POST** | `/api/prep/griller` | Yes | Simulates technical project defense round with 3 personas & live scorecards |
| **GET** | `/api/prep/star-matrix` | Yes | Lists user synthesized STAR stories from Project Vault |
| **POST** | `/api/prep/star-matrix` | Yes | Generates behavioral STAR stories with 3-lens audience re-targeting |
| **DELETE** | `/api/prep/star-matrix` | Yes | Deletes a stored STAR story |
| **GET** | `/api/prep/remediation` | Yes | Scans rejected opportunities and generates anti-pattern recovery drills |
| **POST** | `/api/planner/link-task` | Yes | Schedules a problem from a sheet directly into the active Day Plan |

---

## 8. Environment Configuration Reference

Create a `.env` file in the root workspace based on `.env.example`:

```bash
# ── MongoDB Connection URI ───────────────────────────────────────────────────
# Connection string pointing to your local MongoDB instance or MongoDB Atlas cluster.
MONGODB_URI="mongodb://localhost:27017/hirecompass"

# ── JWT Authentication Secret ────────────────────────────────────────────────
# Cryptographically secure random secret (minimum 32 characters) used to sign HS256 tokens.
JWT_SECRET="generate-a-super-secret-jwt-key-at-least-32-characters-long"

# ── Secret Encryption Key (Optional / Recommended) ───────────────────────────
# Used by lib/crypto.ts to encrypt user-provided Groq API keys with AES-256-GCM.
# If omitted, system falls back to hashing JWT_SECRET.
ENCRYPTION_SECRET="generate-a-separate-32-byte-hex-encryption-secret-string"

# ── Gmail SMTP Configuration (Nodemailer) ────────────────────────────────────
# Required for sending cold outreach emails, reminder alerts, and morning digests.
# Note: Use an App Password (Google Account > Security > 2-Step Verification > App Passwords).
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# ── Groq Cloud AI Configuration ──────────────────────────────────────────────
# Get your free API key at: https://console.groq.com/keys
GROQ_API_KEY="gsk_your_groq_api_key_here"
# Default LLM model identifier (supports reasoning models with 128k context)
GROQ_MODEL="openai/gpt-oss-120b"
# Default free AI request allowance per user (default: 30)
FREE_AI_LIMIT=30

# ── Google Calendar OAuth2 Integration ───────────────────────────────────────
# Obtain from Google Cloud Console > APIs & Services > Credentials (OAuth 2.0 Client ID)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google-calendar/callback"

# ── Application Base URL ─────────────────────────────────────────────────────
# Deployed canonical URL used for OAuth redirects and email hyperlinks.
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ── Cron Job Security Secret ─────────────────────────────────────────────────
# Secret token to protect /api/cron/* routes from unauthorized execution.
CRON_SECRET="your-random-cron-secret-token"
```

---

## 9. DevOps, Local Development & Deployment Guide

### 9.1 Local Development Setup

1. **Prerequisites**:
   - Node.js 18.17.0+ or Node.js 20+
   - MongoDB running locally on port 27017 or a MongoDB Atlas connection string.
   - A valid Groq Cloud API key.

2. **Clone and Install**:
   ```bash
   git clone https://github.com/your-username/HireCompass.git
   cd HireCompass
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser. Turbopack hot reloading is enabled by default (`next dev --turbo`).

5. **Lint, Typecheck & Production Build**:
   ```bash
   # Validate ESLint rules
   npm run lint

   # Validate TypeScript types across all App Router routes
   npx tsc --noEmit

   # Generate optimized production bundle (allocated 4GB heap space to support full AST type-checking)
   npm run build
   ```

### 9.2 Production Deployment (Vercel & Self-Hosted)

1. Push your repository to GitHub / GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com) or configure a Node.js production server.
3. Configure Environment Variables in Project Settings matching your `.env`.
4. Ensure `NEXT_PUBLIC_BASE_URL` points to your production domain (e.g. `https://hirecompass.yourdomain.com`).
5. Set `Build Command` to `npm run build` (which runs `node --max-old-space-size=4096 ./node_modules/next/dist/bin/next build` to prevent Node V8 heap limits during production bundling) and `Output Directory` to `.next`.
6. Deploy!

### 9.3 External Cron Scheduling

To enable background reminder dispatch and morning digest emails in serverless environments:
1. Register a free account at [cron-job.org](https://cron-job.org).
2. **Job 1: Email Alert Queue Processor**:
   - **URL**: `https://your-domain.com/api/cron/process-emails`
   - **Schedule**: Every 15 or 30 minutes (`*/30 * * * *`)
   - **HTTP Header**: `Authorization: Bearer <YOUR_CRON_SECRET>`
3. **Job 2: Daily Morning Digest**:
   - **URL**: `https://your-domain.com/api/cron/daily-digest`
   - **Schedule**: Once daily at 08:00 AM IST (02:30 AM UTC) (`30 2 * * *`)
   - **HTTP Header**: `Authorization: Bearer <YOUR_CRON_SECRET>`

---

## 10. Delivered Preparation Ecosystem & Cross-System Synergy

Originally conceived in `tracker.md` as an external DSA tracker, the **Preparation Ecosystem** has been fully designed and integrated into the core HireCompass platform, creating a seamless feedback loop between job hunting, day-to-day preparation, and interview performance:

```mermaid
graph LR
    Opps["/opportunities<br/>(Applications & Interviews)"] -->|Upcoming Rounds| WarRoom["War Room<br/>(/prep)"]
    Rejection["/rejected<br/>(Drop-offs & Failures)"] -->|Identified Gaps| Remediation["Remediation Loop<br/>(/prep)"]
    Projects["/projects<br/>(Project Vault)"] -->|Architecture Data| Griller["The Griller & STAR Matrix<br/>(/prep)"]
    Sheets["Problem Solving Sheets<br/>(/prep/problem-solving)"] -->|1-Click Task Link| Planner["Day Planner Cockpit<br/>(/planner)"]
    Remediation -->|Target Drills| Sheets
    WarRoom -->|High-Yield Topics| Planner
```

### Key Integrations & System Synergies:
1. **Application Pipeline to Tactical War Room (`/interviews` -> `/prep`)**:
   Scheduled technical interviews feed directly into the **War Room**, generating company culture insights, scoring guidelines, and senior reverse questions with zero manual data re-entry.
2. **Rejection Post-Mortems to Targeted Remediation (`/rejected` -> `/prep`)**:
   When candidates log interview drop-offs in the Rejection Tracker, the **Rejection Remediation** engine aggregates failure patterns across rounds and generates anti-pattern practice drills linked directly to problem sheets.
3. **Project Vault to Live Defense Arena (`/projects` -> `/prep`)**:
   Projects logged in the Project Vault serve as the source of truth for **The Griller** (AI Staff Engineer interrogation) and the **Dynamic STAR Story Matrix** (audience-adapted behavioral pitches for EM, PE, PM).
4. **Curriculum Sheets to Day Planner Execution (`/prep/problem-solving` -> `/planner`)**:
   Every problem item across Blind 75, DSA, OS, CN, DBMS, and System Design sheets includes a **"Send to Day Planner"** action (`POST /api/planner/link-task`), booking dedicated 45-minute coding blocks straight into today's schedule.
5. **Universal Spreadsheet Ingestion**:
   Supports dragging and dropping custom curricula or external sheets (`.xlsx`, `.xls`, `.xlsm`, `.csv`) with automatic header discovery and duplicate-tolerant bulk insertion.

---

## 11. Conclusion & Maintenance

HireCompass is built with a resilient architecture separating concerns between client-side reactivity, authenticated server operations, and AI inference. By maintaining strict TypeScript schemas and cryptographic security, it serves as a secure, production-ready foundation for engineering job seekers.
