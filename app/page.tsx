"use client"

import React, { useState } from "react"
import LandingNavbar from "@/components/features/landing/landing-navbar"
import HeroSection from "@/components/features/landing/hero-section"
import TrustedCompanies from "@/components/features/landing/trusted-companies"
import CoreBenefits from "@/components/features/landing/core-benefits"
import LowerFeatureSection from "@/components/features/landing/lower-feature-section"
import DemoModal from "@/components/features/landing/demo-modal"
import LandingFooter from "@/components/features/landing/landing-footer"

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800 antialiased overflow-x-hidden">
      {/* ── 1. Top Slim Navigation ── */}
      <LandingNavbar />

      {/* ── 2. Hero Section ── */}
      <main>
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* ── 3. Trusted-By Section ── */}
        <TrustedCompanies />

        {/* ── 4. Core Benefits Row (3 Horizontal Cards) ── */}
        <CoreBenefits />

        {/* ── 5. Lower Product-Feature Section (2 Columns with Layered Cards) ── */}
        <LowerFeatureSection />
      </main>

      {/* ── 6. Footer ── */}
      <LandingFooter />

      {/* ── 7. Interactive Demo Tour Modal ── */}
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
