import Papa from "papaparse"
import * as XLSX from "xlsx"
import Groq from "groq-sdk"
import { AI_MAX_TOKENS } from "@/lib/ai-security"
import { Difficulty, Platform } from "@/types/sheet"

export interface ParsedCsvItem {
  topic: string
  title: string
  difficulty: Difficulty
  platform: Platform
  problemLink: string
  articleLink: string
  youtubeLink: string
  tags: string[]
}

export interface CsvParseResult {
  items: ParsedCsvItem[]
  errors: Array<{ line: number; error: string }>
  summary?: {
    totalRowsProcessed: number
    detectedFields: string[]
    smartDefaultsApplied: string[]
    usedAiAlignment?: boolean
  }
}

export interface ParseOptions {
  defaultTopic?: string
  sheetTitle?: string
  apiKey?: string
  model?: string
}

const VALID_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"]
const VALID_PLATFORMS: Platform[] = [
  "LeetCode",
  "GFG",
  "CodeChef",
  "Codeforces",
  "HackerRank",
  "InterviewBit",
  "Other",
]

/**
 * Normalizes and cleans URLs.
 * Handles markdown links e.g. [Two Sum](https://...), missing protocol (leetcode.com/...), etc.
 * Returns empty string if not a recognizable URL without failing.
 */
export function cleanAndNormalizeUrl(raw: any): string {
  if (!raw) return ""
  let str = String(raw).trim()

  // Extract from markdown format [Text](url)
  const mdMatch = str.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/i)
  if (mdMatch) {
    str = mdMatch[1]
  }

  // Strip wrapping quotes, brackets, parentheses
  str = str.replace(/^["'`(\[<]+|[>"'`)\]]+$/g, "").trim()
  if (!str) return ""

  // Already standard HTTP(S) URL
  if (/^https?:\/\//i.test(str)) {
    return str
  }

  // Auto-prefix www.
  if (/^www\./i.test(str)) {
    return `https://${str}`
  }

  // Auto-prefix known coding and video domains
  if (
    /^(leetcode\.com|geeksforgeeks\.org|codechef\.com|codeforces\.com|hackerrank\.com|interviewbit\.com|youtube\.com|youtu\.be|github\.com|atcoder\.jp|spoj\.com|lintcode\.com|neetcode\.io)/i.test(
      str
    )
  ) {
    return `https://${str}`
  }

  // If contains a domain-like structure with path (e.g. domain.com/path)
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]+$/i.test(str)) {
    return `https://${str}`
  }

  return ""
}

/**
 * Smartly infers a problem title from a URL path slug.
 * e.g. "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
 *   -> "Longest Substring Without Repeating Characters"
 */
export function slugToTitle(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/").filter(Boolean)
    if (segments.length > 0) {
      // Find segment following 'problems' or 'problem' or 'challenges'
      const probIdx = segments.findIndex((s) => /^(problems?|challenges?)$/i.test(s))
      const slug = probIdx !== -1 && segments[probIdx + 1] ? segments[probIdx + 1] : segments[segments.length - 1]
      if (slug && slug.length > 2 && !/^\d+$/.test(slug)) {
        return slug
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim()
      }
    }
  } catch {
    // ignore
  }
  return ""
}

/**
 * Normalizes difficulty input values to Easy, Medium, Hard, or N/A
 */
export function normalizeDifficulty(val: any): Difficulty {
  const clean = String(val || "").trim().toLowerCase()
  if (!clean || clean === "n/a" || clean === "none" || clean === "null" || clean === "-") return "N/A"

  if (/^(easy|ez|simple|basic|beginner|e|1|school)$/i.test(clean)) return "Easy"
  if (/^(medium|med|mid|intermediate|m|2|medium-hard|med-hard)$/i.test(clean)) return "Medium"
  if (/^(hard|difficult|diff|advanced|expert|h|3|hard-expert)$/i.test(clean)) return "Hard"

  const match = VALID_DIFFICULTIES.find((d) => d.toLowerCase() === clean)
  return match || "N/A"
}

/**
 * Normalizes platform string or infers from URL
 */
export function normalizePlatform(val: any, url?: string): Platform {
  const clean = String(val || "").trim().toLowerCase()

  if (clean.includes("leetcode")) return "LeetCode"
  if (clean.includes("geeksforgeeks") || clean === "gfg") return "GFG"
  if (clean.includes("codechef")) return "CodeChef"
  if (clean.includes("codeforces")) return "Codeforces"
  if (clean.includes("hackerrank")) return "HackerRank"
  if (clean.includes("interviewbit")) return "InterviewBit"

  // Infer from URL if platform is unknown
  if (url) {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes("leetcode.com")) return "LeetCode"
    if (lowerUrl.includes("geeksforgeeks.org")) return "GFG"
    if (lowerUrl.includes("codechef.com")) return "CodeChef"
    if (lowerUrl.includes("codeforces.com")) return "Codeforces"
    if (lowerUrl.includes("hackerrank.com")) return "HackerRank"
    if (lowerUrl.includes("interviewbit.com")) return "InterviewBit"
  }

  const match = VALID_PLATFORMS.find((p) => p.toLowerCase() === clean)
  return match || "Other"
}

// Synonyms dictionary for target fields
const FIELD_SYNONYMS: Record<string, string[]> = {
  topic: [
    "topic", "topics", "category", "categories", "section", "sections", "module", "modules",
    "domain", "domains", "subtopic", "sub-topic", "sub topic", "pattern", "patterns",
    "chapter", "chapters", "unit", "units", "group", "type", "ds", "algo",
    "datastructure", "algorithm", "subject", "area", "theme", "bucket"
  ],
  title: [
    "title", "problem", "problemname", "problemtitle", "problems", "name", "question",
    "questions", "questionname", "task", "tasks", "challenge", "challenges",
    "problemstatement", "statement", "description", "item", "items", "headline",
    "heading", "exercise", "prompt", "problemdescription"
  ],
  problemLink: [
    "problemlink", "problemurl", "problemlinkurl", "leetcodelink", "gfglink",
    "codelink", "solvelink", "link", "url", "practice", "practicelink", "solve",
    "code", "submission", "web", "sitelink", "questionlink", "page", "platformlink"
  ],
  articleLink: [
    "articlelink", "articleurl", "article", "solutionlink", "solutionurl", "solution",
    "solutions", "editorial", "editoriallink", "editorialurl", "notes", "blog",
    "reference", "writeup", "doc", "explanation", "resource", "resources", "read"
  ],
  youtubeLink: [
    "youtube", "video", "yt", "youtubelink", "videolink", "videosolution",
    "walkthrough", "watch", "youtubeurl", "videourl", "videoexplanation"
  ],
  difficulty: [
    "difficulty", "level", "diff", "tier", "complexity", "hardness", "rank", "difflevel"
  ],
  platform: [
    "platform", "source", "site", "website", "judge", "onlinejudge", "oj", "origin", "portal"
  ],
  tags: [
    "tags", "tag", "concepts", "concept", "keywords", "keyword", "topictags",
    "labels", "skills", "topics covered", "topic tags"
  ],
}

function cleanKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Automatically maps raw spreadsheet headers to canonical field keys using synonym heuristics.
 */
export function buildHeaderMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedTargets = new Set<string>()

  for (const header of headers) {
    const cleaned = cleanKey(header)
    if (!cleaned) continue

    for (const [targetField, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (usedTargets.has(targetField)) continue

      if (synonyms.some((syn) => cleanKey(syn) === cleaned)) {
        mapping[header] = targetField
        usedTargets.add(targetField)
        break
      }
    }
  }

  return mapping
}

/**
 * Content-based inspection: If headers are completely ambiguous (e.g. Col 1, Col 2, A, B, C),
 * inspect sample rows to discover which column contains titles, URLs, topics, etc.
 */
export function inspectColumnsByContent(
  rows: Array<Record<string, any>>,
  headers: string[],
  currentMapping: Record<string, string>
): Record<string, string> {
  const mapping = { ...currentMapping }
  const mappedTargets = new Set(Object.values(mapping))

  const sampleRows = rows.slice(0, 15)
  if (sampleRows.length === 0) return mapping

  for (const header of headers) {
    if (mapping[header]) continue // already mapped

    let urlCount = 0
    let youtubeCount = 0
    let diffCount = 0
    let titleLikeCount = 0
    let totalNonEmpty = 0

    for (const row of sampleRows) {
      const val = String(row[header] || "").trim()
      if (!val) continue
      totalNonEmpty++

      if (val.includes("youtube.com") || val.includes("youtu.be")) {
        youtubeCount++
      } else if (
        /^https?:\/\//i.test(val) ||
        /leetcode\.com|geeksforgeeks\.org|codechef|codeforces/i.test(val)
      ) {
        urlCount++
      } else if (/^(easy|medium|hard|ez|med|mid|basic|intermediate|expert)$/i.test(val)) {
        diffCount++
      } else if (
        val.length >= 3 &&
        val.length <= 100 &&
        !/^\d+$/.test(val) &&
        !/^(true|false|yes|no|done|todo)$/i.test(val)
      ) {
        titleLikeCount++
      }
    }

    if (totalNonEmpty === 0) continue

    // Map based on dominant data signature
    if (youtubeCount > 0 && !mappedTargets.has("youtubeLink")) {
      mapping[header] = "youtubeLink"
      mappedTargets.add("youtubeLink")
    } else if (urlCount / totalNonEmpty >= 0.4 && !mappedTargets.has("problemLink")) {
      mapping[header] = "problemLink"
      mappedTargets.add("problemLink")
    } else if (diffCount / totalNonEmpty >= 0.5 && !mappedTargets.has("difficulty")) {
      mapping[header] = "difficulty"
      mappedTargets.add("difficulty")
    } else if (titleLikeCount / totalNonEmpty >= 0.5 && !mappedTargets.has("title")) {
      mapping[header] = "title"
      mappedTargets.add("title")
    }
  }

  return mapping
}

/**
 * Optional AI Schema Alignment: Uses Groq Cloud LLM to detect column roles
 * when headers and values are heavily obfuscated or in another language.
 */
export async function alignColumnsWithAi(
  headers: string[],
  sampleRows: Array<Record<string, any>>,
  apiKey?: string,
  model?: string
): Promise<Record<string, string> | null> {
  if (!apiKey || headers.length === 0 || sampleRows.length === 0) return null

  try {
    const groq = new Groq({ apiKey })
    const prompt = `You are an expert spreadsheet schema analyzer.
Map the provided spreadsheet column headers to standard problem-solving sheet fields.

TARGET FIELDS:
- "topic": Topic / Category / Section (e.g. Arrays, Trees, Dynamic Programming)
- "title": Problem title or name (e.g. Two Sum, Reverse Linked List)
- "difficulty": Easy / Medium / Hard
- "platform": LeetCode / GFG / Codeforces / etc.
- "problemLink": URL to solve the problem
- "articleLink": URL to article, editorial, or solution notes
- "youtubeLink": URL to YouTube video explanation
- "tags": Tags, concepts, patterns, or keywords

SPREADSHEET HEADERS:
${JSON.stringify(headers)}

SAMPLE ROWS (first 3 rows):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

INSTRUCTIONS:
Respond ONLY with a valid JSON object mapping each input header name to one of the target fields (or "ignore").
Example format:
{
  "${headers[0]}": "title",
  "${headers[1] || 'Col 2'}": "problemLink"
}`

    const completion = await groq.chat.completions.create({
      model: model || "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "You output only clean JSON without markdown code blocks." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: AI_MAX_TOKENS.CSV_ALIGN,
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const parsed = JSON.parse(raw)
    const validTargets = new Set([
      "topic",
      "title",
      "difficulty",
      "platform",
      "problemLink",
      "articleLink",
      "youtubeLink",
      "tags",
    ])

    const cleanResult: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && validTargets.has(v)) {
        cleanResult[k] = v
      }
    }

    return Object.keys(cleanResult).length > 0 ? cleanResult : null
  } catch (err) {
    console.warn("[alignColumnsWithAi] AI schema alignment fallback skipped:", err)
    return null
  }
}

/**
 * Universal tolerant row parser that places all fields smartly into the sheet without failure.
 */
export function parseRowsIntoItems(
  rows: Array<Record<string, any>>,
  options?: ParseOptions,
  customMapping?: Record<string, string>
): CsvParseResult {
  const items: ParsedCsvItem[] = []
  const errors: Array<{ line: number; error: string }> = []
  const smartDefaultsApplied: string[] = []

  if (!rows || rows.length === 0) {
    return { items: [], errors: [{ line: 1, error: "Spreadsheet contains no data rows" }] }
  }

  // Collect all unique column headers across rows
  const allHeaders: string[] = []
  const headerSet = new Set<string>()
  for (const r of rows.slice(0, 20)) {
    for (const k of Object.keys(r)) {
      if (!headerSet.has(k)) {
        headerSet.add(k)
        allHeaders.push(k)
      }
    }
  }

  // 1. Build initial mapping via synonym dictionary
  let mapping: Record<string, string> = customMapping || buildHeaderMapping(allHeaders)

  // 2. If title or problem link was not found by header names, inspect cell contents
  if (!Object.values(mapping).includes("title") || !Object.values(mapping).includes("problemLink")) {
    mapping = inspectColumnsByContent(rows, allHeaders, mapping)
  }

  const detectedFields = Object.values(mapping)

  // Fallback initial topic
  let currentTopic = (options?.defaultTopic || options?.sheetTitle || "General Problems").trim()
  if (!detectedFields.includes("topic")) {
    smartDefaultsApplied.push(`Auto-assigned topic '${currentTopic}' (no topic column in source)`)
  }

  rows.forEach((row, idx) => {
    const line = idx + 2 // +1 header, +1 1-indexed

    // Check if row is totally blank
    const rowValues = Object.values(row).map((v) => (v != null ? String(v).trim() : ""))
    const nonBlankValues = rowValues.filter(Boolean)
    if (nonBlankValues.length === 0) {
      return // skip purely blank row silently
    }

    // Check if this row is a "Section / Category Header Row"
    // (Common Excel pattern: row has only 1 value and it's a short section title like "Dynamic Programming")
    if (nonBlankValues.length === 1) {
      const singleVal = nonBlankValues[0]
      if (
        singleVal.length >= 2 &&
        singleVal.length <= 50 &&
        !/^https?:\/\//i.test(singleVal) &&
        !/^(easy|medium|hard)$/i.test(singleVal) &&
        !/^\d+$/.test(singleVal)
      ) {
        currentTopic = singleVal
        return // handled as section header
      }
    }

    // Extract values based on mapping
    let topic = ""
    let title = ""
    let rawDifficulty = ""
    let rawPlatform = ""
    let problemLink = ""
    let articleLink = ""
    let youtubeLink = ""
    const tagValues: string[] = []

    for (const [header, target] of Object.entries(mapping)) {
      const val = row[header] != null ? String(row[header]).trim() : ""
      if (!val) continue

      switch (target) {
        case "topic":
          topic = val
          break
        case "title":
          title = val
          break
        case "difficulty":
          rawDifficulty = val
          break
        case "platform":
          rawPlatform = val
          break
        case "problemLink":
          problemLink = cleanAndNormalizeUrl(val)
          break
        case "articleLink":
          articleLink = cleanAndNormalizeUrl(val)
          break
        case "youtubeLink":
          youtubeLink = cleanAndNormalizeUrl(val)
          break
        case "tags":
          tagValues.push(val)
          break
      }
    }

    // Carry-forward topic if current row has empty topic
    if (topic) {
      currentTopic = topic
    } else {
      topic = currentTopic
    }

    // ── Value-level sniffing for unmapped or missing fields ──
    for (const [key, rawVal] of Object.entries(row)) {
      if (rawVal == null) continue
      const strVal = String(rawVal).trim()
      if (!strVal) continue

      // Check for YouTube links
      if (!youtubeLink && (strVal.includes("youtube.com") || strVal.includes("youtu.be"))) {
        const u = cleanAndNormalizeUrl(strVal)
        if (u) youtubeLink = u
      }
      // Check for Problem links
      else if (
        !problemLink &&
        (/leetcode\.com|geeksforgeeks\.org|codechef\.com|codeforces\.com|hackerrank\.com|interviewbit\.com/i.test(
          strVal
        ) ||
          /\/problems?\/[a-zA-Z0-9_-]+/i.test(strVal))
      ) {
        const u = cleanAndNormalizeUrl(strVal)
        if (u) problemLink = u
      }
      // Check for Article / Editorial links
      else if (!articleLink && /^https?:\/\//i.test(strVal) && strVal !== problemLink && strVal !== youtubeLink) {
        const u = cleanAndNormalizeUrl(strVal)
        if (u) articleLink = u
      }
      // Check for Difficulty
      else if (!rawDifficulty && /^(easy|medium|hard|ez|med|mid|basic|intermediate|expert)$/i.test(strVal)) {
        rawDifficulty = strVal
      }
      // Check for Platform
      else if (
        !rawPlatform &&
        /^(leetcode|gfg|geeksforgeeks|codechef|codeforces|hackerrank|interviewbit)$/i.test(strVal)
      ) {
        rawPlatform = strVal
      }
    }

    // ── Title Resolution (Zero-Drop Guarantee) ──
    if (!title) {
      // 1. If problem link exists, infer title from slug
      if (problemLink) {
        title = slugToTitle(problemLink)
      }

      // 2. If still no title, pick first non-empty string that is not a URL, number, or difficulty
      if (!title) {
        for (const [k, v] of Object.entries(row)) {
          const s = String(v || "").trim()
          if (
            s.length >= 2 &&
            s.length <= 150 &&
            !/^https?:\/\//i.test(s) &&
            !/^\d+$/.test(s) &&
            !/^(easy|medium|hard|n\/a)$/i.test(s) &&
            !/^(true|false|done|todo)$/i.test(s)
          ) {
            title = s
            break
          }
        }
      }

      // 3. Fallback title
      if (!title) {
        title = `Problem ${idx + 1}`
      }
    }

    // Clean up title (remove leading numbering e.g. "1. Two Sum" -> "Two Sum")
    const cleanTitle = title.replace(/^#?\d+[\.\-\)]\s*/, "").trim() || title

    // Determine platform
    const platform = normalizePlatform(rawPlatform, problemLink)

    // Determine difficulty
    const difficulty = normalizeDifficulty(rawDifficulty)

    // Aggregate tags
    const tags = tagValues
      .flatMap((t) => t.split(/[,;|]/))
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !/^https?:\/\//i.test(t))

    items.push({
      topic: topic || "General Problems",
      title: cleanTitle,
      difficulty,
      platform,
      problemLink,
      articleLink,
      youtubeLink,
      tags,
    })
  })

  return {
    items,
    errors,
    summary: {
      totalRowsProcessed: rows.length,
      detectedFields,
      smartDefaultsApplied,
      usedAiAlignment: !!customMapping,
    },
  }
}

/**
 * Universal CSV Parser
 */
export async function parseSheetCsv(csvContent: string, options?: ParseOptions): Promise<CsvParseResult> {
  // Strip BOM if present
  let cleanCsv = csvContent
  if (cleanCsv.charCodeAt(0) === 0xfeff) {
    cleanCsv = cleanCsv.slice(1)
  }

  const parsed = Papa.parse<Record<string, string>>(cleanCsv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, ""),
  })

  const rows = parsed.data || []
  let result = parseRowsIntoItems(rows, options)

  // If fewer than 1 item was extracted and an AI API key is available, run AI Schema Alignment
  if (result.items.length === 0 && rows.length > 0 && options?.apiKey) {
    const headers = Object.keys(rows[0] || {})
    const aiMapping = await alignColumnsWithAi(headers, rows, options.apiKey, options.model)
    if (aiMapping) {
      result = parseRowsIntoItems(rows, options, aiMapping)
    }
  }

  return result
}

/**
 * Universal Spreadsheet Buffer Parser (Excel .xlsx, .xls, .xlsm, .csv)
 */
export async function parseSpreadsheetBuffer(
  buffer: Buffer,
  filename: string,
  options?: ParseOptions
): Promise<CsvParseResult> {
  const lowerName = filename.toLowerCase()
  const isExcel =
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".xlsm") ||
    lowerName.endsWith(".xlsb")

  if (isExcel) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" })
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return { items: [], errors: [{ line: 1, error: "Excel file has no worksheets" }] }
      }

      // Intelligent Worksheet Selection:
      // Pick the worksheet with the most data, bypassing "Instructions" or "Cover" sheets
      let bestSheetName = workbook.SheetNames[0]
      let maxRows = 0

      for (const name of workbook.SheetNames) {
        const ws = workbook.Sheets[name]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
        const lowerSheetName = name.toLowerCase()
        const isInstruction =
          lowerSheetName.includes("readme") ||
          lowerSheetName.includes("instruction") ||
          lowerSheetName.includes("cover") ||
          lowerSheetName.includes("summary")

        if (rows.length > maxRows && (!isInstruction || workbook.SheetNames.length === 1)) {
          maxRows = rows.length
          bestSheetName = name
        }
      }

      const worksheet = workbook.Sheets[bestSheetName]
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" })

      let result = parseRowsIntoItems(rawData, options)

      // AI Fallback if heuristic yielded 0 items
      if (result.items.length === 0 && rawData.length > 0 && options?.apiKey) {
        const headers = Object.keys(rawData[0] || {})
        const aiMapping = await alignColumnsWithAi(headers, rawData, options.apiKey, options.model)
        if (aiMapping) {
          result = parseRowsIntoItems(rawData, options, aiMapping)
        }
      }

      return result
    } catch (e: any) {
      return {
        items: [],
        errors: [{ line: 1, error: `Failed to read Excel file: ${e.message || "Invalid spreadsheet format"}` }],
      }
    }
  }

  // Fallback to CSV parser
  const text = buffer.toString("utf-8")
  return parseSheetCsv(text, options)
}
