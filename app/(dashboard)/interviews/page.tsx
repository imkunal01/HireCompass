"use client"

import React from "react"
import { Calendar, Video, MapPin, ExternalLink, Plus } from "lucide-react"

const upcomingSessions = [
  {
    id: "i1",
    role: "Software Engineer",
    company: "Google",
    date: "June 3, 2026",
    time: "10:00 AM - 10:45 AM (EST)",
    type: "Technical Phone Screen",
    location: "Google Meet",
    link: "https://meet.google.com/abc-defg-hij",
    notes: "Data structures, algorithms, and complexity analyses."
  },
  {
    id: "i2",
    role: "Fullstack Developer",
    company: "Stripe",
    date: "June 5, 2026",
    time: "2:00 PM - 3:00 PM (EST)",
    type: "System Design",
    location: "Zoom Video",
    link: "https://zoom.us/j/123456789",
    notes: "Scale application caching, database replication, and rate limiters."
  }
]

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Interviews & Sessions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View schedules, preparation notes, and connect links for your active interviews.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-primary/10 transition-all duration-200">
          <Plus className="h-4 w-4" /> Schedule Interview
        </button>
      </div>

      {/* Columns: Timeline vs Calendar placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline list */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-semibold text-base">Timeline</h3>
          
          <div className="space-y-6 relative border-l border-border/60 pl-6 ml-3">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="relative group">
                {/* Dynamic dot marker */}
                <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background scale-100 group-hover:scale-110 transition duration-200" />
                
                <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 hover:bg-card/70 hover:border-primary/30 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{session.company}</span>
                      <h4 className="font-semibold text-sm text-foreground">{session.type}</h4>
                      <p className="text-xs text-muted-foreground">{session.role}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-foreground block">{session.date}</span>
                      <span className="text-[10px] text-muted-foreground">{session.time}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Location / Meeting link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Video className="h-4 w-4 text-purple-400" />
                        <span>{session.location}</span>
                      </div>
                      {session.link && (
                        <a
                          href={session.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          Join Call Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Prep notes */}
                    {session.notes && (
                      <div className="rounded-xl bg-secondary/20 border border-border/40 p-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground block mb-1">Preparation Checklist:</span>
                        {session.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Calendar Mock */}
        <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-6">
          <h3 className="font-semibold text-base">Calendar Highlights</h3>

          {/* simple premium Month View placeholder */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold px-1">
              <span>June 2026</span>
              <span className="text-primary cursor-pointer hover:underline">Next Month</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* padding days */}
              <span className="p-1 text-muted-foreground/30">31</span>
              <span className="p-1 font-medium">1</span>
              <span className="p-1 font-medium">2</span>
              {/* highlight 3rd (Google interview) */}
              <span className="p-1 font-semibold rounded-lg bg-primary text-white shadow-md shadow-primary/20 cursor-pointer">3</span>
              <span className="p-1 font-medium">4</span>
              {/* highlight 5th (Stripe interview) */}
              <span className="p-1 font-semibold rounded-lg bg-purple-500 text-white shadow-md shadow-purple-500/20 cursor-pointer">5</span>
              <span className="p-1 font-medium">6</span>
              {/* rest of dates */}
              {[...Array(24)].map((_, idx) => (
                <span key={idx} className="p-1 font-medium">{idx + 7}</span>
              ))}
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Google Technical (June 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Stripe System Design (June 5)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
