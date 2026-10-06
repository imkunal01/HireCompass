"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ShieldCheck, Lock, Mail, ArrowRight, Loader2,
  Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export default function AdminLoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Authentication failed. Invalid administrator credentials.")
        return
      }

      // Ensure the returned user has admin privileges
      if (data.user?.role !== "admin") {
        setError("Access restricted: This portal is reserved exclusively for platform administrators.")
        return
      }

      // Invalidate queries so the session is refreshed
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })

      // Direct redirection into Admin Control Center
      router.push("/admin")
      router.refresh()
    } catch {
      setError("An unexpected network error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-600/10 blur-[130px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-9 shadow-2xl shadow-black/80 space-y-6">
          
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-600/20">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-950/80 text-rose-300 border border-rose-800/80">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                Staff Gateway
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Administrator Sign In
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Restricted access portal for HireCompass system administrators
              </p>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-2xl border border-rose-800/80 bg-rose-950/50 flex items-start gap-2.5 text-xs text-rose-300 font-medium animate-in fade-in">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 pl-0.5 uppercase tracking-wider text-[10px]">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-sm text-white",
                    "placeholder:text-slate-600 transition-all duration-150",
                    "focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 pl-0.5 uppercase tracking-wider text-[10px]">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-11 text-sm text-white",
                    "placeholder:text-slate-600 transition-all duration-150",
                    "focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className={cn(
                "w-full mt-3 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2",
                "bg-gradient-to-r from-rose-600 via-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500",
                "shadow-lg shadow-rose-600/25 transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Authenticate Session</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer note & back link */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-[11px]"
            >
              <ArrowLeft size={13} />
              <span>Back to HireCompass</span>
            </Link>

            <span className="text-[10px] text-slate-600 font-mono">
              IP & Activity Logged
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
