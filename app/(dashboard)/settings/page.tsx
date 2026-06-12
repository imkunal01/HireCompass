"use client"

import React, { useState } from "react"
import { Settings, Shield, Bell, User, Lock, Mail } from "lucide-react"

export default function SettingsPage() {
  const [name, setName] = useState("Demo Job Hunter")
  const [email, setEmail] = useState("demo@jobshunt.com")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure profile variables, notification behaviors, and password parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Profile */}
          <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3 mb-2">
              <User className="h-4.5 w-4.5 text-primary" /> Profile Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-secondary/10 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-secondary/10 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <button className="rounded-xl bg-primary hover:bg-primary/95 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-primary/10 transition-all duration-200">
                Save Changes
              </button>
            </div>
          </div>

          {/* Section: Password Update */}
          <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3 mb-2">
              <Lock className="h-4.5 w-4.5 text-purple-400" /> Update Password
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-border bg-secondary/10 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 pl-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-border bg-secondary/10 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <button className="rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border px-4 py-2 text-xs font-semibold transition">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences Mockups */}
        <div className="space-y-6">
          {/* Preferences Settings */}
          <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3 mb-2">
              <Bell className="h-4.5 w-4.5 text-amber-400" /> Notifications
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <span className="font-semibold text-foreground block">Email alerts</span>
                  <span className="text-muted-foreground">Receive upcoming interview schedules in your inbox.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <span className="font-semibold text-foreground block">Weekly report summary</span>
                  <span className="text-muted-foreground">Receive overall ghost rate and progress yields email weekly.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy settings */}
          <div className="rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3 mb-2">
              <Shield className="h-4.5 w-4.5 text-blue-400" /> Privacy & Security
            </h3>

            <div className="text-xs text-muted-foreground space-y-3">
              <p>Your databases are powered by MongoDB, meaning all your personal resume tracking coordinates reside securely in your NoSQL collection environments.</p>
              <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 text-[11px] text-blue-300">
                Database Status: MongoDB Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
