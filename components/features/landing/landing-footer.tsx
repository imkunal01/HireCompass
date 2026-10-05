"use client"

import React from "react"
import Link from "next/link"

export default function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-500 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-500/25">
                <svg
                  className="h-4 w-4"
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
              <span className="text-lg font-black tracking-tight text-slate-900">
                Hire<span className="text-indigo-600">Compass</span>
              </span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              The all-in-one job search management workspace for students and engineers. Organize applications, ace technical assessments, and accelerate your path to getting hired.
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              © 2026 HireCompass. All rights reserved.
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Application Pipeline
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Interviews & Calendar
                </Link>
              </li>
              <li>
                <Link href="/prep/problem-solving" className="hover:text-indigo-600 transition-colors">
                  Preparation Sheets
                </Link>
              </li>
              <li>
                <Link href="/assessment" className="hover:text-indigo-600 transition-colors">
                  AI Assessment Arena
                </Link>
              </li>
            </ul>
          </div>

          {/* Features Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Features</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Smart Reminders
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Application Analytics
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Project Defense Arena
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  STAR Story Matrix
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Spreadsheet Importer
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/prep/problem-solving" className="hover:text-indigo-600 transition-colors">
                  Blind 75 & DSA
                </Link>
              </li>
              <li>
                <Link href="/assessment" className="hover:text-indigo-600 transition-colors">
                  Capgemini Practice
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Day Planner
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-rose-600 transition-colors flex items-center gap-1.5 font-medium">
                  <span>Admin Portal</span>
                  <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-rose-100 text-rose-700">Admin</span>
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-indigo-600 transition-colors font-semibold text-indigo-600">
                  Create free account →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Built with care for students and professionals navigating their job search journey.</p>
          <div className="flex items-center gap-6">
            <Link href="#privacy" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#terms" className="hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="#cookies" className="hover:text-slate-600 transition-colors">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
