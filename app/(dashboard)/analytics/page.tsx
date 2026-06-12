"use client"

import React from "react"
import { BarChart3, TrendingUp, Compass, Award, Percent } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identify bottleneck stages, conversion distributions, and optimization tips.
          </p>
        </div>
      </div>

      {/* Conversion metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 text-center">
          <span className="text-xs text-muted-foreground font-medium block">Wishlist-to-Applied</span>
          <h3 className="text-2xl font-bold mt-2 text-blue-400">82%</h3>
          <p className="text-[10px] text-muted-foreground mt-1">High conversion rate</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 text-center">
          <span className="text-xs text-muted-foreground font-medium block">Applied-to-Interview</span>
          <h3 className="text-2xl font-bold mt-2 text-purple-400">25%</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Needs minor resume polishing</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 text-center">
          <span className="text-xs text-muted-foreground font-medium block">Interview-to-Offer</span>
          <h3 className="text-2xl font-bold mt-2 text-emerald-400">33.3%</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Outstanding technical performance</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 text-center">
          <span className="text-xs text-muted-foreground font-medium block">Overall Yield</span>
          <h3 className="text-2xl font-bold mt-2 text-amber-400">8.3%</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Landed 1 offer out of 12</p>
        </div>
      </div>

      {/* Grid: Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly application volume chart mock in Tailwind */}
        <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-semibold text-base">Weekly Application Velocity</h3>
          </div>

          {/* Bar Chart mockup */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-secondary/40 rounded-t-lg relative group h-[40%]">
                <div className="absolute inset-0 bg-primary/70 rounded-t-lg group-hover:bg-primary transition duration-200" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">2</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Wk 1</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-secondary/40 rounded-t-lg relative group h-[80%]">
                <div className="absolute inset-0 bg-primary/70 rounded-t-lg group-hover:bg-primary transition duration-200" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">4</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Wk 2</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-secondary/40 rounded-t-lg relative group h-[60%]">
                <div className="absolute inset-0 bg-primary/70 rounded-t-lg group-hover:bg-primary transition duration-200" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">3</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Wk 3</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-secondary/40 rounded-t-lg relative group h-[100%]">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-indigo-600 rounded-t-lg group-hover:from-primary group-hover:to-indigo-500 transition duration-200" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">5</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Wk 4</span>
            </div>
          </div>
        </div>

        {/* Source breakdown list */}
        <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 text-purple-400" />
            <h3 className="font-semibold text-base">Channel Distributions</h3>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Employee Referrals</span>
                <span>50%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "50%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>LinkedIn Apply</span>
                <span>25%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: "25%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Company Portals</span>
                <span>25%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          {/* Quick tips box */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 text-xs text-muted-foreground flex gap-3">
            <Award className="h-6 w-6 text-primary shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">Optimization Strategy:</span>
              Referrals produce 3x higher interview conversions than LinkedIn Apply. Spend more time networking!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
