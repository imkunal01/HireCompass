"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserFeedback } from "@/types/feedback"
import { useToast } from "@/components/ui/toast"
import {
  MessageSquarePlus,
  Lightbulb,
  MessageSquare,
  Star,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminFeedbackTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filterType, setFilterType] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")

  // 1. Fetch Feedback Data
  const { data, isLoading, refetch } = useQuery<{
    feedbacks: UserFeedback[]
    stats: {
      totalCount: number
      suggestionsCount: number
      feedbackCount: number
    }
  }>({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feedback")
      if (!res.ok) throw new Error("Failed to load user feedbacks")
      return res.json()
    },
    refetchInterval: 30000,
  })

  // 2. Delete Feedback Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/feedback?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete feedback")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] })
      toast({ type: "success", title: "Feedback Removed", message: "Item deleted from feedback registry." })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Delete Failed", message: err.message })
    },
  })

  const feedbacks = data?.feedbacks || []

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesType = filterType === "ALL" || f.type === filterType
    const matchesSearch =
      f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.userName && f.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.userEmail && f.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.category && f.category.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesSearch
  })

  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
      : "5.0"

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Submissions</span>
            <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{data?.stats?.totalCount ?? 0}</div>
          <p className="text-[10px] text-slate-400">Feedback & suggestions logged</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-amber-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Feature Suggestions</span>
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">{data?.stats?.suggestionsCount ?? 0}</div>
          <p className="text-[10px] text-slate-400">Community ideas shared</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-indigo-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">General Feedback</span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{data?.stats?.feedbackCount ?? 0}</div>
          <p className="text-[10px] text-slate-400">User experience reviews</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Satisfaction</span>
            <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{averageRating} / 5.0</div>
          <p className="text-[10px] text-slate-400">Across all ratings</p>
        </div>
      </div>

      {/* ── Main Feedback List Card ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: "All Items" },
              { id: "suggestion", label: "Suggestions" },
              { id: "feedback", label: "Feedback" },
              { id: "bug_report", label: "Bugs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  filterType === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search feedback content..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              onClick={() => refetch()}
              className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-indigo-600")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <span className="text-xs">Loading feedback submissions...</span>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <MessageSquarePlus className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">No feedback entries found</p>
              <p className="text-[11px] text-slate-400">When users submit feedback or suggestions, they appear here.</p>
            </div>
          ) : (
            filteredFeedbacks.map((item) => (
              <div key={item.id || item._id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                        item.type === "suggestion"
                          ? "bg-amber-100 text-amber-700"
                          : item.type === "bug_report"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {item.type === "suggestion" ? "Feature Suggestion" : item.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.category || "General"}
                    </span>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-3 h-3",
                            s <= item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-transparent"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(item.id || (item._id as string))}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                  {item.message}
                </p>

                {/* Author Info & Origin Page */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{item.userName || "User"}</span>
                    <span className="text-slate-400">({item.userEmail || "Anonymous"})</span>
                  </div>
                  {item.pageUrl && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Origin: {item.pageUrl}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
