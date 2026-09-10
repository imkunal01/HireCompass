"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Briefcase } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import "@/styles/v2/variables.css"
import "@/styles/v2/reset.css"
import "@/styles/v2/animations.css"
import "@/styles/v2/components.css"
import "@/styles/v2/auth.css"

export default function V2SignupPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
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
      {/* ── Left brand panel ── */}
      <div className="v2-auth-brand anim-fade-in-left">
        <div className="v2-auth-brand__blob v2-auth-brand__blob--1" aria-hidden="true" />
        <div className="v2-auth-brand__blob v2-auth-brand__blob--2" aria-hidden="true" />
        <div className="v2-auth-brand__grid" aria-hidden="true" />

        <div className="v2-auth-brand__content">
          <div className="v2-auth-brand__logo-row">
            <div className="v2-auth-brand__logo-icon">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            <span className="v2-auth-brand__logo-name">HireCompass</span>
          </div>

          <div className="v2-auth-brand__hero anim-fade-in-up delay-100">
            <div className="v2-auth-brand__pill">
              <span className="v2-auth-brand__pill-dot" aria-hidden="true" />
              Free forever — no credit card
            </div>
            <h1 className="v2-auth-brand__headline">
              Your job search,{" "}
              <span className="v2-auth-brand__headline-accent">supercharged.</span>
            </h1>
            <p className="v2-auth-brand__tagline">
              Create a free account and start tracking every application, interview, and outreach campaign in one intelligent dashboard.
            </p>
          </div>

          <div className="v2-auth-brand__features anim-fade-in-up delay-200">
            {[
              { icon: "🗂️", title: "Everything in one place", desc: "Applications, interviews, reminders, resumes — all unified." },
              { icon: "✉️", title: "AI Outreach at scale", desc: "Generate personalised cold emails and track replies automatically." },
              { icon: "🧠", title: "AI Assistant", desc: "Ask anything about your job search and get instant, context-aware answers." },
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

      {/* ── Right form panel ── */}
      <div className="v2-auth-form-panel anim-fade-in">
        <div className="v2-auth-form-box anim-fade-in-up delay-50">
          {/* Mobile logo */}
          <div className="v2-auth-form-box__mobile-logo">
            <div className="v2-auth-brand__logo-icon" style={{ background: "var(--brand-gradient)", border: "none" }}>
              <Briefcase size={18} strokeWidth={2.5} />
            </div>
            <span className="v2-auth-brand__logo-name" style={{ color: "var(--txt-primary)" }}>HireCompass</span>
          </div>

          <div className="v2-auth-form-box__header">
            <h2 className="v2-auth-form-box__title">Create your account</h2>
            <p className="v2-auth-form-box__subtitle">Free forever · No credit card required</p>
          </div>

          {error && (
            <div className="v2-auth-error" role="alert">
              <span className="v2-auth-error__icon" aria-hidden="true">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="v2-auth-form" noValidate>
            {/* Full name */}
            <div className="v2-form-group">
              <label htmlFor="signup-name" className="v2-label">Full Name</label>
              <div className="v2-input-wrapper">
                <User size={15} className="v2-input-icon" aria-hidden="true" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="v2-input v2-input--has-icon"
                />
              </div>
            </div>

            {/* Email */}
            <div className="v2-form-group">
              <label htmlFor="signup-email" className="v2-label">Email Address</label>
              <div className="v2-input-wrapper">
                <Mail size={15} className="v2-input-icon" aria-hidden="true" />
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password" className="v2-label">Password</label>
              <div className="v2-input-wrapper">
                <Lock size={15} className="v2-input-icon" aria-hidden="true" />
                <input
                  id="signup-password"
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className={`v2-btn v2-btn--primary v2-btn--lg v2-auth-submit ${loading ? "v2-btn--loading" : ""}`}
            >
              {loading ? (
                <><Loader2 size={16} className="anim-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="v2-auth-trust">
            <span className="v2-auth-trust__dot">🔒</span>
            Your data is encrypted and secure
          </div>

          <p className="v2-auth-switch">
            Already have an account?{" "}
            <Link href="/v2/login" className="v2-auth-switch__link">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
