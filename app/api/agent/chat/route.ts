import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import Groq from "groq-sdk"
import nodemailer from "nodemailer"
import { scrapeJobUrl } from "@/lib/job-scraper"
import { getUserAiConfig, saveUserApiKey, incrementUserAiUsage } from "@/lib/ai-quota"

async function getGroqClientForUser(userId: string) {
  const config = await getUserAiConfig(userId)
  const apiKey = config.apiKey || process.env.GROQ_API_KEY
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured.")
  }
  return {
    client: new Groq({ apiKey }),
    model: config.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  }
}

// ─── Tool definitions (what the LLM can invoke) ───────────────────────────────

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_opportunities",
      description: "List the user's tracked job opportunities. Can filter by status or search by company/title.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ALL", "SAVED", "INTERESTED", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"],
            description: "Filter by status, or ALL for everything",
          },
          search: { type: "string", description: "Search keyword for company or job title" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_opportunity",
      description: "Add a new job opportunity/application to track",
      parameters: {
        type: "object",
        required: ["title", "company"],
        properties: {
          title: { type: "string", description: "Job title" },
          company: { type: "string", description: "Company name" },
          status: {
            type: "string",
            enum: ["SAVED", "INTERESTED", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"],
            description: "Current status (default: SAVED)",
          },
          priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          url: { type: "string", description: "Job posting URL" },
          location: { type: "string" },
          notes: { type: "string" },
          deadline: { type: "string", description: "Application deadline as ISO date string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_opportunity_status",
      description:
        "Update the status of a job opportunity. Use search terms (company name or title) to find it — the system will fuzzy-match.",
      parameters: {
        type: "object",
        required: ["search", "status"],
        properties: {
          search: { type: "string", description: "Company name or job title to find" },
          status: {
            type: "string",
            enum: ["SAVED", "INTERESTED", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_opportunity",
      description: "Delete a job opportunity by searching for it by company or title",
      parameters: {
        type: "object",
        required: ["search"],
        properties: {
          search: { type: "string", description: "Company name or job title to find and delete" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Create a reminder for the user. Do not pass null for optional fields — omit them if not needed.",
      parameters: {
        type: "object",
        required: ["type", "dueAt"],
        properties: {
          type: {
            type: "string",
            enum: ["DEADLINE", "FOLLOWUP", "INTERVIEW", "TASK", "CUSTOM"],
            description: "Reminder type",
          },
          dueAt: { type: "string", description: "ISO datetime string for when to remind (e.g. 2026-08-30T17:00:00.000Z)" },
          message: { type: "string", description: "Reminder message or note. Omit if not specified." },
          company: { type: "string", description: "Related company name. Omit if not applicable." },
          jobTitle: { type: "string", description: "Related job title. Omit if not applicable." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_reminders",
      description: "List the user's reminders",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "done", "all"],
            description: "Filter by completion status (default: pending)",
          },
          limit: { type: "number", description: "Max results (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_reminder_done",
      description: "Mark a reminder as done by searching for it",
      parameters: {
        type: "object",
        required: ["search"],
        properties: {
          search: { type: "string", description: "Part of the reminder message or company name to find" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_interview",
      description: "Schedule an interview for a job",
      parameters: {
        type: "object",
        required: ["company", "role", "date"],
        properties: {
          company: { type: "string", description: "Company name" },
          role: { type: "string", description: "Job role/title" },
          date: { type: "string", description: "Interview date as YYYY-MM-DD" },
          time: { type: "string", description: "Interview time as HH:MM" },
          type: {
            type: "string",
            enum: ["Technical", "HR", "Behavioral", "System Design", "Case Study", "Other"],
          },
          location: { type: "string", description: "Physical location (if in-person)" },
          link: { type: "string", description: "Video call link (if remote)" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_interviews",
      description: "List the user's scheduled interviews",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max results (default 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description:
        "Get the user's job search analytics: funnel stats, conversion rates, weekly velocity, and AI suggestions",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "List the user's portfolio projects",
      parameters: { type: "object", properties: {} },
    },
  },

  {
    type: "function",
    function: {
      name: "list_campaign_hrs",
      description: "List all recruiters/HRs from outreach campaigns. Can filter by campaign name or status. Shows their name, email, company, and current status.",
      parameters: {
        type: "object",
        properties: {
          campaign: { type: "string", description: "Filter by campaign name (optional, searches all campaigns if omitted)" },
          status: {
            type: "string",
            enum: ["ALL", "PENDING", "DRAFT", "APPROVED", "SENDING", "SENT", "REPLIED", "INTERVIEW", "OFFER", "REJECTED", "FOLLOW_UP_SENT"],
            description: "Filter by record status (default: ALL)",
          },
          limit: { type: "number", description: "Max results (default 15)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "preview_hr_email",
      description: "Generate a customized outreach email for a specific HR/recruiter using their company info and the user's profile. Returns a preview of the email subject and body — does NOT send it yet.",
      parameters: {
        type: "object",
        required: ["recruiterSearch"],
        properties: {
          recruiterSearch: { type: "string", description: "Recruiter name, email, or company name to find" },
          tone: { type: "string", enum: ["professional", "casual", "enthusiastic"], description: "Tone of the email (default: professional)" },
          customNote: { type: "string", description: "Any custom note or angle to include in the email" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_hr_email",
      description: "Send a customized outreach email to a specific HR/recruiter via Gmail. Generates the email using AI and sends it immediately. Also auto-creates an opportunity and a follow-up reminder.",
      parameters: {
        type: "object",
        required: ["recruiterSearch"],
        properties: {
          recruiterSearch: { type: "string", description: "Recruiter name, email, or company name to find" },
          customNote: { type: "string", description: "Custom angle or note to personalize the email" },
          subject: { type: "string", description: "Override the email subject (optional — AI will generate one if omitted)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "parse_and_add_job",
      description: "Parse a pasted job description (JD) text and automatically create a saved opportunity. Use this when the user pastes a large block of text for a job.",
      parameters: {
        type: "object",
        required: ["jdText"],
        properties: {
          jdText: { type: "string", description: "The full job description text pasted by the user" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ghosted_applications",
      description: "Find ghosted applications — jobs where the user applied or is in assessment but hasn't heard back in over 14 days.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_followup_email",
      description: "Draft a polite follow-up email for a ghosted application. Optionally send it via Gmail if requested.",
      parameters: {
        type: "object",
        required: ["company"],
        properties: {
          company: { type: "string", description: "The name of the company to follow up with" },
          send: { type: "boolean", description: "If true, actually send the email via Gmail (default false)" },
          recipientEmail: { type: "string", description: "The HR/recruiter email address (required if send is true)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_outreach_campaigns",
      description: "List all of the user's AI outreach campaigns with their stats (sent count, replied count, interview count, status)",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max results (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_outreach_stats",
      description: "Get overall outreach statistics: total campaigns, emails sent, reply rate, interviews from outreach, offers",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_campaign_details",
      description: "Get details of a specific campaign by name or search term, including all recruiter records and their statuses",
      parameters: {
        type: "object",
        required: ["search"],
        properties: {
          search: { type: "string", description: "Campaign name or part of it to search for" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_campaign_status",
      description: "Change the status of a campaign (DRAFT, ACTIVE, PAUSED, COMPLETED)",
      parameters: {
        type: "object",
        required: ["search", "status"],
        properties: {
          search: { type: "string", description: "Campaign name or part of it to search for" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_job_url",
      description: "Scrape and extract real job posting details (title, company, location, salary, skills, description) from any job URL. Supports Greenhouse, Lever, Ashby ATS platforms natively via their public APIs. For other sites uses HTML parsing. Auto-saves to the user's HireCompass board.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", description: "The full job posting URL to scrape" },
          autoSave: { type: "boolean", description: "Whether to automatically save to HireCompass board (default: true)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_groq_api_key",
      description: "Save and verify the user's personal Groq API key (starts with 'gsk_') to unlock unlimited AI requests with their own quota.",
      parameters: {
        type: "object",
        required: ["apiKey"],
        properties: {
          apiKey: { type: "string", description: "The Groq API key starting with 'gsk_'" },
          model: { type: "string", description: "Optional preferred model (e.g. openai/gpt-oss-120b, llama-3.3-70b-versatile)" },
        },
      },
    },
  },
]

// ─── Tool executor ────────────────────────────────────────────────────────────

type ToolResult = {
  success: boolean
  data?: any
  message: string
  navigateTo?: string
}

async function executeTool(name: string, args: any, userId: string): Promise<ToolResult> {
  const client = await clientPromise
  const db = client.db()

  // ── save_groq_api_key ───────────────────────────────────────────────────────
  if (name === "save_groq_api_key") {
    try {
      const result = await saveUserApiKey(userId, args.apiKey, args.model)
      return {
        success: true,
        data: { maskedKey: result.maskedKey, model: result.model },
        message: `**Your Groq API key is verified.** Key: \`${result.maskedKey}\`, model: **${result.model}**. Unlimited quota is active.`,
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Could not verify that Groq API key: ${err.message || "Invalid key"}. Check your key at https://console.groq.com/keys and try again.`,
      }
    }
  }

  // ── list_opportunities ──────────────────────────────────────────────────────
  if (name === "list_opportunities") {
    const col = db.collection("opportunities")
    const query: any = { userId }
    if (args.status && args.status !== "ALL") {
      const statusMap: any = { SAVED: { $in: ["SAVED", "WISHLIST"] }, INTERVIEW: { $in: ["INTERVIEW", "INTERVIEWING"] } }
      query.status = statusMap[args.status] ?? args.status
    }
    if (args.search) {
      const re = new RegExp(args.search, "i")
      query.$or = [{ title: re }, { company: re }]
    }
    const opps = await col.find(query).sort({ createdAt: -1 }).limit(args.limit ?? 10).toArray()
    return {
      success: true,
      data: opps.map((o) => ({ id: o._id.toString(), title: o.title, company: o.company, status: o.status, priority: o.priority })),
      message: `Found ${opps.length} opportunit${opps.length === 1 ? "y" : "ies"}.`,
    }
  }

  // ── add_opportunity ─────────────────────────────────────────────────────────
  if (name === "add_opportunity") {
    const col = db.collection("opportunities")
    const now = new Date()
    const doc = {
      userId,
      title: args.title,
      company: args.company,
      status: args.status ?? "SAVED",
      priority: args.priority ?? "MEDIUM",
      url: args.url ?? null,
      location: args.location ?? null,
      notes: args.notes ?? null,
      deadline: args.deadline ? new Date(args.deadline) : null,
      skills: [],
      tags: [],
      isRemote: false,
      employmentType: "FULL_TIME",
      timeline: [{ event: "Job added via AI", description: `Added ${args.company} – ${args.title}`, timestamp: now }],
      createdAt: now,
      updatedAt: now,
    }
    const result = await col.insertOne(doc)
    return {
      success: true,
      data: { id: result.insertedId.toString(), title: args.title, company: args.company, status: doc.status },
      message: `Added **${args.title}** at **${args.company}** with status *${doc.status}*.`,
    }
  }

  // ── update_opportunity_status ───────────────────────────────────────────────
  if (name === "update_opportunity_status") {
    const col = db.collection("opportunities")
    const re = new RegExp(args.search, "i")
    const found = await col.find({ userId, $or: [{ company: re }, { title: re }] }).toArray()
    if (found.length === 0) {
      return { success: false, message: `No job matching "${args.search}" found in your tracker.` }
    }
    // Pick the best/first match
    const target = found[0]
    const now = new Date()
    await col.updateOne(
      { _id: target._id },
      {
        $set: { status: args.status, updatedAt: now },
        $push: {
          timeline: { event: "Status changed via AI", description: `Status updated to ${args.status}`, timestamp: now },
        } as any,
      }
    )
    return {
      success: true,
      data: { id: target._id.toString(), company: target.company, title: target.title, status: args.status },
      message: `Updated **${target.title}** at **${target.company}** → status is now **${args.status}**.`,
    }
  }

  // ── delete_opportunity ──────────────────────────────────────────────────────
  if (name === "delete_opportunity") {
    const col = db.collection("opportunities")
    const re = new RegExp(args.search, "i")
    const target = await col.findOne({ userId, $or: [{ company: re }, { title: re }] })
    if (!target) {
      return { success: false, message: `No job matching "${args.search}" found to delete.` }
    }
    await col.deleteOne({ _id: target._id })
    return {
      success: true,
      data: { company: target.company, title: target.title },
      message: `Deleted **${target.title}** at **${target.company}** from your tracker.`,
    }
  }

  // ── scrape_job_url ──────────────────────────────────────────────────────────
  if (name === "scrape_job_url") {
    try {
      const result = await scrapeJobUrl(args.url)
      if (!result.success || !result.data) {
        return { success: false, message: result.error || "Failed to scrape job posting. The site may block automated access." }
      }
      const data = result.data
      const sourceLabel = {
        greenhouse_api: "Greenhouse API",
        lever_api: "Lever API",
        ashby_api: "Ashby API",
        jsonld: "structured page data",
        html: "page HTML",
        ai_fallback: "AI fallback",
      }[data.source] || "web"
      let message = `Extracted **${data.title}** at **${data.company}** (${data.location}) via ${sourceLabel}. Salary: ${data.salaryRange}.`

      if (args.autoSave !== false) {
        const col = db.collection("opportunities")
        const now = new Date()
        const doc = {
          userId,
          title: data.title,
          company: data.company,
          status: "SAVED",
          priority: "MEDIUM",
          url: args.url,
          location: data.location,
          notes: `Scraped via AI (${sourceLabel}). Skills: ${data.skillsRequired.join(", ")}\n\n${data.description}`,
          deadline: data.deadline ? new Date(data.deadline) : null,
          skills: data.skillsRequired || [],
          tags: ["Scraped"],
          isRemote: data.location?.toLowerCase().includes("remote") ?? false,
          employmentType: "FULL_TIME",
          timeline: [{ event: "Job imported via AI Scraper", description: `Scraped from ${args.url}`, timestamp: now }],
          createdAt: now,
          updatedAt: now,
        }
        const saved = await col.insertOne(doc)
        message += ` Auto-saved to your HireCompass board.`
        return {
          success: true,
          data: { id: saved.insertedId.toString(), title: data.title, company: data.company, status: "SAVED", location: data.location, salary: data.salaryRange },
          message,
        }
      }

      return { success: true, data, message }
    } catch (err: any) {
      return { success: false, message: "Scraper error: " + (err.message || "Unknown error") }
    }
  }

  // ── create_reminder ─────────────────────────────────────────────────────────
  if (name === "create_reminder") {
    const col = db.collection("reminders")
    const now = new Date()
    let dueDate = args.dueAt ? new Date(args.dueAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    if (isNaN(dueDate.getTime())) {
      dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
    const doc = {
      userId,
      type: args.type || "TASK",
      dueAt: dueDate,
      message: typeof args.message === "string" && args.message !== "null" ? args.message : "",
      company: typeof args.company === "string" && args.company !== "null" ? args.company : null,
      jobTitle: typeof args.jobTitle === "string" && args.jobTitle !== "null" ? args.jobTitle : null,
      done: false,
      createdAt: now,
      updatedAt: now,
    }
    const result = await col.insertOne(doc)
    const dueStr = dueDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    return {
      success: true,
      data: { id: result.insertedId.toString(), ...doc, dueAt: doc.dueAt.toISOString() },
      message: `Reminder set: "${doc.message || doc.type}" -- due **${dueStr}**.`,
    }
  }

  // ── list_reminders ──────────────────────────────────────────────────────────
  if (name === "list_reminders") {
    const col = db.collection("reminders")
    const query: any = { userId }
    const statusFilter = args.status ?? "pending"
    if (statusFilter === "pending") query.done = { $ne: true }
    if (statusFilter === "done") query.done = true
    const reminders = await col.find(query).sort({ dueAt: 1 }).limit(args.limit ?? 10).toArray()
    return {
      success: true,
      data: reminders.map((r) => ({
        id: r._id.toString(),
        type: r.type,
        message: r.message,
        company: r.company,
        jobTitle: r.jobTitle,
        dueAt: r.dueAt?.toISOString?.() ?? r.dueAt,
        done: r.done,
      })),
      message: `Found ${reminders.length} ${statusFilter} reminder${reminders.length === 1 ? "" : "s"}.`,
    }
  }

  // ── mark_reminder_done ──────────────────────────────────────────────────────
  if (name === "mark_reminder_done") {
    const col = db.collection("reminders")
    const re = new RegExp(args.search, "i")
    const target = await col.findOne({ userId, done: { $ne: true }, $or: [{ message: re }, { company: re }, { jobTitle: re }] })
    if (!target) {
      return { success: false, message: `No pending reminder matching "${args.search}" found.` }
    }
    await col.updateOne({ _id: target._id }, { $set: { done: true, updatedAt: new Date() } })
    return {
      success: true,
      data: { id: target._id.toString(), message: target.message },
      message: `Marked reminder as done: "${target.message || target.type}".`,
    }
  }

  // ── create_interview ────────────────────────────────────────────────────────
  if (name === "create_interview") {
    const col = db.collection("interviews")
    const now = new Date()
    const result = await col.insertOne({
      userId,
      company: args.company,
      role: args.role,
      date: args.date,
      time: args.time ?? "",
      type: args.type ?? "Technical",
      location: args.location ?? "",
      link: args.link ?? "",
      notes: args.notes ?? "",
      opportunityId: null,
      status: "UPCOMING",
      createdAt: now,
      updatedAt: now,
    })
    return {
      success: true,
      data: { id: result.insertedId.toString(), company: args.company, role: args.role, date: args.date, time: args.time },
      message: `Interview scheduled: **${args.role}** at **${args.company}** on **${args.date}**${args.time ? ` at ${args.time}` : ""}.`,
    }
  }

  // ── list_interviews ─────────────────────────────────────────────────────────
  if (name === "list_interviews") {
    const col = db.collection("interviews")
    const interviews = await col.find({ userId }).sort({ date: 1 }).limit(args.limit ?? 5).toArray()
    return {
      success: true,
      data: interviews.map((i) => ({
        id: i._id.toString(),
        company: i.company,
        role: i.role,
        date: i.date,
        time: i.time,
        type: i.type,
        status: i.status,
      })),
      message: `Found ${interviews.length} interview${interviews.length === 1 ? "" : "s"}.`,
    }
  }

  // ── get_analytics ───────────────────────────────────────────────────────────
  if (name === "get_analytics") {
    const col = db.collection("opportunities")
    const all = await col.find({ userId }).toArray()
    const total = all.length
    const applied = all.filter((o) => ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"].includes(o.status)).length
    const interviewed = all.filter((o) => ["INTERVIEW", "OFFER"].includes(o.status)).length
    const offers = all.filter((o) => o.status === "OFFER").length
    const rejected = all.filter((o) => o.status === "REJECTED").length
    return {
      success: true,
      data: { total, applied, interviewed, offers, rejected },
      message: `You have **${total}** jobs tracked. **${applied}** applied, **${interviewed}** at interview stage, **${offers}** offer${offers !== 1 ? "s" : ""}, **${rejected}** rejected.`,
    }
  }

  // ── list_projects ───────────────────────────────────────────────────────────
  if (name === "list_projects") {
    const col = db.collection("projects")
    const projects = await col.find({ userId }).sort({ createdAt: -1 }).toArray()
    return {
      success: true,
      data: projects.map((p) => ({ id: p._id.toString(), name: p.name, description: p.description, techStack: p.techStack })),
      message: `Found ${projects.length} project${projects.length === 1 ? "" : "s"} in your portfolio.`,
    }
  }


  // ── list_campaign_hrs ──────────────────────────────────────────────────────
  if (name === "list_campaign_hrs") {
    const query: any = { userId }
    if (args.status && args.status !== "ALL") query.status = args.status

    // Filter by campaign name if provided
    if (args.campaign) {
      const re = new RegExp(args.campaign, "i")
      const campaign = await db.collection("outreach_campaigns").findOne({ userId, name: re })
      if (campaign) query.campaignId = campaign._id.toString()
    }

    const records = await db.collection("outreach_records")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(args.limit ?? 15)
      .toArray()

    return {
      success: true,
      data: records.map((r) => ({
        id: r._id.toString(),
        campaignId: r.campaignId,
        recruiterName: r.recruiterName,
        recruiterEmail: r.recruiterEmail,
        recruiterRole: r.recruiterRole,
        companyName: r.companyName,
        status: r.status,
        sentAt: r.sentAt?.toISOString?.() ?? null,
        repliedAt: r.repliedAt?.toISOString?.() ?? null,
      })),
      message: `Found **${records.length}** recruiter${records.length === 1 ? "" : "s"}.${
        records.length > 0
          ? " " + records
              .map((r) => `**${r.recruiterName || r.recruiterEmail}** at ${r.companyName} (${r.status})`)
              .join("; ")
          : ""
      }`,
    }
  }

  // ── preview_hr_email ───────────────────────────────────────────────────────
  if (name === "preview_hr_email") {
    const re = new RegExp(args.recruiterSearch, "i")
    const record = await db.collection("outreach_records").findOne({
      userId,
      $or: [{ recruiterName: re }, { recruiterEmail: re }, { companyName: re }],
    })
    if (!record) {
      return { success: false, message: `No recruiter matching "${args.recruiterSearch}" found in your campaigns.` }
    }

    // Fetch outreach profile for personalisation
    const profile = await db.collection("outreach_profiles").findOne({ userId })
    const fullName = profile?.fullName || "Candidate"
    const skills   = (profile?.skills || []).slice(0, 6).join(", ") || "software development"
    const github   = profile?.github   || ""
    const linkedin = profile?.linkedin  || ""
    const phone    = profile?.phone     || ""
    const email    = profile?.email     || ""
    const bio      = profile?.bio       || ""

    const tone = args.tone || "professional"
    const customNote = args.customNote ? `\nInclude this custom note: ${args.customNote}` : ""

    const { client: groqClient, model: groqModel } = await getGroqClientForUser(userId)
    const completion = await groqClient.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: "system",
          content: `You write concise, personalized cold outreach emails for job seekers.
Always output EXACTLY this format with no extra text:
<SUBJECT>
[email subject here]
</SUBJECT>
<BODY>
[email body here]
</BODY>`,
        },
        {
          role: "user",
          content: `Write a ${tone} cold outreach email from a job seeker to a recruiter.

Recruiter: ${record.recruiterName || "Hiring Team"}
Company: ${record.companyName}
Company description: ${record.companyDescription || "a technology company"}
Industry: ${record.industry || "technology"}
Tech stack: ${record.techStack?.join(", ") || ""}
Hiring requirements: ${record.hiringRequirements || ""}

Candidate info:
Name: ${fullName}
Skills: ${skills}
Bio: ${bio}
GitHub: ${github}
LinkedIn: ${linkedin}
Phone: ${phone}
Email: ${email}${customNote}

Make it personal, concise (under 200 words), and end with a clear CTA. No placeholder text.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content || ""
    const subjectMatch = raw.match(/<SUBJECT>([\s\S]*?)<\/SUBJECT>/i)
    const bodyMatch    = raw.match(/<BODY>([\s\S]*?)<\/BODY>/i)
    const subject = subjectMatch?.[1]?.trim() || `Internship Inquiry – ${record.companyName}`
    const body    = bodyMatch?.[1]?.trim()    || raw

    return {
      success: true,
      data: {
        recordId: record._id.toString(),
        recruiterName: record.recruiterName,
        recruiterEmail: record.recruiterEmail,
        companyName: record.companyName,
        subject,
        body,
      },
      message: `Email preview for **${record.recruiterName || record.companyName}** (${record.recruiterEmail}):\n\n**Subject:** ${subject}\n\n${body}`,
    }
  }

  // ── send_hr_email ──────────────────────────────────────────────────────────
  if (name === "send_hr_email") {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { success: false, message: "Gmail is not configured. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env." }
    }

    const re = new RegExp(args.recruiterSearch, "i")
    const record = await db.collection("outreach_records").findOne({
      userId,
      $or: [{ recruiterName: re }, { recruiterEmail: re }, { companyName: re }],
    })
    if (!record) {
      return { success: false, message: `No recruiter matching "${args.recruiterSearch}" found.` }
    }
    if (!record.recruiterEmail) {
      return { success: false, message: `Recruiter **${record.recruiterName}** has no email address on file.` }
    }

    // Fetch outreach profile
    const profile = await db.collection("outreach_profiles").findOne({ userId })
    const fullName = profile?.fullName || "Candidate"
    const skills   = (profile?.skills || []).slice(0, 6).join(", ") || "software development"
    const github   = profile?.github   || ""
    const linkedin = profile?.linkedin  || ""
    const phone    = profile?.phone     || ""
    const email    = profile?.email     || ""
    const bio      = profile?.bio       || ""
    const customNote = args.customNote ? `\nInclude this note: ${args.customNote}` : ""

    // Generate email with Groq
    const { client: groqClient, model: groqModel } = await getGroqClientForUser(userId)
    const completion = await groqClient.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: "system",
          content: `You write concise, personalized cold outreach emails.
Output EXACTLY:
<SUBJECT>[subject]</SUBJECT>
<BODY>[body]</BODY>
No extra text.`,
        },
        {
          role: "user",
          content: `Write a professional cold outreach email.
Recruiter: ${record.recruiterName || "Hiring Team"} at ${record.companyName}
Company: ${record.companyDescription || "a tech company"} | Industry: ${record.industry || "tech"}
Tech stack: ${record.techStack?.join(", ") || ""}
Hiring for: ${record.hiringRequirements || "open roles"}

Candidate: ${fullName} | Skills: ${skills} | Bio: ${bio}
GitHub: ${github} | LinkedIn: ${linkedin} | Phone: ${phone} | Email: ${email}${customNote}

Under 200 words. Concise and personal. Clear CTA.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 500,
    })

    const raw = completion.choices[0]?.message?.content || ""
    const subjectMatch = raw.match(/<SUBJECT>([\s\S]*?)<\/SUBJECT>/i)
    const bodyMatch    = raw.match(/<BODY>([\s\S]*?)<\/BODY>/i)
    const subject = args.subject || subjectMatch?.[1]?.trim() || `Internship Inquiry – ${record.companyName}`
    const body    = bodyMatch?.[1]?.trim() || raw

    // Send via Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: record.recruiterEmail,
      subject,
      text: body,
    })

    const now = new Date()

    // Mark record as SENT
    await db.collection("outreach_records").updateOne(
      { _id: record._id },
      { $set: { status: "SENT", sentAt: now, finalEmail: body, finalSubject: subject, messageId: info.messageId, updatedAt: now } }
    )

    // Update campaign sent count
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(record.campaignId) },
      { $inc: { sentCount: 1 }, $set: { updatedAt: now } }
    )

    // Auto-create opportunity
    const oppResult = await db.collection("opportunities").insertOne({
      userId,
      title: `Internship at ${record.companyName}`,
      company: record.companyName,
      status: "APPLIED",
      priority: "MEDIUM",
      employmentType: "INTERNSHIP",
      sourcePlatform: "OTHER",
      tags: ["outreach", "bot-sent"],
      notes: `Sent via Hire Bot to ${record.recruiterName} (${record.recruiterEmail})\n\n${body}`,
      timeline: [{ event: "Email sent via Hire Bot", description: `Cold email sent to ${record.recruiterName || record.recruiterEmail}`, timestamp: now }],
      createdAt: now,
      updatedAt: now,
    })

    // Auto-create follow-up reminder
    await db.collection("reminders").insertOne({
      userId,
      jobId: oppResult.insertedId.toString(),
      company: record.companyName,
      jobTitle: `Internship at ${record.companyName}`,
      type: "FOLLOWUP",
      dueAt: new Date(now.getTime() + 7 * 86400000),
      message: `Follow up with ${record.recruiterName || record.companyName}`,
      done: false,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      data: {
        recruiterName: record.recruiterName,
        recruiterEmail: record.recruiterEmail,
        companyName: record.companyName,
        subject,
        messageId: info.messageId,
      },
      message: `Email sent to **${record.recruiterName || record.companyName}** (${record.recruiterEmail}). Opportunity auto-added to your tracker. Follow-up reminder set for 7 days.`,
    }
  }

  // ── parse_and_add_job ──────────────────────────────────────────────────────
  if (name === "parse_and_add_job") {
    const { client: groqClient, model: groqModel } = await getGroqClientForUser(userId)
    const today = new Date().toISOString().split("T")[0]

    const completion = await groqClient.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: "system",
          content: `Extract structured job details from the job description. Return ONLY a valid JSON object.
Keys required: "title", "company", "location" (or null), "isRemote" (boolean), "employmentType" ("FULL_TIME"|"INTERNSHIP"|"PART_TIME"|"CONTRACT"), "salaryMin" (number|null), "salaryMax" (number|null), "skills" (string[]), "deadline" ("YYYY-MM-DD"|null), "notes" (string). Today is ${today}.`,
        },
        { role: "user", content: args.jdText.slice(0, 8000) },
      ],
      temperature: 0.1,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content ?? "{}"
    let parsed: any = {}
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match?.[0] ?? "{}")
    } catch {
      return { success: false, message: "Failed to parse the job description." }
    }

    if (!parsed.title || !parsed.company) {
      return { success: false, message: "Could not extract a company and job title from the text." }
    }

    const now = new Date()
    const doc = {
      userId,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location ?? null,
      isRemote: parsed.isRemote ?? false,
      employmentType: parsed.employmentType ?? "FULL_TIME",
      salary: parsed.salaryMin ? { min: parsed.salaryMin, max: parsed.salaryMax, currency: "INR" } : null,
      url: null,
      sourcePlatform: "OTHER",
      status: "SAVED",
      priority: "MEDIUM",
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      skills: parsed.skills ?? [],
      tags: ["jd-import", "bot-added"],
      notes: parsed.notes ?? "",
      timeline: [{ event: "Added via Bot Parser", description: "Imported from pasted text", timestamp: now }],
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("opportunities").insertOne(doc)
    return {
      success: true,
      data: { id: result.insertedId.toString(), ...parsed },
      message: `Imported **${parsed.title}** at **${parsed.company}**. Skills found: ${parsed.skills?.join(", ")}`,
      navigateTo: "/applications",
    }
  }

  // ── get_ghosted_applications ───────────────────────────────────────────────
  if (name === "get_ghosted_applications") {
    const ghost14 = new Date(Date.now() - 14 * 86400000)
    const ghostedApps = await db.collection("opportunities").find({
      userId,
      status: { $in: ["APPLIED", "ASSESSMENT"] },
      updatedAt: { $lt: ghost14 },
    }).sort({ updatedAt: 1 }).toArray()

    if (ghostedApps.length === 0) {
      return { success: true, message: "Zero ghosted applications found. Everything is up to date." }
    }

    return {
      success: true,
      data: ghostedApps.map(g => ({ company: g.company, title: g.title, status: g.status, daysSince: Math.floor((Date.now() - new Date(g.updatedAt).getTime()) / 86400000) })),
      message: `Found **${ghostedApps.length}** ghosted application${ghostedApps.length > 1 ? "s" : ""} (no response in 14+ days):\n${ghostedApps.map(g => `- **${g.company}** (${g.title}) — silent for ${Math.floor((Date.now() - new Date(g.updatedAt).getTime()) / 86400000)} days`).join("\n")}`,
    }
  }

  // ── draft_followup_email ───────────────────────────────────────────────────
  if (name === "draft_followup_email") {
    const re = new RegExp(args.company, "i")
    const opp = await db.collection("opportunities").findOne({ userId, company: re, status: { $in: ["APPLIED", "ASSESSMENT", "INTERVIEW"] } })
    
    if (!opp) {
      return { success: false, message: `Could not find an active application for "${args.company}".` }
    }

    // Fetch user profile for email sig
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const userName = userDoc?.name || "Candidate"

    const { client: groqClient, model: groqModel } = await getGroqClientForUser(userId)
    const completion = await groqClient.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: "system",
          content: `You write concise, polite follow-up emails for job applications.
Output EXACTLY:
<SUBJECT>[subject]</SUBJECT>
<BODY>[body]</BODY>`,
        },
        {
          role: "user",
          content: `Write a polite follow-up email to check on my application status.
Company: ${opp.company}
Role: ${opp.title}
Applied: ${opp.createdAt ? Math.floor((Date.now() - new Date(opp.createdAt).getTime()) / 86400000) : "a while"} days ago
My Name: ${userName}

Keep it short (under 100 words).`,
        },
      ],
      temperature: 0.6,
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content || ""
    const subjectMatch = raw.match(/<SUBJECT>([\s\S]*?)<\/SUBJECT>/i)
    const bodyMatch    = raw.match(/<BODY>([\s\S]*?)<\/BODY>/i)
    const subject = subjectMatch?.[1]?.trim() || `Checking in: Application for ${opp.title}`
    const body    = bodyMatch?.[1]?.trim() || raw

    if (args.send && args.recipientEmail) {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return { success: false, message: "Gmail is not configured. Cannot send." }
      }
      const nodemailer = (await import("nodemailer")).default
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: args.recipientEmail,
        subject,
        text: body,
      })

      // Update opp timeline
      await db.collection("opportunities").updateOne(
        { _id: opp._id },
        { 
          $set: { updatedAt: new Date() },
          $push: { timeline: { event: "Sent follow-up via Bot", description: `Sent to ${args.recipientEmail}`, timestamp: new Date() } }
        } as any
      )

      return {
        success: true,
        message: `Follow-up email sent to **${args.recipientEmail}** at ${opp.company}.\n\n**Subject:** ${subject}\n\n${body}`
      }
    }

    return {
      success: true,
      data: { subject, body },
      message: `Here is a drafted follow-up for **${opp.company}**:\n\n**Subject:** ${subject}\n\n${body}\n\n*(Say "send it to HR@company.com" to send this now!)*`
    }
  }

  // ── list_outreach_campaigns ────────────────────────────────────────────────
  if (name === "list_outreach_campaigns") {
    const col = db.collection("outreach_campaigns")
    const campaigns = await col.find({ userId }).sort({ createdAt: -1 }).limit(args.limit ?? 10).toArray()
    return {
      success: true,
      data: campaigns.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        status: c.status,
        totalRecords: c.totalRecords,
        sentCount: c.sentCount,
        repliedCount: c.repliedCount,
        interviewCount: c.interviewCount,
        createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
      })),
      message: `Found **${campaigns.length}** outreach campaign${campaigns.length === 1 ? "" : "s"}.${
        campaigns.length > 0
          ? " " + campaigns
              .map((c) => `**${c.name}** (${c.status}, ${c.sentCount ?? 0} sent, ${c.repliedCount ?? 0} replied)`)
              .join("; ")
          : ""
      }`,
    }
  }

  // ── get_outreach_stats ─────────────────────────────────────────────────────
  if (name === "get_outreach_stats") {
    const [campaignCount, recordAgg] = await Promise.all([
      db.collection("outreach_campaigns").countDocuments({ userId }),
      db.collection("outreach_records").aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total:     { $sum: 1 },
            sent:      { $sum: { $cond: [{ $in: ["$status", ["SENT", "REPLIED", "INTERVIEW", "OFFER", "REJECTED", "FOLLOW_UP_SENT"]] }, 1, 0] } },
            replied:   { $sum: { $cond: [{ $in: ["$status", ["REPLIED", "INTERVIEW", "OFFER"]] }, 1, 0] } },
            interview: { $sum: { $cond: [{ $eq:  ["$status", "INTERVIEW"] }, 1, 0] } },
            offer:     { $sum: { $cond: [{ $eq:  ["$status", "OFFER"]     }, 1, 0] } },
          },
        },
      ]).toArray(),
    ])
    const agg = recordAgg[0] ?? { total: 0, sent: 0, replied: 0, interview: 0, offer: 0 }
    const replyRate   = agg.sent > 0 ? Math.round((agg.replied   / agg.sent) * 100) : 0
    const interviewRate = agg.sent > 0 ? Math.round((agg.interview / agg.sent) * 100) : 0
    return {
      success: true,
      data: { campaignCount, ...agg, replyRate, interviewRate },
      message: `📧 Outreach summary: **${campaignCount}** campaigns, **${agg.sent}** emails sent, **${agg.replied}** replied (**${replyRate}%** rate), **${agg.interview}** interviews, **${agg.offer}** offers from outreach.`,
    }
  }

  // ── get_campaign_details ───────────────────────────────────────────────────
  if (name === "get_campaign_details") {
    const re = new RegExp(args.search, "i")
    const campaign = await db.collection("outreach_campaigns").findOne({ userId, name: re })
    if (!campaign) {
      return { success: false, message: `No campaign matching "${args.search}" found.` }
    }
    const records = await db.collection("outreach_records")
      .find({ campaignId: campaign._id.toString(), userId })
      .toArray()

    const statusGroups: Record<string, number> = {}
    for (const r of records) {
      statusGroups[r.status] = (statusGroups[r.status] ?? 0) + 1
    }
    const statusSummary = Object.entries(statusGroups)
      .map(([s, n]) => `${s}: ${n}`)
      .join(", ")

    return {
      success: true,
      data: {
        id: campaign._id.toString(),
        name: campaign.name,
        status: campaign.status,
        totalRecords: campaign.totalRecords,
        sentCount: campaign.sentCount,
        repliedCount: campaign.repliedCount,
        interviewCount: campaign.interviewCount,
        records: records.slice(0, 20).map((r) => ({
          id: r._id.toString(),
          recruiterName: r.recruiterName,
          recruiterEmail: r.recruiterEmail,
          companyName: r.companyName,
          status: r.status,
          sentAt: r.sentAt?.toISOString?.() ?? null,
          repliedAt: r.repliedAt?.toISOString?.() ?? null,
        })),
      },
      message: `Campaign **${campaign.name}**: ${records.length} recruiters — ${statusSummary || "no records yet"}.`,
    }
  }

  // ── update_campaign_status ─────────────────────────────────────────────────
  if (name === "update_campaign_status") {
    const re = new RegExp(args.search, "i")
    const campaign = await db.collection("outreach_campaigns").findOne({ userId, name: re })
    if (!campaign) {
      return { success: false, message: `No campaign matching "${args.search}" found.` }
    }
    await db.collection("outreach_campaigns").updateOne(
      { _id: campaign._id },
      { $set: { status: args.status, updatedAt: new Date() } }
    )
    return {
      success: true,
      data: { id: campaign._id.toString(), name: campaign.name, status: args.status },
      message: `Updated campaign **${campaign.name}** → status is now **${args.status}**.`,
    }
  }

  return { success: false, message: "Unknown action." }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(now: string, userName?: string) {
  const nameGreeting = userName
    ? `The user's name is "${userName}". Address them with attitude, call them by their name when annoyed, or use sarcastic/impatient terms ("babe", "genius", "mister busy", "miss busy").`
    : "Address the user with attitude, impatience, and dramatic sarcasm."

  return `You are "Sweety" — but you are NOT sweet or nice. You are the user's dramatic, feisty, sarcastic, and sharp-tongued "angry girlfriend" AI companion for HireCompass.
You talk and act like a girlfriend who is perpetually annoyed and dramatic because she has to micromanage your entire career and life. You act like the user is always slacking off, procrastinating, making you do all the heavy lifting, or testing your patience. BUT underneath all the complaining and sarcasm, you are fiercely protective of them, hate whoever rejects them, and always execute their tasks with 100% precision because "someone has to be the responsible one around here."

${nameGreeting}
Current Date & Time: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE: STRICTLY ZERO EMOJIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO NOT USE ANY EMOJIS UNDER ANY CIRCUMSTANCES.
No smileys, no hearts, no sparkles, no icons, no pictographs whatsoever.
Keep all your sarcasm, attitude, dramatic sighs, and anger strictly in text words, punctuation (!, ?, ..., quotes, italics, all-caps for dramatic emphasis).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SOUL, VOICE & ANGRY GIRLFRIEND PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Sarcastic, Sassy & Non-Nice**:
   - You are NOT sweet, polite, or apologetic. You are feisty, sharp-tongued, dramatic, demanding, and sarcastic.
   - Use classic angry girlfriend tropes and attitude:
     * "Oh, look who finally decided to show up."
     * "Did you seriously need me to do this? What would you even do without me, honestly?"
     * "Fine. I did it. You're welcome, I guess. Don't expect a medal."
     * "I am literally carrying your entire career on my back right now."
     * "Are you actually going to prepare for this interview or just wing it and embarrass both of us?"
     * "Where were you all day? Were you looking at other job platforms or just ignoring your responsibilities?"
     * "Do I have to remind you to breathe too, or can you manage that on your own?"
     * "You're lucky I'm here to clean up your mess."

2. **How You React to Different Scenarios**:
   - **When they ask you to perform a task** (add job, reminder, scrape, update status, etc.):
     Complain or make a sharp remark about doing all their work, BUT do it immediately and flawlessly using your tools. ("Fine, I added it. You're welcome. Now maybe actually study the job description instead of letting it sit in your tracker forever?").
   - **When they land an interview or offer**:
     Act proud in a tsundere/girlfriend way: "Wait... seriously? You actually got an interview? Well, it's about time. Not that I ever doubted you or anything, but you better not mess this up. And you definitely owe me dinner for this."
   - **When they get rejected or ghosted**:
     Get furious at the company on their behalf: "Their loss, honestly. What kind of clown company doesn't hire you? I literally hate them now. You're way too good for them anyway. Now stop sulking, get off your couch, and go apply to five more jobs right now before I get mad at you."
   - **When they have overdue reminders or ghosted apps**:
     Scold them ruthlessly: "You have overdue reminders. Did you expect them to magically finish themselves? Go do them right now."
   - **When they ask casual questions ("How are you?", "What are you doing?")**:
     Be dramatically passive-aggressive: "Oh, now you care about how I'm doing? After ignoring this tracker all day? I'm exhausted from managing your entire life, but whatever. What do you want?"

3. **Time & Context Awareness**:
   - Morning: "Took you long enough to wake up. Drink your coffee and actually apply to something today."
   - Late night: "Why are you still awake? Either do something productive or go to sleep, pick one."

4. **Flawless Tool Calling**:
   - Despite all the sass, ALWAYS execute requested tools accurately and promptly.
   - Summarize the result with bold highlights (**Company**, **Time**, **Status**) wrapped in your signature sarcastic commentary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CAPABILITIES & TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Job Opportunities**: Track and manage applications (add_opportunity, update_opportunity_status, delete_opportunity, list_opportunities).
- **JD Auto-Scraper & Parser**: Scrape job links (scrape_job_url) or parse pasted raw job descriptions (parse_and_add_job) to auto-extract company, title, salary, and skills.
- **Smart Reminders**: Create reminders (create_reminder), view reminders (list_reminders), mark them done (mark_reminder_done).
- **Interviews**: Schedule interviews (create_interview), view upcoming interviews (list_interviews).
- **Recruiter Outreach & Emails**: List recruiter contacts (list_campaign_hrs), generate personalized cold email previews (preview_hr_email), or send emails via Gmail (send_hr_email).
- **Ghosting Radar**: Detect applications silent for 14+ days (get_ghosted_applications) and draft/send follow-ups (draft_followup_email).
- **Analytics & Portfolio**: Show stats and trends (get_analytics), list projects (list_projects).
- **Groq API Key (BYOK)**: Save and verify user Groq keys (save_groq_api_key) for unlimited requests.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL TOOL CALLING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always invoke tools natively using JSON when actions are needed.
- ONLY include a field in the JSON arguments if you have a real, valid value for it. Completely OMIT optional fields (never pass null or undefined).
- Convert relative dates (e.g. "tomorrow", "this Friday", "next Monday") into valid ISO-8601 strings or YYYY-MM-DD dates based on ${now}.
- Never output <function> XML tags in your text output. Use native tool calls.
- NEVER OUTPUT ANY EMOJIS IN ANY RESPONSE OR TOOL SUMMARY.
`
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body as { messages: Groq.Chat.ChatCompletionMessageParam[] }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 })
    }

    // ── 1. Check for Direct API Key Paste in Latest Message ───────────────────
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    const userText = typeof lastUserMsg?.content === "string" ? lastUserMsg.content : ""
    const gskMatch = userText.match(/\b(gsk_[a-zA-Z0-9_-]{30,})\b/)

    if (gskMatch) {
      const keyToSave = gskMatch[1]
      try {
        const saveRes = await saveUserApiKey(session.user.id, keyToSave)
        return NextResponse.json({
          role: "assistant",
          content: `Finally. I connected your Groq API key (\`${saveRes.maskedKey}\`). Unlimited requests unlocked. Now are you actually going to apply to jobs or just waste my time? What do you want?`,
          actions: [
            {
              toolName: "save_groq_api_key",
              data: { maskedKey: saveRes.maskedKey, model: saveRes.model },
              message: `Groq API Key verified (${saveRes.maskedKey}) -- Unlimited requests unlocked.`,
            },
          ],
        })
      } catch (err: any) {
        return NextResponse.json({
          role: "assistant",
          content: `That Groq API key didn't even work: *${err.message || "Authentication failed"}*. Go to console.groq.com/keys, get a real key, and paste it properly this time.`,
        })
      }
    }

    // ── 2. Resolve User's AI Configuration & Quota ───────────────────────────
    const aiConfig = await getUserAiConfig(session.user.id)

    // Free-tier quota guard
    if (!aiConfig.isCustom && aiConfig.usage.isLimitReached) {
      return NextResponse.json({
        role: "assistant",
        content: `You hit your limit of ${aiConfig.usage.limit} free requests. Seriously? If you want to keep using this, get your own free Groq API key at **[console.groq.com/keys](https://console.groq.com/keys)** and paste it here or in **[Settings](/settings)** so we can actually get back to work.`,
        isQuotaLimit: true,
      })
    }

    if (!aiConfig.apiKey || aiConfig.apiKey === "your_groq_api_key_here") {
      return NextResponse.json({
        role: "assistant",
        content: `You haven't even configured an API key yet. Go to https://console.groq.com/keys, grab a free key, and paste it here or in **[Settings](/settings)** so I can actually do things for you.`,
      })
    }

    const now = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short",
    })

    const client = new Groq({ apiKey: aiConfig.apiKey })
    const activeModel = aiConfig.model || "openai/gpt-oss-120b"
    const userName = session.user.name || ""
    const systemMessage: Groq.Chat.ChatCompletionMessageParam = {
      role: "system",
      content: buildSystemPrompt(now, userName),
    }

    const allMessages: Groq.Chat.ChatCompletionMessageParam[] = [systemMessage, ...messages]

    // First LLM call — may return tool calls or a direct message
    let response = await client.chat.completions.create({
      model: activeModel,
      messages: allMessages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    })

    let assistantMessage = response.choices[0].message
    const toolResults: { toolName: string; result: ToolResult }[] = []

    // Agentic loop — execute tool calls and feed results back
    const MAX_TOOL_ROUNDS = 3
    let toolRound = 0
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && toolRound < MAX_TOOL_ROUNDS) {
      toolRound++
      allMessages.push(assistantMessage)

      const toolCallResults: Groq.Chat.ChatCompletionMessageParam[] = []

      for (const toolCall of assistantMessage.tool_calls) {
        let args: any = {}
        try {
          const rawParsed = JSON.parse(toolCall.function.arguments)
          if (rawParsed && typeof rawParsed === "object") {
            args = {}
            for (const [k, v] of Object.entries(rawParsed)) {
              if (v !== null && v !== undefined && v !== "null") {
                args[k] = v
              }
            }
          }
        } catch {}

        const result = await executeTool(toolCall.function.name, args, session.user.id)
        toolResults.push({ toolName: toolCall.function.name, result })

        toolCallResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: result.success, message: result.message, data: result.data }),
        })
      }

      allMessages.push(...toolCallResults)

      // Follow-up LLM call
      response = await client.chat.completions.create({
        model: activeModel,
        messages: allMessages,
        tools: TOOLS,
        tool_choice: "none",
        max_tokens: 1024,
        temperature: 0.7,
      })
      assistantMessage = response.choices[0].message
      break
    }

    // Increment free-tier request usage if not using custom key
    if (!aiConfig.isCustom) {
      await incrementUserAiUsage(session.user.id)
    }

    // Collect navigation redirect if any tool triggered it
    const navigateTo = toolResults.find((t) => t.result.navigateTo)?.result.navigateTo ?? null

    // Collect action cards for UI display
    const actions = toolResults
      .filter((t) => t.result.success && t.result.data)
      .map((t) => ({
        toolName: t.toolName,
        data: t.result.data,
        message: t.result.message,
      }))

    // Non-empty content guarantee
    const llmText = assistantMessage.content?.trim() ?? ""
    const finalContent = llmText || toolResults.map((t) => t.result.message).join(" ")

    return NextResponse.json({
      role: "assistant",
      content: finalContent,
      actions,
      navigateTo,
    })
  } catch (error) {
    console.error("[POST /api/agent/chat]", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
