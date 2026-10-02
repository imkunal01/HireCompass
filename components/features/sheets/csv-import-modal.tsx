"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  ArrowRight,
  FolderPlus,
  FileCode,
  FileCheck,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SheetCategory } from "@/types/sheet"

interface CsvImportModalProps {
  sheetId?: string
  sheetTitle?: string
  availableSheets?: Array<{ _id: string; title: string; category?: string }>
  isOpen: boolean
  onClose: () => void
  onSuccess?: (sheetId?: string) => void
}

const SAMPLE_CSV = `Topic,Title,Difficulty,Platform,Problem Link,Article Link,YouTube,Tags
Arrays,Two Sum,Easy,LeetCode,https://leetcode.com/problems/two-sum/,,,hashing;array
Arrays,Maximum Subarray,Medium,LeetCode,https://leetcode.com/problems/maximum-subarray/,,,dp;kadane
Binary Search,Search in Rotated Sorted Array,Medium,LeetCode,https://leetcode.com/problems/search-in-rotated-sorted-array/,,,binary-search
Dynamic Programming,Climbing Stairs,Easy,LeetCode,https://leetcode.com/problems/climbing-stairs/,,,dp;fibonacci
Trees,Invert Binary Tree,Easy,LeetCode,https://leetcode.com/problems/invert-binary-tree/,,,tree;dfs
`

const SAMPLE_ROWS = [
  ["Topic", "Title", "Difficulty", "Platform", "Problem Link", "Article Link", "YouTube", "Tags"],
  ["Arrays", "Two Sum", "Easy", "LeetCode", "https://leetcode.com/problems/two-sum/", "", "", "hashing;array"],
  ["Arrays", "Maximum Subarray", "Medium", "LeetCode", "https://leetcode.com/problems/maximum-subarray/", "", "", "dp;kadane"],
  ["Binary Search", "Search in Rotated Sorted Array", "Medium", "LeetCode", "https://leetcode.com/problems/search-in-rotated-sorted-array/", "", "", "binary-search"],
  ["Dynamic Programming", "Climbing Stairs", "Easy", "LeetCode", "https://leetcode.com/problems/climbing-stairs/", "", "", "dp;fibonacci"],
  ["Trees", "Invert Binary Tree", "Easy", "LeetCode", "https://leetcode.com/problems/invert-binary-tree/", "", "", "tree;dfs"],
  ["Graphs", "Number of Islands", "Medium", "LeetCode", "https://leetcode.com/problems/number-of-islands/", "", "", "bfs;dfs;matrix"],
]

const CATEGORIES: SheetCategory[] = [
  "DSA",
  "CP",
  "OS",
  "CN",
  "OOPS",
  "DBMS",
  "Development",
  "Company",
  "Custom",
]

export function CsvImportModal({
  sheetId,
  sheetTitle,
  availableSheets = [],
  isOpen,
  onClose,
  onSuccess,
}: CsvImportModalProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [importMode, setImportMode] = useState<"new" | "existing">(sheetId ? "existing" : "new")
  const [selectedSheetId, setSelectedSheetId] = useState<string>(sheetId || "")
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState<SheetCategory>("DSA")
  const [result, setResult] = useState<{
    sheetId?: string
    inserted: number
    duplicates: number
    rejected: number
    errors: Array<{ line: number; error: string }>
  } | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDownloadCsvSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "hirecompass_roadmap_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadExcelSample = () => {
    const ws = XLSX.utils.aoa_to_sheet(SAMPLE_ROWS)
    // Auto-fit column widths
    ws["!cols"] = [
      { wch: 22 },
      { wch: 32 },
      { wch: 12 },
      { wch: 14 },
      { wch: 45 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Problems")
    XLSX.writeFile(wb, "hirecompass_roadmap_template.xlsx")
  }

  const handleProcessFile = (selected: File) => {
    setFile(selected)
    setGeneralError(null)
    setResult(null)
    if (!newTitle) {
      const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      setNewTitle(cleanName)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleProcessFile(selected)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0])
    }
  }

  const getFileBadge = (name: string) => {
    const ext = name.split(".").pop()?.toUpperCase() || ""
    if (ext === "XLSX" || ext === "XLS") {
      return { label: ext, color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" }
    }
    return { label: "CSV", color: "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30" }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setGeneralError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const targetId = sheetId || (importMode === "existing" ? selectedSheetId : "")
      if (targetId) {
        formData.append("sheetId", targetId)
      } else {
        formData.append("title", newTitle.trim() || file.name.replace(/\.[^/.]+$/, ""))
        formData.append("category", newCategory)
      }

      const res = await fetch("/api/sheets/import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to import spreadsheet")
      }

      setResult(data)
      if (onSuccess) {
        onSuccess(data.sheetId)
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred during import")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto ring-1 ring-black/5 dark:ring-white/10">
        
        {/* Glow decorative orbs */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Universal Spreadsheet Importer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
                  XLSX • XLS • CSV
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sheetTitle ? `Importing directly into: ${sheetTitle}` : "Create a new roadmap or append to an existing sheet"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Supported Columns & Template Download Card */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-2.5 text-xs backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expected Column Schema:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadExcelSample}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCsvSample}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 transition-all shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Template (.csv)</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap shadow-inner">
            Topic, Title, Difficulty, Platform, Problem Link, Article Link, YouTube, Tags
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>✓ Column header names are case-insensitive</span>
            <span>✓ Duplicates are automatically skipped</span>
            <span>✓ Missing topics auto-create new sections</span>
          </div>
        </div>

        {/* Target Destination Switcher (if opened standalone) */}
        {!sheetId && (
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Import Destination
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setImportMode("new")}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-semibold transition-all text-left flex items-center gap-2.5 relative group",
                  importMode === "new"
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                )}
              >
                <div className={cn("p-1.5 rounded-xl", importMode === "new" ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Create New Sheet</div>
                  <div className="text-[10px] text-slate-400 font-normal">Auto-generates roadmap</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode("existing")}
                disabled={availableSheets.length === 0}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-semibold transition-all text-left flex items-center gap-2.5 relative group disabled:opacity-40",
                  importMode === "existing"
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                )}
              >
                <div className={cn("p-1.5 rounded-xl", importMode === "existing" ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Append to Existing</div>
                  <div className="text-[10px] text-slate-400 font-normal">{availableSheets.length} roadmaps ready</div>
                </div>
              </button>
            </div>

            {importMode === "new" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    New Sheet Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Striver SDE Sheet"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SheetCategory)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="pt-1 animate-in fade-in duration-200">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Existing Target Sheet
                </label>
                <select
                  value={selectedSheetId}
                  onChange={(e) => setSelectedSheetId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Choose one of your roadmaps --</option>
                  {availableSheets.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} ({s.category || "DSA"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {generalError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-start gap-2.5 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Import Results Box */}
        {result && (
          <div className="space-y-4 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Spreadsheet Import Completed Successfully!</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <div className="text-xl font-extrabold">{result.inserted}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Problems Added</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <div className="text-xl font-extrabold">{result.duplicates}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Duplicates Skipped</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <div className="text-xl font-extrabold">{result.rejected}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Row Errors</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="max-h-28 overflow-y-auto p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-[11px] text-rose-600 dark:text-rose-400 space-y-1">
                <div className="font-bold">Errors found in file:</div>
                {result.errors.map((err, i) => (
                  <div key={i}>
                    • Line {err.line}: {err.error}
                  </div>
                ))}
              </div>
            )}

            {result.sheetId && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/prep/problem-solving/${result.sheetId}`)
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-md hover:shadow-emerald-500/20 hover:scale-[1.01]"
              >
                <span>Open Imported Roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Interactive Drag & Drop Zone */}
        {!result && (
          <form onSubmit={handleUpload} className="space-y-4">
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center p-7 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200 group text-center relative overflow-hidden",
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-emerald-500/80 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-emerald-500/5"
              )}
            >
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-200 mb-3 text-slate-500 group-hover:text-emerald-500">
                {file ? <FileCheck className="w-7 h-7 text-emerald-500" /> : <Upload className="w-7 h-7" />}
              </div>

              {file ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {file.name}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-extrabold border", getFileBadge(file.name).color)}>
                      {getFileBadge(file.name).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • Ready to parse & insert
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-block pt-1">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    Drag & Drop your spreadsheet here, or <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40">browse</span>
                  </span>
                  <p className="text-xs text-slate-400">
                    Supports Microsoft Excel (<code className="font-semibold text-slate-600 dark:text-slate-300">.xlsx, .xls</code>) and CSV (<code className="font-semibold text-slate-600 dark:text-slate-300">.csv</code>)
                  </p>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx,.xls,.xlsm,.xlsb,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {result ? "Close" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!file || isUploading || (importMode === "existing" && !sheetId && !selectedSheetId)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-md hover:shadow-emerald-500/25 disabled:opacity-50 hover:scale-[1.02]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing & Importing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Import</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
