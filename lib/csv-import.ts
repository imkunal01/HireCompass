import Papa from "papaparse"
import * as XLSX from "xlsx"
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
}

const VALID_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"]
const VALID_PLATFORMS: Platform[] = [
  "LeetCode",
  "GFG",
  "CodeChef",
  "Codeforces",
  "HackerRank",
  "InterviewBit",
]

function normalizeDifficulty(val: any): Difficulty {
  const clean = String(val || "").trim().toLowerCase()
  const match = VALID_DIFFICULTIES.find((d) => d.toLowerCase() === clean)
  return match || "N/A"
}

function normalizePlatform(val: any): Platform {
  const clean = String(val || "").trim().toLowerCase()
  const match = VALID_PLATFORMS.find((p) => p.toLowerCase() === clean)
  return match || "Other"
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function getRowValue(row: Record<string, any>, candidateKeys: string[]): string {
  // Case-insensitive & whitespace-trimmed matching
  const rowKeys = Object.keys(row)
  for (const candidate of candidateKeys) {
    const cleanCand = candidate.toLowerCase().replace(/[\s_-]+/g, "")
    for (const key of rowKeys) {
      const cleanKey = key.toLowerCase().replace(/[\s_-]+/g, "")
      if (cleanKey === cleanCand) {
        const val = row[key]
        return val != null ? String(val).trim() : ""
      }
    }
  }
  return ""
}

export function parseRowsIntoItems(rows: Array<Record<string, any>>): CsvParseResult {
  const items: ParsedCsvItem[] = []
  const errors: Array<{ line: number; error: string }> = []

  rows.forEach((row, idx) => {
    const line = idx + 2 // +1 header, +1 1-indexed

    const topic = getRowValue(row, ["Topic", "Category", "Section", "Module", "Domain"])
    const title = getRowValue(row, ["Title", "Problem", "Problem Name", "Name", "Question", "Problem Title"])

    if (!topic || !title) {
      // If the row is totally empty, skip silently
      const hasAnyValue = Object.values(row).some((v) => String(v || "").trim().length > 0)
      if (hasAnyValue) {
        errors.push({
          line,
          error: `Missing required ${!topic ? "Topic" : ""}${!topic && !title ? " & " : ""}${!title ? "Title" : ""}`,
        })
      }
      return
    }

    const problemLink = getRowValue(row, ["Problem Link", "Problem URL", "URL", "Link", "LeetCode Link"])
    const articleLink = getRowValue(row, ["Article Link", "Article URL", "Solution Link", "Editorial", "Article"])
    const youtubeLink = getRowValue(row, ["YouTube", "Video", "YouTube Link", "Video Solution", "Video Link"])

    if (!isValidHttpUrl(problemLink)) {
      errors.push({ line, error: "Problem Link must be a valid http:// or https:// URL" })
      return
    }
    if (!isValidHttpUrl(articleLink)) {
      errors.push({ line, error: "Article Link must be a valid http:// or https:// URL" })
      return
    }
    if (!isValidHttpUrl(youtubeLink)) {
      errors.push({ line, error: "YouTube Link must be a valid http:// or https:// URL" })
      return
    }

    const rawTags = getRowValue(row, ["Tags", "Tag", "Concepts", "Pattern", "Patterns", "Keywords"])
    const tags = rawTags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)

    const rawDifficulty = getRowValue(row, ["Difficulty", "Level", "Diff"])
    const rawPlatform = getRowValue(row, ["Platform", "Source", "Site"])

    items.push({
      topic,
      title,
      difficulty: normalizeDifficulty(rawDifficulty),
      platform: normalizePlatform(rawPlatform),
      problemLink,
      articleLink,
      youtubeLink,
      tags,
    })
  })

  return { items, errors }
}

export function parseSheetCsv(csvContent: string): CsvParseResult {
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

  return parseRowsIntoItems(parsed.data)
}

export function parseSpreadsheetBuffer(buffer: Buffer, filename: string): CsvParseResult {
  const lowerName = filename.toLowerCase()
  const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsm") || lowerName.endsWith(".xlsb")

  if (isExcel) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        return { items: [], errors: [{ line: 1, error: "Excel file has no worksheets" }] }
      }
      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" })
      return parseRowsIntoItems(rawData)
    } catch (e: any) {
      return { items: [], errors: [{ line: 1, error: `Failed to read Excel file: ${e.message || "Invalid format"}` }] }
    }
  }

  // Fallback to CSV parser
  const text = buffer.toString("utf-8")
  return parseSheetCsv(text)
}
