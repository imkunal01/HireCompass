"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Briefcase, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

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

export default function SignupPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
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

      // Invalidate user query then navigate
      queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card/40 backdrop-blur-xl px-8 py-10 shadow-2xl shadow-primary/5">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 shadow-xl shadow-primary/20 mb-4">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-bold text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start tracking your job applications today
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-secondary/20 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-secondary/20 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-secondary/20 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
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
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
