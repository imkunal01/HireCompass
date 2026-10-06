"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Briefcase, Mail, Lock, User, ArrowRight, Loader2,
  Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Sparkles, AlertCircle
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button"
import { useAuthSettings } from "@/hooks/useAuthSettings"

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a number", ok: /\d/.test(password) },
    { label: "Contains a letter", ok: /[a-zA-Z]/.test(password) },
  ]
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-1.5 text-[11px]">
          {c.ok ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          )}
          <span className={c.ok ? "text-emerald-400" : "text-muted-foreground/60"}>{c.label}</span>
        </li>
      ))}
    </ul>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: authSettings, isLoading: settingsLoading } = useAuthSettings()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const returnUrl = searchParams.get("returnUrl") || "/dashboard"
  const isPasswordAuthEnabled = Boolean(authSettings?.enablePasswordAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.")
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.")
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

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-8 py-10 shadow-2xl shadow-indigo-500/5">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/25 mb-4">
          <Briefcase className="h-6 w-6 text-white" />
        </div>
        <h1 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100 tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {isPasswordAuthEnabled
            ? "Start tracking jobs and acing AI assessments"
            : "Sign up instantly with your verified Google account"}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      {/* ── Primary Action: Google Sign-Up ── */}
      <div className="space-y-4">
        <GoogleSignInButton
          label="Sign up with Google"
          returnUrl={returnUrl}
          size="large"
        />

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
                or sign up with email
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 pl-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-10 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Benefit Highlights for Google-Only Mode */
          <div className="mt-5 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/60 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-950 dark:text-indigo-100">
              <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Verified Candidate Benefits</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-indigo-800 dark:text-indigo-200">
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Instant activation with 30 free AI queries</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Capgemini DSA problem bank & prep roadmaps included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>No password required — seamless 1-click login</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Login link */}
      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 dark:bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
