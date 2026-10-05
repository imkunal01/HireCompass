"use client"

import React from "react"
import { Folder, CalendarCheck, BarChart3 } from "lucide-react"

export default function CoreBenefits() {
  const benefits = [
    {
      title: "Track Applications",
      description: "Save and organize jobs across multiple platforms.",
      icon: (
        <div className="h-14 w-14 rounded-2xl bg-[#EEECFC] text-[#6366F1] flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/60">
          <Folder className="h-7 w-7 stroke-[2]" />
        </div>
      ),
    },
    {
      title: "Stay on Top",
      description: "Get reminders for follow-ups, interviews and assessments.",
      icon: (
        <div className="h-14 w-14 rounded-2xl bg-[#E6F8F3] text-[#10B981] flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/60">
          <CalendarCheck className="h-7 w-7 stroke-[2]" />
        </div>
      ),
    },
    {
      title: "Gain Insights",
      description: "Visualize your progress and find what's working.",
      icon: (
        <div className="h-14 w-14 rounded-2xl bg-[#EBF3FF] text-[#3B82F6] flex items-center justify-center shrink-0 shadow-sm border border-blue-100/60">
          <BarChart3 className="h-7 w-7 stroke-[2]" />
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="py-12 sm:py-16 bg-white relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100/90 rounded-3xl bg-white">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`flex items-start gap-5 py-6 md:py-4 ${
                index === 0 ? "md:pr-8" : index === 1 ? "md:px-8" : "md:pl-8"
              }`}
            >
              {benefit.icon}
              <div className="pt-0.5">
                <h3 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight mb-1">
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-[13.5px] text-slate-500 leading-relaxed font-normal">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
