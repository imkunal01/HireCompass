"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BroadcastMessage, BroadcastType } from "@/types/broadcast"
import { useToast } from "@/components/ui/toast"
import {
  Radio,
  Send,
  Users,
  User,
  Trash2,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  RotateCcw,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminBroadcastsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form State
  const [targetType, setTargetType] = useState<"ALL" | "USER">("ALL")
  const [targetUserId, setTargetUserId] = useState("")
  const [type, setType] = useState<BroadcastType>("announcement")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")

  // 1. Fetch Users for dropdown targeting
  const { data: usersData } = useQuery<{ users: Array<{ id: string; name: string; email: string }> }>({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?limit=100")
      if (!res.ok) throw new Error("Failed to load users")
      return res.json()
    },
  })

  // 2. Fetch Broadcasts
  const { data: broadcastsData, isLoading, refetch } = useQuery<{ broadcasts: BroadcastMessage[] }>({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/broadcasts")
      if (!res.ok) throw new Error("Failed to load broadcasts")
      return res.json()
    },
    refetchInterval: 15000,
  })

  // 3. Create Broadcast Mutation
  const createBroadcastMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to dispatch broadcast")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] })
      setTitle("")
      setMessage("")
      setTargetUserId("")
      toast({
        type: "success",
        title: "Broadcast Dispatched! 📡",
        message:
          data.broadcast?.targetType === "ALL"
            ? "Your message will appear for all users across any page."
            : `Your direct message was dispatched to ${data.broadcast?.targetUserName || "the selected user"}.`,
      })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Dispatch Failed", message: err.message })
    },
  })

  // 4. Delete Broadcast Mutation
  const deleteBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await fetch(`/api/admin/broadcasts/${broadcastId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete broadcast")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] })
      toast({ type: "success", title: "Broadcast Deleted", message: "Message removed from active rotation." })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Deletion Failed", message: err.message })
    },
  })

  // 5. Reping / Resend Broadcast Mutation
  const repingBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await fetch(`/api/admin/broadcasts/${broadcastId}`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to reping broadcast")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] })
      queryClient.invalidateQueries({ queryKey: ["broadcast-personal"] })
      queryClient.invalidateQueries({ queryKey: ["broadcast-global-dashboard"] })
      toast({
        type: "success",
        title: "Reping Dispatched! 📡",
        message: data.message || "Message repinged! The alert will pop up on the candidate's screen again.",
      })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Reping Failed", message: err.message })
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast({ type: "error", title: "Missing fields", message: "Title and message are required." })
      return
    }
    if (targetType === "USER" && !targetUserId) {
      toast({ type: "error", title: "Target required", message: "Please select a specific candidate to receive this message." })
      return
    }

    createBroadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      type,
      targetType,
      targetUserId: targetType === "USER" ? targetUserId : undefined,
    })
  }

  const filteredUsers = (usersData?.users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  const selectedUserObject = (usersData?.users || []).find((u) => u.id === targetUserId)

  return (
    <div className="space-y-6">
      {/* ── Header Callout ── */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Admin Broadcast & Messaging Center</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Global Screen Pop
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Transmit live notices that pop up instantly on any page for all visitors or a specific candidate.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-indigo-600")} />
          <span>Refresh Broadcasts</span>
        </button>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Compose Broadcast ── */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Compose New Broadcast</h4>
          </div>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Target Audience
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("ALL")
                    setTargetUserId("")
                  }}
                  className={cn(
                    "py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all",
                    targetType === "ALL"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Everyone (Global)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("USER")}
                  className={cn(
                    "py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all",
                    targetType === "USER"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Specific User</span>
                </button>
              </div>
            </div>

            {/* If Specific User: Select candidate */}
            {targetType === "USER" && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-700">
                  Select Candidate:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search candidate by name or email..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-2 text-center">
                      No matching candidates found.
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setTargetUserId(u.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors flex items-center justify-between",
                          targetUserId === u.id
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-100"
                        )}
                      >
                        <div className="truncate">
                          <p className="text-xs truncate">{u.name}</p>
                          <p className={cn("text-[10px]", targetUserId === u.id ? "text-indigo-200" : "text-slate-400")}>
                            {u.email}
                          </p>
                        </div>
                        {targetUserId === u.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
                {selectedUserObject && (
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    Targeting: <strong>{selectedUserObject.name}</strong> ({selectedUserObject.email})
                  </p>
                )}
              </div>
            )}

            {/* Broadcast Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Notice Category / Urgency
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "announcement", label: "Announcement", icon: Bell },
                  { id: "urgent", label: "Urgent Alert", icon: AlertTriangle },
                  { id: "update", label: "Update", icon: CheckCircle2 },
                  { id: "maintenance", label: "Maintenance", icon: ShieldAlert },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={cn(
                      "p-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all",
                      type === item.id
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Broadcast Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled System Upgrade at 11 PM IST"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Message Body
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the broadcast body. Users will see this in a pop-up modal on whatever page they are browsing and can dismiss it to continue."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createBroadcastMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {createBroadcastMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {createBroadcastMutation.isPending ? "Transmitting..." : "Dispatch Broadcast Now"}
              </span>
            </button>
          </form>
        </div>

        {/* ── Right Column: Active Broadcasts List ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Active Broadcasts & Messages
              </h4>
              <p className="text-[11px] text-slate-400">
                Currently running broadcast notices and their dismissal rates.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {broadcastsData?.broadcasts?.length ?? 0} Active
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <span className="text-xs">Loading active broadcasts...</span>
              </div>
            ) : !broadcastsData?.broadcasts || broadcastsData.broadcasts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Radio className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">No active broadcasts</p>
                <p className="text-[11px] text-slate-400">Use the form on the left to broadcast a message to candidates.</p>
              </div>
            ) : (
              broadcastsData.broadcasts.map((b) => (
                <div
                  key={b.id || b._id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          b.type === "urgent"
                            ? "bg-rose-100 text-rose-700"
                            : b.type === "update"
                            ? "bg-emerald-100 text-emerald-700"
                            : b.type === "maintenance"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-indigo-100 text-indigo-700"
                        )}
                      >
                        {b.type}
                      </span>
                      {b.targetType === "USER" ? (
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                          Target: {b.targetUserName || b.targetUserEmail || "Specific User"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                          Audience: Everyone
                        </span>
                      )}
                      {b.repingCount && b.repingCount > 0 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Repinged {b.repingCount}x</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => repingBroadcastMutation.mutate(b.id || (b._id as string))}
                        disabled={repingBroadcastMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-all border border-indigo-200/80 active:scale-95 shadow-2xs"
                        title="Resend this message so the alert popup appears again for the user"
                      >
                        <RotateCcw className={cn("w-3 h-3", repingBroadcastMutation.isPending && "animate-spin")} />
                        <span>Resend / Reping</span>
                      </button>

                      <button
                        onClick={() => {
                          setTitle(b.title)
                          setMessage(b.message)
                          setType(b.type)
                          setTargetType(b.targetType)
                          if (b.targetUserId) setTargetUserId(b.targetUserId)
                          toast({ type: "info", title: "Loaded into composer", message: "You can modify and dispatch." })
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Copy into composer to edit & dispatch"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteBroadcastMutation.mutate(b.id || (b._id as string))}
                        disabled={deleteBroadcastMutation.isPending}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete / Revoke broadcast"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {b.title}
                    </h5>
                    <p className="text-xs text-slate-600 whitespace-pre-line mt-1 line-clamp-3">
                      {b.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>
                      Dispatched by <strong>{b.createdByName || "Admin"}</strong> •{" "}
                      {new Date(b.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="font-semibold text-slate-500">
                      {(b.dismissedBy || []).length} Dismissed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
