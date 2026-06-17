import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { extractJSON } from "@/lib/gemini"
import { RecruiterRow } from "@/types/outreach"
import * as XLSX from "xlsx"

// ── POST /api/outreach/extract ─────────────────────────────────────────────────
// Parses uploaded file content (CSV / XLSX / plain text) → AI extracts recruiter rows
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, fileType, columnMapping } = body

    if (!content) {
      return NextResponse.json({ error: "No file content provided" }, { status: 400 })
    }

    let rawRows: Record<string, string>[] = []

    // ── Parse based on file type ──────────────────────────────────────────────
    if (fileType === "xlsx" || fileType === "xls") {
      // content is base64
      const buffer = Buffer.from(content, "base64")
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
    } else if (fileType === "csv") {
      // content is plain text CSV
      const wb = XLSX.read(content, { type: "string" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
    } else {
      // Plain text — let AI extract everything
      rawRows = [{ rawText: content }]
    }

    // ── Apply column mapping if provided ────────────────────────────────────
    const mapped = columnMapping
      ? rawRows.map((row) => {
          const out: Record<string, string> = {}
          for (const [standardField, sourceCol] of Object.entries(columnMapping)) {
            out[standardField] = (row as any)[sourceCol as string] || ""
          }
          return out
        })
      : rawRows

    let records: any[] = []

    // ── Heuristic Extraction for Tabular Data ────────────────────────────────
    if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
      if (columnMapping && Object.keys(columnMapping).length > 0) {
        // Explicit mapping provided by user, skip heuristics
        for (const r of mapped) {
          records.push({
            recruiterName: r.recruiterName || "",
            recruiterEmail: r.recruiterEmail || "",
            recruiterRole: r.recruiterRole || "",
            companyName: r.companyName || "",
            companyDescription: r.companyDescription || "",
            industry: r.industry || "",
            productsServices: r.productsServices || "",
            techStack: r.techStack ? r.techStack.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean) : [],
            hiringRequirements: r.hiringRequirements || "",
            additionalNotes: r.additionalNotes || ""
          })
        }
      } else {
        // It's structured data, use heuristic matching on headers instead of LLM
        for (const r of mapped) {
          const record: any = { techStack: [] }
          for (const [key, val] of Object.entries(r)) {
            if (!val) continue
            const k = key.toLowerCase()
            const v = String(val).trim()

            if (k.includes("email")) {
              record.recruiterEmail = v
            } else if (k.includes("company") || k.includes("organization") || k.includes("employer") || k.includes("account")) {
              record.companyName = v
            } else if ((k.includes("name") || k.includes("contact")) && !k.includes("company") && !record.recruiterName) {
              record.recruiterName = v
            } else if (k.includes("role") || k.includes("title") || k.includes("position")) {
              record.recruiterRole = v
            } else if (k.includes("industry") || k.includes("domain") || k.includes("sector")) {
              record.industry = v
            } else if (k.includes("tech") || k.includes("stack") || k.includes("skills")) {
              record.techStack = v.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
            } else if (k.includes("desc") || k.includes("about") || k.includes("overview")) {
              record.companyDescription = v
            } else if (k.includes("req") || k.includes("qual")) {
              record.hiringRequirements = v
            } else if (k.includes("product") || k.includes("service")) {
              record.productsServices = v
            } else if (k.includes("note") || k.includes("add")) {
              record.additionalNotes = v
            }
          }
          records.push(record)
        }
      }
    } else {
      // ── AI Extraction for Unstructured Text ──────────────────────────────────
      const prompt = `You are a data extraction AI. Extract recruiter and company contact information from the following text data.

Data to extract from:
${JSON.stringify(mapped.slice(0, 150), null, 2)}

Extract an array of recruiter records. For each record, return:
{
  "recruiterName": "string or empty",
  "recruiterEmail": "valid email or empty",
  "recruiterRole": "string or empty",
  "companyName": "string (required, infer from context if needed)",
  "companyDescription": "string or empty",
  "industry": "string or empty",
  "productsServices": "string or empty",
  "techStack": ["array of technologies"],
  "hiringRequirements": "string or empty",
  "additionalNotes": "string or empty"
}

Rules:
- Skip rows with no email AND no company name
- If email is malformed, still include the row but mark recruiterEmail as ""
- Deduplicate by recruiterEmail (keep first occurrence)
- Return max 500 records
- Return ONLY valid JSON: { "records": [...] }`

      const result = await extractJSON<{ records: any[] }>(prompt)
      records = result.records || []
    }

    // ── Post-processing ──────────────────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const seenEmails = new Set<string>()

    const processed: RecruiterRow[] = records.map((r: any, idx: number) => {
      const email = (r.recruiterEmail || "").trim().toLowerCase()
      const emailValid = email.length > 0 && emailRegex.test(email)
      const isDuplicate = email.length > 0 && seenEmails.has(email)
      if (email) seenEmails.add(email)

      return {
        id: `row_${idx}_${Date.now()}`,
        recruiterName: r.recruiterName || "",
        recruiterEmail: email,
        recruiterRole: r.recruiterRole || "",
        companyName: r.companyName || "Unknown Company",
        companyDescription: r.companyDescription || "",
        industry: r.industry || "",
        productsServices: r.productsServices || "",
        techStack: Array.isArray(r.techStack) ? r.techStack : [],
        hiringRequirements: r.hiringRequirements || "",
        additionalNotes: r.additionalNotes || "",
        emailValid,
        isDuplicate,
      }
    })

    // Filter out duplicates and rows with no company
    const valid = processed.filter((r) => r.companyName && r.companyName !== "Unknown Company")
    const invalid = processed.filter((r) => !r.emailValid && !r.recruiterEmail)

    return NextResponse.json({
      records: valid,
      stats: {
        total: processed.length,
        valid: valid.filter((r) => r.emailValid).length,
        duplicates: processed.filter((r) => r.isDuplicate).length,
        missingEmail: processed.filter((r) => !r.emailValid).length,
        skipped: invalid.length,
      },
    })
  } catch (err) {
    console.error("[POST /api/outreach/extract]", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Extraction failed" }, { status: 500 })
  }
}
