# 🧭 HireCompass

<p align="center">
  <strong>The AI-Powered Career Orchestration & Job Hunt Acceleration Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5.4.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MongoDB-6.6-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Groq_Cloud-Fast_Inference-F05A28?style=for-the-badge&logo=fastapi" alt="Groq AI" />
</p>

---

## 📖 Overview

**HireCompass** is a full-stack, AI-augmented career command center designed for modern software engineers. It replaces fragmented spreadsheets, notes, and manual outreach with an end-to-end operational hub that accelerates every phase of your job search: from intelligent ATS web scraping to Kanban pipeline tracking, post-rejection diagnostics, automated recruiter cold emailing, daily timeboxed study plans, and an autonomous conversational AI agent.

> 📚 **Looking for the exhaustive technical reference?**  
> Read the complete architectural blueprint and engineering guide in [PROJECT_DOCUMENTATION.md](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md).

---

## ✨ Key Features

### 📋 Interactive Drag-and-Drop Pipeline
- Built with `@dnd-kit` for fluid Kanban card management across 6 lifecycle stages: `Saved`, `Applied`, `OA / Assessment`, `Interview`, `Offer 🎉`, and `Rejected ❌`.
- Deep interview tracking: record Online Assessment scores, technical rounds, take-homes, and compensation breakdowns.

### 🧠 Rejection Intelligence & Diagnostics
- Transforms rejections into actionable learning opportunities.
- Stage drop-off analytics (Resume Screen, OA, System Design, HR) paired with root cause categorizations and reflection logging to pinpoint growth areas.

### 🤖 Autonomous AI Agent: "Sweety"
- Conversational dashboard copilot equipped with **15+ executable tools** (tool/function calling via Groq Cloud LLMs).
- Add or update opportunities, schedule interviews, create reminders, draft cold outreach emails, scrape jobs from URLs, and inspect analytics purely through natural language.

### ✉️ AI Cold Outreach Automation
- Ingest recruiter contacts via CSV or Excel uploads.
- Automatically analyzes company tech stacks and pain points to synthesize hyper-personalized cold outreach emails.
- Dispatches emails with rate-limiting and delays via Gmail SMTP, automatically creating Kanban entries and 4-day follow-up reminders.

### ⏱️ AI Day Planner & Execution Cockpit
- Enter your daily goals, available hours, and energy curve (*Morning Peak*, *Night Owl*, *Balanced*).
- Generates 3 tailored daily strategies (*Deep Work*, *Balanced Flow*, *Momentum Velocity*) with an integrated focus timer, audio bell cues, and a mid-day reshuffle engine for unexpected schedule interruptions.

### 🛠️ Project Vault & Form Kit
- Store master project documentation and synthesize role-tailored descriptions (Short, Medium, Long, Custom words) in seconds.
- Automatically computes skill overlap match scores (0–100%) against job descriptions to autofill application portals.

### 🔍 Smart ATS Scraping & Ingestion
- Native API integration for **Greenhouse**, **Lever**, and **Ashby HQ** job postings.
- JSON-LD and Cheerio parser fallback for generic corporate portals.
- Raw text AI parser extracting compensation, skills, location, and deadlines from unstructured text.

### 📅 Google Calendar Two-Way Synchronization
- Seamless OAuth2 connection syncing scheduled technical interviews and deadlines straight to Google Calendar with custom alert thresholds.

### 🔐 Enterprise-Grade Security & BYOK Vault
- Custom HS256 JWT sessions stored in secure, `httpOnly` cookies.
- **Bring-Your-Own-Key (BYOK)**: Store personal Groq API keys encrypted at rest using **AES-256-GCM** to unlock unlimited AI requests.

---

## 🏗️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), [next-themes](https://github.com/pacocoursey/next-themes), [Lucide Icons](https://lucide.dev/) |
| **State & Data** | [TanStack React Query](https://tanstack.com/query), [Zustand](https://github.com/pmndrs/zustand), [nuqs](https://nuqs.47ng.com/) |
| **Interactivity** | [@dnd-kit](https://dndkit.com/), [Recharts](https://recharts.org/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Node.js Native Driver) |
| **AI / LLM** | [Groq SDK](https://groq.com/) (`openai/gpt-oss-120b`, 128k context) |
| **Authentication** | [Jose](https://github.com/panva/jose) (HS256 JWT), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Security** | Node.js `crypto` (AES-256-GCM encryption vault) |
| **Email & Calendar** | [Nodemailer](https://nodemailer.com/), [googleapis](https://github.com/googleapis/google-api-nodejs-client) |
| **Parsing** | [pdf-parse](https://www.npmjs.com/package/pdf-parse), [PapaParse](https://www.papaparse.com/), [XLSX](https://sheetjs.com/), [Cheerio](https://cheerio.js.org/) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.
- **Groq API Key**: Obtain a free API key at [console.groq.com/keys](https://console.groq.com/keys).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/HireCompass.git
cd HireCompass
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the essential variables:
```env
MONGODB_URI="mongodb://localhost:27017/hirecompass"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-chars"
GROQ_API_KEY="gsk_your_groq_api_key_here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```
*(Optional: Configure `GMAIL_USER` and `GMAIL_APP_PASSWORD` for email alerts, and Google Cloud credentials for Calendar sync).*

### 3. Start the Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to start using HireCompass.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
HireCompass/
├── app/
│   ├── (auth)/             # Login & Signup interfaces
│   ├── (dashboard)/        # Main dashboard features
│   │   ├── applications/   # Drag-and-drop Kanban pipeline
│   │   ├── opportunities/  # Filterable job inventory
│   │   ├── outreach/       # Cold emailing campaign manager
│   │   ├── planner/        # AI Day Planner & Focus Cockpit
│   │   ├── rejected/       # Rejection intelligence & analytics
│   │   ├── projects/       # Portfolio vault & snippet tailor
│   │   ├── import/         # Smart job URL scraper
│   │   ├── interviews/     # Interview calendar & Google Meet links
│   │   ├── reminders/      # Deadline alerts & reminder calendar
│   │   ├── resumes/        # Resume upload & ATS document storage
│   │   ├── analytics/      # Funnel conversions & ghosting radar
│   │   ├── settings/       # Profile, digest preferences & BYOK vault
│   │   └── admin/          # Admin user management & system telemetry
│   └── api/                # 45+ modular REST endpoints
├── components/
│   ├── features/           # Domain-specific components (Kanban, Agent, Cockpit)
│   ├── layout/             # Shell, sidebar, and navbar
│   └── ui/                 # Reusable atomic UI elements
├── lib/                    # Core utilities (AI, DB, Auth, Crypto, Scraper, Mail)
├── types/                  # Strict TypeScript data contracts
└── PROJECT_DOCUMENTATION.md # Comprehensive engineering blueprint
```

---

## 📜 Documentation Index

For in-depth details, refer to:
- [Complete Architecture & Engineering Blueprint](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md)
- [MongoDB Schema Specifications](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md#5-database-architecture--mongodb-schema-reference)
- [Full API Route Matrix (45+ Endpoints)](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md#7-comprehensive-api-route-matrix)
- [Autonomous Agent ("Sweety") Tool Definitions](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md#69-autonomous-ai-agent-sweety)
- [DevOps, Cron Setup & Deployment Guide](file:///c:/Users/Kunal/Desktop/Projects/HireCompass/PROJECT_DOCUMENTATION.md#9-devops-local-development--deployment-guide)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
