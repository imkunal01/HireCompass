import * as cheerio from "cheerio"
import Groq from "groq-sdk"

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

function getGroqClient(apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.GROQ_API_KEY
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured.")
  }
  return new Groq({ apiKey })
}

export interface ScrapedJobData {
  title: string
  company: string
  location: string
  employmentType: string
  salaryRange: string
  experienceLevel: string
  skillsRequired: string[]
  description: string
  deadline: string
  source: string // Which method was used: "greenhouse_api", "lever_api", "jsonld", "html", "ai_fallback"
}

// ─── ATS URL pattern detection ────────────────────────────────────────────────

function detectATS(url: string): { ats: string; company?: string; jobId?: string } {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const path = u.pathname

    // Greenhouse: boards.greenhouse.io/company/jobs/12345
    if (host.includes("boards.greenhouse.io") || host.includes("job.greenhouse.io")) {
      const match = path.match(/\/([^/]+)\/jobs\/(\d+)/)
      if (match) return { ats: "greenhouse", company: match[1], jobId: match[2] }
    }

    // Lever: jobs.lever.co/company/uuid
    if (host.includes("jobs.lever.co")) {
      const match = path.match(/\/([^/]+)\/([a-f0-9-]{36})/)
      if (match) return { ats: "lever", company: match[1], jobId: match[2] }
    }

    // Ashby: jobs.ashbyhq.com/company/uuid
    if (host.includes("jobs.ashbyhq.com")) {
      const match = path.match(/\/([^/]+)\/([a-f0-9-]{36})/)
      if (match) return { ats: "ashby", company: match[1], jobId: match[2] }
    }

    // Workday: company.wd5.myworkdayjobs.com/...
    if (host.includes("myworkdayjobs.com")) {
      return { ats: "workday" }
    }

    // LinkedIn
    if (host.includes("linkedin.com")) {
      return { ats: "linkedin" }
    }

    // Indeed
    if (host.includes("indeed.com")) {
      return { ats: "indeed" }
    }

    return { ats: "generic" }
  } catch {
    return { ats: "generic" }
  }
}

// ─── Greenhouse Public API ─────────────────────────────────────────────────────

async function scrapeGreenhouse(company: string, jobId: string): Promise<ScrapedJobData | null> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`, {
      headers: { "Accept": "application/json" },
    })
    if (!res.ok) return null
    const job = await res.json()

    const $ = cheerio.load(job.content || "")
    const description = $.text().replace(/\s+/g, " ").trim().slice(0, 2000)

    // Extract location
    const location = job.location?.name || "Not specified"

    // Extract departments / teams
    const dept = job.departments?.[0]?.name || ""

    return {
      title: job.title || "Job Opportunity",
      company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      location,
      employmentType: "Full-time",
      salaryRange: "Not specified",
      experienceLevel: dept ? `${dept} team` : "Mid level",
      skillsRequired: [],
      description,
      deadline: "",
      source: "greenhouse_api",
    }
  } catch (e) {
    console.warn("[Greenhouse API Error]", e)
    return null
  }
}

// ─── Lever Public API ──────────────────────────────────────────────────────────

async function scrapeLever(company: string, jobId: string): Promise<ScrapedJobData | null> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${company}/${jobId}`, {
      headers: { "Accept": "application/json" },
    })
    if (!res.ok) return null
    const job = await res.json()

    // Parse rich text description
    const $ = cheerio.load(job.descriptionBody || job.description || "")
    const description = $.text().replace(/\s+/g, " ").trim().slice(0, 2000)

    // Skills from tags / lists
    const lists = job.lists || []
    const skillsRaw: string[] = []
    for (const list of lists) {
      if (/requirement|skill|qualif|tech/i.test(list.text || "")) {
        const $l = cheerio.load(list.content || "")
        $l("li").each((_: any, el: any) => {
          const txt = $l(el).text().trim()
          if (txt && txt.length < 80) skillsRaw.push(txt)
        })
      }
    }

    return {
      title: job.text || "Job Opportunity",
      company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      location: job.categories?.location || job.country || "Not specified",
      employmentType: job.categories?.commitment || "Full-time",
      salaryRange: job.salaryRange ? `${job.salaryRange.min} – ${job.salaryRange.max}` : "Not specified",
      experienceLevel: job.categories?.experience || "Mid level",
      skillsRequired: skillsRaw.slice(0, 10),
      description,
      deadline: "",
      source: "lever_api",
    }
  } catch (e) {
    console.warn("[Lever API Error]", e)
    return null
  }
}

// ─── Ashby Public API ──────────────────────────────────────────────────────────

async function scrapeAshby(company: string, jobId: string): Promise<ScrapedJobData | null> {
  try {
    const res = await fetch(`https://jobs.ashbyhq.com/api/non-user-graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationName: "ApiJobPosting",
        variables: { organizationHostedJobsPageName: company, jobPostingId: jobId },
        query: `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) {
          jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) {
            title
            locationName
            employmentType
            descriptionHtml
            isRemote
          }
        }`,
      }),
    })
    if (!res.ok) return null
    const body = await res.json()
    const job = body?.data?.jobPosting
    if (!job) return null

    const $ = cheerio.load(job.descriptionHtml || "")
    const description = $.text().replace(/\s+/g, " ").trim().slice(0, 2000)

    return {
      title: job.title || "Job Opportunity",
      company: company.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      location: job.locationName || (job.isRemote ? "Remote" : "Not specified"),
      employmentType: job.employmentType || "Full-time",
      salaryRange: "Not specified",
      experienceLevel: "Mid level",
      skillsRequired: [],
      description,
      deadline: "",
      source: "ashby_api",
    }
  } catch (e) {
    console.warn("[Ashby API Error]", e)
    return null
  }
}

// ─── Generic HTML Fetch + JSON-LD + AI cleanup ───────────────────────────────

async function scrapeGenericPage(rawUrl: string): Promise<ScrapedJobData> {
  const parsedUrl = new URL(rawUrl)
  let pageText = ""
  let jsonLdData: any = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
    })

    clearTimeout(timeout)

    if (response.ok) {
      const html = await response.text()
      const $ = cheerio.load(html)

      // Try JSON-LD first (most reliable)
      $('script[type="application/ld+json"]').each((_: any, elem: any) => {
        try {
          const raw = $(elem).html()
          if (!raw) return
          const json = JSON.parse(raw)
          const posting = json["@type"] === "JobPosting"
            ? json
            : json["@graph"]?.find((g: any) => g["@type"] === "JobPosting")
          if (posting) jsonLdData = posting
        } catch {}
      })

      // If we got JSON-LD, use it directly — most accurate
      if (jsonLdData) {
        const $ = cheerio.load(jsonLdData.description || "")
        const desc = $.text().replace(/\s+/g, " ").trim()

        const skills: string[] = []
        ;(jsonLdData.skills || jsonLdData.qualifications || []).forEach((s: any) => {
          if (typeof s === "string") skills.push(s)
        })

        return {
          title: jsonLdData.title || "Job Opportunity",
          company: typeof jsonLdData.hiringOrganization === "string"
            ? jsonLdData.hiringOrganization
            : jsonLdData.hiringOrganization?.name || parsedUrl.hostname,
          location: typeof jsonLdData.jobLocation === "string"
            ? jsonLdData.jobLocation
            : jsonLdData.jobLocation?.address?.addressLocality || "Not specified",
          employmentType: jsonLdData.employmentType || "Full-time",
          salaryRange: jsonLdData.baseSalary
            ? `${jsonLdData.baseSalary.value?.minValue ?? ""} – ${jsonLdData.baseSalary.value?.maxValue ?? ""}`.trim()
            : "Not specified",
          experienceLevel: jsonLdData.experienceRequirements || "Mid level",
          skillsRequired: skills.slice(0, 10),
          description: desc.slice(0, 2000),
          deadline: jsonLdData.validThrough || "",
          source: "jsonld",
        }
      }

      // Fallback: clean HTML text
      $("script, style, iframe, nav, footer, svg, noscript, header").remove()

      // Try targeting job-specific containers first
      const selectors = [
        "[class*='job-description']",
        "[class*='jobDescription']",
        "[class*='job-detail']",
        "[class*='posting-description']",
        "[class*='description']",
        "main",
        "article",
        "body",
      ]

      for (const sel of selectors) {
        const el = $(sel).first()
        if (el.length) {
          pageText = el.text().replace(/\s+/g, " ").trim()
          if (pageText.length > 300) break
        }
      }

      if (!pageText) {
        pageText = $("body").text().replace(/\s+/g, " ").trim()
      }

      pageText = pageText.slice(0, 8000)
    }
  } catch (fetchErr) {
    console.warn("[Generic Fetch Error]", fetchErr)
  }

  // If we got meaningful HTML text, use AI to structure it
  if (pageText && pageText.length > 200) {
    try {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You extract job posting details from raw webpage text and output ONLY valid JSON. Never guess or make up data that isn't present in the text.",
          },
          {
            role: "user",
            content: `Extract job details from this raw text from ${parsedUrl.hostname}. If a field cannot be found in the text, use "Not specified" or an empty array.

RULES:
- Only use data that exists in the text below
- Do NOT guess salary, company name, or skills not mentioned
- Return ONLY raw JSON, no backticks, no explanation

TEXT:
${pageText}

OUTPUT FORMAT:
{
  "title": "exact job title from text",
  "company": "exact company name from text",
  "location": "exact location from text",
  "employmentType": "Full-time/Part-time/Contract/Internship",
  "salaryRange": "exact salary if mentioned or Not specified",
  "experienceLevel": "Entry/Mid/Senior/Lead or Not specified",
  "skillsRequired": ["only skills explicitly mentioned in text"],
  "description": "2-3 paragraph summary using only text content",
  "deadline": ""
}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      })

      const raw = completion.choices[0]?.message?.content?.trim() || "{}"
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim()
      const result = JSON.parse(cleaned)

      return {
        title: result.title || "Job Opportunity",
        company: result.company || parsedUrl.hostname.replace("www.", "").split(".")[0],
        location: result.location || "Not specified",
        employmentType: result.employmentType || "Full-time",
        salaryRange: result.salaryRange || "Not specified",
        experienceLevel: result.experienceLevel || "Not specified",
        skillsRequired: Array.isArray(result.skillsRequired) ? result.skillsRequired.slice(0, 10) : [],
        description: result.description || "",
        deadline: result.deadline || "",
        source: "html",
      }
    } catch (e) {
      console.warn("[AI Extraction Error]", e)
    }
  }

  // Hard fail — return error marker instead of AI hallucination
  return {
    title: "Could not extract job details",
    company: parsedUrl.hostname.replace("www.", ""),
    location: "Not specified",
    employmentType: "Not specified",
    salaryRange: "Not specified",
    experienceLevel: "Not specified",
    skillsRequired: [],
    description: `This site (${parsedUrl.hostname}) blocks automated access. Please copy-paste the job description manually or try importing it via Sweety AI chat.`,
    deadline: "",
    source: "ai_fallback",
  }
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export async function scrapeJobUrl(
  url: string
): Promise<{ success: boolean; data?: ScrapedJobData; error?: string }> {
  try {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return { success: false, error: "Invalid URL format" }
    }

    const { ats, company, jobId } = detectATS(parsedUrl.toString())

    let data: ScrapedJobData | null = null

    // Try ATS-specific APIs first (most accurate, real data)
    if (ats === "greenhouse" && company && jobId) {
      console.log(`[Scraper] Detected Greenhouse ATS: company=${company}, jobId=${jobId}`)
      data = await scrapeGreenhouse(company, jobId)
    } else if (ats === "lever" && company && jobId) {
      console.log(`[Scraper] Detected Lever ATS: company=${company}, jobId=${jobId}`)
      data = await scrapeLever(company, jobId)
    } else if (ats === "ashby" && company && jobId) {
      console.log(`[Scraper] Detected Ashby ATS: company=${company}, jobId=${jobId}`)
      data = await scrapeAshby(company, jobId)
    }

    // Fall back to generic HTML scraper
    if (!data) {
      if (ats === "linkedin") {
        return {
          success: false,
          error: "LinkedIn blocks automated scraping. Please copy the job title, company, and description from the LinkedIn job page and paste it to Sweety — I'll structure and save it for you!",
        }
      }
      if (ats === "indeed") {
        return {
          success: false,
          error: "Indeed blocks automated scraping. Please copy the job details and paste them here — Sweety will extract and save everything automatically!",
        }
      }
      console.log(`[Scraper] Using generic HTML scraper for ${parsedUrl.hostname}`)
      data = await scrapeGenericPage(parsedUrl.toString())
    }

    // If we got an "ai_fallback" result with no real data, consider it a soft failure
    if (data.source === "ai_fallback") {
      return {
        success: false,
        error: data.description,
      }
    }

    return { success: true, data }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Scraping error"
    return { success: false, error: msg }
  }
}
