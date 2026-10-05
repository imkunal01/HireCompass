"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play, Check } from "lucide-react"

interface HeroSectionProps {
  onOpenDemo: () => void
}

export default function HeroSection({ onOpenDemo }: HeroSectionProps) {
  return (
    <section id="product" className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-24">
      {/* ── Background Layer with Ambient Glow ── */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-75 pointer-events-none"
        style={{ backgroundImage: `url('/images/hirecompass-hero-bg.webp')` }}
      />
      <div className="absolute top-12 right-1/4 w-[600px] h-[500px] bg-gradient-to-tr from-indigo-200/40 via-purple-150/30 to-pink-100/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ══════════════════════════════════════════
              LEFT COLUMN — Headline, CTAs, Trust
             ══════════════════════════════════════════ */}
          <div className="lg:col-span-5 text-left z-10">
            {/* Rounded Lavender Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase bg-[#EAE6FE] text-[#6366F1] border border-indigo-100/80 mb-6 shadow-sm">
              YOUR JOB SEARCH, UNDER CONTROL
            </div>

            {/* Three-Line Heavy Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-black tracking-tight text-slate-950 leading-[1.06] mb-6">
              Track.
              <br />
              Prepare.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                Get Hired.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-md mb-8 font-normal">
              All your opportunities, applications, interviews and follow-ups in one focused workspace.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Get started for free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={onOpenDemo}
                className="px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50/90 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </div>
                <span>Watch demo</span>
              </button>
            </div>

            {/* Reassurance Row with Green Checks */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-[13px] font-medium text-slate-500 mb-8">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                <span>Loved by 10,000+ users</span>
              </div>
            </div>

            {/* Social Proof Row */}
            <div className="flex items-center gap-3.5 pt-2 border-t border-slate-200/50">
              {/* Overlapping Avatars */}
              <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                <Image
                  src="/images/avatars/avatar-1.jpg"
                  alt="HireCompass User"
                  width={36}
                  height={36}
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="/images/avatars/avatar-2.jpg"
                  alt="HireCompass User"
                  width={36}
                  height={36}
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="/images/avatars/avatar-3.jpg"
                  alt="HireCompass User"
                  width={36}
                  height={36}
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="/images/avatars/avatar-4.jpg"
                  alt="HireCompass User"
                  width={36}
                  height={36}
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                />
              </div>

              {/* Social Proof Text */}
              <p className="text-xs sm:text-[13px] text-slate-500 leading-snug">
                Join <strong className="font-bold text-indigo-600">10,000+</strong> students and professionals organizing their job search with HireCompass.
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN — Primary Product Showcase (~60% width)
             ══════════════════════════════════════════ */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end">
            {/* Diffuse Multi-Color Ambient Glow behind Laptop */}
            <div className="absolute -inset-6 sm:-inset-10 bg-gradient-to-tr from-indigo-300/35 via-violet-200/40 to-pink-200/30 rounded-[80px] blur-3xl -z-10 pointer-events-none" />

            {/* Laptop Product Showcase Container */}
            <div className="relative w-full max-w-2xl lg:max-w-none group">
              <Image
                src="/images/hirecompass-laptop-hero.webp"
                alt="HireCompass SaaS Job Search Application Dashboard"
                width={1024}
                height={682}
                priority
                className="w-full h-auto object-contain block drop-shadow-[0_20px_40px_rgba(79,70,229,0.15)] transform group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
