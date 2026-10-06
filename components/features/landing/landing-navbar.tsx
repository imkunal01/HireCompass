"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ArrowRight, Menu, X, Sparkles, BookOpen, Layers, Target, Shield, HelpCircle, ShieldCheck } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/components/features/auth/auth-modal"

export default function LandingNavbar() {
  const { user } = useUser()
  const { openAuthModal } = useAuthModal()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          : "bg-white/60 backdrop-blur-md border-b border-slate-100/80"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* ── Left: Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon
                points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                fill="currentColor"
                fillOpacity="0.3"
              />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            Hire<span className="text-indigo-600">Compass</span>
          </span>
        </Link>

        {/* ── Center: Navigation Links (Desktop) ── */}
        <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
          <Link
            href="#product"
            className="hover:text-slate-900 transition-colors py-1"
          >
            Product
          </Link>
          <Link
            href="#features"
            className="hover:text-slate-900 transition-colors py-1"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-slate-900 transition-colors py-1"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="hover:text-slate-900 transition-colors py-1"
          >
            Pricing
          </Link>

          {/* Resources Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className="flex items-center gap-1 hover:text-slate-900 transition-colors py-1 focus:outline-none"
            >
              <span>Resources</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  resourcesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {resourcesOpen && (
              <div className="absolute top-full -left-4 pt-2 w-64 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 space-y-1">
                  <Link
                    href="/prep/problem-solving"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                        Interview Prep Sheets
                      </div>
                      <div className="text-[11px] text-slate-400">Capgemini 150 DSA roadmap</div>
                    </div>
                  </Link>

                  <Link
                    href="/assessment"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">
                        Capgemini Exam Simulator
                      </div>
                      <div className="text-[11px] text-slate-400">Proctored AI coding assessment</div>
                    </div>
                  </Link>

                  <Link
                    href="#faq"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">
                        Help & FAQs
                      </div>
                      <div className="text-[11px] text-slate-400">Common questions & guides</div>
                    </div>
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 border border-dashed border-rose-200 bg-rose-50/40 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-rose-700 group-hover:text-rose-800 flex items-center gap-1.5">
                          <span>Admin Control Center</span>
                          <span className="text-[8px] font-black px-1 rounded bg-rose-200/80 text-rose-700">ADMIN</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Users, resumes & quotas</div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── Right: Auth Buttons (Desktop) ── */}
        <div className="hidden sm:flex items-center gap-3">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/90 shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
              <span>Admin Panel</span>
            </Link>
          )}
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal({ mode: "login" })}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-xl border border-slate-200/90 shadow-sm transition-all duration-200"
              >
                Log in
              </button>
              <Link
                href="/dashboard"
                className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger Button ── */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-5 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Product
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/prep/problem-solving"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <span>Interview Prep Sheets</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">DSA</span>
            </Link>
            <Link
              href="/assessment"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <span>AI Assessment Exam</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">SIMULATOR</span>
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors flex items-center justify-between border border-rose-200"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-rose-600" />
                  <span>Admin Control Center</span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">ADMIN</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                openAuthModal({ mode: "login" })
              }}
              className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Log in
            </button>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
