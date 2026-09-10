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
  Lock, RefreshCw, X, Loader2
} from "lucide-react"
import "@/styles/variables.css"
import "@/styles/components.css"
import "@/styles/animations.css"

interface UserRecord {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  aiAccess: "DEFAULT" | "UNRESTRICTED" | "DISABLED"
  aiUsage: {
    count: number
    limit: number | "UNLIMITED"
    lastUsedAt: string | null
  }
  hasCustomKey: boolean
  opportunitiesCount: number
  resumesCount: number
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

export default function AdminDashboardPage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<"users" | "resumes" | "system">("users")
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [aiAccessFilter, setAiAccessFilter] = useState("ALL")

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
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<{ users: UserRecord[] }>({
    queryKey: ["admin-users", userSearch, roleFilter, aiAccessFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userSearch) params.set("search", userSearch)
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (aiAccessFilter !== "ALL") params.set("aiAccess", aiAccessFilter)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load users")
      return res.json()
    },
    enabled: user?.role === "admin",
  })

  // 3. Fetch Resumes
  const { data: resumes, isLoading: resumesLoading, refetch: refetchResumes } = useQuery<ResumeRecord[]>({
    queryKey: ["admin-resumes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/resumes")
      if (!res.ok) throw new Error("Failed to load resumes")
      return res.json()
    },
    enabled: user?.role === "admin" && activeTab === "resumes",
  })

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

  if (userLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader2 size={32} className="anim-spin" color="var(--brand-400)" />
      </div>
    )
  }

  // Access check
  if (!user || user.role !== "admin") {
    return (
      <div
        className="v2-card"
        style={{
          maxWidth: "500px",
          margin: "80px auto",
          padding: "40px",
          textAlign: "center",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-danger)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        <ShieldAlert size={48} color="var(--clr-danger)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--txt-primary)", marginBottom: "8px" }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: "14px", color: "var(--txt-secondary)", marginBottom: "24px" }}>
          This control center requires the <strong>admin</strong> role. Your account ({user?.email}) currently has standard user permissions.
        </p>
        <button onClick={() => router.push("/dashboard")} className="v2-btn v2-btn--secondary">
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "64px" }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid var(--border-brand)",
              color: "var(--brand-300)",
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "10px",
            }}
          >
            <ShieldCheck size={14} />
            ADMIN PRIVILEGE ACTIVE · UNRESTRICTED AI
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 900, color: "var(--txt-primary)", letterSpacing: "-0.03em" }}>
            Admin Control Center
          </h1>
          <p style={{ fontSize: "14px", color: "var(--txt-secondary)", marginTop: "4px" }}>
            Manage platform users, control AI quotas and permissions, inspect resumes, and monitor system metrics.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: "", email: "", password: "", role: "user", aiAccess: "DEFAULT", aiLimit: "" })
            setIsAddUserOpen(true)
          }}
          className="v2-btn v2-btn--primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "var(--radius-md)" }}
        >
          <Plus size={16} /> Add New User
        </button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Total Users", val: stats?.totalUsers ?? "...", icon: Users, color: "var(--brand-400)" },
          { label: "Active Admins", val: stats?.totalAdmins ?? "...", icon: ShieldCheck, color: "var(--clr-assessment)" },
          { label: "Opportunities", val: stats?.totalOpportunities ?? "...", icon: Activity, color: "var(--clr-saved)" },
          { label: "Uploaded Resumes", val: stats?.totalResumes ?? "...", icon: FileText, color: "var(--clr-offer)" },
          { label: "Platform AI Calls", val: stats?.totalAiRequests ?? "...", icon: Cpu, color: "var(--clr-warning)" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="v2-card"
            style={{
              padding: "18px 20px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase" }}>
                {item.label}
              </span>
              <item.icon size={18} color={item.color} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--txt-primary)" }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-default)",
          marginBottom: "24px",
        }}
      >
        {[
          { id: "users", label: "User Management & AI Quotas", icon: Users },
          { id: "resumes", label: "Resumes Oversight", icon: FileText },
          { id: "system", label: "System & AI Settings", icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--brand-500)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--txt-primary)" : "var(--txt-secondary)",
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <tab.icon size={16} color={activeTab === tab.id ? "var(--brand-400)" : "currentColor"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB 1: USERS ════════════════════ */}
      {activeTab === "users" && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 12px",
                  flex: 1,
                }}
              >
                <Search size={16} color="var(--txt-secondary)" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--txt-primary)",
                    fontSize: "13px",
                    width: "100%",
                  }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="v2-input"
                style={{ padding: "6px 12px", fontSize: "13px", width: "auto" }}
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Standard User</option>
              </select>

              <select
                value={aiAccessFilter}
                onChange={(e) => setAiAccessFilter(e.target.value)}
                className="v2-input"
                style={{ padding: "6px 12px", fontSize: "13px", width: "auto" }}
              >
                <option value="ALL">All AI Access</option>
                <option value="DEFAULT">Default Limit</option>
                <option value="UNRESTRICTED">Unrestricted</option>
                <option value="DISABLED">Disabled (Blocked)</option>
              </select>
            </div>

            <button
              onClick={() => refetchUsers()}
              className="v2-btn v2-btn--secondary"
              style={{ padding: "8px 12px" }}
              title="Refresh users"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Users Table */}
          <div
            className="v2-card"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)" }}>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>USER</th>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>ROLE</th>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>AI PRIVILEGE</th>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>AI USAGE</th>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>RECORDS</th>
                    <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--txt-secondary)" }}>
                        <Loader2 size={24} className="anim-spin" style={{ margin: "0 auto 8px" }} />
                        Loading users...
                      </td>
                    </tr>
                  ) : usersData?.users?.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--txt-secondary)" }}>
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    usersData?.users?.map((u) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* User Identity */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "var(--radius-full)",
                                background: u.role === "admin" ? "var(--brand-gradient)" : "var(--bg-surface-3)",
                                color: "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "12px",
                              }}
                            >
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--txt-primary)" }}>{u.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--txt-secondary)" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: "14px 18px" }}>
                          <button
                            onClick={() => {
                              const newRole = u.role === "admin" ? "user" : "admin"
                              updateUserMutation.mutate({ id: u.id, updates: { role: newRole } })
                            }}
                            title="Click to toggle role"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-full)",
                              border: u.role === "admin" ? "1px solid var(--border-brand)" : "1px solid var(--border-default)",
                              background: u.role === "admin" ? "rgba(139, 92, 246, 0.15)" : "var(--bg-surface-2)",
                              color: u.role === "admin" ? "var(--brand-300)" : "var(--txt-secondary)",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {u.role === "admin" ? <ShieldCheck size={12} /> : <Users size={12} />}
                            {u.role.toUpperCase()}
                          </button>
                        </td>

                        {/* AI Privilege Mode */}
                        <td style={{ padding: "14px 18px" }}>
                          {u.role === "admin" ? (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "var(--clr-success)",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              Admin (Unlimited)
                            </span>
                          ) : u.aiAccess === "UNRESTRICTED" ? (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "var(--clr-success)",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              Unrestricted
                            </span>
                          ) : u.aiAccess === "DISABLED" ? (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(239, 68, 68, 0.12)",
                                color: "var(--clr-danger)",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              Blocked
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--bg-surface-2)",
                                color: "var(--txt-secondary)",
                                fontSize: "11px",
                              }}
                            >
                              Default ({u.aiUsage.limit})
                            </span>
                          )}
                        </td>

                        {/* AI Usage Meter & Reset */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ minWidth: "80px" }}>
                              <span style={{ fontWeight: 800, color: "var(--txt-primary)" }}>{u.aiUsage.count}</span>
                              <span style={{ color: "var(--txt-muted)", fontSize: "11px" }}>
                                {" "}
                                / {u.aiUsage.limit === "UNLIMITED" ? "∞" : u.aiUsage.limit}
                              </span>
                            </div>
                            {u.aiUsage.count > 0 && (
                              <button
                                onClick={() => updateUserMutation.mutate({ id: u.id, updates: { resetAiUsage: true } })}
                                title="Reset AI usage to 0"
                                style={{
                                  background: "var(--bg-surface-2)",
                                  border: "1px solid var(--border-default)",
                                  color: "var(--txt-secondary)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <RotateCcw size={10} /> Reset
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Counts */}
                        <td style={{ padding: "14px 18px", color: "var(--txt-secondary)" }}>
                          <span title="Jobs tracked">{u.opportunitiesCount} jobs</span> ·{" "}
                          <span title="Resumes uploaded">{u.resumesCount} CVs</span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {/* Fast toggle AI Access */}
                            <button
                              onClick={() => {
                                const nextAccess =
                                  u.aiAccess === "DISABLED" ? "DEFAULT" : u.aiAccess === "DEFAULT" ? "UNRESTRICTED" : "DISABLED"
                                updateUserMutation.mutate({ id: u.id, updates: { aiAccess: nextAccess } })
                              }}
                              title={`Current: ${u.aiAccess}. Click to cycle.`}
                              style={{
                                background: "var(--bg-surface-2)",
                                border: "1px solid var(--border-default)",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px",
                                color: u.aiAccess === "DISABLED" ? "var(--clr-danger)" : "var(--txt-secondary)",
                                cursor: "pointer",
                              }}
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
                                  aiLimit: typeof u.aiUsage.limit === "number" ? String(u.aiUsage.limit) : "",
                                })
                              }}
                              title="Edit user"
                              style={{
                                background: "var(--bg-surface-2)",
                                border: "1px solid var(--border-default)",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px",
                                color: "var(--txt-secondary)",
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete (if not self) */}
                            {user.id !== u.id && (
                              <button
                                onClick={() => setDeletingUser(u)}
                                title="Delete user"
                                style={{
                                  background: "var(--bg-surface-2)",
                                  border: "1px solid var(--border-default)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "6px",
                                  color: "var(--clr-danger)",
                                  cursor: "pointer",
                                }}
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
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 2: RESUMES ════════════════════ */}
      {activeTab === "resumes" && (
        <div
          className="v2-card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)" }}>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>DOCUMENT NAME</th>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>USER</th>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>TARGET ROLE</th>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>SIZE</th>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700 }}>UPLOADED</th>
                  <th style={{ padding: "14px 18px", color: "var(--txt-secondary)", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {resumesLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--txt-secondary)" }}>
                      <Loader2 size={24} className="anim-spin" style={{ margin: "0 auto 8px" }} />
                      Loading resumes...
                    </td>
                  </tr>
                ) : resumes?.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--txt-secondary)" }}>
                      No resumes uploaded by users yet.
                    </td>
                  </tr>
                ) : (
                  resumes?.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--txt-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FileText size={16} color="var(--brand-400)" />
                          {r.name}
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ color: "var(--txt-primary)", fontWeight: 600 }}>{r.userName}</div>
                        <div style={{ fontSize: "11px", color: "var(--txt-secondary)" }}>{r.userEmail}</div>
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--txt-secondary)" }}>
                        {r.targetRole || "General"}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--txt-secondary)" }}>
                        {formatBytes(r.sizeBytes)}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--txt-secondary)" }}>
                        {new Date(r.uploadedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${r.name}?`)) {
                              deleteResumeMutation.mutate(r.id)
                            }
                          }}
                          style={{
                            background: "var(--bg-surface-2)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "var(--radius-sm)",
                            padding: "6px",
                            color: "var(--clr-danger)",
                            cursor: "pointer",
                          }}
                          title="Delete resume"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 3: SYSTEM SETTINGS ════════════════════ */}
      {activeTab === "system" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* AI Settings Box */}
          <div
            className="v2-card"
            style={{
              padding: "24px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Cpu size={20} color="var(--brand-400)" />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--txt-primary)" }}>
                Platform AI Model & Engine
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--txt-secondary)", display: "block", marginBottom: "4px" }}>Active Model</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--brand-300)" }}>
                  {stats?.systemModel}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--txt-secondary)", display: "block", marginBottom: "4px" }}>API Key Status</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: stats?.hasSystemApiKey ? "var(--clr-success)" : "var(--clr-danger)",
                    fontWeight: 700,
                  }}
                >
                  {stats?.hasSystemApiKey ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {stats?.hasSystemApiKey ? "System Groq API Key Active" : "Missing GROQ_API_KEY in .env"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--txt-secondary)", display: "block", marginBottom: "4px" }}>Default Free Tier Quota</span>
                <span style={{ fontWeight: 700, color: "var(--txt-primary)" }}>
                  {stats?.freeLimitDefault} requests per user
                </span>
              </div>
            </div>
          </div>

          {/* Admin Policy Summary */}
          <div
            className="v2-card"
            style={{
              padding: "24px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-brand)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <ShieldCheck size={20} color="var(--brand-400)" />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--txt-primary)" }}>
                Admin Privilege Rules
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--txt-secondary)", lineHeight: "1.6" }}>
              <div>
                <strong style={{ color: "var(--txt-primary)" }}>1. Unrestricted AI:</strong> Admins are exempt from request limits and quotas across all features.
              </div>
              <div>
                <strong style={{ color: "var(--txt-primary)" }}>2. User AI Controls:</strong> Admins can unrestrict any specific user, raise their request limit, or temporarily disable AI access.
              </div>
              <div>
                <strong style={{ color: "var(--txt-primary)" }}>3. Role Delegation:</strong> Any existing admin can promote or demote other users directly from the user table.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add New User ── */}
      {isAddUserOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div
            className="v2-card"
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-brand)",
              borderRadius: "var(--radius-xl)",
              padding: "28px",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--txt-primary)" }}>Register New User</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--txt-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createUserMutation.mutate(formData)
              }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Full Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Password *
                </label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                  placeholder="Min 6 characters"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="v2-input"
                    style={{ width: "100%" }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                    AI Access Mode
                  </label>
                  <select
                    value={formData.aiAccess}
                    onChange={(e) => setFormData({ ...formData, aiAccess: e.target.value as any })}
                    className="v2-input"
                    style={{ width: "100%" }}
                  >
                    <option value="DEFAULT">Default Limit</option>
                    <option value="UNRESTRICTED">Unrestricted</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="v2-btn v2-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="v2-btn v2-btn--primary"
                >
                  {createUserMutation.isPending ? <Loader2 size={16} className="anim-spin" /> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit User ── */}
      {editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div
            className="v2-card"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-brand)",
              borderRadius: "var(--radius-xl)",
              padding: "28px",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--txt-primary)" }}>
                Edit Account: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "transparent", border: "none", color: "var(--txt-secondary)", cursor: "pointer" }}
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
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                  placeholder="New password (optional)"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="v2-input"
                    style={{ width: "100%" }}
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                    AI Access Privilege
                  </label>
                  <select
                    value={formData.aiAccess}
                    onChange={(e) => setFormData({ ...formData, aiAccess: e.target.value as any })}
                    className="v2-input"
                    style={{ width: "100%" }}
                  >
                    <option value="DEFAULT">Default Limit</option>
                    <option value="UNRESTRICTED">Unrestricted (Unlimited)</option>
                    <option value="DISABLED">Disabled (Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--txt-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Custom AI Request Limit (leave blank for platform default)
                </label>
                <input
                  type="number"
                  value={formData.aiLimit}
                  onChange={(e) => setFormData({ ...formData, aiLimit: e.target.value })}
                  className="v2-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. 50"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="v2-btn v2-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="v2-btn v2-btn--primary"
                >
                  {updateUserMutation.isPending ? <Loader2 size={16} className="anim-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete User Confirmation ── */}
      {deletingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div
            className="v2-card"
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-danger)",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={36} color="var(--clr-danger)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--txt-primary)", marginBottom: "8px" }}>
              Delete User Account?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--txt-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
              This will permanently delete <strong>{deletingUser.name}</strong> ({deletingUser.email}) and cascade delete all their opportunities, resumes, and reminders.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => setDeletingUser(null)} className="v2-btn v2-btn--secondary">
                Cancel
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                disabled={deleteUserMutation.isPending}
                className="v2-btn v2-btn--danger"
              >
                {deleteUserMutation.isPending ? <Loader2 size={16} className="anim-spin" /> : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
