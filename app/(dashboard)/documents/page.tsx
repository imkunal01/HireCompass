"use client"

import React from "react"
import { FileText, Upload, Plus, Download, Trash2, Link as LinkIcon } from "lucide-react"

const documentsList = [
  { id: "d1", name: "Kunal_Resume_2026_SE.pdf", type: "Resume", size: "142 KB", added: "May 1, 2026", jobLinked: "Google, Vercel" },
  { id: "d2", name: "Google_Cover_Letter.pdf", type: "Cover Letter", size: "98 KB", added: "May 20, 2026", jobLinked: "Google" },
  { id: "d3", name: "Kunal_Portfolio_Fullstack.pdf", type: "Portfolio", size: "2.1 MB", added: "April 15, 2026", jobLinked: "Stripe" }
]

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Documents & Resumes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store multiple resume variants, targeted cover letters, and track which documents are sent where.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-primary/10 transition-all duration-200">
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {/* Drag & Drop Upload mockup */}
      <div className="rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-card/10 backdrop-blur-md p-8 text-center flex flex-col items-center justify-center cursor-pointer group transition duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/40 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition duration-300 mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <h4 className="font-semibold text-sm text-foreground">Upload resumes or cover letters</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
          Drag and drop PDF or DOCX files here, or click to browse local files (max 10MB).
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-base">All Stored Documents</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentsList.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {doc.type}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-foreground truncate pr-6 group-hover:text-primary transition duration-200">
                  {doc.name}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Size: {doc.size} • Uploaded {doc.added}
                </p>

                {doc.jobLinked && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <span className="truncate">Linked to: <strong className="text-foreground">{doc.jobLinked}</strong></span>
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
