"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Ghost, ChevronRight, Mail, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CompanyAvatar } from "@/components/ui/badge"

interface GhostedApp {
  id: string
  title: string
  company: string
  status: string
  url: string | null
  updatedAt: string
  daysSince: number
}

export function GhostingRadar() {
  const { data: ghosted, isLoading } = useQuery<GhostedApp[]>({
    queryKey: ["ghosted-apps"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/ghosted?days=14")
      if (!res.ok) return []
      return res.json()
    },
  })

  if (isLoading) return null
  if (!ghosted || ghosted.length === 0) return null

  return (
    <div className="rounded-2xl border border-rose-200/60 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
            <Ghost className="h-4 w-4 text-rose-500" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">Ghosting Radar</h2>
        </div>
        <span className="flex h-5 items-center justify-center rounded-full bg-rose-500 px-2 text-[10px] font-bold text-white shadow-sm">
          {ghosted.length} Silent
        </span>
      </div>
      
      <div className="divide-y divide-slate-50">
        {ghosted.slice(0, 4).map((app) => (
          <div key={app.id} className="group flex items-start sm:items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors flex-col sm:flex-row">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CompanyAvatar company={app.company} size="sm" />
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-slate-800 truncate">{app.company}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{app.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
              <span className="shrink-0 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-600">
                {app.daysSince}d ago
              </span>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-bot', { 
                    detail: { prompt: `Draft a follow-up email for ${app.company} (${app.title})` }
                  }))
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group-hover:shadow"
              >
                <Mail className="h-3.5 w-3.5" />
                Draft Email
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {ghosted.length > 4 && (
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/applications"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-slate-50 border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            View all {ghosted.length} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
