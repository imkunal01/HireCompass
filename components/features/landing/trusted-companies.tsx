"use client"

import React from "react"

export default function TrustedCompanies() {
  return (
    <section className="py-12 sm:py-16 border-y border-slate-100 bg-white/50 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 sm:mb-10">
          TRUSTED BY JOB SEEKERS TARGETING TOP COMPANIES
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 text-slate-400">
          {/* 1. Google */}
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors">
            <svg className="h-6 sm:h-7 w-auto" viewBox="0 0 88 28" fill="currentColor">
              <text x="0" y="22" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="600" letterSpacing="-0.5px">
                Google
              </text>
            </svg>
          </div>

          {/* 2. Microsoft */}
          <div className="flex items-center gap-2.5 hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 24 24" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" />
              <rect x="13" y="1" width="10" height="10" />
              <rect x="1" y="13" width="10" height="10" />
              <rect x="13" y="13" width="10" height="10" />
            </svg>
            <span className="text-base sm:text-lg font-semibold tracking-tight font-sans">Microsoft</span>
          </div>

          {/* 3. Amazon */}
          <div className="flex items-center hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 100 30" fill="currentColor">
              <text x="0" y="21" fontFamily="system-ui, sans-serif" fontSize="23" fontWeight="700" letterSpacing="-0.5px">
                amazon
              </text>
              <path d="M12 25 Q45 32 80 23" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <polygon points="80,21 85,24 81,27" fill="currentColor" />
            </svg>
          </div>

          {/* 4. Adobe */}
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="14.5,2 22,22 17,22 13.5,13.5 10.5,13.5 14,4" />
              <polygon points="9.5,2 2,22 7,22 10.5,13.5 13.5,13.5 10,4" />
              <polygon points="12,10 15,18 9,18" />
            </svg>
            <span className="text-base sm:text-lg font-bold tracking-normal font-sans">Adobe</span>
          </div>

          {/* 5. Meta */}
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M7 16 C3 16 1 13 1 9.5 C1 6 3 3 7 3 C11 3 14 8 16 11 C18 8 21 3 25 3 C29 3 31 6 31 9.5 C31 13 29 16 25 16 C21 16 18 11 16 8 C14 11 11 16 7 16 Z" />
            </svg>
            <span className="text-base sm:text-lg font-bold tracking-tight font-sans">Meta</span>
          </div>

          {/* 6. Atlassian */}
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 28 24" fill="currentColor">
              <path d="M12.5 1.5 C12.2 2.2 9.5 7.5 9 8.5 C8.5 9.5 8.2 10.5 8.5 11.2 C8.8 11.9 9.8 12 11 12 L17 12 C18 12 18.5 12.5 18.2 13.2 C17.8 14 14.5 21 14 22 L26 22 C26.8 22 27.2 21.2 26.8 20.5 L14.5 1.5 Z" />
              <path d="M1.5 22 L11 22 C11.8 22 12.2 21.2 11.8 20.5 L5 9 C4.2 7.8 2.8 8.2 2 9.5 L0.2 20.5 C-0.2 21.3 0.5 22 1.5 22 Z" opacity="0.6" />
            </svg>
            <span className="text-sm sm:text-base font-black tracking-widest uppercase font-sans">ATLASSIAN</span>
          </div>

          {/* 7. Spotify */}
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors">
            <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="11" />
              <path d="M6 9 C10 8 15 9 18 11" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M7 12 C10.5 11 14.5 12 17 13.5" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 15 C10.5 14.5 13.5 15 15.5 16" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="text-base sm:text-lg font-bold tracking-tight font-sans">Spotify</span>
          </div>
        </div>
      </div>
    </section>
  )
}
