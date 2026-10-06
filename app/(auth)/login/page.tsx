"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Briefcase, Mail, Lock, ArrowRight, Loader2,
  Eye, EyeOff, CheckCircle2, TrendingUp, Calendar, Star,
  ShieldCheck, AlertCircle
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button"
import { useAuthSettings } from "@/hooks/useAuthSettings"

const FEATURES = [
  {
    icon: TrendingUp,
    color: "bg-indigo-500",
    title: "Track Every Application",
    desc:  "Kanban board, status tracking, and reminders all in one place.",
  },
  {
    icon: Calendar,
    color: "bg-violet-500",
    title: "Never Miss an Interview",
    desc:  "Smart reminders keep your schedule organised automatically.",
  },
  {
    icon: Star,
    color: "bg-amber-500",
    title: "AI-Powered Insights",
    desc:  "Get personalised suggestions to improve your response rate.",
  },
]

const STATS = [
  { value: "12k+", label: "Job seekers" },
  { value: "94%",  label: "Interview rate" },
  { value: "3.2x", label: "Faster offers" },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: authSettings, isLoading: settingsLoading } = useAuthSettings()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Surface errors passed from OAuth callback (e.g., cancelled or unverified)
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const returnUrl = searchParams.get("returnUrl") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid email or password.")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      router.push(returnUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Feature flag determines whether password authentication is visible
  const isPasswordAuthEnabled = Boolean(authSettings?.enablePasswordAuth)

  return (
    <div className="relative w-full max-w-md animate-slide-up">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
          <Briefcase className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">HireCompass</span>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/6 dark:shadow-black/60 p-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isPasswordAuthEnabled
              ? "Sign in to your HireCompass account"
              : "Continue with your verified Google account"}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs sm:text-sm text-rose-600 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* ── Primary Authentication Option: Google Sign-In ── */}
        <div className="space-y-4">
          <GoogleSignInButton
            label="Sign in with Google"
            returnUrl={returnUrl}
            size="large"
          />

          {/* Conditional Email/Password Form based on Feature Flag */}
          {settingsLoading ? (
            <div className="py-4 flex justify-center text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : isPasswordAuthEnabled ? (
            <>
              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  or continue with email
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 pl-0.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150",
                        "focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pl-0.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="login-password"
                      type={showPwd ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-11 text-sm text-slate-900 dark:text-slate-100",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150",
                        "focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl text-white",
                    "px-4 py-3 text-sm font-semibold mt-2 transition-all duration-200",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                  style={{
                    background:  loading ? "#818CF8" : "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
                    boxShadow:   loading ? "none" : "0 4px 15px rgba(99, 102, 241, 0.4), 0 1px 3px rgba(99, 102, 241, 0.2)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Information Card when Password Auth is Disabled (Google OAuth Only) */
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-100">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Verified Account Access Only</span>
              </div>
              <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed">
                To protect platform compute quotas and ensure zero spam, general sign-in is restricted to verified Google accounts.
              </p>
            </div>
          )}
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex items-center gap-2 justify-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Your data is encrypted and secure
          </span>
        </div>
      </div>

      {/* Sign up link */}
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          Create one free →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#080C14] overflow-hidden">
      {/* ═══════════════════════════════════════════
          LEFT PANEL — Brand / Value Prop
      ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 40%, #6366F1 70%, #818CF8 100%)",
          }}
        />
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #A78BFA 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #60A5FA 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <Briefcase className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">HireCompass</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8 animate-slide-up">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-xs font-semibold text-white/90 tracking-wide">Used by 12,000+ job seekers</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Land your dream job{" "}
              <span className="text-yellow-300">3× faster.</span>
            </h1>

            <p className="text-base text-white/75 leading-relaxed max-w-md">
              HireCompass organises every application, interview, and follow-up
              so you can focus on what matters — getting hired.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="flex items-start gap-4">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm", feat.color)}>
                  <feat.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm leading-tight">{feat.title}</p>
                  <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 animate-slide-up delay-200">
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
            {STATS.map((s) => (
              <div key={s.label} className="space-y-0.5">
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/60 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Login Form
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50/50 dark:bg-slate-950/60 relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #6366F1 1px, transparent 0)",
            backgroundSize:  "32px 32px",
          }}
        />

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
