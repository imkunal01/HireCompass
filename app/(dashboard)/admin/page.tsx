"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/components/ui/toast"
import {
  ShieldCheck, Users, FileText, Cpu, Sparkles, AlertTriangle,
  Search, Plus, RotateCcw, Trash2, Edit3, CheckCircle2, XCircle,
  Download, Eye, Key, ShieldAlert, ChevronRight, Activity, Ban,
  Lock, RefreshCw, X, Loader2, Globe, Wifi, Radio, Laptop, Smartphone,
  ExternalLink, Compass, ArrowUpRight
} from "lucide-react"
import "@/styles/animations.css"
import { cn } from "@/lib/utils"
import type { TrafficSummary } from "@/types/telemetry"

function formatTimeAgo(dateStr?: string | Date | null): string {
  if (!dateStr) return "Never"
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 0) return "Just now"
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface UserRecord {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  aiAccess: "DEFAULT" | "UNRESTRICTED" | "DISABLED"
  hasCustomLimit?: boolean
  customLimit?: number | null
  aiUsage: {
    count: number
    limit: number | "UNLIMITED"
    lastUsedAt: string | null
  }
  hasCustomKey: boolean
  opportunitiesCount: number
  resumesCount: number
  lastActiveAt?: string | null
  lastPath?: string | null
  isOnline?: boolean
  createdAt: string | null
}

interface ResumeRecord {
  id: string
  name: string
  type: string
  targetRole: string | null
  mimeType: string
  sizeBytes: number
  userId: string
  userName: string
  userEmail: string
  uploadedAt: string
}

interface AdminStats {
  totalUsers: number
  totalAdmins: number
  totalOpportunities: number
  totalResumes: number
  totalAiRequests: number
  systemModel: string
  hasSystemApiKey: boolean
  freeLimitDefault: number
}

interface UsersApiResponse {
  users: UserRecord[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function AdminDashboardPage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<"users" | "traffic" | "resumes" | "system">("users")
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [aiAccessFilter, setAiAccessFilter] = useState("ALL")
  const [userPage, setUserPage] = useState(1)

  // 0. Fetch Real-Time Traffic & User Interactivity
  const { data: trafficData, isLoading: trafficLoading, refetch: refetchTraffic } = useQuery<TrafficSummary>({
    queryKey: ["admin-traffic"],
    queryFn: async () => {
      const res = await fetch("/api/admin/traffic")
      if (!res.ok) throw new Error("Failed to load traffic stats")
      return res.json()
    },
    enabled: user?.role === "admin",
    refetchInterval: 15000, // Live presence poll every 15s
  })

  // Resumes states
  const [resumeSearch, setResumeSearch] = useState("")
  const [previewResume, setPreviewResume] = useState<any | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deletingResume, setDeletingResume] = useState<ResumeRecord | null>(null)

  // System AI test state
  const [isTestingAi, setIsTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean
    latencyMs?: number
    model?: string
    reply?: string
    error?: string
  } | null>(null)

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    aiAccess: "DEFAULT" as "DEFAULT" | "UNRESTRICTED" | "DISABLED",
    aiLimit: "",
  })

  // 1. Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to load admin stats")
      return res.json()
    },
    enabled: user?.role === "admin",
  })

  // 2. Fetch Users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<UsersApiResponse>({
    queryKey: ["admin-users", userSearch, roleFilter, aiAccessFilter, userPage],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userSearch) params.set("search", userSearch)
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (aiAccessFilter !== "ALL") params.set("aiAccess", aiAccessFilter)
      params.set("page", String(userPage))
      params.set("limit", "15")
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load users")
      return res.json()
    },
    enabled: user?.role === "admin",
  })

  // 3. Fetch Resumes
  const { data: resumes, isLoading: resumesLoading, refetch: refetchResumes } = useQuery<ResumeRecord[]>({
    queryKey: ["admin-resumes", resumeSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (resumeSearch.trim()) params.set("search", resumeSearch.trim())
      const res = await fetch(`/api/admin/resumes?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load resumes")
      return res.json()
    },
    enabled: user?.role === "admin" && activeTab === "resumes",
  })

  // Resume Download Handler
  const handleDownloadResume = async (resume: ResumeRecord | any) => {
    try {
      toast({ type: "info", title: "Preparing download...", message: `Fetching ${resume.name}` })
      const res = await fetch(`/api/admin/resumes/${resume.id || resume._id}`)
      if (!res.ok) throw new Error("Failed to fetch resume file")
      const doc = await res.json()
      if (!doc.data) throw new Error("Document file data not found")

      // Base64 to Blob
      const byteCharacters = atob(doc.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: doc.mimeType || "application/pdf" })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.name || "resume.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ type: "success", title: "Downloaded", message: `${doc.name} downloaded successfully.` })
    } catch (err: any) {
      toast({ type: "error", title: "Download failed", message: err.message || "Could not download resume." })
    }
  }

  // Resume Preview Handler
  const handlePreviewResume = async (resume: ResumeRecord) => {
    try {
      setPreviewLoading(true)
      const res = await fetch(`/api/admin/resumes/${resume.id}`)
      if (!res.ok) throw new Error("Failed to fetch resume details")
      const doc = await res.json()
      setPreviewResume({
        ...doc,
        userName: resume.userName,
        userEmail: resume.userEmail,
      })
    } catch (err: any) {
      toast({ type: "error", title: "Preview failed", message: err.message })
    } finally {
      setPreviewLoading(false)
    }
  }

  // AI Connection Test Handler
  const handleTestAi = async () => {
    try {
      setIsTestingAi(true)
      setAiTestResult(null)
      const res = await fetch("/api/admin/system/test-ai", { method: "POST" })
      const data = await res.json()
      setAiTestResult(data)
      if (data.success) {
        toast({ type: "success", title: "AI Connected!", message: `Latency: ${data.latencyMs}ms (${data.model})` })
      } else {
        toast({ type: "error", title: "AI Test Failed", message: data.error })
      }
    } catch (err: any) {
      setAiTestResult({ success: false, error: err.message })
      toast({ type: "error", title: "AI Test Failed", message: err.message })
    } finally {
      setIsTestingAi(false)
    }
  }

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          aiLimit: data.aiLimit ? parseInt(data.aiLimit, 10) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create user")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      setIsAddUserOpen(false)
      setFormData({ name: "", email: "", password: "", role: "user", aiAccess: "DEFAULT", aiLimit: "" })
      toast({ type: "success", title: "User created!", message: "New account has been registered successfully." })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Creation failed", message: err.message })
    },
  })

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update user")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      setEditingUser(null)
      toast({ type: "success", title: "User updated", message: "Account settings and AI privileges updated." })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Update failed", message: err.message })
    },
  })

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete user")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      queryClient.invalidateQueries({ queryKey: ["admin-resumes"] })
      setDeletingUser(null)
      toast({ type: "success", title: "User deleted", message: "User account and all related records removed." })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Delete failed", message: err.message })
    },
  })

  // Delete Resume Mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/resumes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete resume")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resumes"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      toast({ type: "success", title: "Resume deleted", message: "Document removed permanently." })
    },
  })

  // 4. Auth Settings Feature Flag Query & Mutation
  const { data: authSettings, isLoading: authSettingsLoading, refetch: refetchAuthSettings } = useQuery<{
    enablePasswordAuth: boolean
    googleAuthEnabled: boolean
    updatedAt?: string
    updatedBy?: string
  }>({
    queryKey: ["admin-auth-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system/auth-settings")
      if (!res.ok) throw new Error("Failed to load auth settings")
      return res.json()
    },
    enabled: user?.role === "admin",
  })

  const toggleAuthMutation = useMutation({
    mutationFn: async (enablePasswordAuth: boolean) => {
      const res = await fetch("/api/admin/system/auth-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enablePasswordAuth }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update auth settings")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth-settings"] })
      queryClient.invalidateQueries({ queryKey: ["auth-settings"] })
      const isEnabled = data.settings?.enablePasswordAuth
      toast({
        type: "success",
        title: isEnabled ? "Hybrid Auth Mode Enabled" : "Google OAuth Only Mode Active",
        message: isEnabled
          ? "Normal login/signup flow along with Google signup is now visible across the website."
          : "Password registration is now disabled. Only verified Google accounts can enter.",
      })
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Update failed", message: err.message })
    },
  })

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  // Access check
  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-xl">
        <ShieldAlert size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          This control center requires the <strong>admin</strong> role. Your account ({user?.email}) currently has standard user permissions.
        </p>
        <button onClick={() => router.push("/dashboard")} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors">
          Return to Dashboard
        </button>
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black tracking-wide mb-2.5 shadow-xs">
            <ShieldCheck size={14} className="text-rose-600" />
            ADMIN PRIVILEGE ACTIVE · UNRESTRICTED AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage platform users, control AI quotas and permissions, inspect resumes, and monitor system metrics.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: "", email: "", password: "", role: "user", aiAccess: "DEFAULT", aiLimit: "" })
            setIsAddUserOpen(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all"
        >
          <Plus size={16} /> Add New User
        </button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {[
          { label: "Total Users", val: stats?.totalUsers ?? "...", icon: Users, color: "#6366F1", bg: "bg-indigo-50 text-indigo-600" },
          {
            label: "Online Now",
            val: (
              <div className="flex items-center gap-2">
                <span>{trafficData?.onlineUsersCount ?? 0}</span>
                {(trafficData?.onlineUsersCount ?? 0) > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            ),
            icon: Wifi,
            color: "#10B981",
            bg: "bg-emerald-50 text-emerald-600",
            sub: "Active in last 5m",
          },
          {
            label: "24h Traffic",
            val: trafficData?.totalPageviewsToday ?? 0,
            icon: Globe,
            color: "#3B82F6",
            bg: "bg-blue-50 text-blue-600",
            sub: `${trafficData?.uniqueVisitorsToday ?? 0} unique visitors`,
          },
          { label: "Opportunities", val: stats?.totalOpportunities ?? "...", icon: Activity, color: "#2563EB", bg: "bg-indigo-50 text-indigo-600" },
          { label: "Resumes", val: stats?.totalResumes ?? "...", icon: FileText, color: "#059669", bg: "bg-teal-50 text-teal-600" },
          { label: "AI Requests", val: stats?.totalAiRequests ?? "...", icon: Cpu, color: "#D97706", bg: "bg-amber-50 text-amber-600" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {item.label}
              </span>
              <div className={cn("p-1.5 rounded-xl shrink-0", item.bg)}>
                <item.icon size={15} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {item.val}
              </div>
              {item.sub && (
                <div className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                  {item.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex gap-2 border-b border-slate-200/80 pt-2 overflow-x-auto">
        {[
          { id: "users", label: "User Management & AI Quotas", icon: Users },
          {
            id: "traffic",
            label: "Traffic & User Activity",
            icon: Globe,
            badge: (trafficData?.onlineUsersCount ?? 0) > 0 ? `${trafficData?.onlineUsersCount} online` : null,
          },
          { id: "resumes", label: "Resumes Oversight", icon: FileText },
          { id: "system", label: "System & AI Settings", icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 text-xs sm:text-sm font-bold transition-all -mb-px shrink-0",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB 1: USERS ════════════════════ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    setUserPage(1)
                  }}
                  placeholder="Search by name or email..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setUserPage(1)
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Standard User</option>
              </select>

              <select
                value={aiAccessFilter}
                onChange={(e) => {
                  setAiAccessFilter(e.target.value)
                  setUserPage(1)
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
              >
                <option value="ALL">All AI Access</option>
                <option value="DEFAULT">Default Limit</option>
                <option value="UNRESTRICTED">Unrestricted</option>
                <option value="DISABLED">Disabled (Blocked)</option>
              </select>
            </div>

            <button
              onClick={() => refetchUsers()}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all shadow-xs inline-flex items-center justify-center gap-2 shrink-0"
              title="Refresh users"
            >
              <RefreshCw size={14} className={usersLoading ? "animate-spin text-indigo-600" : ""} />
              <span className="hidden sm:inline text-xs">Refresh</span>
            </button>
          </div>

          {/* Users Table Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">User</th>
                    <th className="py-3.5 px-4 sm:px-6">Role</th>
                    <th className="py-3.5 px-4 sm:px-6">Last Active</th>
                    <th className="py-3.5 px-4 sm:px-6">AI Privilege</th>
                    <th className="py-3.5 px-4 sm:px-6">AI Usage</th>
                    <th className="py-3.5 px-4 sm:px-6">Records</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                        <span>Loading users...</span>
                      </td>
                    </tr>
                  ) : usersData?.users?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    usersData?.users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0",
                                u.role === "admin"
                                  ? "bg-gradient-to-br from-rose-500 to-indigo-600"
                                  : "bg-slate-200 text-slate-700"
                              )}
                            >
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{u.name}</div>
                              <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <button
                            onClick={() => {
                              if (u.id === user?.id) {
                                toast({ type: "error", title: "Cannot change role", message: "You cannot change your own admin account role." })
                                return
                              }
                              const newRole = u.role === "admin" ? "user" : "admin"
                              updateUserMutation.mutate({ id: u.id, updates: { role: newRole } })
                            }}
                            title={u.id === user?.id ? "Your own account" : "Click to toggle role"}
                            disabled={u.id === user?.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide border transition-all",
                              u.role === "admin"
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
                              u.id === user?.id && "cursor-default opacity-85 hover:bg-rose-50"
                            )}
                          >
                            {u.role === "admin" ? <ShieldCheck size={12} className="text-rose-600" /> : <Users size={12} />}
                            {u.role.toUpperCase()}
                          </button>
                        </td>

                        {/* Last Active */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {u.isOnline ? (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="font-bold text-emerald-700 text-xs">Online Now</span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700 text-xs">{formatTimeAgo(u.lastActiveAt)}</span>
                              {u.lastPath && (
                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={u.lastPath}>
                                  {u.lastPath}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* AI Privilege Mode */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
                              <ShieldCheck size={12} /> Admin (Unlimited)
                            </span>
                          ) : u.aiAccess === "UNRESTRICTED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                              <Sparkles size={12} /> Unrestricted
                            </span>
                          ) : u.aiAccess === "DISABLED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
                              <Ban size={12} /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                              Default ({u.aiUsage.limit})
                            </span>
                          )}
                        </td>

                        {/* AI Usage Meter & Reset */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <div className="min-w-[65px]">
                              <span className="font-black text-slate-900">{u.aiUsage.count}</span>
                              <span className="text-slate-400 text-xs">
                                {" "}
                                / {u.aiUsage.limit === "UNLIMITED" ? "∞" : u.aiUsage.limit}
                              </span>
                            </div>
                            {u.aiUsage.count > 0 && (
                              <button
                                onClick={() => updateUserMutation.mutate({ id: u.id, updates: { resetAiUsage: true } })}
                                title="Reset AI usage to 0"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold transition-colors"
                              >
                                <RotateCcw size={10} /> Reset
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Counts */}
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-medium">
                          <span>{u.opportunitiesCount} jobs</span> · <span>{u.resumesCount} CVs</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Fast toggle AI Access */}
                            <button
                              onClick={() => {
                                const nextAccess =
                                  u.aiAccess === "DISABLED" ? "DEFAULT" : u.aiAccess === "DEFAULT" ? "UNRESTRICTED" : "DISABLED"
                                updateUserMutation.mutate({ id: u.id, updates: { aiAccess: nextAccess } })
                              }}
                              title={`Current: ${u.aiAccess}. Click to cycle.`}
                              className={cn(
                                "p-2 rounded-xl border transition-all",
                                u.aiAccess === "DISABLED"
                                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              )}
                            >
                              <Sparkles size={14} />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingUser(u)
                                setFormData({
                                  name: u.name,
                                  email: u.email,
                                  password: "",
                                  role: u.role,
                                  aiAccess: u.aiAccess,
                                  aiLimit: u.hasCustomLimit && typeof u.customLimit === "number" ? String(u.customLimit) : "",
                                })
                              }}
                              title="Edit user"
                              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete (if not self) */}
                            {user.id !== u.id && (
                              <button
                                onClick={() => setDeletingUser(u)}
                                title="Delete user"
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Users Table Pagination */}
            {usersData?.pagination && usersData.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/60 text-xs text-slate-600">
                <span>
                  Showing {Math.min(usersData.pagination.total, (usersData.pagination.page - 1) * usersData.pagination.limit + 1)}–
                  {Math.min(usersData.pagination.total, usersData.pagination.page * usersData.pagination.limit)} of {usersData.pagination.total} users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={usersData.pagination.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-900 px-2">
                    {usersData.pagination.page} / {usersData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setUserPage((p) => Math.min(usersData.pagination!.totalPages, p + 1))}
                    disabled={usersData.pagination.page >= usersData.pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: TRAFFIC & USER ACTIVITY ════════════════════ */}
      {activeTab === "traffic" && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Live Telemetry & User Interactivity</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking active candidate sessions, route history, and real-time website traffic.
                </p>
              </div>
            </div>

            <button
              onClick={() => refetchTraffic()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <RefreshCw size={13} className={trafficLoading ? "animate-spin text-indigo-600" : ""} />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {/* 1. Active Users Roster ("Which user was active last time") */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  User Interactivity & Last Active Roster
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {trafficData?.activeUsersList?.length || 0} candidates tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Candidate</th>
                    <th className="py-3 px-4 sm:px-6">Presence Status</th>
                    <th className="py-3 px-4 sm:px-6">Last Active</th>
                    <th className="py-3 px-4 sm:px-6">Last Route Visited</th>
                    <th className="py-3 px-4 sm:px-6">AI Usage</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {trafficLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                        <span>Loading user activity telemetry...</span>
                      </td>
                    </tr>
                  ) : !trafficData?.activeUsersList || trafficData.activeUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No user activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    trafficData.activeUsersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {usr.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{usr.name}</div>
                              <div className="text-xs text-slate-500 truncate">{usr.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          {usr.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              Online Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <div className="text-xs text-slate-700 font-semibold">
                            {formatTimeAgo(usr.lastActiveAt)}
                          </div>
                          {usr.lastActiveAt && (
                            <div className="text-[10px] text-slate-400">
                              {new Date(usr.lastActiveAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[160px] truncate" title={usr.lastPath}>
                            {usr.lastPath || "/dashboard"}
                          </span>
                        </td>

                        <td className="py-3 px-4 sm:px-6 font-semibold text-slate-800">
                          {usr.aiUsageCount} requests
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-right">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                            usr.role === "admin"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          )}>
                            {usr.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Grid: Traffic Composition & Top Visited Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Overall Audience Breakdown */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Traffic & Audience Split</h4>
                    <p className="text-[11px] text-slate-500">Last 24 hours visitor composition</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {trafficData?.uniqueVisitorsToday ?? 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Visitors</span>
                </div>
              </div>

              {/* Progress split bar */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (trafficData?.uniqueVisitorsToday ?? 0) > 0
                          ? Math.round(((trafficData?.registeredVisitorsToday ?? 0) / (trafficData?.uniqueVisitorsToday ?? 1)) * 100)
                          : 50
                      }%`,
                    }}
                    title="Registered Users"
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (trafficData?.uniqueVisitorsToday ?? 0) > 0
                          ? Math.round(((trafficData?.guestVisitorsToday ?? 0) / (trafficData?.uniqueVisitorsToday ?? 1)) * 100)
                          : 50
                      }%`,
                    }}
                    title="Guest Explorers"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600 font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    <span>Registered Members: <strong>{trafficData?.registeredVisitorsToday ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span>Guest Explorers: <strong>{trafficData?.guestVisitorsToday ?? 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Device Category Pills */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Device Distribution
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Laptop size={18} className="text-slate-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {trafficData?.deviceBreakdown?.desktop ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Desktop</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Smartphone size={18} className="text-slate-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {trafficData?.deviceBreakdown?.mobile ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Mobile</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Compass size={18} className="text-slate-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {trafficData?.deviceBreakdown?.tablet ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Tablet</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Top Visited Pages & Features */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-violet-50 text-violet-600">
                  <Activity size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Top Visited Features & Routes</h4>
                  <p className="text-[11px] text-slate-500">Most engaged platform modules (last 7 days)</p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {!trafficData?.topPages || trafficData.topPages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No route visits recorded yet.
                  </div>
                ) : (
                  trafficData.topPages.map((page, index) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-black shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                          {page.path}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                        {page.count} {page.count === 1 ? "hit" : "hits"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 3. Live Real-Time Event Stream Ticker */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <Radio size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Live Traffic & Activity Stream</h4>
                  <p className="text-[11px] text-slate-500">Real-time chronologic pulse across all visitors</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {trafficData?.recentLogs?.length || 0} recent events
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {!trafficData?.recentLogs || trafficData.recentLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No live events logged yet.
                </div>
              ) : (
                trafficData.recentLogs.map((log, i) => (
                  <div key={log.id || i} className="pt-2 pb-2 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        log.action === "pageview" ? "bg-indigo-500" : "bg-emerald-500"
                      )} />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 truncate">
                          {log.userName || log.userEmail || `Guest (${log.visitorId.slice(0, 8)})`}
                        </span>
                        <span className="text-slate-500 ml-1.5 font-normal">
                          {log.action === "pageview" ? "visited" : "pinged"}
                        </span>
                        <span className="font-mono text-indigo-600 ml-1 font-semibold truncate">
                          {log.path}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                      <span className="capitalize">{log.device || "desktop"}</span>
                      <span>·</span>
                      <span>{formatTimeAgo(log.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: RESUMES ════════════════════ */}
      {activeTab === "resumes" && (
        <div className="space-y-4">
          {/* Resumes Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={resumeSearch}
                onChange={(e) => setResumeSearch(e.target.value)}
                placeholder="Search resumes by document name or user..."
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
              {resumeSearch && (
                <button
                  onClick={() => setResumeSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => refetchResumes()}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all shadow-xs inline-flex items-center justify-center gap-2 shrink-0"
              title="Refresh resumes"
            >
              <RefreshCw size={14} className={resumesLoading ? "animate-spin text-indigo-600" : ""} />
              <span className="hidden sm:inline text-xs">Refresh</span>
            </button>
          </div>

          {/* Resumes Table Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Document Name</th>
                    <th className="py-3.5 px-4 sm:px-6">User</th>
                    <th className="py-3.5 px-4 sm:px-6">Target Role</th>
                    <th className="py-3.5 px-4 sm:px-6">Size</th>
                    <th className="py-3.5 px-4 sm:px-6">Uploaded</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {resumesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                        <span>Loading resumes...</span>
                      </td>
                    </tr>
                  ) : resumes?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No resumes found matching your search.
                      </td>
                    </tr>
                  ) : (
                    resumes?.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5 font-bold text-slate-900">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                              <FileText size={16} />
                            </div>
                            <span className="truncate max-w-xs">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{r.userName}</div>
                          <div className="text-xs text-slate-500">{r.userEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                          {r.targetRole || "General"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-xs">
                          {formatBytes(r.sizeBytes)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500" suppressHydrationWarning>
                          {new Date(r.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handlePreviewResume(r)}
                              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                              title="Preview resume details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadResume(r)}
                              className="p-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                              title="Download resume file"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingResume(r)}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                              title="Delete resume"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 3: SYSTEM SETTINGS ════════════════════ */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Settings Box */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Platform AI Model & Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Global LLM gateway status and baseline quotas
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs sm:text-sm divide-y divide-slate-100">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Active Engine</span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {stats?.systemModel || "llama-3.3-70b-versatile"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">API Key Status</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-full",
                  stats?.hasSystemApiKey
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}>
                  {stats?.hasSystemApiKey ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {stats?.hasSystemApiKey ? "System Groq API Key Active" : "Missing GROQ_API_KEY in .env"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Default Free Tier Quota</span>
                <span className="font-bold text-slate-900">
                  {stats?.freeLimitDefault ?? 30} requests per user
                </span>
              </div>
            </div>

            {/* Interactive AI Health Test */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">AI Service Connectivity</span>
                <button
                  onClick={handleTestAi}
                  disabled={isTestingAi}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  <RefreshCw size={13} className={isTestingAi ? "animate-spin text-indigo-600" : ""} />
                  {isTestingAi ? "Testing..." : "Test Connection"}
                </button>
              </div>

              {aiTestResult && (
                <div
                  className={cn(
                    "p-3.5 rounded-2xl border text-xs leading-relaxed",
                    aiTestResult.success
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/80 border-rose-200 text-rose-900"
                  )}
                >
                  {aiTestResult.success ? (
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Connected to <strong>{aiTestResult.model}</strong> ({aiTestResult.latencyMs}ms latency).</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-medium">
                      <XCircle size={16} className="text-rose-600 shrink-0" />
                      <span>Error: {aiTestResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Admin Policy Summary */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-rose-50 text-rose-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Admin Privilege Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Platform access controls and system authorization
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-0.5">1. Unrestricted AI Access:</strong>
                Admins have zero token and request limits across all generative features including STAR synthesis, the Griller, and Resume Studio.
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-0.5">2. Granular User AI Controls:</strong>
                Admins can upgrade individual users to unrestricted status, raise custom quota ceilings, or block AI privileges.
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-0.5">3. Role Delegation & Safety:</strong>
                Admins can promote or demote any user. Self-demotion is strictly blocked by backend guards to prevent accidental admin lockouts.
              </div>
            </div>
          </div>

          {/* ── Feature Flag: Authentication Flow & Anti-Token Abuse Shield ── */}
          <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Authentication Feature Flag & Token Abuse Shield
                    </h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider",
                      authSettings?.enablePasswordAuth
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    )}>
                      {authSettings?.enablePasswordAuth ? "Hybrid Auth" : "Google Only (Shield Active)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control public registration flow to prevent bot burner accounts from consuming AI token quotas
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-2 px-3 shrink-0">
                <span className="text-xs font-bold text-slate-700">
                  {authSettings?.enablePasswordAuth ? "Password Auth ON" : "Password Auth OFF"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAuthMutation.mutate(!authSettings?.enablePasswordAuth)}
                  disabled={authSettingsLoading || toggleAuthMutation.isPending}
                  aria-label="Toggle password authentication feature flag"
                  className={cn(
                    "relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50",
                    authSettings?.enablePasswordAuth ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                      authSettings?.enablePasswordAuth ? "translate-x-6" : "translate-x-0"
                    )}
                  >
                    {toggleAuthMutation.isPending && (
                      <Loader2 size={12} className="animate-spin text-indigo-600" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Feature Flag Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {/* Left Column: Active Behavior */}
              <div className={cn(
                "p-4 rounded-2xl border text-xs leading-relaxed space-y-2",
                authSettings?.enablePasswordAuth
                  ? "bg-amber-50/50 border-amber-200/80 text-amber-950"
                  : "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
              )}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {authSettings?.enablePasswordAuth ? (
                    <>
                      <Users size={16} className="text-amber-600" />
                      <span>Hybrid Authentication Mode Active</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>Google-Only Protection Active (Recommended)</span>
                    </>
                  )}
                </div>
                <p className="text-slate-600">
                  {authSettings?.enablePasswordAuth
                    ? "Both traditional email/password forms and Google Sign-In are visible across the login page, signup page, and modal popups. Any visitor can register with any email."
                    : "Traditional password forms are hidden across all login/signup screens. Users can ONLY enter via verified Google accounts, ensuring 100% genuine emails and preventing token drainage."}
                </p>
                <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span>Backend Guard: {authSettings?.enablePasswordAuth ? "Open" : "Strict 403 on /api/auth/signup"}</span>
                  <span>·</span>
                  <span>Admin Bypass: Enabled (admins can always log in with credentials)</span>
                </div>
              </div>

              {/* Right Column: Google OAuth Infrastructure Status */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Google OAuth 2.0 Gateway</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Callback URI: </span>
                    <span className="text-indigo-600 font-semibold">/api/auth/google/callback</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Scope: </span>
                    <span>openid, email (verified), profile</span>
                  </div>
                  {authSettings?.updatedAt && (
                    <div className="text-slate-400 font-sans text-[10px] pt-1">
                      Last modified: {new Date(authSettings.updatedAt).toLocaleString()} by {authSettings.updatedBy || "admin"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add New User ── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Register New User</h3>
                <p className="text-xs text-slate-500">Create an account and assign AI privileges</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createUserMutation.mutate(formData)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Account Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    AI Access Mode
                  </label>
                  <select
                    value={formData.aiAccess}
                    onChange={(e) => setFormData({ ...formData, aiAccess: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="DEFAULT">Default Limit</option>
                    <option value="UNRESTRICTED">Unrestricted</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all inline-flex items-center gap-2"
                >
                  {createUserMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{createUserMutation.isPending ? "Creating..." : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit User ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Edit Account: {editingUser.name}
                </h3>
                <p className="text-xs text-slate-500">Update account credentials and AI quotas</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const updates: any = {
                  name: formData.name,
                  email: formData.email,
                  role: formData.role,
                  aiAccess: formData.aiAccess,
                  aiLimit: formData.aiLimit ? parseInt(formData.aiLimit, 10) : null,
                }
                if (formData.password.trim()) {
                  updates.password = formData.password.trim()
                }
                updateUserMutation.mutate({ id: editingUser.id, updates })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  placeholder="New password (optional)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    AI Access Privilege
                  </label>
                  <select
                    value={formData.aiAccess}
                    onChange={(e) => setFormData({ ...formData, aiAccess: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="DEFAULT">Default Limit</option>
                    <option value="UNRESTRICTED">Unrestricted (Unlimited)</option>
                    <option value="DISABLED">Disabled (Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Custom AI Request Limit (leave blank for platform default)
                </label>
                <input
                  type="number"
                  value={formData.aiLimit}
                  onChange={(e) => setFormData({ ...formData, aiLimit: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all inline-flex items-center gap-2"
                >
                  {updateUserMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{updateUserMutation.isPending ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete User Confirmation ── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Delete User Account?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This will permanently delete <strong>{deletingUser.name}</strong> ({deletingUser.email}) and cascade delete all their tracked opportunities, resumes, and reminders.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                disabled={deleteUserMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all inline-flex items-center gap-2"
              >
                {deleteUserMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                <span>{deleteUserMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Resume Confirmation ── */}
      {deletingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Delete Resume?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Permanently delete <strong>{deletingResume.name}</strong> uploaded by {deletingResume.userName}? This cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingResume(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteResumeMutation.mutate(deletingResume.id)
                  setDeletingResume(null)
                }}
                disabled={deleteResumeMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all inline-flex items-center gap-2"
              >
                {deleteResumeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                <span>{deleteResumeMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Preview Resume ── */}
      {previewResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Resume Metadata</h3>
                  <p className="text-xs text-slate-500">Document attributes and owner record</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">File Name</span>
                <strong className="text-slate-900 truncate max-w-[260px]">{previewResume.name}</strong>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Uploaded By</span>
                <span className="text-slate-800 font-semibold">{previewResume.userName} ({previewResume.userEmail})</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Target Role</span>
                <span className="text-slate-800">{previewResume.targetRole || "General"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">MIME Type</span>
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{previewResume.mimeType}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Size</span>
                <span className="text-slate-800 font-mono">{formatBytes(previewResume.sizeBytes || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Uploaded At</span>
                <span className="text-slate-800">{new Date(previewResume.uploadedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewResume(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadResume(previewResume)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all inline-flex items-center gap-2"
              >
                <Download size={14} />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
