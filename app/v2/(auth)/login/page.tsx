"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Briefcase } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import "@/styles/v2/variables.css"
import "@/styles/v2/reset.css"
import "@/styles/v2/animations.css"
import "@/styles/v2/components.css"
import "@/styles/v2/auth.css"

export default function V2LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
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
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid email or password.")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      router.push("/v2/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="v2-auth-shell">
      {/* ── Left panel — brand ── */}
      <div className="v2-auth-brand anim-fade-in-left">
        {/* Decorative blobs */}
        <div className="v2-auth-brand__blob v2-auth-brand__blob--1" aria-hidden="true" />
        <div className="v2-auth-brand__blob v2-auth-brand__blob--2" aria-hidden="true" />
        <div className="v2-auth-brand__grid" aria-hidden="true" />

        {/* Content */}
        <div className="v2-auth-brand__content">
          {/* Logo */}
          <div className="v2-auth-brand__logo-row">
            <div className="v2-auth-brand__logo-icon">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            <span className="v2-auth-brand__logo-name">HireCompass</span>
          </div>

          {/* Hero text */}
          <div className="v2-auth-brand__hero anim-fade-in-up delay-100">
            <div className="v2-auth-brand__pill">
              <span className="v2-auth-brand__pill-dot" aria-hidden="true" />
              Used by 12,000+ job seekers
            </div>
            <h1 className="v2-auth-brand__headline">
              Land your dream job{" "}
              <span className="v2-auth-brand__headline-accent">3× faster.</span>
            </h1>
            <p className="v2-auth-brand__tagline">
              HireCompass organises every application, interview, and follow-up so you can focus on what matters — getting hired.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="v2-auth-brand__features anim-fade-in-up delay-200">
            {[
              { icon: "📊", title: "Track Every Application", desc: "Kanban board, status tracking, and reminders all in one place." },
              { icon: "🤖", title: "AI-Powered Outreach", desc: "Auto-generate personalised cold emails and send at scale." },
              { icon: "📈", title: "Analytics & Insights", desc: "Conversion funnel, response rates and ghosting detection." },
            ].map((f) => (
              <div key={f.title} className="v2-auth-brand__feature">
                <span className="v2-auth-brand__feature-icon" aria-hidden="true">{f.icon}</span>
                <div>
                  <p className="v2-auth-brand__feature-title">{f.title}</p>
                  <p className="v2-auth-brand__feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="v2-auth-brand__stats anim-fade-in-up delay-300">
            {[
              { value: "12k+", label: "Job seekers" },
              { value: "94%",  label: "Interview rate" },
              { value: "3.2x", label: "Faster offers" },
            ].map((s) => (
              <div key={s.label} className="v2-auth-brand__stat">
                <span className="v2-auth-brand__stat-value">{s.value}</span>
                <span className="v2-auth-brand__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="v2-auth-form-panel anim-fade-in">
        <div className="v2-auth-form-box anim-fade-in-up delay-50">
          {/* Mobile logo */}
          <div className="v2-auth-form-box__mobile-logo">
            <div className="v2-auth-brand__logo-icon">
              <Briefcase size={18} strokeWidth={2.5} />
            </div>
            <span className="v2-auth-brand__logo-name" style={{ color: "var(--txt-primary)" }}>HireCompass</span>
          </div>

          <div className="v2-auth-form-box__header">
            <h2 className="v2-auth-form-box__title">Welcome back</h2>
            <p className="v2-auth-form-box__subtitle">Sign in to your HireCompass account</p>
          </div>

          {error && (
            <div className="v2-auth-error" role="alert">
              <span className="v2-auth-error__icon" aria-hidden="true">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="v2-auth-form" noValidate>
            {/* Email */}
            <div className="v2-form-group">
              <label htmlFor="login-email" className="v2-label">Email Address</label>
              <div className="v2-input-wrapper">
                <Mail size={15} className="v2-input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="v2-input v2-input--has-icon"
                />
              </div>
            </div>

            {/* Password */}
            <div className="v2-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="login-password" className="v2-label" style={{ margin: 0 }}>Password</label>
                <button type="button" className="v2-auth-forgot">Forgot password?</button>
              </div>
              <div className="v2-input-wrapper">
                <Lock size={15} className="v2-input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="v2-input v2-input--has-icon"
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="v2-auth-pwd-toggle"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={`v2-btn v2-btn--primary v2-btn--lg v2-auth-submit ${loading ? "v2-btn--loading" : ""}`}
            >
              {loading ? (
                <><Loader2 size={16} className="anim-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Trust */}
          <div className="v2-auth-trust">
            <span className="v2-auth-trust__dot" aria-hidden="true">🔒</span>
            Your data is encrypted and secure
          </div>

          {/* Sign up link */}
          <p className="v2-auth-switch">
            Don&apos;t have an account?{" "}
            <Link href="/v2/signup" className="v2-auth-switch__link">Create one free →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
